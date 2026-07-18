'use client';
import { useState } from 'react';
import Link from 'next/link';
import { postJson } from '@/lib/api';
import { API_URL as CFG_API_URL } from '@/lib/config';

export default function MyPropertiesClient() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('otp');
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');

  async function sendOtp(e) {
    e.preventDefault();
    const res = await postJson('/otp/send', { phone });
    if (res.ok) setStep('verify');
    else setError('Could not send OTP, try again.');
  }

  async function verifyOtp(e) {
    e.preventDefault();
    const res = await postJson('/otp/verify', { phone, otp });
    if (!res.ok) { setError('Invalid OTP'); return; }
    try {
      const r = await fetch(`${CFG_API_URL}/properties?contactPhone=${phone}`, { cache: 'no-store' });
      const data = await r.json();
      setListings(data?.data || []);
    } catch {
      setListings([]);
    }
    setStep('list');
  }

  if (step === 'otp') {
    return (
      <form onSubmit={sendOtp} className="card p-6 max-w-md">
        <h2 className="font-bold text-lg mb-4">Log in to view your properties</h2>
        <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit mobile number"
          className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all mb-4" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn-primary w-full">Send OTP</button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    );
  }

  if (step === 'verify') {
    return (
      <form onSubmit={verifyOtp} className="card p-6 max-w-md">
        <h2 className="font-bold text-lg mb-4">Enter OTP</h2>
        <input required placeholder="6-digit OTP" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all mb-4"
          value={otp} onChange={(e) => setOtp(e.target.value)} />
        <button className="btn-primary w-full">Verify</button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    );
  }

  return (
    <div>
      {listings.length === 0 ? (
        <p className="text-gray-500">No properties found for this phone number.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((p) => (
            <div key={p.propertyId} className="card p-4">
              <div className="font-semibold">{p.premiseName || p.propertyType}</div>
              <div className="text-sm text-gray-500 mb-2">{p.status}</div>
              <Link href={`/edit-property/${p.propertyId}/`} className="text-primary text-sm font-medium">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
