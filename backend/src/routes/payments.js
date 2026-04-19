const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  createRazorpayOrder,
  verifyPayment,
  webhook,
} = require('../controllers/paymentController');

router.post('/razorpay/create', optionalAuth, createRazorpayOrder);
router.post('/razorpay/verify', optionalAuth, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
