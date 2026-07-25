import { getCity, getArea, getAreas, getProperties, getSocieties } from './api';
import { fmtPrice } from './format';
import { SITE_URL } from './config';

// Port of backend/server.py `_listing_data` — builds listing page context for
// category_city.html (city-level) and area.html (area-level) equivalents.
// Reads BHK/price/furnishing/parking/sort/search filter params from a Next.js
// searchParams object (used by every listing route entry point) into a plain
// filters object that fetchListingData/resolveCitySegments understand.
// Purely additive query-string filters — never touches the canonical path,
// so SEO canonicals stay stable regardless of which filters are applied.
export function parseListingFilters(searchParams = {}) {
  const bhk = searchParams.bhk || '';
  const minPrice = searchParams.minPrice || '';
  const maxPrice = searchParams.maxPrice || '';
  const furnishing = searchParams.furnishing || '';
  const sort = searchParams.sort || 'newest';
  const q = searchParams.q || '';
  const propertyType = searchParams.propertyType || '';
  const minSqft = searchParams.minSqft || '';
  const maxSqft = searchParams.maxSqft || '';
  const postedBy = searchParams.postedBy || '';
  const postedSince = searchParams.postedSince || '';
  const familyOrBachelors = searchParams.familyOrBachelors || '';
  const area = searchParams.area || '';
  // Any of these present means the URL is a filter permutation: it must NOT be indexed
  // (unbounded combinations) but should still be crawled so listings are discovered.
  const FILTER_KEYS = [
    'bhk', 'minPrice', 'maxPrice', 'furnishing', 'propertyType', 'minSqft', 'maxSqft',
    'postedBy', 'postedSince', 'familyOrBachelors', 'area', 'q', 'sort',
  ];
  const hasFilters = FILTER_KEYS.some((k) => searchParams[k]);
  return {
    bhk, minPrice, maxPrice, furnishing, sort, q,
    propertyType, minSqft, maxSqft, postedBy, postedSince, familyOrBachelors, area,
    hasFilters,
  };
}

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

  const sortMap = { newest: '-createdAt', price_asc: 'price_asc', price_desc: 'price_desc' };
  const sort = sortMap[extraFilters.sort] || '-createdAt';

  const filters = {
    status: 'active',
    isApproved: true,
    category: ['residential', 'commercial'].includes(category) ? category : undefined,
    transactionType: transDb,
    cityId: city?.id || city?._id,
    areaId: area?.id || area?._id,
    page,
    limit: perPage,
    sort,
    bhk: extraFilters.bhk || undefined,
    minPrice: extraFilters.minPrice || undefined,
    maxPrice: extraFilters.maxPrice || undefined,
    furnishing: extraFilters.furnishing || undefined,
    search: extraFilters.q || undefined,
    propertyType: extraFilters.propertyType || undefined,
    minSqft: extraFilters.minSqft || undefined,
    maxSqft: extraFilters.maxSqft || undefined,
    postedBy: extraFilters.postedBy || undefined,
    postedSince: extraFilters.postedSince || undefined,
    familyOrBachelors: extraFilters.familyOrBachelors || undefined,
    // A locality picked from the filter bar narrows within the current path.
    area: !areaSlug && extraFilters.area ? extraFilters.area : undefined,
  };

  const result = await getProperties(filters, { revalidate: 900 });
  const properties = result?.data || [];
  const total = result?.total ?? properties.length;
  const totalPages = result?.totalPages || Math.max(1, Math.ceil(total / perPage));

  const location = areaName ? `${areaName}, ${cityName}` : cityName;
  const minPrice = result?.minPrice || 0;
  const maxPrice = result?.maxPrice || 0;
  const priceRangeText = minPrice && maxPrice ? ` Price range ${fmtPrice(minPrice)} to ${fmtPrice(maxPrice)}.` : '';

  const pageSuffix = page > 1 ? ` \u2013 Page ${page}` : '';
  const title = `${total}+ ${catName} Properties for ${tn} in ${location}${pageSuffix} | PRObroker`;
  const desc = `Browse ${total} verified ${catName.toLowerCase()} properties for ${tw} in ${location}.${priceRangeText} Updated daily on PRObroker.`;
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
    properties, total, page, totalPages,
    minPrice, maxPrice,
    popularAreas, societies,
    activeFilters: extraFilters,
  };
}

export function toTitle(slug) {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
