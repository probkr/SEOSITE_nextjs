'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import AddPanel from '@/components/admin/AddPanel';
import Badge from '@/components/admin/Badge';

export default function CitiesClient({ cities }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', state: 'Gujarat' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submitAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('City name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await clientFetchJson('/admin/cities/add', { method: 'POST', body: JSON.stringify(form) });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{cities.length} cities found</div>
        <button onClick={() => setOpen(true)} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">+ Add City</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">City Name</th><th className="text-left px-3.5 py-2.5">State</th><th className="text-left px-3.5 py-2.5">Properties</th><th className="text-left px-3.5 py-2.5">Areas</th><th className="text-left px-3.5 py-2.5">Slug</th></tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold text-gray-900">{c.name}</td>
                <td className="px-3.5 py-2.5">{c.state || 'Gujarat'}</td>
                <td className="px-3.5 py-2.5"><Badge color="purple">{c.propertyCount || 0}</Badge></td>
                <td className="px-3.5 py-2.5"><Badge color="gray">{c.areaCount || 0}</Badge></td>
                <td className="px-3.5 py-2.5 text-xs text-gray-400"><code>{c.slug}</code></td>
              </tr>
            ))}
            {cities.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No cities found</td></tr>}
          </tbody>
        </table>
      </div>
      <AddPanel open={open} onClose={() => setOpen(false)} title="Add City">
        <form onSubmit={submitAdd}>
          {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">City Name *</label>
            <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">State *</label>
            <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-primary text-white rounded-md py-2.5 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save City'}
          </button>
        </form>
      </AddPanel>
    </>
  );
}
