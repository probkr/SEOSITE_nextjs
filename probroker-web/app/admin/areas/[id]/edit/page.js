import { adminFetchJson } from '@/lib/api';
import AreaEditForm from '@/components/admin/AreaEditForm';

export const dynamic = 'force-dynamic';

export default async function AreaEditPage({ params }) {
  let area;
  try {
    area = await adminFetchJson(`/admin/areas/edit/${params.id}`);
  } catch (e) {
    return <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">Failed to load area: {e.message}</div>;
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <a href="/admin/areas" className="text-gray-500 text-sm">&larr; Back to Areas</a>
        <h2 className="text-lg font-bold text-gray-900">Edit: {area.name}</h2>
      </div>
      <AreaEditForm area={area.area || area} />
    </div>
  );
}
