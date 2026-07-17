import { adminFetchJson } from '@/lib/api';
import AreasClient from '@/components/admin/AreasClient';

export const dynamic = 'force-dynamic';

export default async function AreasPage({ searchParams }) {
  const q = searchParams.q || '';
  let data = { areas: [], cities: [] };
  try {
    const [areasRes, citiesRes] = await Promise.all([
      adminFetchJson(`/admin/areas?q=${encodeURIComponent(q)}&all=1`),
      adminFetchJson('/admin/cities?all=1')
    ]);
    data = { areas: areasRes.areas || areasRes || [], cities: citiesRes.cities || citiesRes || [] };
  } catch (e) {
    data = { areas: [], cities: [], error: e.message };
  }

  return (
    <div>
      {data.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {data.error}</div>}
      <form method="get" className="flex gap-2 mb-4">
        <input type="text" name="q" defaultValue={q} placeholder="Search areas by name…" className="border border-gray-200 rounded-md px-3 py-2 text-sm flex-1 max-w-sm" />
        <button type="submit" className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">Search</button>
        {q && <a href="/admin/areas" className="text-xs text-gray-500 self-center">Reset</a>}
      </form>
      <AreasClient areas={data.areas} cities={data.cities} />
    </div>
  );
}
