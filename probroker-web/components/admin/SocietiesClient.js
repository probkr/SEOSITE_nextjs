'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import AddPanel from '@/components/admin/AddPanel';
import Badge from '@/components/admin/Badge';

const TYPE_COLOR = { residential: 'green', commercial: 'orange', mixed: 'blue' };

export default function SocietiesClient({ societies, areas }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get('action') === 'add');
  const [form, setForm] = useState({ name: '', project_type: '', areaId: areas[0]?.id || '', description: '', totalUnits: '', amenities: '', metaTitle: '', metaDescription: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function submitAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Society name is required'); return; }
    if (!form.project_type) { setError('Project type is required'); return; }
    setSaving(true);
    setError('');
    try {
      await clientFetchJson('/admin/societies', {
        method: 'POST',
        body: JSON.stringify({ ...form, amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean) })
      });
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
      await clientFetchJson(`/admin/societies/${id}/toggle-featured`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSociety(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/societies/${id}`, { method: 'DELETE' });
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
        <div className="text-sm text-gray-500">{societies.length} societies found</div>
        <button onClick={() => setOpen(true)} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">+ Add New Society</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Society Name</th><th className="text-left px-3.5 py-2.5">Area</th><th className="text-left px-3.5 py-2.5">City</th><th className="text-left px-3.5 py-2.5">Type</th><th className="text-left px-3.5 py-2.5">Properties</th><th className="text-left px-3.5 py-2.5">Featured</th><th className="text-left px-3.5 py-2.5">Status</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
          </thead>
          <tbody>
            {societies.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold text-gray-900">{s.name}</td>
                <td className="px-3.5 py-2.5">{s.areaName}</td>
                <td className="px-3.5 py-2.5">{s.cityName}</td>
                <td className="px-3.5 py-2.5"><Badge color={TYPE_COLOR[s.project_type || 'residential']}>{(s.project_type || 'residential')[0].toUpperCase() + (s.project_type || 'residential').slice(1)}</Badge></td>
                <td className="px-3.5 py-2.5"><Badge color="purple">{s.propertyCount || 0}</Badge></td>
                <td className="px-3.5 py-2.5">
                  <button disabled={busyId === s.id} onClick={() => toggleFeatured(s.id)} className={`text-[11px] rounded px-2.5 py-1 ${s.is_featured ? 'bg-primary text-white' : 'border border-gray-200'}`}>
                    {s.is_featured ? 'Pinned' : 'Pin'}
                  </button>
                </td>
                <td className="px-3.5 py-2.5">{s.isActive ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                <td className="px-3.5 py-2.5 whitespace-nowrap">
                  <a href={`/admin/societies/${s.id}/edit`} className="border border-gray-200 text-xs rounded px-2.5 py-1.5 mr-1">Edit</a>
                  <button disabled={busyId === s.id} onClick={() => deleteSociety(s.id, s.name)} className="text-red-600 border border-red-600 text-xs rounded px-2.5 py-1.5">Delete</button>
                </td>
              </tr>
            ))}
            {societies.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No societies found</td></tr>}
          </tbody>
        </table>
      </div>

      <AddPanel open={open} onClose={() => setOpen(false)} title="Add New Society">
        <form onSubmit={submitAdd}>
          {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Society Name *</label>
            <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Project Type *</label>
            <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} required>
              <option value="" disabled>Select Type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Area *</label>
            <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} required>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Total Units</label>
            <input type="number" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Amenities</label>
            <input placeholder="Swimming Pool, Gym, Garden (comma-separated)" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
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
            {saving ? 'Saving…' : 'Save Society'}
          </button>
        </form>
      </AddPanel>
    </>
  );
}
