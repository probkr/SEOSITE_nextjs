'use client';

import { useEffect, useRef, useState } from 'react';
import { postJson } from '@/lib/api';

// Shared SMS-OTP step for lead forms (inquiries, requirements). The API's 'inquiry' purpose
// proves the number without logging anyone in: /otp/verify returns a short-lived verifyToken
// that the form sends with its submission, and the API marks that lead phoneVerified.

export const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

// Last 10 digits of whatever was typed ("+91 98765 43210" -> "9876543210").
export const phone10 = (v) => String(v || '').replace(/\D/g, '').slice(-10);
export const validPhone = (v) => /^[6-9]\d{9}$/.test(phone10(v));

/** send(phone, name) texts a code; true when sent. Errors land in `error`. */
export function usePhoneOtp() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function send(phone, name = '') {
    setError('');
    setBusy(true);
    const res = await postJson('/otp/send', { phone: phone10(phone), name: String(name).trim(), purpose: 'inquiry' });
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.error || 'Could not send the OTP. Please try again.');
      return false;
    }
    setDevOtp(res.data?.dev_otp || '');
    setResendIn(RESEND_SECONDS);
    return true;
  }

  // The verify token, or null (with `error` set).
  async function verify(phone, code) {
    setError('');
    setBusy(true);
    const res = await postJson('/otp/verify', { phone: phone10(phone), otp: code, purpose: 'inquiry' });
    setBusy(false);
    if (!res.ok || !res.data?.verifyToken) {
      setError(res.data?.error || 'Incorrect OTP. Please try again.');
      return null;
    }
    return res.data.verifyToken;
  }

  return { busy, setBusy, error, setError, devOtp, resendIn, send, verify };
}

/**
 * The "enter the code" screen. onVerified(token) runs once the code checks out; the parent
 * then submits its form. submitting: the parent is sending the form after verification.
 */
export function OtpStep({ otp: o, phone, name, onVerified, onChangeNumber, submitting = false, verifyLabel = 'Verify & Submit' }) {
  const [code, setCode] = useState('');
  const ref = useRef(null);
  const busy = o.busy || submitting;

  useEffect(() => { ref.current?.focus(); }, []);

  async function check(value) {
    if (busy || value.length !== OTP_LENGTH) return;
    const token = await o.verify(phone, value);
    if (token) {
      onVerified(token);
    } else {
      setCode('');
      ref.current?.focus();
    }
  }

  function onChange(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(v);
    if (v.length === OTP_LENGTH) check(v);
  }

  async function resend() {
    if (await o.send(phone, name)) {
      setCode('');
      ref.current?.focus();
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Enter the {OTP_LENGTH}-digit code sent to <span className="font-semibold text-gray-900">+91 {phone10(phone)}</span>{' '}
        <button type="button" onClick={onChangeNumber} className="text-primary font-semibold hover:underline">Change</button>
      </div>
      <input
        ref={ref}
        value={code}
        onChange={onChange}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="OTP"
        placeholder={'•'.repeat(OTP_LENGTH)}
        maxLength={OTP_LENGTH}
        disabled={busy}
        className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-center text-xl font-bold tracking-[0.6em] placeholder:tracking-[0.6em] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
      />
      {o.devOtp && (
        <p className="text-xs text-gray-500">
          SMS isn&apos;t configured on this server. Test code: <span className="font-mono font-bold text-gray-800">{o.devOtp}</span>
        </p>
      )}
      <button type="button" onClick={() => check(code)} disabled={busy || code.length !== OTP_LENGTH} className="btn-primary w-full text-sm disabled:opacity-60">
        {busy ? 'Verifying...' : verifyLabel}
      </button>
      <div className="text-xs text-gray-500 text-center">
        {o.resendIn > 0 ? (
          <>Resend code in {o.resendIn}s</>
        ) : (
          <button type="button" onClick={resend} disabled={busy} className="text-primary font-semibold hover:underline">Resend code</button>
        )}
      </div>
      {o.error && <p className="text-xs text-red-600" role="alert">{o.error}</p>}
    </div>
  );
}

/** Small reassurance line under a form's submit button. */
export function OtpHint() {
  return (
    <p className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /></svg>
      We&apos;ll send a one-time code to verify your number
    </p>
  );
}
