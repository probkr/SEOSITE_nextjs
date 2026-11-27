import PostPropertyForm from '@/components/PostPropertyForm';
import { getAreas, getCities, getProperties, getSocietyCount } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Post Property FREE | AllFlats',
    description: 'List your property for free on AllFlats and reach genuine buyers and tenants in Ahmedabad and Gandhinagar.',
    alternates: { canonical: `${SITE_URL}/post-property/` },
  };
}

export default async function PostPropertyPage() {
  const [propResult, societyCount, cities, areas] = await Promise.all([
    getProperties({ status: 'active', isApproved: true, limit: 1 }, { revalidate: 3600 }),
    getSocietyCount({}, { revalidate: 3600 }),
    getCities({ revalidate: 3600 }).catch(() => []),
    getAreas({}, { revalidate: 3600 }).catch(() => []),
  ]);
  const stats = {
    listings: propResult?.total || 0,
    societies: societyCount,
  };

  // Locality suggestions per city slug, so the form can offer a pick-list and send the API a
  // slug it recognises (it matches areas by id or slug, not by display name).
  const slugById = Object.fromEntries((cities || []).map((c) => [c.id || c._id, c.slug]));
  const areasByCity = {};
  for (const a of Array.isArray(areas) ? areas : []) {
    const citySlug = slugById[a.cityId];
    if (!citySlug || !a.name || !a.slug) continue;
    (areasByCity[citySlug] ||= []).push({ name: a.name, slug: a.slug });
  }

  return <PostPropertyForm stats={stats} areasByCity={areasByCity} />;
}
