import { adminFetchJson } from '@/lib/api';
import RedirectsClient from '@/components/admin/RedirectsClient';

export const dynamic = 'force-dynamic';

export default async function RedirectsPage() {
  let redirects = [];
  let error = null;
  try {
    const res = await adminFetchJson('/admin/redirects');
    redirects = res.redirects || res || [];
  } catch (e) {
    error = e.message;
  }
  return (
    <div>
      {error && <div className="bg-red-100 text-red-800 px-4 py-2.5 rounded-lg mb-4 text-sm">API error: {error}</div>}
      <RedirectsClient redirects={redirects} />
    </div>
  );
}
