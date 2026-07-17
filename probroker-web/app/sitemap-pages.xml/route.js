import { getCities } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const urls = ['/', '/post-property/', '/about/', '/contact/', '/privacy-policy/', '/terms/', '/blog/', '/societies/'].map(
    (p) => `${SITE_URL}${p}`
  );
  const cities = (await getCities({ revalidate: 3600 })) || [];
  for (const city of cities) {
    urls.push(`${SITE_URL}/societies/${city.slug}/`);
    for (const cat of ['residential', 'commercial']) {
      for (const trans of ['sale', 'rent']) {
        urls.push(`${SITE_URL}/${city.slug}/${cat}-property-for-${trans}/`);
      }
    }
  }
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
