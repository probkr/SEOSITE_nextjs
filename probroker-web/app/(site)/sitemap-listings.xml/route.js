import { getCities } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

// City-level keyword landing pages the [citySlug]/[...seg] catch-all router already
// serves natively (category pages, BHK pages, budget pages) but that were previously
// missing from every sitemap -- meaning crawlers had no path to discover them at all.
const BHK_VALUES = [1, 2, 3, 4];
const BUDGET_LAKHS = [20, 30, 40, 50, 75];
const BUDGET_CRORE = [1, 2, 3];

export async function GET() {
  const cities = (await getCities({ revalidate: 3600 })) || [];
  const urls = [];

  for (const city of cities) {
    for (const cat of ['residential', 'commercial']) {
      for (const trans of ['sale', 'rent']) {
        urls.push(`${SITE_URL}/${city.slug}/${cat}-property-for-${trans}/`);
      }
    }

    for (const bhk of BHK_VALUES) {
      for (const trans of ['sale', 'rent']) {
        urls.push(`${SITE_URL}/${city.slug}/${bhk}-bhk-flats-for-${trans}/`);
      }
    }

    for (const val of BUDGET_LAKHS) {
      urls.push(`${SITE_URL}/${city.slug}/flats-under-${val}-lakhs/`);
    }
    for (const val of BUDGET_CRORE) {
      urls.push(`${SITE_URL}/${city.slug}/flats-under-${val}-crore/`);
    }
  }

  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
