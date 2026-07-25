'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function InquiryForm({ propertyId, propertyTitle, contactName, contactPhone, listingType }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const [revealed, setRevealed] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await postJson('/inquiries', { propertyId, ...form });
    setStatus(res.ok ? 'success' : 'error');
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
  const posterLabel = listingType === 'owner' ? 'Owner' : 'Dealer';
  const initials = (contactName || 'P').trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Owner / contact card */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-primary-100 text-primary font-bold flex items-center justify-center text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{contactName || 'PRObroker Listing'}</div>
            <div className="text-xs text-gray-500">{posterLabel}</div>
          </div>
        </div>

        {contactPhone ? (
          revealed ? (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${contactPhone}`}
                className="btn-primary !py-2.5 text-sm flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {contactPhone}
              </a>
              <a
                href={`https://wa.me/91${contactPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi, I'm interested in ${propertyTitle} listed on PRObroker.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="!py-2.5 text-sm flex items-center justify-center gap-1.5 rounded-lg border-2 border-green-500 text-green-600 font-semibold hover:bg-green-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.17 8.17 0 01-1.26-4.38c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 012.4 5.81c0 4.54-3.69 8.22-8.23 8.22z" /></svg>
                WhatsApp
              </a>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="btn-primary w-full !py-2.5 text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Show Contact Number
            </button>
          )
        ) : (
          <p className="text-sm text-gray-500">Contact number not available. Use the form below to reach out.</p>
        )}
      </div>

      {/* Inquiry form */}
      {status === 'success' ? (
        <div className="card p-5 text-center">
          <div className="text-primary font-semibold">Thank you! Your inquiry has been sent.</div>
          <p className="text-sm text-gray-500 mt-1">The {posterLabel.toLowerCase()} will contact you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3">
          <h3 className="font-bold font-heading text-lg text-gray-900">Send Inquiry</h3>
          <p className="text-sm text-gray-500 line-clamp-1">Interested in {propertyTitle}?</p>
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
          {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
        </form>
      )}
    </div>
  );
}
