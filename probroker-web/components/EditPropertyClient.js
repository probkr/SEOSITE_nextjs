'use client';
import { useState } from 'react';
import { patchJson } from '@/lib/api';

export default function EditPropertyClient({ propertyId }) {
  const [form, setForm] = useState({ price: '', description: '', status: 'active' });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    const res = await patchJson(`/properties/${propertyId}`, form);
    setStatus(res.ok ? 'saved' : 'error');
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-3">
      <input type="number" placeholder="Price" className="w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <textarea placeholder="Description" rows={4} className="w-full border rounded px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <select className="w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Active</option>
        <option value="sold">Sold</option>
        <option value="rented">Rented</option>
        <option value="pending">Pending</option>
      </select>
      <button className="btn-primary w-full" disabled={status === 'saving'}>Save Changes</button>
      {status === 'saved' && <p className="text-primary text-sm">Saved successfully.</p>}
      {status === 'error' && <p className="text-red-600 text-sm">Something went wrong.</p>}
    </form>
  );
}
