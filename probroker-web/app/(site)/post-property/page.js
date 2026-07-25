import PostPropertyForm from '@/components/PostPropertyForm';
import { getProperties, getSocieties } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Post Property FREE | PRObroker',
    description: 'List your property for free on PRObroker and reach genuine buyers and tenants in Ahmedabad and Gandhinagar.',
    alternates: { canonical: `${SITE_URL}/post-property/` },
  };
}

export default async function PostPropertyPage() {
  const [propResult, societies] = await Promise.all([
    getProperties({ status: 'active', isApproved: true, limit: 1 }, { revalidate: 3600 }),
    getSocieties({}, { revalidate: 3600 }),
  ]);
  const stats = {
    listings: propResult?.total || 0,
    societies: (societies || []).length,
  };
  return <PostPropertyForm stats={stats} />;
}
