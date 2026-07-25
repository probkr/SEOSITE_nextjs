'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch, clientFetchJson } from '@/lib/api';

export default function BlogEditForm({ post, isNew }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    status: post?.status || 'draft',
    category: post?.category || '',
    tags: (post?.tags || []).join(', '),
    featuredImageUrl: post?.featuredImage || '',
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || ''
  });
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (featuredImageFile) fd.append('featured_image_file', featuredImageFile);

      const path = '/admin/blog/save';
      const res = await clientFetch(path, { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      const saved = await res.json();
      setMessage({ type: 'success', text: isNew ? 'Post created' : 'Post saved successfully' });
      if (isNew && saved.id) {
        router.push(`/admin/blog/${saved.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return;
    setDeleting(true);
    try {
      await clientFetchJson(`/admin/blog/delete/${post.id}`, { method: 'POST' });
      router.push('/admin/blog');
    } catch (err) {
      alert('Delete failed: ' + err.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && <div className={`px-4 py-2.5 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
      <div className="flex items-center gap-3 mb-5">
        <a href="/admin/blog" className="text-gray-500 text-sm">&larr; All Posts</a>
        <h2 className="text-lg font-bold text-gray-900">{isNew ? 'New Blog Post' : `Edit: ${post.title}`}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Title *</label>
            <input placeholder="Blog post title" required className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.title} onChange={(e) => setField('title', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">URL Slug</label>
            <input placeholder="auto-generated-from-title" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm font-mono" value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1">Excerpt</label>
            <textarea rows={2} placeholder="Short summary for listing cards (max 200 chars)" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.excerpt} onChange={(e) => setField('excerpt', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Content *</label>
            <textarea rows={20} required placeholder="Write your blog post content here…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm font-mono" value={form.content} onChange={(e) => setField('content', e.target.value)} />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-3">Publish</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Category</label>
              <input placeholder="e.g. Buying Guide, Market Trends" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.category} onChange={(e) => setField('category', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Tags (comma-separated)</label>
              <input placeholder="real estate, ahmedabad, investment" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.tags} onChange={(e) => setField('tags', e.target.value)} />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-primary text-white rounded-md py-2.5 font-semibold disabled:opacity-60 mt-1">
              {saving ? 'Saving…' : isNew ? 'Create Post' : 'Update Post'}
            </button>
            {!isNew && (
              <button type="button" onClick={handleDelete} disabled={deleting} className="w-full border border-gray-200 text-red-600 rounded-md py-2.5 font-semibold mt-2 disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete Post'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-3">Featured Image</h3>
            {form.featuredImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.featuredImageUrl} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />
            )}
            <div className="mb-2">
              <label className="block text-xs font-semibold mb-1">Upload Image</label>
              <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFeaturedImageFile(e.target.files[0] || null)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Or Paste Image URL</label>
              <input placeholder="https://…" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.featuredImageUrl} onChange={(e) => setField('featuredImageUrl', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-3">SEO</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Meta Title</label>
              <input placeholder="Custom SEO title" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Meta Description</label>
              <textarea rows={2} placeholder="SEO description (max 160 chars)" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={form.metaDescription} onChange={(e) => setField('metaDescription', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
