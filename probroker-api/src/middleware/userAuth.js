const jwt = require('jsonwebtoken');

/**
 * Replaces the OTP-based user session (request.session["user_phone"] etc. in server.py)
 * with a JWT stored in an httpOnly cookie, issued by POST /api/v1/otp/verify.
 */
function getCurrentUser(req) {
  const token = req.cookies && req.cookies.user_token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (e) {
    return null;
  }
}

function requireUser(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }
  req.user = user;
  next();
}

module.exports = { getCurrentUser, requireUser };
