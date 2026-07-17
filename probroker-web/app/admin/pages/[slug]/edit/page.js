import { adminFetchJson } from '@/lib/api';
import PageEditForm from '@/components/admin/PageEditForm';

export const dynamic = 'force-dynamic';

export default async function PageEditPage({ params }) {
  let data;
  try {
    data = await adminFetchJson(`/admin/pages/${params.slug}`);
  } catch (e) {
    return <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">Failed to load page: {e.message}</div>;
  }
  const { page_label, page_url, page_data = {} } = data;
  return <PageEditForm slug={params.slug} label={page_label} url={page_url} initial={page_data} />;
}
