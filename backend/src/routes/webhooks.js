const express = require('express');
const router = express.Router();
const { handleShiprocketWebhook } = require('../controllers/shiprocketWebhookController');

// POST /api/webhooks/shiprocket
// Receives status-update events pushed by Shiprocket.
// No auth middleware — Shiprocket calls this from their servers.
// Optional secret verification via SHIPROCKET_WEBHOOK_SECRET env var.
router.post('/shiprocket', handleShiprocketWebhook);

module.exports = router;
