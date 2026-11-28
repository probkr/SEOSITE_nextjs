import { getCity, getArea, getAreas, getProperties, getSocieties } from './api';
import { fmtPrice } from './format';
import { SITE_URL } from './config';
import { parseListingFilters, buildPropertyQuery, normalizePropertyResult, listingFetchOpts } from './listingQuery';

// Port of backend/server.py `_listing_data` — builds listing page context for
// category_city.html (city-level) and area.html (area-level) equivalents.
// parseListingFilters lives in listingQuery.js so the browser can use it too.
export { parseListingFilters };

export async function fetchListingData({ citySlug, category, trans, areaSlug, page = 1, perPage = 12, filters: extraFilters = {} }) {
  const city = await getCity(citySlug, { revalidate: 3600 });
  const cityName = city?.name || toTitle(citySlug);

  const transDb = trans === 'sale' || trans === 'buy' ? 'buy' : 'rent';
  const tn = transDb === 'buy' ? 'Sale' : 'Rent';
  const tw = transDb === 'buy' ? 'sale' : 'rent';
  const catName = category === 'residential' ? 'Residential' : 'Commercial';

  let area = null;
  let areaName = '';
  if (areaSlug) {
    area = await getArea(areaSlug, { revalidate: 900 });
    areaName = area?.name || toTitle(areaSlug);
  }

  // What this page pins; the browser reuses it to fetch the same listing as JSON.
  const scope = {
    fixed: {
      category: ['residential', 'commercial'].includes(category) ? category : undefined,
      transactionType: transDb,
      cityId: city?.id || city?._id,
      areaId: area?.id || area?._id,
    },
    // A locality picked from the filter bar narrows within the current path (city pages only).
    omit: areaSlug ? ['area'] : [],
  };

  const result = await getProperties(buildPropertyQuery(scope, extraFilters, page, perPage), listingFetchOpts(extraFilters, page));
  const { properties, total, totalPages } = normalizePropertyResult(result, perPage);

  const location = areaName ? `${areaName}, ${cityName}` : cityName;
  const minPrice = result?.minPrice || 0;
  const maxPrice = result?.maxPrice || 0;
  const priceRangeText = minPrice && maxPrice ? ` Price range ${fmtPrice(minPrice)} to ${fmtPrice(maxPrice)}.` : '';

  const pageSuffix = page > 1 ? ` \u2013 Page ${page}` : '';
  const title = `${total}+ ${catName} Properties for ${tn} in ${location}${pageSuffix} | AllFlats`;
  const desc = `Browse ${total} verified ${catName.toLowerCase()} properties for ${tw} in ${location}.${priceRangeText} Updated daily on AllFlats.`;
  const h1 = `${total}+ ${catName} Properties for ${tn} in ${location}${pageSuffix}`;
  const pathArea = areaSlug ? `${areaSlug}/` : '';
  const cleanPath = `${SITE_URL}/${citySlug}/${pathArea}${category}-property-for-${trans}/`;
  // Filter permutations consolidate onto the clean path. Paginated pages self-canonicalise
  // so pages 2..N can rank in their own right instead of cannibalising page 1.
  const canonical = extraFilters.hasFilters
    ? cleanPath
    : page > 1
      ? `${cleanPath}?page=${page}`
      : cleanPath;

  let popularAreas = [];
  if (city) {
    const areas = await getAreas({ cityId: city.id || city._id }, { revalidate: 3600 });
    popularAreas = (areas || []).slice(0, 12);
  }

  let societies = [];
  if (area) {
    societies = (await getSocieties({ areaId: area.id || area._id }, { revalidate: 900 })) || [];
  }

  return {
    title, metaDescription: desc, canonical, h1,
    noindex: !!extraFilters.hasFilters,
    prevUrl: page > 2 ? `${cleanPath}?page=${page - 1}` : page === 2 ? cleanPath : null,
    nextUrl: page < totalPages ? `${cleanPath}?page=${page + 1}` : null,
    city: city || { name: cityName, slug: citySlug },
    area, category, transactionType: transDb,
    properties, total, page, totalPages, scope,
    minPrice, maxPrice,
    popularAreas, societies,
    activeFilters: extraFilters,
  };
}

export function toTitle(slug) {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
