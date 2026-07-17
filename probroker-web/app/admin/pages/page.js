import { adminFetchJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function PagesListPage() {
  let pages = [];
  let error = null;
  try {
    const res = await adminFetchJson('/admin/pages');
    pages = res.pages || res || [];
  } catch (e) {
    error = e.message;
  }
  return (
    <div>
      {error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {error}</div>}
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500 mb-4">Edit the content of your site&apos;s static pages. Changes are saved to the database and reflected immediately.</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Page</th><th className="text-left px-3.5 py-2.5">URL</th><th className="text-left px-3.5 py-2.5">Last Updated</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug} className="border-t border-gray-100">
                <td className="px-3.5 py-2.5 font-semibold text-gray-900">{p.label}</td>
                <td className="px-3.5 py-2.5"><a href={p.url} target="_blank" rel="noreferrer" className="text-primary">{p.url}</a></td>
                <td className="px-3.5 py-2.5 text-gray-400">{p.updated_at || 'Never'}</td>
                <td className="px-3.5 py-2.5"><a href={`/admin/pages/${p.slug}/edit`} className="bg-primary text-white text-xs rounded px-3 py-1.5">Edit Content</a></td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">No pages found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
