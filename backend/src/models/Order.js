const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Guest checkout support
  guestInfo: {
    name: String,
    email: String,
    phone: String,
  },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  subtotal: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: String,
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },
  trackingNumber: String,
  trackingUrl: String,
  notes: String,
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
    },
  ],
  isGift: { type: Boolean, default: false },
  giftMessage: String,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
}, { timestamps: true });

// Auto-generate orderId
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const date = new Date();
    const prefix = 'SS'; // spiritual-revamp
    const timestamp = date.getTime().toString().slice(-8);
    this.orderId = `${prefix}${timestamp}`;
  }
  // Auto-push status history only when orderStatus changes and the caller
  // has NOT already pushed a history entry (to avoid duplicates when the
  // controller adds a note-aware entry itself).
  if (this.isModified('orderStatus') && !this.isModified('statusHistory')) {
    this.statusHistory.push({ status: this.orderStatus });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
