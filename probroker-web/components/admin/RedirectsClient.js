'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import { formatDate } from '@/lib/format';
import Badge from '@/components/admin/Badge';

export default function RedirectsClient({ redirects }) {
  const router = useRouter();
  const [form, setForm] = useState({ source_url: '', destination_url: '/', redirect_type: '301' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function addRedirect(e) {
    e.preventDefault();
    setError('');
    if (!form.source_url.trim()) { setError('Source URL is required'); return; }
    setSaving(true);
    try {
      await clientFetchJson('/admin/redirects/add', { method: 'POST', body: JSON.stringify(form) });
      setForm({ source_url: '', destination_url: '/', redirect_type: '301' });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleRedirect(id) {
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/redirects/${id}/toggle`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRedirect(id) {
    if (!confirm('Delete this redirect?')) return;
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/redirects/${id}/delete`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Add New Redirect</h3>
        {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
        <form onSubmit={addRedirect} className="flex flex-wrap gap-3 items-end">
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs font-semibold mb-1">Source URL</label>
            <input placeholder="/old-page-url/" required className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs font-semibold mb-1">Destination URL</label>
            <input placeholder="/" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.destination_url} onChange={(e) => setForm({ ...form, destination_url: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold mb-1">Type</label>
            <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.redirect_type} onChange={(e) => setForm({ ...form, redirect_type: e.target.value })}>
              <option value="301">301 Permanent</option>
              <option value="302">302 Temporary</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Adding…' : 'Add Redirect'}</button>
        </form>
      </div>

      <div className="text-sm text-gray-500 mb-3">{redirects.length} redirect{redirects.length !== 1 ? 's' : ''} configured</div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Source URL</th><th className="text-left px-3.5 py-2.5">Destination</th><th className="text-left px-3.5 py-2.5">Type</th><th className="text-left px-3.5 py-2.5">Status</th><th className="text-left px-3.5 py-2.5">Created</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold font-mono text-xs">{r.source_url}</td>
                <td className="px-3.5 py-2.5 font-mono text-xs">{r.destination_url}</td>
                <td className="px-3.5 py-2.5"><Badge color="blue">{r.redirect_type}</Badge></td>
                <td className="px-3.5 py-2.5">{r.is_active ? <Badge color="green">Active</Badge> : <Badge color="gray">Disabled</Badge>}</td>
                <td className="px-3.5 py-2.5 text-xs text-gray-400">{formatDate(r.createdAt)}</td>
                <td className="px-3.5 py-2.5 whitespace-nowrap">
                  <button disabled={busyId === r.id} onClick={() => toggleRedirect(r.id)} className={`text-xs rounded px-2.5 py-1.5 mr-1 ${r.is_active ? 'border border-gray-200' : 'bg-primary text-white'}`}>
                    {r.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button disabled={busyId === r.id} onClick={() => deleteRedirect(r.id)} className="bg-red-500 text-white text-xs rounded px-2.5 py-1.5">✕</button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No redirects configured</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
