import { getProperties } from '@/lib/api';
import { buildPropertySlug } from '@/lib/format';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const result = await getProperties({ status: 'active', isApproved: true, limit: 5000 }, { revalidate: 3600 });
  const props = result?.data || [];
  const urls = props.map((p) => {
    const slug = p.slug || buildPropertySlug(p);
    const lastmod = p.updatedAt || p.createdAt || '';
    return [`${SITE_URL}/property/${slug}/`, lastmod];
  });
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
