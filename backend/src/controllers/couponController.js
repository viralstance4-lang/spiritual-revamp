const Coupon = require('../models/Coupon');

// ─── Shared validation helper ─────────────────────────────────────────────────
function computeDiscount(coupon, subtotal) {
  let amount = 0;
  if (coupon.discountType === 'percentage') {
    amount = Math.round(subtotal * coupon.discountValue / 100);
    if (coupon.maxDiscountAmount > 0) amount = Math.min(amount, coupon.maxDiscountAmount);
  } else {
    amount = coupon.discountValue;
  }
  return Math.min(amount, subtotal); // never exceed cart value
}

// ─── POST /api/coupons/validate — public ──────────────────────────────────────
exports.validateCoupon = async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  if (!code?.trim()) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return res.status(400).json({ success: false, message: 'Invalid coupon code' });
  }
  if (!coupon.isActive) {
    return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
  }
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return res.status(400).json({ success: false, message: 'This coupon has expired' });
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
  }
  if (subtotal < coupon.minOrderValue) {
    return res.status(400).json({
      success: false,
      message: `Minimum order of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required for this coupon`,
    });
  }

  const discountAmount = computeDiscount(coupon, subtotal);

  res.json({
    success: true,
    coupon: {
      code:        coupon.code,
      discount:    discountAmount,
      type:        coupon.discountType,
      rate:        coupon.discountValue,
      description: coupon.description,
    },
  });
};

// ─── GET /api/coupons — admin: list all coupons ───────────────────────────────
exports.getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
};

// ─── POST /api/coupons — admin: create coupon ─────────────────────────────────
exports.createCoupon = async (req, res) => {
  const {
    code, description, discountType, discountValue,
    minOrderValue, maxDiscountAmount, isActive, usageLimit, expiresAt,
  } = req.body;

  if (!code?.trim())     return res.status(400).json({ success: false, message: 'Code is required' });
  if (!discountType)     return res.status(400).json({ success: false, message: 'Discount type is required' });
  if (discountValue <= 0) return res.status(400).json({ success: false, message: 'Discount value must be > 0' });
  if (discountType === 'percentage' && discountValue > 100) {
    return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description,
    discountType,
    discountValue,
    minOrderValue:     minOrderValue     || 0,
    maxDiscountAmount: maxDiscountAmount || 0,
    isActive:          isActive          ?? true,
    usageLimit:        usageLimit        || 0,
    expiresAt:         expiresAt || undefined,
  });

  res.status(201).json({ success: true, coupon });
};

// ─── PUT /api/coupons/:id — admin: update coupon ──────────────────────────────
exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, coupon });
};

// ─── DELETE /api/coupons/:id — admin ─────────────────────────────────────────
exports.deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, message: 'Coupon deleted' });
};

// ─── Helper: apply coupon in order creation ───────────────────────────────────
// Atomic findOneAndUpdate prevents race condition where two simultaneous orders
// could both pass the usageLimit check before either increments the counter.
exports.applyCouponToOrder = async (code, subtotal) => {
  if (!code) return 0;

  const now = new Date();
  const normalised = code.toUpperCase().trim();

  // Single atomic operation: match all validity conditions AND increment in one step
  const coupon = await Coupon.findOneAndUpdate(
    {
      code: normalised,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $and: [
        { $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
        { $or: [{ minOrderValue: { $lte: subtotal } }, { minOrderValue: { $exists: false } }] },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: false } // return the doc before increment to compute discount on original values
  );

  if (!coupon) return 0;
  return computeDiscount(coupon, subtotal);
};
