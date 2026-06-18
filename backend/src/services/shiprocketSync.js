'use strict';

/**
 * shiprocketSync.js
 *
 * Orchestrates pushing a confirmed/paid order to Shiprocket:
 *
 *   1. Atomic claim — exactly one concurrent handler wins (mirrors the
 *      confirmationEmailSent pattern used for emails).
 *   2. Builds the Shiprocket payload from our Order document.
 *   3. Calls the Shiprocket API with exponential-backoff retry (3 attempts).
 *   4. Persists the Shiprocket response (or error details) back to MongoDB.
 *
 * Usage (fire-and-forget — never awaited at the call site):
 *
 *   syncOrderToShiprocket(order, emailTo).catch(err =>
 *     console.error('[Shiprocket] Unhandled sync error:', err.message)
 *   );
 */

const Order      = require('../models/Order');
const shiprocket = require('./shiprocketService');

const tag = '[Shiprocket]';

// ── Retry helper ───────────────────────────────────────────────────────────────

/**
 * Run `fn` up to `attempts` times, waiting with exponential back-off between
 * failures.  Throws the last error if all attempts fail.
 *
 * Delays: 2 s → 4 s → 8 s (doubles each time, capped at maxDelayMs).
 */
async function withRetry(fn, { attempts = 3, baseDelayMs = 2000, maxDelayMs = 15000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts) break;
      const delay = Math.min(baseDelayMs * Math.pow(2, i - 1), maxDelayMs);
      console.warn(
        `${tag} Attempt ${i}/${attempts} failed: ${err.message}. Retrying in ${delay / 1000}s…`
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Payload builder ────────────────────────────────────────────────────────────

/**
 * Converts our internal Order document into the payload expected by
 * POST /orders/create/adhoc.
 *
 * Package dimensions default to bracelet/jewellery sizes and can be
 * overridden via environment variables.
 */
function buildShiprocketPayload(order, emailTo) {
  const addr = order.shippingAddress;

  // Shiprocket requires separate first / last name fields
  const nameParts = (addr.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName  = nameParts.slice(1).join(' ') || '.';

  // "YYYY-MM-DD HH:MM:SS" format required by Shiprocket
  const orderDate = new Date(order.createdAt)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  // Paid items
  const paidItems = order.items
    .filter(i => !i.isFreeGift)
    .map(i => ({
      name:          i.name,
      sku:           (i.product?.toString() || 'PROD').slice(-8).toUpperCase(),
      units:         i.quantity,
      selling_price: String(i.price),
      discount:      '',
      tax:           '',
      hsn:           '',
    }));

  // Free gifts — listed as ₹0 so Shiprocket knows what's in the parcel
  const giftItems = order.items
    .filter(i => i.isFreeGift)
    .map(i => ({
      name:          `${i.name} (Free Gift)`,
      sku:           (i.product?.toString() || 'GIFT').slice(-8).toUpperCase() + '-GFT',
      units:         i.quantity,
      selling_price: '0',
      discount:      '',
      tax:           '',
      hsn:           '',
    }));

  return {
    order_id:              order.orderId,
    order_date:            orderDate,
    pickup_location:       process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    comment:               order.giftMessage || '',

    // Billing address (same as shipping in this store)
    billing_customer_name: firstName,
    billing_last_name:     lastName,
    billing_address:       addr.line1,
    billing_address_2:     addr.line2 || '',
    billing_city:          addr.city,
    billing_pincode:       addr.pincode,
    billing_state:         addr.state,
    billing_country:       'India',
    billing_email:         emailTo || '',
    billing_phone:         addr.phone,

    // Shipping = billing
    shipping_is_billing:   true,
    shipping_customer_name: '',
    shipping_last_name:    '',
    shipping_address:      '',
    shipping_address_2:    '',
    shipping_city:         '',
    shipping_pincode:      '',
    shipping_country:      '',
    shipping_state:        '',
    shipping_email:        '',
    shipping_phone:        '',

    order_items:           [...paidItems, ...giftItems],

    // "COD" or "Prepaid"
    payment_method:        order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',

    shipping_charges:      order.shippingCharge  || 0,
    giftwrap_charges:      0,
    transaction_charges:   0,
    total_discount:        order.discount        || 0,
    sub_total:             order.subtotal        || order.total,

    // Package dimensions — override via env vars for different product lines
    length:  Number(process.env.SHIPROCKET_LENGTH)  || 10,  // cm
    breadth: Number(process.env.SHIPROCKET_BREADTH) || 10,  // cm
    height:  Number(process.env.SHIPROCKET_HEIGHT)  || 5,   // cm
    weight:  Number(process.env.SHIPROCKET_WEIGHT)  || 0.3, // kg
  };
}

// ── Main sync function ─────────────────────────────────────────────────────────

/**
 * Push a confirmed/paid order to Shiprocket (idempotent, concurrency-safe).
 *
 * Guards:
 *  - Skips orders that are not in a shippable state.
 *  - Uses an atomic MongoDB claim so verifyPayment + webhook can both call
 *    this safely — only one will proceed.
 *  - If all retry attempts fail, saves the error blob to `shiprocketResponse`
 *    so an admin can investigate without trawling logs, then an admin can
 *    manually re-trigger via POST /api/orders/admin/:id/sync-shiprocket.
 *
 * @param {import('../models/Order').default} order    Mongoose Order document.
 * @param {string|null}                       emailTo  Customer email (for SR record).
 */
async function syncOrderToShiprocket(order, emailTo) {
  // Guard: only sync orders that have been paid or are COD-confirmed
  const syncable =
    order.paymentMethod === 'cod' ||
    order.paymentStatus === 'paid';

  if (!syncable) {
    console.log(`${tag} Skipping order ${order.orderId} — payment not confirmed.`);
    return;
  }

  // Guard: skip if already has a Shiprocket order ID (idempotency for manual retriggers)
  if (order.shiprocketOrderId) {
    console.log(`${tag} Order ${order.orderId} already in Shiprocket (${order.shiprocketOrderId}).`);
    return;
  }

  // ── Atomic claim ────────────────────────────────────────────────────────────
  // If shiprocketSynced is already true another handler got here first → skip.
  // This mirrors the confirmationEmailSent pattern.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, shiprocketSynced: false },
    { shiprocketSynced: true },
  );

  if (!claimed) {
    console.log(`${tag} Order ${order.orderId} — sync already claimed by another handler.`);
    return;
  }

  // ── Build payload & push with retry ────────────────────────────────────────
  try {
    const payload = buildShiprocketPayload(order, emailTo);

    // Persist the exact payload before calling the API so the debug
    // endpoint can show what was sent even if the process crashes mid-call.
    await Order.findByIdAndUpdate(order._id, { shiprocketLastPayload: payload }).catch(() => {});

    console.log(
      `${tag} Pushing order ${order.orderId} → Shiprocket\n` +
      `${tag} Payload: ${JSON.stringify(payload)}`
    );

    const result = await withRetry(() => shiprocket.createOrder(payload));

    console.log(`${tag} Raw response for ${order.orderId}: ${JSON.stringify(result)}`);

    // Shiprocket occasionally returns HTTP 200 with no order_id on validation errors
    if (!result.order_id) {
      throw new Error(
        `Shiprocket accepted the request but returned no order_id. ` +
        `Response: ${JSON.stringify(result)}`
      );
    }

    await Order.findByIdAndUpdate(order._id, {
      shiprocketOrderId:    String(result.order_id),
      shiprocketShipmentId: String(result.shipment_id || ''),
      shiprocketStatus:     result.status             || 'NEW',
      shiprocketSyncedAt:   new Date(),
      shiprocketResponse:   result,
      shiprocketError:      null, // clear any previous failure
    });

    console.log(
      `${tag} ✓ Order ${order.orderId} created in Shiprocket — ` +
      `order_id: ${result.order_id}, shipment_id: ${result.shipment_id}`
    );
  } catch (err) {
    console.error(
      `${tag} ✗ All retries exhausted for ${order.orderId}:\n` +
      `${tag}   message : ${err.message}\n` +
      `${tag}   status  : ${err.status || 'N/A'}\n` +
      `${tag}   data    : ${JSON.stringify(err.data || null)}`
    );

    // Persist failure details so the admin dashboard can surface them
    await Order.findByIdAndUpdate(order._id, {
      shiprocketError:    err.message,
      shiprocketResponse: {
        error:     err.message,
        errorData: err.data  || null,
        failedAt:  new Date().toISOString(),
      },
    }).catch(() => {});
  }
}

module.exports = { syncOrderToShiprocket };
