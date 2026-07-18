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

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <h3 className="font-bold font-heading text-lg text-gray-900">Contact Owner</h3>
      <p className="text-sm text-gray-500">Interested in {propertyTitle}?</p>
      <input required placeholder="Your Name" className={inputCls}
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required placeholder="Phone Number" className={inputCls}
        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input type="email" placeholder="Email (optional)" className={inputCls}
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <textarea placeholder="Message" rows={3} className={inputCls}
        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-center">
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>
      {status === 'error' && <p className="text-red-60