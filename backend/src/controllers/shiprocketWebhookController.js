'use strict';

const Order = require('../models/Order');

// Shiprocket status text (lowercase) → our internal orderStatus
const SR_STATUS_MAP = {
  'new':                          'confirmed',
  'acknowledged':                 'confirmed',
  'confirmed':                    'confirmed',
  'processing':                   'processing',
  'pickup scheduled':             'processing',
  'pickup generated':             'processing',
  'pickup queued':                'processing',
  'out for pickup':               'processing',
  'pickup error':                 'processing',
  'packed':                       'processing',
  'manifested':                   'processing',
  'ready to ship':                'processing',
  'in transit':                   'shipped',
  'shipped':                      'shipped',
  'reached at destination hub':   'shipped',
  'out for delivery':             'shipped',
  'undelivered':                  'shipped',
  'delayed':                      'shipped',
  'delivered':                    'delivered',
  'cancelled':                    'cancelled',
  'lost':                         'cancelled',
  'destroyed':                    'cancelled',
  'rto initiated':                'returned',
  'rto':                          'returned',
  'rto in transit':               'returned',
  'rto out for delivery':         'returned',
  'rto delivered':                'returned',
  'returned':                     'returned',
};

function mapStatus(shiprocketStatus) {
  if (!shiprocketStatus) return null;
  return SR_STATUS_MAP[shiprocketStatus.toLowerCase().trim()] || null;
}

// Prevent backwards transitions; always allow terminal states
const NON_TERMINAL = ['placed', 'confirmed', 'processing', 'shipped'];
function shouldUpdateStatus(current, next) {
  if (!next || next === current) return false;
  // Nothing moves out of a terminal state via webhook
  if (!NON_TERMINAL.includes(current)) return false;
  // Terminal destination is always allowed from a non-terminal source
  if (!NON_TERMINAL.includes(next)) return true;
  // Forward-only within the non-terminal sequence
  return NON_TERMINAL.indexOf(next) > NON_TERMINAL.indexOf(current);
}

function buildHistoryNote(srStatus, courierName, awb, etd) {
  const parts = [`Shiprocket: ${srStatus}`];
  if (courierName) parts.push(`via ${courierName}`);
  if (awb)         parts.push(`AWB: ${awb}`);
  if (etd)         parts.push(`ETA: ${etd}`);
  return parts.join(' · ');
}

exports.handleShiprocketWebhook = async (req, res) => {
  const payload = req.body;

  // Optional secret verification — configure SHIPROCKET_WEBHOOK_SECRET in .env
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided =
      req.headers['x-shiprocket-secret'] ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      payload?.secret;
    if (provided !== webhookSecret) {
      console.warn('[Shiprocket Webhook] Rejected — invalid secret');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  const {
    awb,
    order_id:          shiprocketNumericId,
    channel_order_id:  channelOrderId,   // our orderId string e.g. "SS12345678"
    current_status:    currentStatus,
    current_status_id: statusCode,
    courier_name:      courierName,
    etd,
  } = payload;

  console.log(
    `[Shiprocket Webhook] ${channelOrderId || shiprocketNumericId} → ${currentStatus}`
  );

  if (!currentStatus) {
    return res.json({ success: true, message: 'No status in payload' });
  }

  // Find order — channel_order_id is our orderId string; fallback to Shiprocket's numeric id
  let order = null;
  if (channelOrderId) {
    order = await Order.findOne({ orderId: channelOrderId });
  }
  if (!order && shiprocketNumericId) {
    order = await Order.findOne({ shiprocketOrderId: String(shiprocketNumericId) });
  }
  if (!order && awb) {
    order = await Order.findOne({ awbCode: awb });
  }

  if (!order) {
    console.warn(
      `[Shiprocket Webhook] Order not found: channel_order_id=${channelOrderId}, sr_order_id=${shiprocketNumericId}`
    );
    return res.json({ success: true, message: 'Order not found, acknowledged' });
  }

  // Deduplication — skip if we already stored this exact status for this AWB
  if (order.shiprocketStatus === currentStatus && order.awbCode === (awb || order.awbCode)) {
    return res.json({ success: true, duplicate: true });
  }

  const mappedStatus = mapStatus(currentStatus);
  const trackingUrl  = awb
    ? `https://shiprocket.co/tracking/${awb}`
    : (order.trackingUrl || undefined);

  // Fields to update unconditionally
  const update = {
    shiprocketStatus:     currentStatus,
    shiprocketStatusCode: statusCode || 0,
    lastWebhookPayload:   payload,
  };
  if (awb)         update.awbCode        = awb;
  if (awb)         update.trackingNumber = awb;
  if (courierName) update.courierName    = courierName;
  if (trackingUrl) update.trackingUrl    = trackingUrl;

  // Only advance our internal orderStatus if it represents a valid forward move
  if (mappedStatus && shouldUpdateStatus(order.orderStatus, mappedStatus)) {
    update.orderStatus = mappedStatus;
    if (mappedStatus === 'delivered') update.deliveredAt = new Date();
    if (mappedStatus === 'cancelled' || mappedStatus === 'returned') {
      update.cancelledAt = new Date();
    }
  }

  const historyEntry = {
    status:    update.orderStatus || order.orderStatus,
    note:      buildHistoryNote(currentStatus, courierName, awb, etd),
    timestamp: new Date(),
  };

  await Order.findByIdAndUpdate(order._id, {
    ...update,
    $push: { statusHistory: historyEntry },
  });

  // Real-time push to all admin browser tabs
  req.app.emitAdminEvent?.('order-status-updated', {
    orderId:          order._id.toString(),
    orderNumber:      order.orderId,
    status:           update.orderStatus || order.orderStatus,
    shiprocketStatus: currentStatus,
    awbCode:          awb          || order.awbCode    || '',
    courierName:      courierName  || order.courierName || '',
    trackingUrl:      trackingUrl  || '',
  });

  console.log(
    `[Shiprocket Webhook] ✓ ${order.orderId}: "${currentStatus}" → internal "${update.orderStatus || order.orderStatus}"`
  );

  res.json({ success: true, orderId: order.orderId, status: currentStatus });
};
