import { adminFetchJson } from '@/lib/api';
import BulkImportClient from '@/components/admin/BulkImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  let dbInfo = {};
  try {
    dbInfo = await adminFetchJson('/admin/import');
  } catch (e) {
    dbInfo = { error: e.message };
  }
  return (
    <div>
      {dbInfo.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {dbInfo.error}</div>}
      <BulkImportClient dbInfo={dbInfo} />
    </div>
  );
}
