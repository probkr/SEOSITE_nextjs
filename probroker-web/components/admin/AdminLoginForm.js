'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientFetch } from '@/lib/api';
import OtpInput from '@/components/auth/OtpInput';

const OTP_LENGTH = 4;
const RESEND_AFTER = 30;

async function post(path, body) {
  const res = await clientFetch(path, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

// Only same-site admin paths are allowed as the post-login redirect.
function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState('phone'); // phone -> otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const verifying = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendOtp(e) {
    if (e) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await post('/admin/login/send-otp', { phone });
      setDevOtp(data.dev_otp || '');
      setOtp('');
      setStep('otp');
      setResendIn(RESEND_AFTER);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(code) {
    if (verifying.current || code.length !== OTP_LENGTH) return;
    verifying.current = true;
    setError('');
    setLoading(true);
    try {
      await post('/admin/login/verify', { phone, otp: code });
      router.push(safeNext(searchParams.get('next')));
      router.refresh();
    } catch (err) {
      setError(err.message);
      setOtp('');
      setLoading(false);
      verifying.current = false;
    }
  }

  function onOtpChange(v) {
    setOtp(v);
    if (error) setError('');
    if (v.length === OTP_LENGTH) verify(v);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 bg-gradient-to-br from-[#1E0A3C] via-[#2D0B59] to-[#4D3C9A] text-white flex flex-col items-center justify-center p-10">
        <h1 className="text-3xl font-extrabold mb-1 text-white">PRObroker Admin</h1>
        <p className="text-white/70">Manage your property platform</p>
        <div className="mt-10 flex flex-col gap-4 text-sm text-white/80">
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Manage property listings</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Approve owner submissions</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Bulk import via JSON/CSV</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-green-500" /> Track inquiries & leads</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-sm">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} noValidate>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-sm text-gray-500 mb-7">Sign in with your registered admin mobile number.</p>

              {error && <div role="alert" className="bg-red-100 text-red-800 px-3.5 py-2.5 rounded-lg text-sm font-medium mb-4">{error}</div>}

              <label htmlFor="admin-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile number</label>
              <div className="relative mb-5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2.5 my-2 border-r border-gray-200 text-sm font-semibold text-gray-600 pointer-events-none">+91</span>
                <input
                  id="admin-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (error) setError(''); }}
                  className="w-full border border-gray-200 rounded-lg pl-16 pr-3 py-2.5 text-sm tracking-wide focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(otp); }}>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="inline-flex items-center gap-1.5 -ml-1 mb-5 px-1 h-9 text-sm font-semibold text-gray-500 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Change number
              </button>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-6">
                Sent to <span className="font-semibold text-gray-800">+91 {phone.slice(0, 5)} {phone.slice(5)}</span>
              </p>

              <OtpInput value={otp} onChange={onOtpChange} length={OTP_LENGTH} disabled={loading} invalid={!!error} autoFocus />

              {devOtp && (
                <p className="mt-4 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2">
                  SMS isn’t configured on this server. Test code: <span className="font-mono font-bold text-gray-800">{devOtp}</span>
                </p>
              )}
              {error && <div role="alert" className="mt-4 bg-red-100 text-red-800 px-3.5 py-2.5 rounded-lg text-sm font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading || otp.length !== OTP_LENGTH}
                className="mt-5 w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>

              <p className="mt-5 text-center text-sm text-gray-500" aria-live="polite">
                {resendIn > 0 ? (
                  <>Resend OTP in <span className="font-semibold text-gray-700 tabular-nums">0:{String(resendIn).padStart(2, '0')}</span></>
                ) : (
                  <button type="button" onClick={() => sendOtp()} disabled={loading} className="font-semibold text-primary hover:underline underline-offset-2">
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          )}
          <div className="text-center text-xs text-gray-400 mt-7">PRObroker Admin Panel v1.0</div>
        </div>
      </div>
    </div>
  );
}
