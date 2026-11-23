import { adminFetchJson } from '@/lib/api';
import AdsClient from '@/components/admin/AdsClient';

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  let ads = [];
  let error = null;
  try {
    const res = await adminFetchJson('/admin/ads');
    ads = Array.isArray(res) ? res : res?.ads || [];
  } catch (e) {
    error = e.message;
  }
  return (
    <div>
      {error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {error}</div>}
      <AdsClient ads={ads} />
    </div>
  );
}
