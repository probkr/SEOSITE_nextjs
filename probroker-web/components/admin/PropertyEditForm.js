'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch, clientFetchJson, API_URL } from '@/lib/api';

const PROPERTY_TYPES = ['flat', 'villa', 'bungalow', 'penthouse', 'plot', 'office', 'shop', 'showroom', 'warehouse', 'godown'];

export default function PropertyEditForm({ property, cities, areas, societies }) {
  const router = useRouter();
  const [form, setForm] = useState({
    cityId: property.cityId || '',
    areaId: property.areaId || '',
    societyId: property.societyId || '',
    premiseName: property.premiseName || '',
    category: property.category || 'residential',
    propertyType: property.propertyType || 'flat',
    transactionType: property.transactionType || 'buy',
    bhk: property.bhk ?? 0,
    price: property.price ?? '',
    sqft: property.sqft ?? '',
    furnishing: property.furnishing || 'unfurnished',
    floorNumber: property.floorNumber ?? '',
    totalFloors: property.totalFloors ?? '',
    description: property.description || property.aiDescription || '',
    contactName: property.contactName || '',
    contactPhone: property.contactPhone || '',
    status: property.status || 'active',
    isApproved: property.isApproved ? 'true' : 'false',
    custom_schema: property.custom_schema || ''
  });
  const [images, setImages] = useState(
    property.images && property.images.length
      ? property.images
      : (property.photos || []).map((url, i) => ({ url, alt_text: '', title: '', caption: '', order_index: i, is_primary: i === 0 }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [schemaError, setSchemaError] = useState('');

  const filteredAreas = useMemo(() => areas.filter((a) => !form.cityId || a.cityId === form.cityId), [areas, form.cityId]);
  const filteredSocieties = useMemo(() => societies.filter((s) => !form.areaId || s.areaId === form.areaId), [societies, form.areaId]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleImageFiles(files) {
    setUploading(true);
    let done = 0;
    for (const file of Array.from(files)) {
      setUploadStatus(`Uploading ${done + 1}/${files.length}…`);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await clientFetch(`/admin/properties/${property.propertyId}/upload-image`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          setImages((imgs) => [
            ...imgs,
            { url: data.url, alt_text: data.alt_text || '', title: '', caption: '', order_index: imgs.length, is_primary: imgs.length === 0 }
          ]);
          done++;
        }
      } catch (e) {
        console.error('Upload error', e);
      }
    }
    setUploadStatus(`${done}/${files.length} uploaded successfully`);
    setUploading(false);
    setTimeout(() => setUploadStatus(''), 2000);
  }

  function updateImage(idx, patch) {
    setImages((imgs) => imgs.map((img, i) => (i === idx ? { ...img, ...patch } : img)));
  }
  function setPrimary(idx) {
    setImages((imgs) => imgs.map((img, i) => ({ ...img, is_primary: i === idx })));
  }
  function moveImage(idx, dir) {
    setImages((imgs) => {
      const next = [...imgs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return imgs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((img, i) => ({ ...img, order_index: i }));
    });
  }
  function removeImage(idx) {
    if (!confirm('Delete this image?')) return;
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (form.custom_schema && form.custom_schema.trim()) {
      try {
        JSON.parse(form.custom_schema.trim());
        setSchemaError('');
      } catch (err) {
        setSchemaError('Invalid JSON: ' + err.message);
        return;
      }
    }
    setSaving(true);
    try {
      // Property field data is saved independently of photo uploads (which already
      // happened per-file above) — mirrors the old admin's "save-first-then-photos"
      // resilience: losing the image metadata PATCH never loses the core listing.
      await clientFetchJson(`/admin/properties/${property.propertyId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          bhk: form.category === 'commercial' ? null : Number(form.bhk) || null,
          price: Number(form.price) || 0,
          sqft: Number(form.sqft) || 0,
          floorNumber: form.floorNumber === '' ? null : Number(form.floorNumber),
          totalFloors: form.totalFloors === '' ? null : Number(form.totalFloors),
          isApproved: form.isApproved === 'true',
          images
        })
      });
      setMessage({ type: 'success', text: 'Property saved successfully' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div className={`px-4 py-2.5 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Property Details</div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1">City *</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.cityId} onChange={(e) => { setField('cityId', e.target.value); setField('areaId', ''); setField('societyId', ''); }}>
                  <option value="">Select City</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Area *</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.areaId} onChange={(e) => { setField('areaId', e.target.value); setField('societyId', ''); }}>
                  <option value="">Select Area</option>
                  {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Society</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.societyId} onChange={(e) => setField('societyId', e.target.value)}>
                  <option value="">None</option>
                  {filteredSocieties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Premise / Society Name</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.premiseName} onChange={(e) => setField('premiseName', e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Category *</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.category} onChange={(e) => setField('category', e.target.value)}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Property Type *</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.propertyType} onChange={(e) => setField('propertyType', e.target.value)}>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Transaction *</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.transactionType} onChange={(e) => setField('transactionType', e.target.value)}>
                  <option value="buy">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {form.category !== 'commercial' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">BHK</label>
                  <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.bhk} onChange={(e) => setField('bhk', e.target.value)}>
                    <option value="0">N/A</option>
                    {[1, 2, 3, 4, 5, 6].map((b) => <option key={b} value={b}>{b} BHK</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Price (₹) *</label>
                <input type="number" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.price} onChange={(e) => setField('price', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Area (sqft)</label>
                <input type="number" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.sqft} onChange={(e) => setField('sqft', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Furnishing</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.furnishing} onChange={(e) => setField('furnishing', e.target.value)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi-furnished">Semi Furnished</option>
                  <option value="fully-furnished">Fully Furnished</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Floor</label>
                <input type="number" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.floorNumber} onChange={(e) => setField('floorNumber', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Total Floors</label>
                <input type="number" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.totalFloors} onChange={(e) => setField('totalFloors', e.target.value)} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Contact Name</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Phone</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Status & Actions</div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="active">Active (Live)</option>
                  <option value="pending">Under Review</option>
                  <option value="rejected">Rejected</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1">Approved</label>
                <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.isApproved} onChange={(e) => setField('isApproved', e.target.value)}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-primary text-white rounded-md py-2.5 font-semibold disabled:opacity-60">
                {saving ? 'Saving…' : 'Save All Changes'}
              </button>
              <div className="text-center text-[11px] text-gray-400 mt-2">ID: {property.propertyId}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mb-4">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Schema Markup (JSON-LD)</div>
            <div className="p-5">
              <textarea
                className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-xs font-mono min-h-[140px]"
                value={form.custom_schema}
                onChange={(e) => setField('custom_schema', e.target.value)}
                placeholder='{"@context":"https://schema.org","@type":"RealEstateListing",...}'
              />
              {schemaError && <div className="text-xs text-red-600 mt-1">{schemaError}</div>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Property Images</div>
            <div className="p-5">
              <label className="block border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary">
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files.length && handleImageFiles(e.target.files)} />
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm"><strong>Click or drag & drop</strong> images here</p>
                <p className="text-[11px] text-gray-400 mt-1">Auto-compressed to WebP. Min 5 recommended.</p>
              </label>
              {uploading && <div className="text-xs text-gray-500 text-center mt-2">{uploadStatus}</div>}

              <div className="mt-4 space-y-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="w-28 h-20 min-w-[7rem] rounded-md overflow-hidden bg-gray-200 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                      {img.is_primary && <span className="absolute top-1 left-1 bg-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded">Primary</span>}
                    </div>
                    <div className="flex-1">
                      <input placeholder="ALT text" value={img.alt_text} onChange={(e) => updateImage(idx, { alt_text: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1 text-xs mb-1" />
                      <input placeholder="Title (optional)" value={img.title} onChange={(e) => updateImage(idx, { title: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1 text-xs mb-1" />
                      <input placeholder="Caption (optional)" value={img.caption} onChange={(e) => updateImage(idx, { caption: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1 text-xs mb-1" />
                      <div className="flex gap-1 mt-1">
                        <button type="button" onClick={() => setPrimary(idx)} className="border border-gray-200 rounded px-2 py-1 text-xs">★ Primary</button>
                        <button type="button" onClick={() => moveImage(idx, -1)} className="border border-gray-200 rounded px-2 py-1 text-xs">↑</button>
                        <button type="button" onClick={() => moveImage(idx, 1)} className="border border-gray-200 rounded px-2 py-1 text-xs">↓</button>
                        <button type="button" onClick={() => removeImage(idx)} className="bg-red-500 text-white rounded px-2 py-1 text-xs">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
