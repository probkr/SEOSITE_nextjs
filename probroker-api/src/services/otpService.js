/**
 * Shared OTP issue/verify logic on top of the otp_sessions collection.
 * Used by the legacy /otp/* endpoints and the WebUser signup/login flow.
 */
const OtpSession = require('../models/OtpSession');
const { sendOtpSms, verifyOtpSession } = require('./smsService');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_ATTEMPTS = 3;

function normalizePhone(raw) {
  let phone = String(raw || '').trim().replace('+91', '').replace(/\s+/g, '');
  if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  return phone.slice(-10);
}

const isValidPhone = (phone) => /^\d{10}$/.test(phone);
const maskPhone = (phone) => `****${phone.slice(-4)}`;

// Sends an OTP and stores the session. `extra` (name, email, ...) is kept on the session so the
// verify step can trust it instead of re-reading it from the client.
async function issueOtp({ phone, purpose, ...extra }) {
  const windowStart = new Date(Date.now() - OTP_TTL_MS).toISOString();
  const recentCount = await OtpSession.countDocuments({ phone, createdAt: { $gte: windowStart } });
  if (recentCount >= MAX_SENDS_PER_WINDOW) {
    return { ok: false, status: 429, error: 'Too many OTP requests. Please wait 10 minutes.' };
  }

  const result = await sendOtpSms(phone);
  if (!result.success) {
    return { ok: false, status: 503, error: result.error || 'Failed to send OTP' };
  }

  const now = new Date();
  await OtpSession.create({
    ...extra,
    phone, otp: result.otp, session_id: result.session_id || '',
    purpose, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    isUsed: false, attempts: 0,
  });

  return { ok: true, devOtp: result.dev_mode ? result.otp : undefined };
}

// Verifies the latest unused OTP for phone+purpose. On success the session is consumed and returned.
async function checkOtp({ phone, otp, purpose }) {
  const session = await OtpSession.findOne(
    { phone, purpose, isUsed: false, expiresAt: { $gte: new Date().toISOString() } },
    { _id: 0 },
  ).sort({ createdAt: -1 }).lean();

  if (!session) {
    return { ok: false, status: 400, error: 'No valid OTP session found. Please request a new OTP.' };
  }

  const filter = { phone, session_id: session.session_id };
  const attempts = session.attempts || 0;
  if (attempts >= MAX_ATTEMPTS) {
    await OtpSession.updateOne(filter, { $set: { isUsed: true } });
    return { ok: false, status: 400, error: 'Too many wrong attempts. Please request a new OTP.' };
  }

  let verified = false;
  if (session.session_id) verified = await verifyOtpSession(session.session_id, otp);
  if (!verified) verified = otp === session.otp;

  if (verified) {
    await OtpSession.updateOne(filter, { $set: { isUsed: true } });
    return { ok: true, session };
  }

  const remaining = MAX_ATTEMPTS - 1 - attempts;
  await OtpSession.updateOne(filter, { $inc: { attempts: 1 } });
  const error = remaining > 0
    ? `Wrong OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    : 'Too many wrong attempts. Please request a new OTP.';
  return { ok: false, status: 400, error };
}

module.exports = { normalizePhone, isValidPhone, maskPhone, issueOtp, checkOtp };
