/**
 * Port of backend/services/sms_service.py -- 2Factor.in SMS OTP service.
 *
 * Dev mode (OTP returned to the caller instead of texted) is opt-in and fails closed: an SMS
 * failure must be an error by default, because echoing the code would let anyone log in as any
 * number. NODE_ENV alone isn't enough -- a server .env copied from .env.example says "development".
 */
const crypto = require('crypto');
const axios = require('axios');

const baseUrl = () => (process.env.TWOFACTOR_BASE_URL || 'https://2factor.in/API/V1').replace(/\/+$/, '');

function generateOtp() {
  return String(crypto.randomInt(1000, 10000));
}

const otpDevModeEnabled = () => process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production';

async function sendOtpSms(phoneNumber) {
  let phone = String(phoneNumber).trim();
  if (phone.startsWith('+91')) phone = phone.slice(3);
  else if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  phone = phone.slice(-10);

  if (phone.length !== 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const otp = generateOtp();
  const apiKey = process.env.TWOFACTOR_API_KEY || '';
  const template = process.env.LOGIN_OTP_SMS_TEMPLATE || process.env.TWOFACTOR_TEMPLATE || 'PRbroker Login OTP';

  if (apiKey && !['probroker-seo', ''].includes(apiKey)) {
    try {
      const url = `${baseUrl()}/${apiKey}/SMS/${phone}/${otp}/${encodeURIComponent(template)}`;
      const resp = await axios.get(url, { timeout: 10000 });
      const data = resp.data;
      if (data && data.Status === 'Success') {
        return { success: true, otp, session_id: data.Details || '', phone };
      }
      console.warn('2Factor API failed:', data && data.Details);
    } catch (apiErr) {
      console.warn('2Factor API error:', apiErr.message);
    }
  } else {
    console.warn('TWOFACTOR_API_KEY is not set, so no SMS was sent.');
  }

  if (otpDevModeEnabled()) {
    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    return { success: true, otp, session_id: `dev-${phone}-${otp}`, phone, dev_mode: true };
  }

  return { success: false, error: 'Could not send OTP right now. Please try again in a few minutes.' };
}

async function verifyOtpSession(sessionId, otpEntered) {
  if (sessionId.startsWith('dev-')) {
    return false; // dev-mode sessions fall through to direct OTP match by the caller
  }
  try {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    const url = `${baseUrl()}/${apiKey}/SMS/VERIFY/${sessionId}/${otpEntered}`;
    const resp = await axios.get(url, { timeout: 10000 });
    return resp.data && resp.data.Status === 'Success';
  } catch (e) {
    console.error('OTP verify error:', e.message);
    return false;
  }
}

module.exports = { generateOtp, sendOtpSms, verifyOtpSession };
