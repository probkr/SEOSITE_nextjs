'use client';

import { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/api';
import { useWebUser } from '@/lib/webUser';
import { OtpHint, OtpStep, phone10, usePhoneOtp, validPhone } from './PhoneOtp';

/**
 * Name / phone / message lead form. With requireOtp, a guest confirms the phone with a 4-digit
 * SMS code before the inquiry is sent (see PhoneOtp.js). A logged-in user sending from their own
 * number skips the code. propertyId is empty for general leads.
 */
export default function InquiryOtpForm({
  propertyId = '',
  defaultMessage = '',
  requireOtp = true,
  submitLabel = 'Get a Call Back',
  messagePlaceholder = 'What are you looking for?',
  successText = "Thanks! We'll be in touch shortly.",
}) {
  const user = useWebUser();
  const otp = usePhoneOtp();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [step, setStep] = useState('form'); // form | otp | done
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Logged-in users get their name and number filled in.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name || '', phone: f.phone || user.phone || '' }));
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ownNumber = !!(user && user.phone && phone10(user.phone) === phone10(form.phone));
  const needOtp = requireOtp && !ownNumber;

  async function sendInquiry(verifyToken) {
    setSubmitting(true);
    // credentials: a logged-in user's session also counts as proof of their own number.
    const res = await clientFetch('/inquiries', {
      method: 'POST',
      body: {
        propertyId,
        name: form.name.trim(),
        phone: phone10(form.phone),
        message: form.message.trim() || defaultMessage,
        ...(verifyToken && { verifyToken }),
      },
    }).catch(() => null);
    setSubmitting(false);
    if (res && res.ok) {
      setStep('done');
    } else {
      setStep('form');
      setError('Something went wrong. Please try again.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!validPhone(form.phone)) return setError('Please enter a valid 10-digit mobile number.');
    if (needOtp) {
      if (await otp.send(form.phone, form.name)) setStep('otp');
      return;
    }
    await sendInquiry();
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

  if (step === 'done') {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </span>
        <p className="text-sm font-semibold text-emerald-800 pt-1" role="status">{successText}</p>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <OtpStep
        otp={otp}
        phone={form.phone}
        name={form.name}
        submitting={submitting}
        onVerified={sendInquiry}
        onChangeNumber={() => { setStep('form'); otp.setError(''); }}
      />
    );
  }

  const busy = otp.busy || submitting;
  const shownError = error || otp.error;
  return (
    <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
      <input required placeholder="Your Name" autoComplete="name" className={inputCls} value={form.name} onChange={set('name')} />
      <div className="flex items-stretch">
        <span className="flex items-center px-3 rounded-l-lg border-2 border-r-0 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500">+91</span>
        <input
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Mobile Number"
          maxLength={14}
          className={`${inputCls} rounded-l-none`}
          value={form.phone}
          onChange={set('phone')}
        />
      </div>
      <textarea placeholder={messagePlaceholder} rows={2} className={inputCls} value={form.message} onChange={set('message')} />
      <button type="submit" disabled={busy} className="btn-primary w-full text-sm disabled:opacity-60">
        {busy ? (needOtp ? 'Sending OTP...' : 'Sending...') : needOtp ? 'Verify with OTP' : submitLabel}
      </button>
      {needOtp && <OtpHint />}
      {shownError && <p className="text-xs text-red-600" role="alert">{shownError}</p>}
    </form>
  );
}
