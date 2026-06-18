const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const User     = require('../models/User');
const { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } = require('../services/emailService');
const { syncOrderToShiprocket }      = require('../services/shiprocketSync');

// ✅ Fixed — lazy init, won't crash on startup

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment');
    return res.status(500).json({ success: false, message: 'Payment gateway not configured. Please contact support.' });
  }

  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const options = {
    amount: Math.round(order.total * 100), // paise
    currency: 'INR',
    receipt: order.orderId,
    notes: {
      orderId: order._id.toString(),
      customerName: order.shippingAddress.name,
    },
  };

  const rzpOrder = await getRazorpay().orders.create(options);

  order.razorpayOrderId = rzpOrder.id;
  await order.save();

  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    razorpayOrderId: rzpOrder.id,
    orderId: order._id,
    orderNumber: order.orderId,
    name: order.shippingAddress.name,
    email: order.guestInfo?.email || '',
    phone: order.shippingAddress.phone,
  });
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();

  const emailTo =
    order.guestInfo?.email ||
    (order.user ? (await User.findById(order.user).select('email'))?.email : null);

  console.log(`[Payment] #${order.orderId} | verifyPayment — customer: ${emailTo || '(none)'}`);

  // ── Customer confirmation email ────────────────────────────────────────────
  try {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, confirmationEmailSent: false },
      { confirmationEmailSent: true }
    );
    if (claimed && emailTo) {
      console.log(`[Payment] #${order.orderId} | triggering customer confirmation → ${emailTo}`);
      await sendOrderConfirmationEmail(order, emailTo);
      console.log(`[Payment] #${order.orderId} | customer confirmation sent ✓`);
    }
  } catch (emailErr) {
    console.error(`[Payment] #${order.orderId} | customer email error: ${emailErr.message}`);
  }

  // ── Admin notification — async IIFE, fully independent ────────────────────
  ;(async () => {
    try {
      console.log(`[Payment] #${order.orderId} | triggering admin notification (verifyPayment)`);
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, adminNotificationSent: false },
        { adminNotificationSent: true }
      );
      if (claimed) {
        await sendAdminOrderNotificationEmail(order, emailTo);
      } else {
        console.log(`[Payment] #${order.orderId} | admin notification already claimed — skipped`);
      }
    } catch (err) {
      console.error(`[Payment] #${order.orderId} | admin notification error (verifyPayment): ${err.message}`, err.stack);
    }
  })();

  // ── Shiprocket sync ────────────────────────────────────────────────────────
  syncOrderToShiprocket(order, emailTo).catch(err =>
    console.error(`[Payment] #${order.orderId} | Shiprocket sync error (verifyPayment): ${err.message}`)
  );

  res.json({ success: true, order });
};

// Razorpay webhook
exports.webhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const paymentId       = payload.payment.entity.id;
    const razorpayOrderId = payload.payment.entity.order_id;

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: 'paid', orderStatus: 'confirmed', razorpayPaymentId: paymentId },
      { new: true }
    );

    if (order) {
      const emailTo =
        order.guestInfo?.email ||
        (order.user ? (await User.findById(order.user).select('email'))?.email : null);

      console.log(`[Payment] #${order.orderId} | Razorpay webhook — customer: ${emailTo || '(none)'}`);

      // ── Customer confirmation email ──────────────────────────────────────
      try {
        const claimed = await Order.findOneAndUpdate(
          { _id: order._id, confirmationEmailSent: false },
          { confirmationEmailSent: true }
        );
        if (claimed && emailTo) {
          console.log(`[Payment] #${order.orderId} | triggering customer confirmation → ${emailTo}`);
          await sendOrderConfirmationEmail(order, emailTo);
          console.log(`[Payment] #${order.orderId} | customer confirmation sent ✓`);
        }
      } catch (emailErr) {
        console.error(`[Payment] #${order.orderId} | customer email error (webhook): ${emailErr.message}`);
      }

      // ── Admin notification — async IIFE, fully independent ──────────────
      ;(async () => {
        try {
          console.log(`[Payment] #${order.orderId} | triggering admin notification (webhook)`);
          const claimed = await Order.findOneAndUpdate(
            { _id: order._id, adminNotificationSent: false },
            { adminNotificationSent: true }
          );
          if (claimed) {
            await sendAdminOrderNotificationEmail(order, emailTo);
          } else {
            console.log(`[Payment] #${order.orderId} | admin notification already claimed — skipped`);
          }
        } catch (err) {
          console.error(`[Payment] #${order.orderId} | admin notification error (webhook): ${err.message}`, err.stack);
        }
      })();

      // ── Shiprocket sync ──────────────────────────────────────────────────
      syncOrderToShiprocket(order, emailTo).catch(err =>
        console.error(`[Payment] #${order.orderId} | Shiprocket sync error (webhook): ${err.message}`)
      );
    }
  }

  if (event === 'payment.failed') {
    const razorpayOrderId = payload.payment.entity.order_id;
    await Order.findOneAndUpdate({ razorpayOrderId }, { paymentStatus: 'failed' });
  }

  res.json({ success: true });
};
