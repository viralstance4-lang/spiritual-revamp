'use strict';

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

// ── In-process token cache ─────────────────────────────────────────────────────
const _token = {
  value:     null,
  expiresAt: 0,
};

// ── Circuit breaker — stops login attempts after a credential failure ──────────
// Shiprocket locks accounts after ~5 failed logins in a short window.
// When we detect a 401/403 from /auth/login itself we open the breaker for
// BREAKER_COOLDOWN_MS (30 min) so no further login attempts are made.
const BREAKER_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const _breaker = {
  open:      false,
  openedAt:  0,
  reason:    '',
};

function isBreakerOpen() {
  if (!_breaker.open) return false;
  // Auto-reset after cooldown
  if (Date.now() - _breaker.openedAt > BREAKER_COOLDOWN_MS) {
    _breaker.open   = false;
    _breaker.reason = '';
    console.log('[Shiprocket] Circuit breaker reset — will retry auth now.');
    return false;
  }
  return true;
}

function openBreaker(reason) {
  _breaker.open     = true;
  _breaker.openedAt = Date.now();
  _breaker.reason   = reason;
  // Also wipe the cached token so the next attempt after cooldown fetches fresh
  _token.value     = null;
  _token.expiresAt = 0;
  console.error(
    `[Shiprocket] ⚡ Circuit breaker OPEN — all Shiprocket calls blocked for 30 min.\n` +
    `[Shiprocket]   Reason: ${reason}\n` +
    `[Shiprocket]   Fix: verify SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD in .env, then pm2 restart spiritual-api`
  );
}

// ── Logging helpers ────────────────────────────────────────────────────────────
const tag  = '[Shiprocket]';
const log  = (...a) => console.log(tag,  ...a);
const warn = (...a) => console.warn(tag, ...a);

// ── Authentication ─────────────────────────────────────────────────────────────

async function fetchNewToken() {
  const email    = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    const err = new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in .env');
    err.nonRetryable = true;
    throw err;
  }

  log('Requesting new auth token…');

  const res  = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    const msg = `Shiprocket auth failed (HTTP ${res.status}): ${data.message || JSON.stringify(data)}`;
    // 401 / 403 from the login endpoint = wrong credentials or account locked.
    // Open the circuit breaker — retrying will only make the lockout worse.
    if (res.status === 401 || res.status === 403) {
      openBreaker(msg);
    }
    const err = new Error(msg);
    err.status       = res.status;
    err.nonRetryable = true; // signal withRetry not to loop
    throw err;
  }

  log('Auth token obtained successfully.');
  return data.token;
}

async function getToken() {
  if (isBreakerOpen()) {
    const minutesLeft = Math.ceil((BREAKER_COOLDOWN_MS - (Date.now() - _breaker.openedAt)) / 60000);
    const err = new Error(
      `[Shiprocket] Circuit breaker is open (credentials failed). ` +
      `Auto-resets in ~${minutesLeft} min. Fix: check SHIPROCKET_EMAIL/PASSWORD in .env`
    );
    err.nonRetryable = true;
    throw err;
  }

  const now = Date.now();
  if (_token.value && _token.expiresAt > now + 60 * 60 * 1000) {
    return _token.value;
  }
  _token.value     = await fetchNewToken();
  _token.expiresAt = now + 9 * 24 * 60 * 60 * 1000; // 9-day cache
  return _token.value;
}

function invalidateToken() {
  _token.value     = null;
  _token.expiresAt = 0;
}

// ── HTTP wrapper ───────────────────────────────────────────────────────────────

async function apiRequest(method, path, body, _retry = false) {
  const token = await getToken(); // may throw if breaker is open

  const res = await fetch(`${SHIPROCKET_API}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // One automatic token refresh on 401 from the API (not from auth/login)
  if (res.status === 401 && !_retry) {
    warn('Received 401 on API call — invalidating cache and retrying once…');
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

async function createOrder(payload) {
  return apiRequest('POST', '/orders/create/adhoc', payload);
}

async function cancelOrder(ids) {
  return apiRequest('POST', '/orders/cancel', { ids });
}

async function trackShipment(shipmentId) {
  return apiRequest('GET', `/courier/track/shipment/${shipmentId}`);
}

/** Manually reset the circuit breaker (e.g. after fixing credentials). */
function resetBreaker() {
  _breaker.open   = false;
  _token.value    = null;
  _token.expiresAt = 0;
  log('Circuit breaker manually reset.');
}

module.exports = { createOrder, cancelOrder, trackShipment, invalidateToken, resetBreaker };
