'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { clientFetchJson } from '@/lib/api';
import { notifyAuthChange } from '@/lib/webUser';
import OtpInput from './OtpInput';

const OTP_LENGTH = 4;
const RESEND_AFTER = 30;
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formatPhone = (p) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

const inputCls = (bad) =>
  `w-full h-11 rounded-xl border bg-white px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    bad ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10'
  }`;

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Log in / sign up inside a popup: mobile number -> 4-digit OTP -> signed in, no page change.
 * Sign up asks only for the mobile number; name and email are optional.
 * A login with a new number quietly becomes a sign-up (and a sign-up with a known number a
 * login), so the visitor never has to start over. Calls onSuccess(user) once signed in.
 */
export default function QuickAuthForm({ initialMode = 'login', onSuccess }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const [step, setStep] = useState('phone'); // phone -> otp
  const [form, setForm] = useState({ phone: '', name: '', email: '' });
  const [fieldError, setFieldError] = useState({});
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const verifying = useRef(false);
  const phoneRef = useRef(null);

  useEffect(() => { phoneRef.current?.focus(); }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const set = (k) => (e) => {
    const v = k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setFieldError((fe) => ({ ...fe, [k]: undefined }));
    setError('');
  };

  function switchMode(m) {
    setMode(m);
    setError('');
    setNote('');
    setFieldError({});
  }

  function validate() {
    const errs = {};
    if (!MOBILE_RE.test(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number.';
    if (mode === 'signup' && form.name.trim() && form.name.trim().length < 2) errs.name = 'Name looks too short.';
    if (mode === 'signup' && form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  }

  const signupBody = () => ({
    phone: form.phone,
    ...(form.name.trim() ? { name: form.name.trim() } : {}),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
  });

  async function request(m) {
    const body = m === 'signup' ? signupBody() : { phone: form.phone };
    return clientFetchJson(`/auth/${m}/send-otp`, { method: 'POST', body });
  }

  async function sendOtp() {
    setError('');
    setBusy(true);
    let used = mode;
    try {
      let res;
      try {
        res = await request(mode);
        setNote('');
      } catch (err) {
        const code = err.data?.code;
        // Wrong tab for this number: switch for them instead of showing an error.
        if (mode === 'login' && code === 'NOT_REGISTERED') {
          used = 'signup';
          res = await request('signup');
          setNote('New number: we’ll create your free account after you verify.');
        } else if (mode === 'signup' && code === 'PHONE_EXISTS') {
          used = 'login';
          res = await request('login');
          setNote('This number already has an account, so we’re logging you in.');
        } else {
          throw err;
        }
      }
      setMode(used);
      setDevOtp(res?.dev_otp || '');
      setOtp('');
      setStep('otp');
      setResendIn(RESEND_AFTER);
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(code) {
    if (verifying.current || code.length !== OTP_LENGTH) return;
    verifying.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await clientFetchJson(`/auth/${mode}/verify`, { method: 'POST', body: { phone: form.phone, otp: code } });
      notifyAuthChange(res.user);
      onSuccess?.(res.user);
    } catch (err) {
      setError(err.message || 'Wrong code. Please try again.');
      setOtp('');
      setBusy(false);
      verifying.current = false;
    }
  }

  function onOtpChange(v) {
    setOtp(v);
    if (error) setError('');
    if (v.length === OTP_LENGTH) verify(v);
  }

  const errorBox = error && (
    <p role="alert" className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
  );

  if (step === 'otp') {
    return (
      <div>
        <button
          type="button"
          onClick={() => { setStep('phone'); setError(''); }}
          className="inline-flex items-center gap-1 -ml-1 mb-3 px-1 h-8 text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Change number
        </button>
        <h3 className="text-lg font-bold text-gray-900">Enter OTP</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          {OTP_LENGTH}-digit code sent to <span className="font-semibold text-gray-800 whitespace-nowrap">{formatPhone(form.phone)}</span>
        </p>
        {note && <p className="mt-2 text-xs text-primary bg-primary-50 rounded-lg px-3 py-2">{note}</p>}

        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); verify(otp); }}>
          <OtpInput value={otp} onChange={onOtpChange} length={OTP_LENGTH} disabled={busy} invalid={!!error} autoFocus />
          {devOtp && (
            <p className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2">
              SMS isn’t configured on this server. Test code: <span className="font-mono font-bold text-gray-800">{devOtp}</span>
            </p>
          )}
          {errorBox}
          <button
            type="submit"
            disabled={busy || otp.length !== OTP_LENGTH}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-btn text-white font-semibold hover:bg-btn-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy && <Spinner />}
            {busy ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <p className="mt-3 text-center text-sm text-gray-500" aria-live="polite">
          {resendIn > 0 ? (
            <>Resend code in <span className="font-semibold text-gray-700 tabular-nums">0:{String(resendIn).padStart(2, '0')}</span></>
          ) : (
            <button type="button" onClick={sendOtp} disabled={busy} className="font-semibold text-primary hover:underline underline-offset-2">
              Resend code
            </button>
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 p-1 mb-4 bg-gray-100 rounded-xl text-sm font-semibold">
        {[['login', 'Log in'], ['signup', 'Sign up']].map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`h-9 rounded-lg transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (validate()) sendOtp(); }}>
        <div>
          <label htmlFor="qa-phone" className="block text-sm font-semibold text-gray-800 mb-1">Mobile number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pr-2.5 my-2 border-r border-gray-200 text-[15px] font-semibold text-gray-600 pointer-events-none">+91</span>
            <input
              ref={phoneRef}
              id="qa-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={form.phone}
              onChange={set('phone')}
              aria-invalid={!!fieldError.phone}
              className={`${inputCls(fieldError.phone)} pl-[3.75rem] tracking-wide`}
            />
          </div>
          {fieldError.phone && <p className="mt-1 text-[13px] text-red-600">{fieldError.phone}</p>}
        </div>

        {mode === 'signup' && (
          <>
            <div>
              <label htmlFor="qa-name" className="block text-sm font-semibold text-gray-800 mb-1">
                Full name <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input id="qa-name" autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} className={inputCls(fieldError.name)} />
              {fieldError.name && <p className="mt-1 text-[13px] text-red-600">{fieldError.name}</p>}
            </div>
            <div>
              <label htmlFor="qa-email" className="block text-sm font-semibold text-gray-800 mb-1">
                Email address <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input id="qa-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} className={inputCls(fieldError.email)} />
              {fieldError.email && <p className="mt-1 text-[13px] text-red-600">{fieldError.email}</p>}
            </div>
          </>
        )}

        {errorBox}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-btn text-white font-semibold hover:bg-btn-hover transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {busy && <Spinner />}
          {busy ? 'Sending code…' : 'Get OTP'}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-gray-400 leading-relaxed">
        New accounts get 10 free coins. By continuing you agree to our{' '}
        <Link href="/terms/" className="underline underline-offset-2 hover:text-gray-600">Terms</Link> and{' '}
        <Link href="/privacy-policy/" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>.
      </p>
    </div>
  );
}
