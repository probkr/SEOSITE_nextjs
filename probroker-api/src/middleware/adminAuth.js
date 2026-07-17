const jwt = require('jsonwebtoken');

/**
 * Replaces FastAPI SessionMiddleware's request.session["is_admin"] check (check_admin() in server.py)
 * with a JWT stored in an httpOnly cookie, issued by POST /api/v1/admin/login.
 */
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    if (!payload.isAdmin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAdmin };
