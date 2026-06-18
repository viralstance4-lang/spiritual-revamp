'use strict';

/**
 * shiprocketService.js
 *
 * Low-level Shiprocket API wrapper:
 *   - Email + password → JWT authentication (tokens valid 10 days)
 *   - In-process token cache with 9-day TTL (refreshes 1 h before expiry)
 *   - Automatic one-shot token refresh on 401
 *   - Throws descriptive errors; callers decide whether to retry
 */

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

// ── In-process token cache (resets if the process restarts, which is fine) ───
const _token = {
  value:     null,
  expiresAt: 0, // epoch ms
};

// ── Logging helpers ────────────────────────────────────────────────────────────
const tag = '[Shiprocket]';
const log  = (...a) => console.log(tag,  ...a);
const warn = (...a) => console.warn(tag, ...a);

// ── Authentication ─────────────────────────────────────────────────────────────

async function fetchNewToken() {
  const email    = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in .env before Shiprocket can be used.'
    );
  }

  log('Requesting new auth token…');

  const res  = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    throw new Error(
      `Shiprocket auth failed (HTTP ${res.status}): ${data.message || JSON.stringify(data)}`
    );
  }

  log('Auth token obtained successfully.');
  return data.token;
}

/**
 * Returns a valid bearer token, re-fetching if missing or close to expiry.
 */
async function getToken() {
  const now = Date.now();
  // Refresh if absent or expiring within the next hour
  if (_token.value && _token.expiresAt > now + 60 * 60 * 1000) {
    return _token.value;
  }
  _token.value     = await fetchNewToken();
  // Cache for 9 days — Shiprocket tokens are valid for 10; the 1-day margin
  // ensures we never send an expired token in production.
  _token.expiresAt = now + 9 * 24 * 60 * 60 * 1000;
  return _token.value;
}

/** Force-expire the cached token (called when we receive a 401). */
function invalidateToken() {
  _token.value     = null;
  _token.expiresAt = 0;
}

// ── HTTP wrapper ───────────────────────────────────────────────────────────────

/**
 * Make an authenticated request to the Shiprocket API.
 * Automatically retries once after refreshing the token on a 401 response.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string}  path    e.g. '/orders/create/adhoc'
 * @param {object}  [body]  JSON body for POST/PUT
 * @param {boolean} [_retry=false]  Internal flag — prevents infinite refresh loop
 * @returns {object} Parsed JSON response body
 * @throws  {Error}  On non-2xx status or network failure
 */
async function apiRequest(method, path, body, _retry = false) {
  const token = await getToken();

  const res = await fetch(`${SHIPROCKET_API}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // One automatic token refresh on 401
  if (res.status === 401 && !_retry) {
    warn('Received 401 — invalidating cache and retrying with a fresh token…');
    invalidateToken();
    return apiRequest(method, path, body, true);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message || data?.errors || JSON.stringify(data);
    const err = new Error(`Shiprocket ${method} ${path} → HTTP ${res.status}: ${message}`);
    err.status     = res.status;
    err.statusText = res.statusText;
    err.data       = data;
    throw err;
  }

  return data;
}

// ── Public API surface ─────────────────────────────────────────────────────────

/**
 * Create a new forward order in Shiprocket.
 * @see https://apiv2.shiprocket.in/v1/external/orders/create/adhoc
 */
async function createOrder(payload) {
  return apiRequest('POST', '/orders/create/adhoc', payload);
}

/**
 * Cancel Shiprocket orders by their Shiprocket order IDs.
 * @param {number[]} ids  Shiprocket order IDs (integers).
 */
async function cancelOrder(ids) {
  return apiRequest('POST', '/orders/cancel', { ids });
}

/**
 * Fetch live tracking details for a shipment.
 * @param {string|number} shipmentId  Shiprocket shipment ID.
 */
async function trackShipment(shipmentId) {
  return apiRequest('GET', `/courier/track/shipment/${shipmentId}`);
}

module.exports = { createOrder, cancelOrder, trackShipment, invalidateToken };
