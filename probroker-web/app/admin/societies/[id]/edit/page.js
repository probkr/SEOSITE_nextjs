import { adminFetchJson } from '@/lib/api';
import SocietyEditForm from '@/components/admin/SocietyEditForm';

export const dynamic = 'force-dynamic';

export default async function SocietyEditPage({ params }) {
  let society, areas;
  try {
    [society, areas] = await Promise.all([
      adminFetchJson(`/admin/societies/${params.id}`),
      adminFetchJson('/admin/areas?all=1')
    ]);
  } catch (e) {
    return <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">Failed to load society: {e.message}</div>;
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <a href="/admin/societies" className="text-gray-500 text-sm">&larr; Back to Societies</a>
        <h2 className="text-lg font-bold text-gray-900">Edit: {society.name}</h2>
      </div>
      <SocietyEditForm society={society} areas={areas.areas || areas || []} />
    </div>
  );
}
