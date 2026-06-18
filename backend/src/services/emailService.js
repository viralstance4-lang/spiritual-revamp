const { SiteSettings } = require('../models/ShippingSettings');
const { sendBrevoEmail } = require('./brevoMailer');

const sendOrderConfirmationEmail = async (order, email) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('[Email] Skipped — BREVO_API_KEY not set');
    return;
  }

  // ── Fetch brand logo + name from DB ──────────────────────────────────────────
  const site = await SiteSettings.findOne().lean();
  const brandName = site?.logoAlt || process.env.FROM_NAME || 'Spiritual Revamp';

  // Convert relative logo path → absolute URL so email clients can load it
  let logoUrl = site?.logoUrl || '';
  if (logoUrl && !logoUrl.startsWith('http')) {
    const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    logoUrl = `${backendBase}${logoUrl}`;
  }

  // Build logo block: real image if available, initials circle as fallback
  const initials = brandName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName}" style="max-height:70px;max-width:220px;object-fit:contain;display:block;margin:0 auto;" />`
    : `<div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#F5E17A);line-height:56px;font-weight:bold;color:#0a0a0a;font-size:18px;">${initials}</div>`;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #2a2a2a;">
        ${item.name}
        ${item.isFreeGift ? '<span style="display:inline-block;margin-left:6px;padding:2px 8px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#0a0a0a;background:#D4AF37;border-radius:999px;">🎁 Free Gift</span>' : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #2a2a2a;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #2a2a2a;text-align:right;">
        ${item.isFreeGift
          ? `<span style="color:rgba(255,255,255,0.3);text-decoration:line-through;margin-right:6px;">₹${(item.originalPrice || 0).toLocaleString('en-IN')}</span><span style="color:#4ade80;">FREE</span>`
          : `₹${(item.price * item.quantity).toLocaleString('en-IN')}`}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmed — spiritual-revamp</title></head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          ${logoBlock}
          <h1 style="margin:12px 0 0;font-size:20px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;">${brandName}</h1>
        </div>

        <!-- Banner -->
        <div style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a);border:1px solid rgba(212,175,55,0.2);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;margin-bottom:16px;">✨</div>
          <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Order Confirmed!</h2>
          <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;">Thank you for your order. Your crystals are being prepared with intention.</p>
          <div style="display:inline-block;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:8px 20px;margin-top:16px;">
            <span style="color:#D4AF37;font-weight:bold;font-size:16px;">#${order.orderId}</span>
          </div>
        </div>

        <!-- Order Details -->
        <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Order Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #333;">
                <th style="padding:8px;text-align:left;font-size:12px;color:rgba(255,255,255,0.4);">ITEM</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:rgba(255,255,255,0.4);">QTY</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:rgba(255,255,255,0.4);">TOTAL</th>
              </tr>
            </thead>
            <tbody style="font-size:14px;">${itemsHtml}</tbody>
          </table>
          <div style="border-top:1px solid #333;margin-top:16px;padding-top:16px;">
            ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#4ade80;font-size:14px;"><span>Discount (${order.couponCode})</span><span>-₹${order.discount.toLocaleString('en-IN')}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;color:#fff;">
              <span>Total</span><span style="color:#D4AF37;">₹${order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Shipping Address -->
        <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin-bottom:24px;">
          <h3 style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Delivering To</h3>
          <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}<br>
            📱 ${order.shippingAddress.phone}
          </p>
          <div style="margin-top:12px;padding:8px 12px;background:rgba(212,175,55,0.1);border-radius:8px;display:inline-block;font-size:13px;color:#D4AF37;">
            ${order.paymentMethod === 'cod' ? '💰 Payment: Cash on Delivery' : '✅ Payment: Paid Online'}
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:12px;">
          <p>Questions? WhatsApp us at <a href="https://wa.me/917599214642" style="color:#D4AF37;">+91 7599214642</a></p>
          <p style="margin-top:8px;">© 2025 spiritual-revamp. Handcrafted with ✨ intention.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `✨ Order Confirmed — #${order.orderId} | ${brandName}`;

  await sendBrevoEmail({
    to: email,
    subject,
    html,
    fromName: brandName,
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER,
  });
  console.log(`[Email] Confirmation sent to ${email} via Brevo API`);
};

