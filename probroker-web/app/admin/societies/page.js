import { adminFetchJson } from '@/lib/api';
import SocietiesClient from '@/components/admin/SocietiesClient';

export const dynamic = 'force-dynamic';

export default async function SocietiesPage({ searchParams }) {
  const q = searchParams.q || '';
  let data = { societies: [], areas: [] };
  try {
    const [societiesRes, areasRes] = await Promise.all([
      adminFetchJson(`/admin/societies?q=${encodeURIComponent(q)}&all=1`),
      adminFetchJson('/admin/areas?all=1')
    ]);
    data = { societies: societiesRes.societies || societiesRes || [], areas: areasRes.areas || areasRes || [] };
  } catch (e) {
    data = { societies: [], areas: [], error: e.message };
  }

  return (
    <div>
      {data.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {data.error}</div>}
      <form method="get" className="flex gap-2 mb-4">
        <input type="text" name="q" defaultValue={q} placeholder="Search societies by name…" className="border border-gray-200 rounded-md px-3 py-2 text-sm flex-1 max-w-sm" />
        <button type="submit" className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">Search</button>
        {q && <a href="/admin/societies" className="text-xs text-gray-500 self-center">Reset</a>}
      </form>
      <SocietiesClient societies={data.societies} areas={data.areas} />
    </div>
  );
}
