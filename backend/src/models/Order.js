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
  isFreeGift: { type: Boolean, default: false },
  originalPrice: Number,
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
  couponType: { type: String, enum: ['percentage', 'fixed', 'free_gift'] },
  couponApplicationMode: { type: String, enum: ['auto', 'manual'] },
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
  confirmationEmailSent:    { type: Boolean, default: false },
  adminNotificationSent:    { type: Boolean, default: false },

  // ── Shiprocket ────────────────────────────────────────────────────────────
  shiprocketOrderId:    String,   // Shiprocket's numeric order ID (stored as string)
  shiprocketShipmentId: String,   // Shiprocket shipment ID
  shiprocketStatus:     String,   // e.g. "NEW", "PICKUP SCHEDULED", "SHIPPED", "Delivered"
  shiprocketStatusCode: Number,   // Shiprocket numeric status code
  shiprocketSyncedAt:   Date,     // timestamp of successful sync
  shiprocketResponse:   mongoose.Schema.Types.Mixed, // full SR response or error blob
  shiprocketError:      String,   // last sync error message — cleared on success, set on failure
  shiprocketLastPayload: mongoose.Schema.Types.Mixed, // exact payload sent to Shiprocket API
  // Atomic-claim flag — same pattern as confirmationEmailSent.
  // Set to true the moment a handler starts the sync attempt;
  // prevents verifyPayment + webhook from both pushing the same order.
  shiprocketSynced:     { type: Boolean, default: false },
  // Two-way sync fields (populated by Shiprocket webhooks)
  awbCode:              String,   // Air Waybill / tracking number assigned by courier
  courierName:          String,   // e.g. "Delhivery", "Bluedart"
  lastWebhookPayload:   mongoose.Schema.Types.Mixed, // last raw Shiprocket webhook body

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
