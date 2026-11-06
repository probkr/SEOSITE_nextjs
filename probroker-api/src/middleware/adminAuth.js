const jwt = require('jsonwebtoken');
const { normalizePhone, isValidPhone } = require('../services/otpService');

// Mobile numbers allowed into the admin panel (comma-separated ADMIN_PHONES in .env, or the older
// single ADMIN_PHONE that existing servers already have).
// Read on every call so removing a number from .env + restarting revokes that admin.
function adminPhones() {
  return String(process.env.ADMIN_PHONES || process.env.ADMIN_PHONE || '')
    .split(',')
    .map(normalizePhone)
    .filter(isValidPhone);
}

/**
 * Replaces FastAPI SessionMiddleware's request.session["is_admin"] check (check_admin() in server.py)
 * with a JWT stored in an httpOnly cookie, issued by POST /api/v1/admin/login/verify after a
 * mobile OTP. Tokens from the old username/password login (no `via: 'otp'`) are rejected.
 */
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    if (!payload.isAdmin || payload.via !== 'otp' || !adminPhones().includes(payload.phone)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAdmin, adminPhones };
