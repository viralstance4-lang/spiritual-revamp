// Sends transactional email via Brevo's HTTPS API instead of SMTP.
// Render (and several other PaaS hosts) block outbound SMTP ports (587/465/25),
// so the SMTP relay times out in production even though it works locally.
// The HTTP API uses port 443, which is never blocked.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendBrevoEmail = async ({ to, subject, html, fromName, fromEmail, replyTo }) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('[Brevo] Skipped — BREVO_API_KEY not set');
    return;
  }

  // `to` can be a single email string or an array of email strings
  const toList = Array.isArray(to)
    ? to.map(email => ({ email }))
    : [{ email: to }];

  const payload = {
    sender:      { name: fromName, email: fromEmail },
    to:          toList,
    subject,
    htmlContent: html,
  };
  if (replyTo) payload.replyTo = { email: replyTo };

  console.log(`[Brevo] Sending "${subject}" → ${toList.map(t => t.email).join(', ')}`);

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept:         'application/json',
      'api-key':      process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`[Brevo] ✗ HTTP ${response.status} for "${subject}" → ${toList.map(t => t.email).join(', ')}: ${errBody}`);
    throw new Error(`Brevo API ${response.status}: ${errBody}`);
  }

  const result = await response.json();
  console.log(`[Brevo] ✓ Accepted — messageId: ${result.messageId}`);
  return result;
};

module.exports = { sendBrevoEmail };
