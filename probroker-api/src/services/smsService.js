/**
 * Port of backend/services/sms_service.py -- 2Factor.in SMS OTP service with dev-mode fallback.
 */
const axios = require('axios');

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function sendOtpSms(phoneNumber) {
  try {
    let phone = String(phoneNumber).trim();
    if (phone.startsWith('+91')) phone = phone.slice(3);
    else if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
    phone = phone.slice(-10);

    if (phone.length !== 10) {
      return { success: false, error: 'Invalid phone number' };
    }

    const otp = generateOtp();
    const apiKey = process.env.TWOFACTOR_API_KEY || '';
    const template = process.env.TWOFACTOR_TEMPLATE || 'PRbroker Login OTP';

    if (apiKey && !['probroker-seo', ''].includes(apiKey)) {
      try {
        const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/${encodeURIComponent(template)}`;
        const resp = await axios.get(url, { timeout: 10000 });
        const data = resp.data;
        if (data && data.Status === 'Success') {
          return { success: true, otp, session_id: data.Details || '', phone };
        }
        console.warn('2Factor API failed:', data && data.Details, '- falling back to dev mode.');
      } catch (apiErr) {
        console.warn('2Factor API error, falling back to dev mode:', apiErr.message);
      }
    }

    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    return { success: true, otp, session_id: `dev-${phone}-${otp}`, phone, dev_mode: true };
  } catch (e) {
    const otp = generateOtp();
    console.log(`[DEV MODE FALLBACK] OTP for ${phoneNumber}: ${otp}`);
    return {
      success: true,
      otp,
      session_id: `dev-fallback-${otp}`,
      phone: String(phoneNumber).slice(-10),
      dev_mode: true,
    };
  }
}

async function verifyOtpSession(sessionId, otpEntered) {
  if (sessionId.startsWith('dev-')) {
    return false; // dev-mode sessions fall through to direct OTP match by the caller
  }
  try {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otpEntered}`;
    const resp = await axios.get(url, { timeout: 10000 });
    return resp.data && resp.data.Status === 'Success';
  } catch (e) {
    console.error('OTP verify error:', e.message);
    return false;
  }
}

module.exports = { generateOtp, sendOtpSms, verifyOtpSession };
