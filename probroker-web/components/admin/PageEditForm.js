'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';

export default function PageEditForm({ slug, label, url, initial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    page_title: initial.page_title || label,
    content: initial.content || '',
    meta_title: initial.meta_title || '',
    meta_description: initial.meta_description || '',
    custom_schema: initial.custom_schema || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [schemaError, setSchemaError] = useState('');

  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (form.custom_schema && form.custom_schema.trim()) {
      try { JSON.parse(form.custom_schema.trim()); setSchemaError(''); }
      catch (err) { setSchemaError('Invalid JSON: ' + err.message); return; }
    }
    setSaving(true);
    try {
      await clientFetchJson(`/admin/pages/edit/${slug}`, { method: 'POST', body: JSON.stringify(form) });
      setMessage({ type: 'success', text: 'Page saved successfully' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && <div className={`px-4 py-2.5 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
      <div className="mb-4">
        <a href="/admin/pages" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm mr-2">← Back to Pages</a>
        <a href={url} target="_blank" rel="noreferrer" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">View Live Page ↗</a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Page Content</div>
          <div className="p-5">
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Page Title (H1)</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.page_title} onChange={(e) => setField('page_title', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Content (HTML supported)</label>
              <textarea rows={18} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm font-mono" value={form.content} onChange={(e) => setField('content', e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">SEO Settings</div>
            <div className="p-5">
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1">Meta Title</label>
                <input placeholder="Leave blank for default" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Meta Description</label>
                <textarea rows={3} placeholder="Leave blank for default" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Preview</div>
            <div className="p-5">
              <div className="border border-gray-200 rounded-md p-3 text-sm max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: form.content }} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Schema Markup (JSON-LD)</div>
            <div className="p-5">
              <textarea rows={6} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-xs font-mono" placeholder='{"@context":"https://schema.org","@type":"WebPage",...}' value={form.custom_schema} onChange={(e) => setField('custom_schema', e.target.value)} />
              {schemaError && <div className="text-xs text-red-600 mt-1">{schemaError}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={saving} className="bg-primary text-white rounded-md px-6 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save Page'}</button>
        <a href="/admin/pages" className="border border-gray-200 rounded-md px-4 py-2 text-sm">Cancel</a>
      </div>
    </form>
  );
}
