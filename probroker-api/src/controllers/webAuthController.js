const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const WebUser = require('../models/WebUser');
const { normalizePhone, maskPhone, issueOtp, checkOtp } = require('../services/otpService');
const { setUserSession } = require('../middleware/userAuth');
const { ensureWallet } = require('../services/creditService');

const SIGNUP = 'web-signup';
const LOGIN = 'web-login';

const MOBILE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^[\p{L} .'-]{2,60}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_RE = /^\d{4}$/;

const fail = (res, status, error, code) => res.status(status).json({ success: false, error, ...(code && { code }) });

// devOtp is only set when OTP_DEV_MODE is on (see smsService); the code is never echoed in production.
function otpSent(res, phone, devOtp) {
  const body = { success: true, message: `OTP sent to ${maskPhone(phone)}` };
  if (devOtp && process.env.NODE_ENV !== 'production') body.dev_otp = devOtp;
  res.json(body);
}

const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email });

// Fields that start a new session. Writing a new authToken signs out whichever device held the old one.
function newSessionFields(req) {
  return {
    authToken: crypto.randomBytes(32).toString('hex'),
    authTokenIssuedAt: new Date().toISOString(),
    lastLoginIp: String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
    lastLoginUserAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  };
}

// Grants the free credits on first login/signup. A wallet failure must not fail the login: the
// account already exists by now, and /auth/me creates the wallet on the next request anyway.
async function startSession(res, user, sid) {
  setUserSession(res, { userId: user.id, phone: user.phone, name: user.name, email: user.email, src: 'web', sid });
  const wallet = await ensureWallet({ userId: user.id, phone: user.phone, name: user.name })
    .catch((e) => console.error('[credits] wallet setup failed:', e));
  return { ...publicUser(user), freeCredits: wallet?.freeCredits };
}

function readOtpBody(body = {}) {
  return { phone: normalizePhone(body.phone), otp: String(body.otp || '').trim() };
}

// ---------- Sign up: name + mobile + email -> OTP -> WebUser ----------
exports.signupSendOtp = async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone);

  if (!NAME_RE.test(name)) return fail(res, 400, 'Please enter your full name.', 'INVALID_NAME');
  if (!MOBILE_RE.test(phone)) return fail(res, 400, 'Enter a valid 10-digit mobile number.', 'INVALID_PHONE');
  if (!EMAIL_RE.test(email)) return fail(res, 400, 'Enter a valid email address.', 'INVALID_EMAIL');

  const [phoneTaken, emailTaken] = await Promise.all([WebUser.exists({ phone }), WebUser.exists({ email })]);
  if (phoneTaken) return fail(res, 409, 'This mobile number is already registered. Please log in.', 'PHONE_EXISTS');
  if (emailTaken) return fail(res, 409, 'This email is already linked to another account.', 'EMAIL_EXISTS');

  const result = await issueOtp({ phone, purpose: SIGNUP, name, email });
  if (!result.ok) return fail(res, result.status, result.error);
  otpSent(res, phone, result.devOtp);
};

exports.signupVerify = async (req, res) => {
  const { phone, otp } = readOtpBody(req.body);
  if (!MOBILE_RE.test(phone) || !OTP_RE.test(otp)) return fail(res, 400, 'Invalid phone or OTP format');

  const check = await checkOtp({ phone, otp, purpose: SIGNUP });
  if (!check.ok) return fail(res, check.status, check.error);

  // name/email come from the OTP session written at send time, not from this request.
  const { name, email } = check.session;
  const nowIso = new Date().toISOString();
  const session = newSessionFields(req);
  let user;
  try {
    user = await WebUser.create({ id: uuidv4(), name, phone, email, createdAt: nowIso, updatedAt: nowIso, lastLogin: nowIso, ...session });
  } catch (e) {
    if (e.code === 11000) return fail(res, 409, 'An account with this mobile or email already exists. Please log in.', 'ACCOUNT_EXISTS');
    throw e;
  }

  res.status(201).json({ success: true, user: await startSession(res, user, session.authToken) });
};

// ---------- Login: registered mobile -> OTP ----------
exports.loginSendOtp = async (req, res) => {
  const phone = normalizePhone((req.body || {}).phone);
  if (!MOBILE_RE.test(phone)) return fail(res, 400, 'Enter a valid 10-digit mobile number.', 'INVALID_PHONE');

  const user = await WebUser.findOne({ phone }, { _id: 0, status: 1 }).lean();
  if (!user) return fail(res, 404, 'No account found for this number. Please sign up first.', 'NOT_REGISTERED');
  if (user.status === 'blocked') return fail(res, 403, 'This account has been disabled. Please contact support.', 'BLOCKED');

  const result = await issueOtp({ phone, purpose: LOGIN });
  if (!result.ok) return fail(res, result.status, result.error);
  otpSent(res, phone, result.devOtp);
};

exports.loginVerify = async (req, res) => {
  const { phone, otp } = readOtpBody(req.body);
  if (!MOBILE_RE.test(phone) || !OTP_RE.test(otp)) return fail(res, 400, 'Invalid phone or OTP format');

  const check = await checkOtp({ phone, otp, purpose: LOGIN });
  if (!check.ok) return fail(res, check.status, check.error);

  // One atomic write rotates the token, so two devices verifying at once can't both stay signed in.
  const session = newSessionFields(req);
  const user = await WebUser.findOneAndUpdate(
    { phone, status: { $ne: 'blocked' } },
    { $set: { lastLogin: session.authTokenIssuedAt, ...session } },
    { new: true, projection: { _id: 0 } },
  ).lean();
  if (!user) {
    const blocked = await WebUser.exists({ phone, status: 'blocked' });
    return blocked
      ? fail(res, 403, 'This account has been disabled. Please contact support.', 'BLOCKED')
      : fail(res, 404, 'No account found for this number. Please sign up first.', 'NOT_REGISTERED');
  }

  res.json({ success: true, user: await startSession(res, user, session.authToken) });
};