// ── Retry helper (used only by admin notification) ────────────────────────────
async function retryBrevo(fn, recipient, orderId, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      console.log(`[AdminEmail] #${orderId} ✓ sent to ${recipient} (attempt ${attempt}/${maxAttempts})`);
      return result;
    } catch (err) {
      lastErr = err;
      const isLast = attempt === maxAttempts;
      const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s → 2s → 4s
      console.error(
        `[AdminEmail] #${orderId} ✗ attempt ${attempt}/${maxAttempts} for ${recipient}: ${err.message}` +
        (isLast ? ' — no more retries' : ` — retrying in ${delayMs}ms`)
      );
      if (!isLast) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// ── Admin Order Notification ──────────────────────────────────────────────────
// • Sends one email per admin recipient (independent retries, no shared failure)
// • Never throws — all errors are logged internally
// • Retries up to 3× with exponential back-off (1 s → 2 s → 4 s)
const sendAdminOrderNotificationEmail = async (order, customerEmail) => {
  const tag = `[AdminEmail] #${order?.orderId || '?'}`;

  console.log(`${tag} ── notification triggered`);

  if (!process.env.BREVO_API_KEY) {
    console.warn(`${tag} Skipped — BREVO_API_KEY not configured`);
    return;
  }

  const rawRecipients = process.env.ADMIN_ORDER_NOTIFICATION_EMAILS || '';
  const recipients = rawRecipients.split(',').map(e => e.trim()).filter(Boolean);

  console.log(`${tag} Recipients parsed: ${recipients.length > 0 ? recipients.join(', ') : '(none)'}`);

  if (recipients.length === 0) {
    console.warn(`${tag} Skipped — ADMIN_ORDER_NOTIFICATION_EMAILS is empty or not set`);
    return;
  }

  // ── Brand assets (DB failure falls back to env / defaults) ──────────────────
  let site = null;
  try {
    site = await SiteSettings.findOne().lean();
  } catch (dbErr) {
    console.warn(`${tag} Could not load SiteSettings (using defaults): ${dbErr.message}`);
  }
  const brandName = site?.logoAlt || process.env.FROM_NAME || 'Spiritual Revamp';
  let   logoUrl   = site?.logoUrl || '';
  if (logoUrl && !logoUrl.startsWith('http')) {
    const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    logoUrl = `${base}${logoUrl}`;
  }
  const initials  = brandName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName}" style="max-height:60px;max-width:200px;object-fit:contain;display:block;margin:0 auto;" />`
    : `<div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#F5E17A);line-height:48px;font-weight:bold;color:#0a0a0a;font-size:16px;text-align:center;">${initials}</div>`;

  // ── Order fields ─────────────────────────────────────────────────────────────
  const addr         = order.shippingAddress;
  const customerName = addr?.name || order.guestInfo?.name || '—';
  const customerPhone= addr?.phone || '—';
  const orderDate    = new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const paymentText  = order.paymentMethod === 'cod'
    ? 'Cash on Delivery'
    : `Online — ${order.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending'}`;

  // ── Items rows ───────────────────────────────────────────────────────────────
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #252525;font-size:13px;color:rgba(255,255,255,0.82);">
        ${item.name}
        ${item.isFreeGift
          ? `<span style="display:inline-block;margin-left:6px;padding:2px 7px;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#0a0a0a;background:#D4AF37;border-radius:4px;">FREE</span>`
          : ''}
      </td>
      <td style="padding:9px 0;border-bottom:1px solid #252525;text-align:center;font-size:13px;color:rgba(255,255,255,0.55);">${item.quantity}</td>
      <td style="padding:9px 0;border-bottom:1px solid #252525;text-align:right;font-size:13px;">
        ${item.isFreeGift
          ? `<span style="color:rgba(255,255,255,0.3);text-decoration:line-through;font-size:11px;">₹${(item.originalPrice || 0).toLocaleString('en-IN')}</span>&nbsp;<span style="color:#4ade80;">FREE</span>`
          : `<span style="color:#fff;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>`}
      </td>
    </tr>`).join('');

  // ── Price rows ───────────────────────────────────────────────────────────────
  const shippingRow = order.shippingCharge > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px;color:rgba(255,255,255,0.55);"><span>Shipping</span><span>₹${order.shippingCharge.toLocaleString('en-IN')}</span></div>`
    : `<div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px;color:rgba(255,255,255,0.55);"><span>Shipping</span><span style="color:#4ade80;">FREE</span></div>`;

  const discountRow = order.discount > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px;color:#4ade80;"><span>Discount${order.couponCode ? ` (${order.couponCode})` : ''}</span><span>−₹${order.discount.toLocaleString('en-IN')}</span></div>`
    : '';

  const adminPanelUrl = `${process.env.ADMIN_URL || 'http://localhost:5174'}/orders`;

  // ── HTML template ────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Order #${order.orderId}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">

  <!-- Logo -->
  <div style="text-align:center;margin-bottom:28px;">
    ${logoBlock}
    <h1 style="margin:10px 0 0;font-size:17px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;">${brandName}</h1>
    <p style="margin:5px 0 0;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:3px;text-transform:uppercase;">Admin Notification</p>
  </div>

  <!-- Alert banner -->
  <div style="background:linear-gradient(135deg,#1c1c1c,#222);border:1px solid rgba(212,175,55,0.22);border-left:3px solid #D4AF37;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h2 style="margin:0 0 6px;font-size:19px;color:#fff;">🔔 New Order Received</h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.42);">A customer has placed a new order. Please review and process it promptly.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.22);border-radius:8px;padding:10px 16px;">
        <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.2px;">Order ID</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#D4AF37;font-family:monospace;">#${order.orderId}</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 16px;">
        <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.2px;">Date &amp; Time</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.78);">${orderDate}</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 16px;">
        <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.2px;">Payment</p>
        <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">${paymentText}</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 16px;">
        <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.2px;">Status</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.78);text-transform:capitalize;">${order.orderStatus}</p>
      </div>
    </div>
  </div>

  <!-- Customer Details -->
  <div style="background:#161616;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:14px;">
    <h3 style="margin:0 0 14px;font-size:10px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.5px;">👤 Customer</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr>
        <td style="padding:5px 0;color:rgba(255,255,255,0.42);width:100px;vertical-align:top;">Name</td>
        <td style="padding:5px 0;color:#fff;font-weight:600;">${customerName}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:rgba(255,255,255,0.42);">Email</td>
        <td style="padding:5px 0;"><a href="mailto:${customerEmail || ''}" style="color:#D4AF37;text-decoration:none;">${customerEmail || '—'}</a></td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:rgba(255,255,255,0.42);">Phone</td>
        <td style="padding:5px 0;color:rgba(255,255,255,0.78);">${customerPhone}</td>
      </tr>
    </table>
  </div>

  <!-- Shipping Address -->
  <div style="background:#161616;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:14px;">
    <h3 style="margin:0 0 14px;font-size:10px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.5px;">📦 Ship To</h3>
    <p style="margin:0;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.7);">
      <strong style="color:#fff;">${addr?.name || ''}</strong><br>
      ${addr?.line1 || ''}${addr?.line2 ? ', ' + addr.line2 : ''}<br>
      ${addr?.city || ''}, ${addr?.state || ''} &mdash; ${addr?.pincode || ''}<br>
      <span style="color:#D4AF37;">📱 ${addr?.phone || ''}</span>
    </p>
  </div>

  <!-- Items + Price Breakdown -->
  <div style="background:#161616;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:14px;">
    <h3 style="margin:0 0 14px;font-size:10px;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:1.5px;">🛒 Items (${order.items.length})</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #252525;">
          <th style="padding:6px 0;text-align:left;font-size:9px;color:rgba(255,255,255,0.28);font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Product</th>
          <th style="padding:6px 0;text-align:center;font-size:9px;color:rgba(255,255,255,0.28);font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Qty</th>
          <th style="padding:6px 0;text-align:right;font-size:9px;color:rgba(255,255,255,0.28);font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #252525;">
      <div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px;color:rgba(255,255,255,0.55);">
        <span>Subtotal</span><span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span>
      </div>
      ${shippingRow}
      ${discountRow}
      <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #2a2a2a;font-size:16px;font-weight:bold;">
        <span style="color:#fff;">Grand Total</span>
        <span style="color:#D4AF37;">₹${(order.total || 0).toLocaleString('en-IN')}</span>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin:28px 0 22px;">
    <a href="${adminPanelUrl}"
       style="display:inline-block;padding:14px 38px;background:linear-gradient(135deg,#D4AF37,#F5E17A);color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;letter-spacing:0.5px;">
      View Order in Admin Panel &rarr;
    </a>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.25);">Search for order <strong style="color:rgba(255,255,255,0.45);">#${order.orderId}</strong> in the Orders page</p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;color:rgba(255,255,255,0.18);font-size:11px;border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;line-height:1.9;">
    <p style="margin:0;">Automated admin notification &mdash; <strong style="color:rgba(255,255,255,0.32);">${brandName}</strong></p>
    <p style="margin:3px 0 0;">Do not reply to this email.</p>
  </div>

</div>
</body>
</html>`;

  const subject   = `New Order Received - Order #${order.orderId}`;
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName  = brandName;

  console.log(`${tag} Building email — subject: "${subject}", from: ${fromEmail}`);

  // Send one email per recipient with individual retry loops.
  // Promise.allSettled ensures one failure never blocks the other.
  const results = await Promise.allSettled(
    recipients.map(recipient =>
      retryBrevo(
        () => sendBrevoEmail({ to: recipient, subject, html, fromName, fromEmail }),
        recipient,
        order.orderId
      )
    )
  );

  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`${tag} ✗ Final failure for ${recipients[i]}: ${r.reason?.message}`);
      }
    });
  }

  console.log(`${tag} ── done: ${sent} sent, ${failed} failed out of ${recipients.length} recipients`);
};

module.exports = { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail };
