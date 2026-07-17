import { adminFetchJson } from '@/lib/api';
import CitiesClient from '@/components/admin/CitiesClient';

export const dynamic = 'force-dynamic';

export default async function CitiesPage({ searchParams }) {
  const q = searchParams.q || '';
  let cities = [];
  let error = null;
  try {
    const res = await adminFetchJson(`/admin/cities?q=${encodeURIComponent(q)}&all=1`);
    cities = res.cities || res || [];
  } catch (e) {
    error = e.message;
  }
  return (
    <div>
      {error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {error}</div>}
      <form method="get" className="flex gap-2 mb-4">
        <input type="text" name="q" defaultValue={q} placeholder="Search cities by name…" className="border border-gray-200 rounded-md px-3 py-2 text-sm flex-1 max-w-sm" />
        <button type="submit" className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">Search</button>
        {q && <a href="/admin/cities" className="text-xs text-gray-500 self-center">Reset</a>}
      </form>
      <CitiesClient cities={cities} />
    </div>
  );
}
