'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import { AD_EVERY, AD_PLACEMENTS, IMAGE_UPLOAD_URL } from '@/lib/ads';
import { AdCard } from '@/components/AdSlot';
import Badge from '@/components/admin/Badge';

const EMPTY = {
  id: '',
  title: '',
  subtitle: '',
  link_url: '',
  cta_text: 'Know More',
  image_url: '',
  placements: AD_PLACEMENTS.map((p) => p.value),
  cities: [],
  priority: 0,
  start_date: '',
  end_date: '',
  is_active: true,
};

const input = 'w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm';
// What visitors see right now. Dates and cities no longer limit an ad (see the API's publicAds):
// an active ad is live on every city's pages, every day.
function adStatus(ad) {
  if (!ad.is_active) return <Badge color="gray">Disabled</Badge>;
  return <Badge color="green">Live</Badge>;
}

const placementLabel = (v) => AD_PLACEMENTS.find((p) => p.value === v)?.label || v;

export default function AdsClient({ ads }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleIn = (key, value) => setForm((f) => ({
    ...f,
    [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
  }));

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image too large (max 10MB)'); return; }
    setError('');
    setUploading(true);
    try {
      // 1. The file goes straight to the upload service, which returns its S3 link.
      const fd = new FormData();
      fd.append('images', file);
      let uploadRes;
      try {
        uploadRes = await fetch(IMAGE_UPLOAD_URL, { method: 'POST', body: fd });
      } catch {
        throw new Error('Could not reach the image upload service. Check your internet and try again.');
      }
      const uploaded = await uploadRes.json().catch(() => null);
      // The service sends its reply encrypted: { success, message: 'Encrypted response', encrypted }.
      // Our API holds the key, decrypts it and returns the link. A plain { files: [{ url }] } also works.
      const payload = uploaded?.encrypted
        ? { encrypted: uploaded.encrypted }
        : { url: uploaded?.files?.[0]?.url };
      if (!uploadRes.ok || !uploaded?.success || (!payload.encrypted && !payload.url)) {
        throw new Error(uploaded?.error || `Image upload failed (${uploadRes.status})`);
      }
      // 2. Only that reply (JSON, not the file) goes to our API.
      const res = await clientFetchJson('/admin/ads/upload-image', { method: 'POST', body: JSON.stringify(payload) });
      set({ image_url: res.url });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.image_url) { setError('Upload an image for the ad'); return; }
    if (!form.link_url.trim()) { setError('Link is required'); return; }
    if (form.placements.length === 0) { setError('Pick at least one place to show the ad'); return; }
    setSaving(true);
    try {
      await clientFetchJson('/admin/ads/save', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(ad) {
    setError('');
    setForm({
      ...EMPTY,
      ...ad,
      placements: ad.placements?.length ? ad.placements : AD_PLACEMENTS.map((p) => p.value),
      // Cities and dates no longer limit ads; saving clears any old values.
      cities: [],
      start_date: '',
      end_date: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function act(id, action, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/ads/${id}/${action}`, { method: 'POST' });
      if (action === 'delete' && form.id === id) setForm(EMPTY);
      router.refresh();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">{form.id ? 'Edit Ad' : 'Add New Ad'}</h3>
          {form.id && <button type="button" onClick={() => { setForm(EMPTY); setError(''); }} className="text-xs text-gray-500 hover:underline">Cancel edit</button>}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          An ad card shows after every {AD_EVERY} property cards. With more than one live ad, each slot shows the next ad, and every visitor gets their own order.
        </p>
        {error && <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-3 text-sm">{error}</div>}

        <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Title *</label>
                <input className={input} maxLength={100} placeholder="Shivalik Parkview – 3 BHK from ₹85 L" value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Button text</label>
                <input className={input} maxLength={30} placeholder="Know More" value={form.cta_text} onChange={(e) => set({ cta_text: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Short description</label>
              <textarea className={input} rows={2} maxLength={200} placeholder="Possession Dec 2027 · RERA approved · Near SG Highway" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Link *</label>
              <input className={input} placeholder="https://builder-site.com/project  or  /ahmedabad/bopal/" value={form.link_url} onChange={(e) => set({ link_url: e.target.value })} />
              <p className="text-[11px] text-gray-400 mt-1">Another website opens in a new tab. A link starting with / opens a page on this site.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Image * <span className="font-normal text-gray-400">(best size 1200 × 720)</span></label>
              <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="text-sm" />
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
              <input className={`${input} mt-2`} placeholder="…or paste an image URL (https://…)" value={form.image_url} onChange={(e) => set({ image_url: e.target.value.trim() })} />
              {form.image_url && <p className="text-[11px] text-emerald-600 mt-1">Image set. See the preview on the right.</p>}
            </div>

            <div>
              <div className="text-xs font-semibold mb-1.5">Show on *</div>
              {AD_PLACEMENTS.map((p) => (
                <label key={p.value} className="flex items-start gap-2 text-sm mb-1.5">
                  <input type="checkbox" className="mt-1" checked={form.placements.includes(p.value)} onChange={() => toggleIn('placements', p.value)} />
                  <span>{p.label}<span className="block text-[11px] text-gray-400">{p.hint}</span></span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <input type="number" min={-100} max={100} className={input} value={form.priority} onChange={(e) => set({ priority: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm self-end pb-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">An active ad shows in every city, every day, until you disable it. Higher priority ads come first; ads with the same priority are mixed.</p>

            <button type="submit" disabled={saving || uploading} className="bg-btn hover:bg-btn-hover text-white rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Ad'}
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold mb-1.5">Preview</div>
            {form.image_url ? (
              <div className="pointer-events-none">
                <AdCard ad={{ ...form, title: form.title || 'Ad title' }} />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg aspect-[5/3] flex items-center justify-center text-xs text-gray-400">Upload an image to see the card</div>
            )}
          </div>
        </form>
      </div>

      <div className="text-sm text-gray-500 mb-3">{ads.length} ad{ads.length !== 1 ? 's' : ''}</div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr>
              <th className="text-left px-3.5 py-2.5">Ad</th>
              <th className="text-left px-3.5 py-2.5">Shows on</th>
              <th className="text-left px-3.5 py-2.5">Priority</th>
              <th className="text-left px-3.5 py-2.5">Status</th>
              <th className="text-left px-3.5 py-2.5">Clicks</th>
              <th className="text-left px-3.5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className={`border-t border-gray-100 ${form.id === ad.id ? 'bg-primary-50' : ''}`}>
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-3 min-w-[240px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.image_url} alt="" className="w-20 h-12 object-cover rounded border border-gray-100 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate max-w-[260px]">{ad.title}</div>
                      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline truncate block max-w-[260px]">{ad.link_url}</a>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-xs text-gray-600">
                  <div>{ad.placements?.length ? ad.placements.map(placementLabel).join(', ') : 'All pages'}</div>
                </td>
                <td className="px-3.5 py-2.5 text-xs">{ad.priority || 0}</td>
                <td className="px-3.5 py-2.5">{adStatus(ad)}</td>
                <td className="px-3.5 py-2.5 text-xs font-semibold">{ad.clicks || 0}</td>
                <td className="px-3.5 py-2.5 whitespace-nowrap">
                  <button disabled={busyId === ad.id} onClick={() => edit(ad)} className="text-xs rounded px-2.5 py-1.5 mr-1 border border-gray-200">Edit</button>
                  <button disabled={busyId === ad.id} onClick={() => act(ad.id, 'toggle')} className={`text-xs rounded px-2.5 py-1.5 mr-1 ${ad.is_active ? 'border border-gray-200' : 'bg-btn hover:bg-btn-hover text-white'}`}>
                    {ad.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button disabled={busyId === ad.id} onClick={() => act(ad.id, 'delete', `Delete the ad "${ad.title}"?`)} className="bg-red-500 text-white text-xs rounded px-2.5 py-1.5">✕</button>
                </td>
              </tr>
            ))}
            {ads.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No ads yet. Add one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
