'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function InquiryForm({ propertyId, propertyTitle }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await postJson('/inquiries', { propertyId, ...form });
    setStatus(res.ok ? 'success' : 'error');
  }

  if (status === 'success') {
    return (
      <div className="card p-5 text-center">
        <div className="text-primary font-semibold">Thank you! Your inquiry has been sent.</div>
        <p className="text-sm text-gray-500 mt-1">The owner will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <h3 className="font-bold text-lg">Contact Owner</h3>
      <p className="text-sm text-gray-500">Interested in {propertyTitle}?</p>
      <input required placeholder="Your Name" className="w-full border rounded px-3 py-2 text-sm"
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required placeholder="Phone Number" className="w-full border rounded px-3 py-2 text-sm"
        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input type="email" placeholder="Email (optional)" className="w-full border rounded px-3 py-2 text-sm"
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <textarea placeholder="Message" rows={3} className="w-full border rounded px-3 py-2 text-sm"
        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-center">
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>
      {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
    </form>
  );
}
