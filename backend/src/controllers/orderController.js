const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ShippingSettings = require('../models/ShippingSettings');
const { calculateShipping } = require('./shippingController');
const { applyCouponToOrder } = require('./couponController');
const { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } = require('../services/emailService');
const { syncOrderToShiprocket } = require('../services/shiprocketSync');

// Create Order (both logged in & guest)
exports.createOrder = async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    guestInfo,
    couponCode,
    isGift,
    giftMessage,
  } = req.body;

  // Server-side COD availability guard — reject even if frontend was bypassed
  if (paymentMethod === 'cod') {
    const s = await ShippingSettings.findOne().lean();
    // treat undefined (field not yet in DB) as enabled; only block when explicitly false
    const codEnabled = s ? s.codEnabled !== false : true;
    if (!codEnabled) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery is currently unavailable. Please pay online.' });
    }
  }

  // Validate products & calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      return res.status(400).json({ success: false, message: 'Invalid product in cart. Please refresh and try again.' });
    }
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
    }
    if (product.stock === 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of "${product.name}" available`,
      });
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price: product.price,
      quantity: item.quantity,
    });
    subtotal += product.price * item.quantity;
  }

  // Dynamic shipping from DB settings (falls back to defaults if no settings doc)
  const shippingCharge = await calculateShipping(subtotal, paymentMethod);

  // Dynamic coupon from DB (increments usedCount on success)
  const { discount, giftProduct, couponType, applicationMode } = await applyCouponToOrder(couponCode, subtotal);

  if (giftProduct) {
    orderItems.push({
      product: giftProduct._id,
      name: giftProduct.name,
      image: giftProduct.images?.[0]?.url,
      price: 0,
      quantity: 1,
      isFreeGift: true,
      originalPrice: giftProduct.price,
    });
  }

  const total = subtotal + shippingCharge - discount;

  const orderData = {
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCharge,
    discount,
    couponCode,
    couponType:            couponType || undefined,
    couponApplicationMode: applicationMode || undefined,
    total,
    isGift,
    giftMessage,
  };

  if (req.user) {
    orderData.user = req.user.id;
  } else {
    orderData.guestInfo = guestInfo;
  }

  // COD: mark as confirmed immediately
  if (paymentMethod === 'cod') {
    orderData.paymentStatus = 'pending';
    orderData.orderStatus = 'confirmed';
  }

  const order = await Order.create(orderData);

  console.log(`[Order] ✓ Created #${order.orderId} | method: ${paymentMethod} | total: ₹${order.total}`);

  // Send confirmation email only for COD (online payment sends after Razorpay verify/webhook)
  if (paymentMethod === 'cod') {
    const emailTo = req.user?.email || guestInfo?.email;

    console.log(`[Order] #${order.orderId} | customer email: ${emailTo || '(none)'}`);

    // ── Customer confirmation email ──────────────────────────────────────────
    try {
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, confirmationEmailSent: false },
        { confirmationEmailSent: true }
      );
      if (claimed && emailTo) {
        console.log(`[Order] #${order.orderId} | triggering customer confirmation email → ${emailTo}`);
        await sendOrderConfirmationEmail(order, emailTo);
        console.log(`[Order] #${order.orderId} | customer confirmation email sent ✓`);
      } else if (!emailTo) {
        console.warn(`[Order] #${order.orderId} | no customer email address — confirmation skipped`);
      }
    } catch (emailErr) {
      console.error(`[Order] #${order.orderId} | customer email error: ${emailErr.message}`);
    }

    // ── Admin notification — async IIFE, fully independent ──────────────────
    ;(async () => {
      try {
        console.log(`[Order] #${order.orderId} | triggering admin notification`);
        const claimed = await Order.findOneAndUpdate(
          { _id: order._id, adminNotificationSent: false },
          { adminNotificationSent: true }
        );
        if (claimed) {
          await sendAdminOrderNotificationEmail(order, emailTo);
        } else {
          console.log(`[Order] #${order.orderId} | admin notification already claimed — skipped`);
        }
      } catch (err) {
        console.error(`[Order] #${order.orderId} | admin notification error: ${err.message}`, err.stack);
      }
    })();

    // ── Shiprocket sync — fire-and-forget ────────────────────────────────────
    syncOrderToShiprocket(order, emailTo).catch(err =>
      console.error(`[Order] #${order.orderId} | Shiprocket COD sync error: ${err.message}`)
    );
  }

  // Decrement stock (free gifts reduce stock but don't count as "sold")
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: item.isFreeGift
        ? { stock: -item.quantity }
        : { stock: -item.quantity, sold: item.quantity },
    });
  }

  // Notify admin dashboard via Socket.io
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed'] } });
  req.app.emitAdminEvent?.('orders:update', { totalOrders, pendingOrders, newOrder: { orderId: order.orderId, total: order.total } });

  res.status(201).json({ success: true, order });
};

exports.getMyOrders = async (req, res) => {
  const email = req.user.email?.toLowerCase().trim();
  const query = email && !email.endsWith('@spiritualrevampse.internal')
    ? { $or: [{ user: req.user.id }, { 'guestInfo.email': email }] }
    : { user: req.user.id };

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images slug');
  res.json({ success: true, orders });
};

