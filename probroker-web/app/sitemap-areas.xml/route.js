import { getAreas, getCities } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const cities = (await getCities({ revalidate: 3600 })) || [];
  const urls = [];
  for (const city of cities) {
    const areas = (await getAreas({ cityId: city.id || city._id }, { revalidate: 3600 })) || [];
    for (const area of areas) {
      urls.push(`${SITE_URL}/${city.slug}/${area.slug}/`);
      for (const cat of ['residential', 'commercial']) {
        for (const trans of ['sale', 'rent']) {
          urls.push(`${SITE_URL}/${city.slug}/${area.slug}/${cat}-property-for-${trans}/`);
        }
      }
    }
  }
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
