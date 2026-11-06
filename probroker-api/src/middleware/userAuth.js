const jwt = require('jsonwebtoken');
const WebUser = require('../models/WebUser');
const { sessionCookieOpts } = require('../config/cookies');

const USER_COOKIE = 'user_token';
// Readable by the site, so guests can skip /auth/me. It holds no user data and proves nothing:
// the API still trusts only the httpOnly token.
const SESSION_FLAG_COOKIE = 'pb_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOpts = sessionCookieOpts;

function decodeToken(req) {
  const token = req.cookies && req.cookies[USER_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Runs before every /api/v1 route. WebUser sessions (src: 'web') are only valid while the
 * token's `sid` still matches WebUser.authToken -- logging in on another device rotates that
 * value, so this device's cookie is cleared and req.sessionEnded explains why.
 * Legacy /otp/verify tokens carry no sid and are accepted on signature alone, as before.
 */
async function resolveUserSession(req, res, next) {
  const payload = decodeToken(req);
  req.authUser = payload;
  if (!payload || payload.src !== 'web') return next();

  try {
    const user = await WebUser.findOne({ id: payload.userId }, { _id: 0, status: 1, authToken: 1 }).lean();
    let reason = null;
    if (!user || !payload.sid) reason = 'SESSION_EXPIRED';
    else if (user.status === 'blocked') reason = 'BLOCKED';
    else if (user.authToken !== payload.sid) reason = user.authToken ? 'SESSION_REPLACED' : 'SESSION_EXPIRED';

    if (reason) {
      req.authUser = null;
      req.sessionEnded = reason;
      clearUserSession(res);
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Replaces the OTP-based user session (request.session["user_phone"] etc. in server.py)
 * with a JWT stored in an httpOnly cookie, issued by POST /api/v1/otp/verify
 * and the /auth/signup + /auth/login verify endpoints.
 */
function getCurrentUser(req) {
  if ('authUser' in req) return req.authUser;
  return decodeToken(req);
}

function setUserSession(res, payload) {
  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie(USER_COOKIE, token, { ...cookieOpts(), maxAge: SESSION_MS });
  res.cookie(SESSION_FLAG_COOKIE, '1', { ...cookieOpts(), httpOnly: false, maxAge: SESSION_MS });
}

function clearUserSession(res) {
  res.clearCookie(USER_COOKIE, cookieOpts());
  res.clearCookie(SESSION_FLAG_COOKIE, { ...cookieOpts(), httpOnly: false });
}

function requireUser(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }
  req.user = user;
  next();
}

module.exports = { resolveUserSession, getCurrentUser, setUserSession, clearUserSession, requireUser };
