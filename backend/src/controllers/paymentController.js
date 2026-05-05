const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// ✅ Fixed — lazy init, won't crash on startup

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
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
    const paymentId = payload.payment.entity.id;
    const razorpayOrderId = payload.payment.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: 'paid', orderStatus: 'confirmed', razorpayPaymentId: paymentId }
    );
  }

  if (event === 'payment.failed') {
    const razorpayOrderId = payload.payment.entity.order_id;
    await Order.findOneAndUpdate({ razorpayOrderId }, { paymentStatus: 'failed' });
  }

  res.json({ success: true });
};
