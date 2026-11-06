import { adminFetchJson } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { formatDate } from '@/lib/format';
import Pagination from '@/components/admin/Pagination';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage({ searchParams }) {
  const page = Number(searchParams.page || 1);
  let data = { inquiries: [], total: 0, total_pages: 1 };
  try {
    data = await adminFetchJson(`/admin/inquiries?page=${page}`);
  } catch (e) {
    data = { inquiries: [], total: 0, total_pages: 1, error: e.message };
  }
  const { inquiries = [], total = 0 } = data;
  const total_pages = data.total_pages || data.totalPages || 1;

  return (
    <div>
      {data.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {data.error}</div>}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{total} total inquiries</div>
        <a href={`${API_URL}/admin/inquiries/export`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">📦 Export CSV</a>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
            <tr><th className="text-left px-3.5 py-2.5">Name</th><th className="text-left px-3.5 py-2.5">Phone</th><th className="text-left px-3.5 py-2.5">Property</th><th className="text-left px-3.5 py-2.5">Message</th><th className="text-left px-3.5 py-2.5">Date</th></tr>
          </thead>
          <tbody>
            {inquiries.map((inq, i) => (
              <tr key={i} className="border-t border-gray-100 align-top">
                <td className="px-3.5 py-2.5 font-semibold text-gray-900">{inq.name}</td>
                <td className="px-3.5 py-2.5">{inq.phone}</td>
                <td className="px-3.5 py-2.5 max-w-[200px] truncate">
                  {inq.propertySlug ? (
                    <a href={`/property/${inq.propertySlug}/`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{inq.propertyName}</a>
                  ) : inq.propertyName}
                </td>
                <td className="px-3.5 py-2.5 max-w-[220px] text-gray-500">{inq.message || '—'}</td>
                <td className="px-3.5 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(inq.createdAt)}</td>
              </tr>
            ))}
            {inquiries.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No inquiries yet</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} totalPages={total_pages} baseHref="/admin/inquiries" />
      </div>
    </div>
  );
}
