import { adminFetchJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function BlogListPage() {
  let posts = [];
  let error = null;
  try {
    const res = await adminFetchJson('/admin/blog');
    posts = res.posts || res || [];
  } catch (e) {
    error = e.message;
  }
  return (
    <div>
      {error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {error}</div>}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Blog Posts ({posts.length})</h2>
        <a href="/admin/blog/new" className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">+ New Post</a>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Title</th><th className="text-left px-3.5 py-2.5">Category</th><th className="text-left px-3.5 py-2.5">Status</th><th className="text-left px-3.5 py-2.5">Published</th><th className="text-left px-3.5 py-2.5">Views</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold">{p.title}</td>
                <td className="px-3.5 py-2.5"><span className="bg-violet-100 text-primary text-xs rounded px-2 py-0.5">{p.category || 'Uncategorized'}</span></td>
                <td className="px-3.5 py-2.5">
                  {p.status === 'published'
                    ? <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold rounded px-2 py-0.5">Published</span>
                    : <span className="bg-amber-100 text-amber-800 text-xs font-semibold rounded px-2 py-0.5">Draft</span>}
                </td>
                <td className="px-3.5 py-2.5 text-xs text-gray-400">{p.publishedAt ? String(p.publishedAt).slice(0, 10) : '—'}</td>
                <td className="px-3.5 py-2.5">{p.views || 0}</td>
                <td className="px-3.5 py-2.5 whitespace-nowrap">
                  <a href={`/admin/blog/${p.id}/edit`} className="border border-gray-200 text-xs rounded px-2.5 py-1.5 mr-1">Edit</a>
                  {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="border border-gray-200 text-xs rounded px-2.5 py-1.5">View</a>}
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No blog posts yet. <a href="/admin/blog/new" className="text-primary">Create your first post</a></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