exports.getOrder = async (req, res) => {
  let query;
  if (req.user) {
    const email = req.user.email?.toLowerCase().trim();
    const byEmail = email && !email.endsWith('@spiritualrevampse.internal')
      ? { 'guestInfo.email': email }
      : null;
    query = byEmail
      ? { _id: req.params.id, $or: [{ user: req.user.id }, byEmail] }
      : { _id: req.params.id, user: req.user.id };
  } else {
    query = { orderId: req.params.id };
  }

  const order = await Order.findOne(query).populate('items.product', 'name images slug');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

// Admin: get all orders (with search across orderId, name, phone, email)
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (search) {
    const re = { $regex: search, $options: 'i' };
    query.$or = [
      { orderId: re },
      { 'shippingAddress.name': re },
      { 'shippingAddress.phone': re },
      { 'guestInfo.email': re },
      { 'guestInfo.name': re },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email'),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
};

// Admin: get single order with full details
exports.getAdminOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name slug images');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

exports.updateOrderStatus = async (req, res) => {
  const { orderStatus, trackingNumber, trackingUrl, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (orderStatus === 'delivered') order.deliveredAt = new Date();
  if (orderStatus === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancelReason = note;
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
  }

  // Push note-aware history entry; pre-save hook skips auto-push when history is modified
  order.statusHistory.push({ status: orderStatus, note: note || undefined, timestamp: new Date() });

  await order.save();
  res.json({ success: true, order });
};

exports.deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Restore stock only if order was active (not already cancelled)
  if (order.orderStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
  }

  await order.deleteOne();
  res.json({ success: true, message: 'Order deleted' });
};

// ── Admin: manually re-trigger Shiprocket sync ────────────────────────────────
// Use when a sync failed (shiprocketResponse.error) or was never attempted.
// Resets the atomic claim flag so syncOrderToShiprocket can claim it again.
exports.resyncShiprocket = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Only sync orders where payment is confirmed
  const syncable =
    order.paymentMethod === 'cod' ||
    order.paymentStatus === 'paid';
  if (!syncable) {
    return res.status(400).json({
      success: false,
      message: 'Only paid / COD-confirmed orders can be pushed to Shiprocket.',
    });
  }

  if (order.shiprocketOrderId) {
    return res.status(409).json({
      success: false,
      message: 'Order is already in Shiprocket.',
      shiprocketOrderId: order.shiprocketOrderId,
    });
  }

  // Reset claim so the sync function can proceed
  await Order.findByIdAndUpdate(order._id, {
    shiprocketSynced:   false,
    shiprocketResponse: null,
  });

  const emailTo =
    order.guestInfo?.email ||
    (order.user
      ? (await User.findById(order.user).select('email'))?.email
      : null);

  // Fire-and-forget — caller gets an immediate 202
  syncOrderToShiprocket(order, emailTo).catch(err =>
    console.error('[Shiprocket] Manual resync error:', err.message)
  );

  res.status(202).json({ success: true, message: 'Shiprocket sync triggered.' });
};

// ── Admin: Shiprocket debug info for a single order ───────────────────────────
// GET /api/orders/admin/:id/shiprocket-debug
// Returns the exact payload we sent, the full Shiprocket response, and a
// human-readable sync status — useful when investigating why an order is missing
// from Shiprocket.
exports.getShiprocketDebug = async (req, res) => {
  const order = await Order.findById(req.params.id).select(
    'orderId paymentMethod paymentStatus ' +
    'shiprocketSynced shiprocketOrderId shiprocketShipmentId ' +
    'shiprocketStatus shiprocketSyncedAt shiprocketError ' +
    'shiprocketResponse shiprocketLastPayload'
  );
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const syncStatus =
    order.shiprocketOrderId       ? 'synced'  :
    order.shiprocketSynced        ? 'failed'  :
    (order.paymentMethod === 'cod' ||
     order.paymentStatus  === 'paid') ? 'pending' : 'not_eligible';

  res.json({
    success: true,
    orderId:               order.orderId,
    syncStatus,
    shiprocketOrderId:     order.shiprocketOrderId    || null,
    shiprocketShipmentId:  order.shiprocketShipmentId || null,
    shiprocketStatus:      order.shiprocketStatus     || null,
    shiprocketSyncedAt:    order.shiprocketSyncedAt   || null,
    shiprocketError:       order.shiprocketError      || null,
    lastPayloadSent:       order.shiprocketLastPayload || null,
    lastApiResponse:       order.shiprocketResponse   || null,
  });
};

exports.getDashboardStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const Review = require('../models/Review');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    pendingOrders,
    recentOrders,
    totalUsers,
    pendingReviews,
    monthlyRevenue,
    topProducts,
    categorySales,
  ] = await Promise.all([
    Order.countDocuments({ paymentStatus: { $ne: 'failed' } }),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    // Count all active (non-terminal) statuses
    Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed', 'processing', 'shipped'] } }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    User.countDocuments({ role: 'user' }),
    Review.countDocuments({ isApproved: false }),

    // Monthly revenue chart (last 6 months)
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Top 5 products by units sold
    Product.find({ isActive: true, sold: { $gt: 0 } })
      .sort({ sold: -1 })
      .limit(5)
      .select('name category sold price images'),

    // Sales by category (from product sold counts)
    Product.aggregate([
      { $match: { isActive: true, sold: { $gt: 0 } } },
      { $group: { _id: '$category', sold: { $sum: '$sold' }, revenue: { $sum: { $multiply: ['$price', '$sold'] } } } },
      { $sort: { sold: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      pendingOrders,
      totalUsers,
      pendingReviews,
    },
    recentOrders,
    monthlyRevenue,
    topProducts,
    categorySales,
  });
};
