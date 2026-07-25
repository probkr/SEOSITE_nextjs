import { adminFetchJson } from '@/lib/api';
import ListingsTable from '@/components/admin/ListingsTable';
import Pagination from '@/components/admin/Pagination';

export const dynamic = 'force-dynamic';

export default async function ListingsPage({ searchParams }) {
  const page = Number(searchParams.page || 1);
  const q = searchParams.q || '';
  const city = searchParams.city || '';
  const status = searchParams.status || '';
  const date_from = searchParams.date_from || '';
  const date_to = searchParams.date_to || '';

  const qs = new URLSearchParams({ page, q, city, status, date_from, date_to }).toString();

  let data = { listings: [], total: 0, total_pages: 1, cities: [] };
  try {
    data = await adminFetchJson(`/admin/listings?${qs}`);
  } catch (e) {
    data = { listings: [], total: 0, total_pages: 1, cities: [], error: e.message };
  }
  const { listings = [], total = 0, total_pages = 1, cities = [] } = data;

  const extraQuery = `&q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&status=${encodeURIComponent(status)}&date_from=${date_from}&date_to=${date_to}`;

  return (
    <div>
      {data.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {data.error}</div>}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{total} properties found</div>
      </div>

      <form className="flex flex-wrap gap-2 items-center bg-white rounded-lg shadow p-4 mb-5" method="get">
        <input type="text" name="q" defaultValue={q} placeholder="Search by title, society, property ID…" className="border border-gray-200 rounded-md px-3 py-2 text-sm flex-1 min-w-[240px]" />
        <select name="city" defaultValue={city} className="border border-gray-200 rounded-md px-3 py-2 text-sm">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className="border border-gray-200 rounded-md px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        <input type="date" name="date_from" defaultValue={date_from} className="border border-gray-200 rounded-md px-3 py-2 text-sm" />
        <input type="date" name="date_to" defaultValue={date_to} className="border border-gray-200 rounded-md px-3 py-2 text-sm" />
        <button type="submit" className="bg-primary text-white text-sm rounded-md px-4 py-2 font-semibold">Filter</button>
        <a href="/admin/listings" className="text-xs text-gray-500">Reset</a>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <ListingsTable listings={listings} />
        <Pagination page={page} totalPages={total_pages} baseHref="/admin/listings" extraQuery={extraQuery} />
      </div>
    </div>
  );
}
