'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/api';

export default function SocietyEditForm({ society, areas }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: society.name || '',
    project_type: society.project_type || 'residential',
    areaId: society.areaId || '',
    slug: society.slug || '',
    description: society.description || '',
    builderName: society.builderName || '',
    reraNumber: society.reraNumber || '',
    totalUnits: society.totalUnits || '',
    overview: society.overview || '',
    configuration: society.configuration || '',
    priceRange: society.priceRange || '',
    possessionDate: society.possessionDate || '',
    amenities: (society.amenities || []).join(', '),
    is_featured: !!society.is_featured,
    location_advantages: society.location_advantages || '',
    facilities_description: society.facilities_description || '',
    metaTitle: society.metaTitle || '',
    metaDescription: society.metaDescription || '',
    custom_schema: society.custom_schema || ''
  });
  const [existingImages, setExistingImages] = useState((society.images || []).map((url) => ({ url, keep: true })));
  const [newImages, setNewImages] = useState([]);
  const [removeBrochure, setRemoveBrochure] = useState(false);
  const [brochureFile, setBrochureFile] = useState(null);
  const [faqs, setFaqs] = useState(society.faqs || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [schemaError, setSchemaError] = useState('');

  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }
  function addFaq() { setFaqs((f) => [...f, { question: '', answer: '' }]); }
  function updateFaq(idx, patch) { setFaqs((f) => f.map((x, i) => (i === idx ? { ...x, ...patch } : x))); }
  function removeFaq(idx) { setFaqs((f) => f.filter((_, i) => i !== idx)); }
  function toggleKeepImage(idx) { setExistingImages((imgs) => imgs.map((img, i) => (i === idx ? { ...img, keep: !img.keep } : img))); }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (form.custom_schema && form.custom_schema.trim()) {
      try { JSON.parse(form.custom_schema.trim()); setSchemaError(''); }
      catch (err) { setSchemaError('Invalid JSON: ' + err.message); return; }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'is_featured') { fd.append(k, v ? '1' : '0'); return; }
        fd.append(k, v ?? '');
      });
      existingImages.forEach((img, i) => fd.append(`keep_image_${i}`, img.keep ? '1' : '0'));
      newImages.forEach((file) => fd.append('new_images', file));
      if (brochureFile) fd.append('brochure_file', brochureFile);
      if (removeBrochure) fd.append('remove_brochure', '1');

      const res = await clientFetch(`/admin/societies/edit/${society.id}`, { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      setMessage({ type: 'success', text: 'Saved successfully' });
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
        <div className={`px-4 py-2.5 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Basic Info</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Society Name *</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Project Type *</label>
              <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.project_type} onChange={(e) => setField('project_type', e.target.value)} required>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Area *</label>
              <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.areaId} onChange={(e) => setField('areaId', e.target.value)} required>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.cityName || ''})</option>)}
              </select>
              <small className="text-gray-400 text-[11px]">Changing the area will update the society&apos;s URL</small>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">URL Slug</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm font-mono" placeholder="auto-generated-from-name" value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Builder Name</label>
              <input placeholder="e.g. Adani Realty" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.builderName} onChange={(e) => setField('builderName', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">RERA Number</label>
              <input placeholder="e.g. PR/GJ/AHMEDABAD/..." className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.reraNumber} onChange={(e) => setField('reraNumber', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Total Units</label>
              <input type="number" placeholder="e.g. 200" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.totalUnits} onChange={(e) => setField('totalUnits', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Rich Content</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Overview</label>
              <textarea rows={4} placeholder="Detailed overview of this society…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.overview} onChange={(e) => setField('overview', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Configuration</label>
              <textarea rows={2} placeholder="2 BHK, 3 BHK, 4 BHK…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.configuration} onChange={(e) => setField('configuration', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Price Range</label>
              <input placeholder="e.g. 45L - 1.2Cr" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.priceRange} onChange={(e) => setField('priceRange', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Possession Date</label>
              <input placeholder="e.g. June 2027" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.possessionDate} onChange={(e) => setField('possessionDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Amenities (comma-separated)</label>
              <textarea rows={2} placeholder="Swimming Pool, Gym, Garden…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.amenities} onChange={(e) => setField('amenities', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Society Images</h3>
            <p className="text-xs text-gray-400 mb-3">Upload min 5 images recommended. JPEG, PNG, WebP (max 10MB each).</p>
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {existingImages.map((img, idx) => (
                  <div key={idx} className={`relative rounded-md overflow-hidden border border-gray-200 ${img.keep ? '' : 'opacity-30 pointer-events-none'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} className="w-full h-24 object-cover" alt="" />
                    <button type="button" onClick={() => toggleKeepImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs">&times;</button>
                  </div>
                ))}
              </div>
            )}
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1">Upload New Images</label>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={(e) => setNewImages(Array.from(e.target.files))} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-4">Brochure (PDF)</h3>
            {society.brochureUrl && (
              <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-violet-50 rounded-md">
                <a href={society.brochureUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-semibold flex-1">Current Brochure</a>
                <label className="text-xs text-gray-400">
                  <input type="checkbox" checked={removeBrochure} onChange={(e) => setRemoveBrochure(e.target.checked)} /> Remove
                </label>
              </div>
            )}
            <label className="block text-xs font-semibold mb-1">{society.brochureUrl ? 'Replace' : 'Upload'} Brochure</label>
            <input type="file" accept="application/pdf" className="text-sm" onChange={(e) => setBrochureFile(e.target.files[0] || null)} />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Homepage Visibility</h3>
            <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-md cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setField('is_featured', e.target.checked)} />
              <div>
                <div className="font-semibold text-sm text-gray-900">Pin on Homepage</div>
                <p className="text-[11px] text-gray-400 mt-0.5">Featured societies appear in the &quot;Popular Societies&quot; section on the homepage</p>
              </div>
            </label>
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Content Overrides</h3>
            <p className="text-[11px] text-gray-400 mb-3">Leave blank to use auto-generated content.</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Location Advantages</label>
              <textarea rows={6} placeholder="Enter custom location advantages…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.location_advantages} onChange={(e) => setField('location_advantages', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Facilities / Amenities Description</label>
              <textarea rows={6} placeholder="Enter custom facilities description…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.facilities_description} onChange={(e) => setField('facilities_description', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">SEO</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Meta Title</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Meta Description</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaDescription} onChange={(e) => setField('metaDescription', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-4">FAQs</h3>
            {faqs.map((faq, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-50 rounded-md">
                <input placeholder="Question" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs mb-2" value={faq.question} onChange={(e) => updateFaq(idx, { question: e.target.value })} />
                <textarea placeholder="Answer" rows={2} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs" value={faq.answer} onChange={(e) => updateFaq(idx, { answer: e.target.value })} />
                <button type="button" onClick={() => removeFaq(idx)} className="text-[11px] text-red-600 mt-1">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addFaq} className="w-full border border-gray-200 rounded-md py-2 text-sm mt-1">+ Add FAQ</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5 mt-5">
        <h3 className="font-bold text-gray-900 mb-2">Schema Markup (JSON-LD)</h3>
        <p className="text-[11px] text-gray-400 mb-2">Custom structured data for this society page. Leave empty to use auto-generated schema.</p>
        <textarea
          className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-xs font-mono min-h-[150px]"
          placeholder='{"@context":"https://schema.org","@type":"Residence",...}'
          value={form.custom_schema}
          onChange={(e) => setField('custom_schema', e.target.value)}
        />
        {schemaError && <div className="text-xs text-red-600 mt-1">{schemaError}</div>}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <a href="/admin/societies" className="border border-gray-200 rounded-md px-4 py-2 text-sm">Cancel</a>
        <button type="submit" disabled={saving} className="bg-primary text-white rounded-md px-6 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
