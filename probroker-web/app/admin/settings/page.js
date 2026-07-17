import { adminFetchJson } from '@/lib/api';
import SettingsClient from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let data = { settings: {}, homepage_schema: '' };
  try {
    data = await adminFetchJson('/admin/settings');
  } catch (e) {
    data = { settings: {}, homepage_schema: '', error: e.message };
  }
  return (
    <div>
      {data.error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {data.error}</div>}
      <SettingsClient settings={data.settings || {}} homepageSchema={data.homepage_schema || ''} />
    </div>
  );
}
