'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

const PROPERTY_TYPES = ['flat', 'bungalow', 'tenement', 'office', 'shop', 'showroom', 'penthouse', 'plot', 'warehouse'];

export default function PostPropertyForm() {
  const [step, setStep] = useState('otp'); // otp -> verify -> form -> done
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState(null);
  const [form, setForm] = useState({
    category: 'residential', transactionType: 'buy', propertyType: 'flat', bhk: '', sqft: '',
    price: '', premiseName: '', areaId: '', cityId: '', description: '', furnishing: 'unfurnished',
    contactName: '', contactPhone: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  async function sendOtp(e) {
    e.preventDefault();
    setOtpStatus('sending');
    const res = await postJson('/otp/send', { phone });
    setOtpStatus(res.ok ? 'sent' : 'error');
    if (res.ok) setStep('verify');
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setOtpStatus('verifying');
    const res = await postJson('/otp/verify', { phone, otp });
    if (res.ok) {
      setStep('form');
      setForm((f) => ({ ...f, contactPhone: phone }));
    } else {
      setOtpStatus('invalid');
    }
  }

  async function submitProperty(e) {
    e.preventDefault();
    setSubmitStatus('saving');
    const res = await postJson('/properties', { ...form, source: 'owner', status: 'pending' });
    setSubmitStatus(res.ok ? 'done' : 'error');
  }

  if (step === 'otp') {
    return (
      <form onSubmit={sendOtp} className="card p-6 max-w-md">
        <h2 className="font-bold text-lg mb-4">Verify your phone number</h2>
        <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit mobile number"
          className="w-full border rounded px-3 py-2 mb-4" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn-primary w-full" disabled={otpStatus === 'sending'}>Send OTP</button>
      </form>
    );
  }

  if (step === 'verify') {
    return (
      <form onSubmit={verifyOtp} className="card p-6 max-w-md">
        <h2 className="font-bold text-lg mb-4">Enter OTP</h2>
        <input required placeholder="6-digit OTP" className="w-full border rounded px-3 py-2 mb-4"
          value={otp} onChange={(e) => setOtp(e.target.value)} />
        <button className="btn-primary w-full" disabled={otpStatus === 'verifying'}>Verify</button>
        {otpStatus === 'invalid' && <p className="text-red-600 text-sm mt-2">Invalid OTP, try again.</p>}
      </form>
    );
  }

  if (step === 'form') {
    if (submitStatus === 'done') {
      return (
        <div className="card p-6 max-w-md text-center">
          <h2 className="font-bold text-lg text-primary mb-2">Property submitted!</h2>
          <p className="text-gray-500">Your listing is pending review and will go live shortly.</p>
        </div>
      );
    }
    return (
      <form onSubmit={submitProperty} className="card p-6 max-w-2xl space-y-3">
        <h2 className="font-bold text-lg mb-2">Property Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <select className="border rounded px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
          <select className="border rounded px-3 py-2" value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
            <option value="buy">Sale</option>
            <option value="rent">Rent</option>
          </select>
        </div>
        <select className="border rounded px-3 py-2 w-full" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="BHK" type="number" className="border rounded px-3 py-2" value={form.bhk} onChange={(e) => setForm({ ...form, bhk: e.target.value })} />
          <input placeholder="Sqft" type="number" className="border rounded px-3 py-2" value={form.sqft} onChange={(e) => setForm({ ...form, sqft: e.target.value })} />
        </div>
        <input required placeholder="Price" type="number" className="w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Society / Premise Name" className="w-full border rounded px-3 py-2" value={form.premiseName} onChange={(e) => setForm({ ...form, premiseName: e.target.value })} />
        <textarea placeholder="Description" rows={4} className="w-full border rounded px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input required placeholder="Contact Name" className="w-full border rounded px-3 py-2" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
        <button className="btn-primary w-full" disabled={submitStatus === 'saving'}>Submit Property</button>
        {submitStatus === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
      </form>
    );
  }

  return null;
}
