import { getSocieties } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const societies = (await getSocieties({}, { revalidate: 3600 })) || [];
  const urls = societies
    .filter((s) => s.citySlug && s.areaSlug)
    .map((s) => [`${SITE_URL}/${s.citySlug}/${s.areaSlug}/${s.slug}/`, s.updatedAt || s.createdAt || '']);
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
