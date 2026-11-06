const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = function verifyWebhookAuth(req, res, next) {
  const expectedKey = process.env.WEBHOOK_AUTH_KEY;

  if (!expectedKey) {
    console.error('WEBHOOK_AUTH_KEY is not configured on the server.');
    return res.status(500).json({ ok: false, error: 'server_misconfigured' });
  }

  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'missing_or_malformed_authorization_header' });
  }

  if (!timingSafeEqual(token, expectedKey)) {
    return res.status(401).json({ ok: false, error: 'invalid_auth_key' });
  }

  next();
};
