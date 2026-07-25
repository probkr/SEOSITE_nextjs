'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function LeadCaptureCard({ context }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await postJson('/inquiries', {
        propertyId: null,
        name: form.name,
        phone: form.phone,
        message: form.message || `General inquiry: ${context || ''}`,
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

  return (
    <div className="card p-5 space-y-3">
      <div>
        <h3 className="font-bold font-heading text-lg text-gray-900">Need help finding a property?</h3>
        <p className="text-sm text-gray-500 mt-0.5">Share your requirement and our team will call you back.</p>
      </div>
      {status === 'success' ? (
        <div className="text-sm text-primary font-semibold py-2">Thanks! We&apos;ll be in touch shortly.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            required
            placeholder="Your Name"
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="Phone Number"
            className={inputCls}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <textarea
            placeholder="What are you looking for?"
            rows={2}
            className={inputCls}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-sm">
            {status === 'loading' ? 'Sending...' : 'Get a Call Back'}
          </button>
          {status === 'error' && <p className="text-xs text-red-600">Something went wrong. Please try again.</p>}
        </form>
      )}
    </div>
  );
}
