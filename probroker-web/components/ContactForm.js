'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', notes: '' });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await postJson('/requirements', { ...form, type: 'contact-us' });
    setStatus(res.ok ? 'success' : 'error');
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

  if (status === 'success') {
    return (
      <div className="card p-6 text-center">
        <div className="text-primary font-semibold font-heading text-lg">Message sent!</div>
        <p className="text-sm text-gray-500 mt-1">Our team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-3">
      <h2 className="font-bold font-heading text-lg text-gray-900">Send us a message</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required placeholder="Your Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <input type="email" placeholder="Email (optional)" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Subject" className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <textarea required placeholder="How can we help?" rows={4} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
      {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
    </form>
  );
}
