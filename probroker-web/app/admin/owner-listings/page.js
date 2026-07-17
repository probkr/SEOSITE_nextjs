import { adminFetchJson } from '@/lib/api';
import OwnerListingsTable from '@/components/admin/OwnerListingsTable';
import Pagination from '@/components/admin/Pagination';

export const dynamic = 'force-dynamic';

export default async function OwnerListingsPage({ searchParams }) {
  const page = Number(searchParams.page || 1);
  let data = { listings: [], total: 0, total_pages: 1 };
  try {
    data = await adminFetchJson(`/admin/owner-listings?page=${page}`);
  } catch (e) {
    data = { listings: [], total: 0, total_pages: 1, error: e.message };
  }
  const { listings = [], total = 0, total_pages = 1 } = data;

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="font-bold text-gray-900 mb-1">All caught up!</h3>
        <p className="text-sm text-gray-500">No pending submissions to review.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-gray-500 mb-3">{total} submissions pending review</div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <OwnerListingsTable listings={listings} />
        <Pagination page={page} totalPages={total_pages} baseHref="/admin/owner-listings" />
      </div>
    </div>
  );
}
