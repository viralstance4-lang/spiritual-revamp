const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { calculateShipping } = require('./shippingController');
const { applyCouponToOrder } = require('./couponController');
const { sendOrderConfirmationEmail } = require('../services/emailService');

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
  const discount = await applyCouponToOrder(couponCode, subtotal);

  const total = subtotal + shippingCharge - discount;

  const orderData = {
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCharge,
    discount,
    couponCode,
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

  // Send order confirmation email
  try {
    const emailTo = req.user?.email || guestInfo?.email;
    if (emailTo) await sendOrderConfirmationEmail(order, emailTo);
  } catch (emailErr) {
    console.error('[Email] Failed to send confirmation:', emailErr.message);
  }

  // Decrement stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
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
  const query = email && !email.endsWith('@soulstone.internal')
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
    const byEmail = email && !email.endsWith('@soulstone.internal')
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
