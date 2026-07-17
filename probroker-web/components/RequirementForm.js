'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function RequirementForm() {
  const [form, setForm] = useState({
    type: 'buy', property_type: '', budget_min: '', budget_max: '', city: '', area: '', bhk: '', name: '', phone: '', notes: '',
  });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await postJson('/requirements', form);
    setStatus(res.ok ? 'success' : 'error');
  }

  if (status === 'success') {
    return (
      <div className="card p-6 text-center max-w-xl">
        <h2 className="font-bold text-lg text-primary mb-2">Requirement submitted!</h2>
        <p className="text-gray-500">Our team will get in touch with matching properties soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="buy">Buy</option>
          <option value="rent">Rent</option>
        </select>
        <select className="border rounded px-3 py-2" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
          <option value="">Any Property Type</option>
          <option value="flat">Flat</option>
          <option value="bungalow">Bungalow</option>
          <option value="office">Office</option>
          <option value="shop">Shop</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Budget Min" className="border rounded px-3 py-2" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
        <input type="number" placeholder="Budget Max" className="border rounded px-3 py-2" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select className="border rounded px-3 py-2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
          <option value="">Select City</option>
          <option value="ahmedabad">Ahmedabad</option>
          <option value="gandhinagar">Gandhinagar</option>
        </select>
        <input placeholder="Preferred Area" className="border rounded px-3 py-2" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
      </div>
      <select className="border rounded px-3 py-2 w-full" value={form.bhk} onChange={(e) => setForm({ ...form, bhk: e.target.value })}>
        <option value="">Any BHK</option>
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
      </select>
      <input required placeholder="Full name" className="w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit number" className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <textarea placeholder="Any specific requirements..." rows={3} className="w-full border rounded px-3 py-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="btn-primary w-full" disabled={status === 'loading'}>Submit Requirement</button>
      {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
    </form>
  );
}
