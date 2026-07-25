'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import AddPanel from '@/components/admin/AddPanel';
import Badge from '@/components/admin/Badge';

export default function AreasClient({ areas, cities }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get('action') === 'add');
  const [form, setForm] = useState({ name: '', cityId: cities[0]?.id || '', description: '', metaTitle: '', metaDescription: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function submitAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Area name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await clientFetchJson('/admin/areas/add', { method: 'POST', body: JSON.stringify(form) });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(id) {
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/areas/toggle-featured/${id}`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteArea(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/areas/delete/${id}`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{areas.length} areas found</div>
        <button onClick={() => setOpen(true)} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">+ Add New Area</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Area Name</th><th className="text-left px-3.5 py-2.5">City</th><th className="text-left px-3.5 py-2.5">Properties</th><th className="text-left px-3.5 py-2.5">Featured</th><th className="text-left px-3.5 py-2.5">Status</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold text-gray-900">{a.name}</td>
                <td className="px-3.5 py-2.5">{a.cityName}</td>
                <td className="px-3.5 py-2.5"><Badge color="purple">{a.propertyCount || 0}</Badge></td>
                <td className="px-3.5 py-2.5">
                  <button disabled={busyId === a.id} onClick={() => toggleFeatured(a.id)} className={`text-[11px] rounded px-2.5 py-1 ${a.is_featured ? 'bg-primary text-white' : 'border border-gray-200'}`}>
                    {a.is_featured ? 'Pinned' : 'Pin'}
                  </button>
                </td>
                <td className="px-3.5 py-2.5">{a.isActive ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                <td className="px-3.5 py-2.5 whitespace-nowrap">
                  <a href={`/admin/areas/${a.id}/edit`} className="border border-gray-200 text-xs rounded px-2.5 py-1.5 mr-1">Edit</a>
                  <button disabled={busyId === a.id} onClick={() => deleteArea(a.id, a.name)} className="text-red-600 border border-red-600 text-xs rounded px-2.5 py-1.5">Delete</button>
                </td>
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No areas found</td></tr>}
          </tbody>
        </table>
      </div>

      <AddPanel open={open} onClose={() => setOpen(false)} title="Add New Area">
        <form onSubmit={submitAdd}>
          {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Area Name *</label>
            <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">City *</label>
            <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Meta Title</label>
            <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Meta Description</label>
            <textarea className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-primary text-white rounded-md py-2.5 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Area'}
          </button>
        </form>
      </AddPanel>
    </>
  );
}
