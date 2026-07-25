'use client';
import { useEffect, useState } from 'react';
import { postJson } from '@/lib/api';

const SUBTYPES = {
  residential: ['Flat/Apartment', 'Bungalow', 'Tenement', 'Penthouse', 'Plot'],
  commercial: ['Office', 'Shop', 'Showroom', 'Warehouse'],
};

const SEEN_KEY = 'pb_lead_popup_seen';

export default function LeadPopup() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    purpose: 'buy',
    city: 'ahmedabad',
    propertyType: 'residential',
    subType: SUBTYPES.residential[0],
    localities: '',
    role: 'buyer',
    name: '',
    phone: '',
  });

  useEffect(() => {
    let timer;
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        timer = setTimeout(() => setVisible(true), 1600);
      }
    } catch {}
    return () => clearTimeout(timer);
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {}
  }

  function dismiss() {
    markSeen();
    setVisible(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await postJson('/inquiries', {
        propertyId: null,
        name: form.name,
        phone: form.phone,
        message: `Zero Brokerage lead — ${form.purpose} ${form.propertyType}/${form.subType} in ${form.city}. Localities: ${
          form.localities || 'any'
        }. I am: ${form.role}.`,
      });
      if (res.ok) {
        setStatus('success');
        markSeen();
        setTimeout(() => setVisible(false), 2200);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!visible) return null;

  const inputCls =
    'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white';
  const radioLabel = 'flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.29 4.29a1 1 0 011.42 0L10 8.59l4.29-4.3a1 1 0 111.42 1.42L11.41 10l4.3 4.29a1 1 0 01-1.42 1.42L10 11.41l-4.29 4.3a1 1 0 01-1.42-1.42L8.59 10l-4.3-4.29a1 1 0 010-1.42z" />
          </svg>
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold font-heading text-primary">Zero Brokerage Offer</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your dream home is calling you! Choose from 2,872+ verified properties.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="text-primary font-semibold text-lg mb-1">
              Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}!
            </div>
            <p className="text-sm text-gray-500">Our team will call you back shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {['buy', 'rent'].map((v) => (
                <label key={v} className={radioLabel}>
                  <input
                    type="radio"
                    name="purpose"
                    checked={form.purpose === v}
                    onChange={() => setForm({ ...form, purpose: v })}
                    className="accent-primary"
                  />
                  {v === 'buy' ? 'Buy' : 'Rent'}
                </label>
              ))}
              <span className="text-gray-400 text-sm">In</span>
              {['ahmedabad', 'gandhinagar'].map((v) => (
                <label key={v} className={radioLabel}>
                  <input
                    type="radio"
                    name="city"
                    checked={form.city === v}
                    onChange={() => setForm({ ...form, city: v })}
                    className="accent-primary"
                  />
                  {v === 'ahmedabad' ? 'Ahmedabad' : 'Gandhinagar'}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Property Type*</label>
                <select
                  className={inputCls}
                  value={form.propertyType}
                  onChange={(e) => {
                    const propertyType = e.target.value;
                    setForm({ ...form, propertyType, subType: SUBTYPES[propertyType][0] });
                  }}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sub Type*</label>
                <select className={inputCls} value={form.subType} onChange={(e) => setForm({ ...form, subType: e.target.value })}>
                  {SUBTYPES[form.propertyType].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Interested Localities</label>
              <input
                placeholder="e.g., Satellite, Bopal, SG Highway"
                className={inputCls}
                value={form.localities}
                onChange={(e) => setForm({ ...form, localities: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-xs font-semibold text-gray-500">I am -</span>
              {[
                ['buyer', 'Buyer/Owner/Tenant'],
                ['agent', 'Agent'],
                ['builder', 'Builder'],
              ].map(([v, l]) => (
                <label key={v} className={radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    checked={form.role === v}
                    onChange={() => setForm({ ...form, role: v })}
                    className="accent-primary"
                  />
                  {l}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Enter your name"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div className="flex">
                <span className="inline-flex items-center px-3 border-2 border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500">
                  +91
                </span>
                <input
                  required
                  placeholder="Mobile number"
                  className={`${inputCls} rounded-l-none`}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                />
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </button>
            {status === 'error' && (
              <p className="text-xs text-red-600 text-center">Something went wrong. Please try again.</p>
            )}
            <p className="text-[11px] text-gray-400 text-center">
              By submitting, you agree to be contacted by our team regarding your requirement.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
