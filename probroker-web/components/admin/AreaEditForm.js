'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';

export default function AreaEditForm({ area }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: area.name || '',
    description: area.description || '',
    overview: area.overview || '',
    priceOverview: area.priceOverview || '',
    infrastructure: area.infrastructure || '',
    connectivity: area.connectivity || '',
    lifestyle: area.lifestyle || '',
    metaTitle: area.metaTitle || '',
    metaDescription: area.metaDescription || ''
  });
  const [faqs, setFaqs] = useState(area.faqs || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }
  function addFaq() { setFaqs((f) => [...f, { question: '', answer: '' }]); }
  function updateFaq(idx, patch) { setFaqs((f) => f.map((x, i) => (i === idx ? { ...x, ...patch } : x))); }
  function removeFaq(idx) { setFaqs((f) => f.filter((_, i) => i !== idx)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await clientFetchJson(`/admin/areas/${area.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, faqs })
      });
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
              <label className="block text-xs font-semibold mb-1">Area Name *</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-4">Rich Content</h3>
            {[
              ['overview', 'Overview', 'Detailed overview of this area…'],
              ['priceOverview', 'Price Overview', 'Price trends, average rates…'],
              ['infrastructure', 'Infrastructure', 'Schools, hospitals, malls…'],
              ['connectivity', 'Connectivity', 'Metro, highways, airport distance…'],
              ['lifestyle', 'Lifestyle', 'Parks, restaurants, nightlife…']
            ].map(([key, label, placeholder]) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-semibold mb-1">{label}</label>
                <textarea rows={key === 'overview' ? 4 : 3} placeholder={placeholder} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div>
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
      <div className="flex justify-end gap-3 mt-4">
        <a href="/admin/areas" className="border border-gray-200 rounded-md px-4 py-2 text-sm">Cancel</a>
        <button type="submit" disabled={saving} className="bg-primary text-white rounded-md px-6 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
