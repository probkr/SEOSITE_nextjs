import { adminFetchJson } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import StatCard from '@/components/admin/StatCard';
import Badge from '@/components/admin/Badge';

export const dynamic = 'force-dynamic';

const STATUS_BADGE = { active: 'green', pending: 'yellow', sold: 'gray', rented: 'gray' };

export default async function AdminDashboardPage() {
  let stats = {};
  try {
    stats = await adminFetchJson('/admin/dashboard');
  } catch (e) {
    stats = { error: e.message };
  }

  const {
    total_listings = 0,
    pending_approvals = 0,
    total_inquiries = 0,
    total_cities = 0,
    total_areas = 0,
    total_societies = 0,
    recent_properties = [],
    recent_inquiries = []
  } = stats;

  return (
    <div>
      {stats.error && (
        <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">
          Could not reach API: {stats.error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🏘️" value={total_listings} label="Active listings" />
        <StatCard icon="⏳" value={pending_approvals} label="Awaiting review" borderColor="#F59E0B" />
        <StatCard icon="📨" value={total_inquiries} label="All time inquiries" borderColor="#10B981" />
        <StatCard icon="🌆" value={`${total_cities} Cities • ${total_areas} Areas • ${total_societies} Societies`} label="Location coverage" borderColor="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-[15px]">Recent Properties</h3>
            <a href="/admin/listings" className="text-xs text-primary font-semibold">View All →</a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr><th className="text-left px-3.5 py-2">Property</th><th className="text-left px-3.5 py-2">Area</th><th className="text-left px-3.5 py-2">Price</th><th className="text-left px-3.5 py-2">Status</th><th className="text-left px-3.5 py-2">Date</th></tr>
            </thead>
            <tbody>
              {recent_properties.map((p) => (
                <tr key={p.propertyId} className="border-t border-gray-100">
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold text-gray-900 truncate max-w-[180px]">{p.bhk || ''} {p.propertyType} in {p.premiseName}</div>
                    <div className="text-[11px] text-gray-400">{p.propertyId}</div>
                  </td>
                  <td className="px-3.5 py-2.5">{p.areaName}</td>
                  <td className="px-3.5 py-2.5 font-semibold whitespace-nowrap">{formatPrice(p.price)}</td>
                  <td className="px-3.5 py-2.5"><Badge color={STATUS_BADGE[p.status] || 'gray'}>{p.status}</Badge></td>
                  <td className="px-3.5 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {recent_properties.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No properties yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-[15px]">Recent Inquiries</h3>
            <a href="/admin/inquiries" className="text-xs text-primary font-semibold">View All →</a>
          </div>
          <div className="px-5 py-2">
            {recent_inquiries.map((inq, i) => (
              <div key={i} className="py-3 border-b border-gray-100 last:border-0">
                <div className="font-semibold text-gray-900 text-sm">{inq.name} · <span className="text-gray-400 font-normal text-xs">{inq.phone}</span></div>
                <div className="text-xs text-gray-400 mt-0.5">{inq.propertyName}</div>
              </div>
            ))}
            {recent_inquiries.length === 0 && <div className="py-8 text-center text-gray-400">No inquiries yet</div>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 my-6">
        <a href="/admin/listings?action=add" className="border border-gray-200 rounded-md px-4 py-2 text-sm hover:border-primary hover:text-primary">+ Add Property</a>
        <a href="/admin/import" className="border border-gray-200 rounded-md px-4 py-2 text-sm hover:border-primary hover:text-primary">📥 Import Data</a>
        <a href="/admin/areas?action=add" className="border border-gray-200 rounded-md px-4 py-2 text-sm hover:border-primary hover:text-primary">+ Add Area</a>
        <a href="/admin/societies?action=add" className="border border-gray-200 rounded-md px-4 py-2 text-sm hover:border-primary hover:text-primary">+ Add Society</a>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-900 text-[15px]">Data Export & Backup</h3></div>
        <div className="p-5 flex flex-wrap gap-2.5 items-center">
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/properties?fmt=xlsx`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Properties (.xlsx)</a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/societies?fmt=xlsx`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Societies (.xlsx)</a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/areas?fmt=xlsx`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Areas (.xlsx)</a>
          <span className="text-gray-300">|</span>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/properties?fmt=csv`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Properties (.csv)</a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/societies?fmt=csv`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Societies (.csv)</a>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export/areas?fmt=csv`} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Areas (.csv)</a>
          <span className="text-gray-300">|</span>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/admin/export-backup`} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold">Download Full Backup (.zip)</a>
        </div>
      </div>
    </div>
  );
}
