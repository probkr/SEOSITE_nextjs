'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientFetch } from '@/lib/api';
import { CITIES } from '@/lib/config';
import { useWebUser } from '@/lib/webUser';
import { OtpHint, OtpStep, phone10, usePhoneOtp, validPhone } from './PhoneOtp';

const fieldCls = 'border-2 border-gray-200 rounded-lg px-3.5 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

// Guests confirm their number with an SMS OTP before the requirement is saved; a logged-in user
// submitting with their own number skips it.
export default function RequirementForm() {
  const user = useWebUser();
  const otp = usePhoneOtp();
  const [form, setForm] = useState({
    type: 'buy', property_type: '', budget_min: '', budget_max: '', city: '', area: '', bhk: '', name: '', phone: '', notes: '',
  });
  const [step, setStep] = useState('form'); // form | otp | done
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name || '', phone: f.phone || user.phone || '' }));
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ownNumber = !!(user && user.phone && phone10(user.phone) === phone10(form.phone));
  const needOtp = !ownNumber;

  async function save(verifyToken) {
    setSubmitting(true);
    // credentials: a logged-in user's session also counts as proof of their own number.
    const res = await clientFetch('/requirements', {
      method: 'POST',
      body: { ...form, phone: phone10(form.phone), ...(verifyToken && { verifyToken }) },
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
    await save();
  }

  if (step === 'done') {
    return (
      <div className="card p-6 text-center max-w-xl">
        <h2 className="font-bold text-lg text-primary mb-2">Requirement submitted!</h2>
        <p className="text-gray-500">Our team will get in touch with matching properties soon.</p>
        <Link href="/my-requirements/" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline underline-offset-2">View my requirements →</Link>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="card p-6 max-w-xl">
        <h2 className="font-bold font-heading text-lg text-gray-900 mb-3">Verify your mobile number</h2>
        <OtpStep
          otp={otp}
          phone={form.phone}
          name={form.name}
          submitting={submitting}
          verifyLabel="Verify & Submit Requirement"
          onVerified={save}
          onChangeNumber={() => { setStep('form'); otp.setError(''); }}
        />
      </div>
    );
  }

  const busy = otp.busy || submitting;
  const shownError = error || otp.error;
  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <select className={fieldCls} value={form.type} onChange={set('type')}>
          <option value="buy">Buy</option>
          <option value="rent">Rent</option>
        </select>
        <select className={fieldCls} value={form.property_type} onChange={set('property_type')}>
          <option value="">Any Property Type</option>
          <option value="flat">Flat</option>
          <option value="bungalow">Bungalow</option>
          <option value="office">Office</option>
          <option value="shop">Shop</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Budget Min" className={fieldCls} value={form.budget_min} onChange={set('budget_min')} />
        <input type="number" placeholder="Budget Max" className={fieldCls} value={form.budget_max} onChange={set('budget_max')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select className={fieldCls} value={form.city} onChange={set('city')}>
          <option value="">Select City</option>
          {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <input placeholder="Preferred Area" className={fieldCls} value={form.area} onChange={set('area')} />
      </div>
      <select className={`${fieldCls} w-full`} value={form.bhk} onChange={set('bhk')}>
        <option value="">Any BHK</option>
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
      </select>
      <input required placeholder="Full name" autoComplete="name" className={`${fieldCls} w-full`} value={form.name} onChange={set('name')} />
      <div className="flex items-stretch">
        <span className="flex items-center px-3 rounded-l-lg border-2 border-r-0 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500">+91</span>
        <input
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={14}
          placeholder="10-digit mobile number"
          className={`${fieldCls} w-full rounded-l-none`}
          value={form.phone}
          onChange={set('phone')}
        />
      </div>
      <textarea placeholder="Any specific requirements..." rows={3} className={`${fieldCls} w-full`} value={form.notes} onChange={set('notes')} />
      <button className="btn-primary w-full disabled:opacity-60" disabled={busy}>
        {busy ? (needOtp ? 'Sending OTP...' : 'Submitting...') : needOtp ? 'Verify with OTP & Submit' : 'Submit Requirement'}
      </button>
      {needOtp && <OtpHint />}
      {shownError && <p className="text-red-600 text-sm" role="alert">{shownError}</p>}
    </form>
  );
}
