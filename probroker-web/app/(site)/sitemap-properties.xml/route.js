import { apiFetch } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const result = await apiFetch('/sitemap/properties', { revalidate: 3600 });
  const props = Array.isArray(result) ? result : [];
  const urls = props.map((p) => {
    return [`${SITE_URL}/property/${p.slug}/`, p.updatedAt || ''];
  });
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
