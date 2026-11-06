'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clientFetchJson } from '@/lib/api';
import { notifyAuthChange, safeNext } from '@/lib/webUser';
import OtpInput from './OtpInput';

const OTP_LENGTH = 4;
const RESEND_AFTER = 30;

const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COPY = {
  login: {
    title: 'Log in to your account',
    sub: 'Enter your registered mobile number. We’ll text you a 4-digit code.',
    cta: 'Get OTP',
  },
  signup: {
    title: 'Create your free account',
    sub: 'Three quick details, then a code on your phone. No password needed.',
    cta: 'Continue',
  },
};

// Server error codes that mean "you're on the wrong page" -- offer the other one instead.
const SWITCH_HINT = {
  NOT_REGISTERED: { mode: 'signup', label: 'Create an account' },
  PHONE_EXISTS: { mode: 'login', label: 'Log in instead' },
};

const inputCls = (bad) =>
  `w-full h-12 rounded-xl border bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    bad ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10'
  }`;

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

function ModeSwitch({ mode, next }) {
  const q = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
  const tab = (key, label) => (
    <Link
      href={`/auth/${key}/${q}`}
      aria-current={mode === key ? 'page' : undefined}
      className={`flex items-center justify-center h-10 rounded-lg transition-colors ${
        mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Account" className="grid grid-cols-2 p-1 mb-7 bg-gray-100 rounded-xl text-sm font-semibold">
      {tab('login', 'Log in')}
      {tab('signup', 'Sign up')}
    </nav>
  );
}

const formatPhone = (p) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

export default function AuthForm({ mode = 'login', next: rawNext }) {
  const router = useRouter();
  const next = safeNext(rawNext);
  const copy = COPY[mode];

  const [step, setStep] = useState('details'); // details -> otp
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null); // { message, code }
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const verifying = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const set = (k) => (e) => {
    const v = k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };

  function validate() {
    const errs = {};
    if (mode === 'signup' && form.name.trim().length < 2) errs.name = 'Please enter your full name.';
    if (!MOBILE_RE.test(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number.';
    if (mode === 'signup' && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function sendOtp() {
    setError(null);
    setBusy(true);
    try {
      const body = mode === 'signup'
        ? { name: form.name.trim(), phone: form.phone, email: form.email.trim() }
        : { phone: form.phone };
      const res = await clientFetchJson(`/auth/${mode}/send-otp`, { method: 'POST', body });
      setDevOtp(res?.dev_otp || '');
      setOtp('');
      setStep('otp');
      setResendIn(RESEND_AFTER);
    } catch (err) {
      setError({ message: err.message, code: err.data?.code });
    } finally {
      setBusy(false);
    }
  }

  async function verify(code) {
    if (verifying.current || code.length !== OTP_LENGTH) return;
    verifying.current = true;
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetchJson(`/auth/${mode}/verify`, { method: 'POST', body: { phone: form.phone, otp: code } });
      notifyAuthChange(res.user);
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError({ message: err.message, code: err.data?.code });
      setOtp('');
      setBusy(false);
      verifying.current = false;
    }
  }

  function onOtpChange(v) {
    setOtp(v);
    if (error) setError(null);
    if (v.length === OTP_LENGTH) verify(v);
  }

  const hint = error && SWITCH_HINT[error.code];
  const errorBox = error && (
    <div role="alert" className="flex gap-2.5 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-700">
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
      <span>
        {error.message}
        {hint && (
          <>
            {' '}
            <Link href={`/auth/${hint.mode}/${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold underline underline-offset-2">
              {hint.label}
            </Link>
          </>
        )}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_24px_48px_-24px_rgba(45,11,89,0.25)] p-6 sm:p-8">
      {step === 'details' ? (
        <>
          <ModeSwitch mode={mode} next={next} />
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{copy.title}</h2>
          <p className="mt-1.5 text-sm text-gray-500">{copy.sub}</p>

          <form
            noValidate
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (validate()) sendOtp();
            }}
          >
            {mode === 'signup' && (
              <Field id="auth-name" label="Full name" error={fieldErrors.name}>
                <input
                  id="auth-name"
                  autoComplete="name"
                  placeholder="As you’d like buyers to see it"
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined}
                  className={inputCls(fieldErrors.name)}
                />
              </Field>
            )}

            <Field id="auth-phone" label="Mobile number" error={fieldErrors.phone}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pr-3 my-2.5 border-r border-gray-200 text-[15px] font-semibold text-gray-600 pointer-events-none">
                  +91
                </span>
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={set('phone')}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'auth-phone-error' : undefined}
                  className={`${inputCls(fieldErrors.phone)} pl-[4.25rem] tracking-wide`}
                />
              </div>
            </Field>

            {mode === 'signup' && (
              <Field id="auth-email" label="Email address" error={fieldErrors.email}>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                  className={inputCls(fieldErrors.email)}
                />
              </Field>
            )}

            {errorBox}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {busy && <Spinner />}
              {busy ? 'Sending code…' : copy.cta}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? 'New to PRObroker? ' : 'Already have an account? '}
            <Link
              href={`/auth/${mode === 'login' ? 'signup' : 'login'}/${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="font-semibold text-primary hover:underline underline-offset-2"
            >
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </Link>
          </p>
          {mode === 'signup' && (
            <p className="mt-3 text-center text-xs text-gray-400 leading-relaxed">
              By continuing you agree to our{' '}
              <Link href="/terms/" className="underline underline-offset-2 hover:text-gray-600">Terms</Link> and{' '}
              <Link href="/privacy-policy/" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>.
            </p>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { setStep('details'); setError(null); }}
            className="inline-flex items-center gap-1.5 -ml-1 mb-6 px-1 h-9 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Change number
          </button>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Verify your mobile</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Enter the {OTP_LENGTH}-digit code sent to{' '}
            <span className="font-semibold text-gray-800 whitespace-nowrap">{formatPhone(form.phone)}</span>
          </p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              verify(otp);
            }}
          >
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
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy && <Spinner />}
              {busy ? 'Verifying…' : mode === 'signup' ? 'Verify & create account' : 'Verify & log in'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500" aria-live="polite">
            {resendIn > 0 ? (
              <>Didn’t get it? Resend in <span className="font-semibold text-gray-700 tabular-nums">0:{String(resendIn).padStart(2, '0')}</span></>
            ) : (
              <>
                Didn’t get it?{' '}
                <button type="button" onClick={sendOtp} disabled={busy} className="font-semibold text-primary hover:underline underline-offset-2 disabled:opacity-60">
                  Resend code
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
