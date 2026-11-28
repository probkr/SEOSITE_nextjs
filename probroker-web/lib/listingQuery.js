// Shared by the server render and the browser. The first load of a listing page is rendered on
// the server (that HTML is what search engines index); later filter, sort and page changes fetch
// /properties as JSON straight from the browser (components/ListingResults.js). Both build the
// API query here so they always ask for the same thing. Keep this file free of server-only imports.

export const PER_PAGE = 12;

export const SORT_MAP = { newest: '-listedDate', oldest: 'listedDate', price_asc: 'price_asc', price_desc: 'price_desc' };

// Any of these present means the URL is a filter permutation: it must NOT be indexed
// (unbounded combinations) but should still be crawled so listings are discovered.
const FILTER_KEYS = [
  'bhk', 'minPrice', 'maxPrice', 'furnishing', 'propertyType', 'minSqft', 'maxSqft',
  'postedBy', 'postedSince', 'familyOrBachelors', 'area', 'q', 'sort',
  'amenities', 'hasPhotos', 'parking', 'verified', 'transactionType',
];

// Accepts a Next.js searchParams object or a URLSearchParams.
function toObject(searchParams) {
  if (!searchParams) return {};
  if (typeof searchParams.entries === 'function' && typeof searchParams.get === 'function') {
    return Object.fromEntries(searchParams.entries());
  }
  return searchParams;
}

export function readPage(searchParams) {
  return parseInt(toObject(searchParams).page || '1', 10) || 1;
}

// Reads the filter query params into a plain filters object. Purely additive query-string
// filters: they never touch the canonical path, so SEO canonicals stay stable.
export function parseListingFilters(searchParams = {}) {
  const sp = toObject(searchParams);
  const hasFilters = FILTER_KEYS.some((k) => sp[k]);
  return {
    bhk: sp.bhk || '',
    minPrice: sp.minPrice || '',
    maxPrice: sp.maxPrice || '',
    furnishing: sp.furnishing || '',
    sort: sp.sort || 'newest',
    q: sp.q || '',
    propertyType: sp.propertyType || '',
    minSqft: sp.minSqft || '',
    maxSqft: sp.maxSqft || '',
    postedBy: sp.postedBy || '',
    postedSince: sp.postedSince || '',
    familyOrBachelors: sp.familyOrBachelors || '',
    area: sp.area || '',
    amenities: sp.amenities || '',
    hasPhotos: sp.hasPhotos === 'true' ? 'true' : '',
    parking: sp.parking === 'true' ? 'true' : '',
    verified: sp.verified === 'true' ? 'true' : '',
    // Only used by /search; SEO listing pages take buy/rent from their path.
    transactionType: ['buy', 'rent'].includes(sp.transactionType) ? sp.transactionType : '',
    hasFilters,
  };
}

/**
 * Builds the /properties query for one listing page.
 * scope.fixed: what the page itself pins (city, area, category, buy/rent, a path BHK...). It wins
 *   over the same key coming from the URL filters.
 * scope.omit: URL filters this page ignores (e.g. the locality picker on an area page).
 * The result must stay JSON-serialisable: the server hands `scope` to the browser.
 */
export function buildPropertyQuery(scope = {}, filters = {}, page = 1, perPage = PER_PAGE) {
  const fromUrl = {
    transactionType: filters.transactionType || undefined,
    bhk: filters.bhk || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    furnishing: filters.furnishing || undefined,
    search: filters.q || undefined,
    propertyType: filters.propertyType || undefined,
    minSqft: filters.minSqft || undefined,
    maxSqft: filters.maxSqft || undefined,
    postedBy: filters.postedBy || undefined,
    postedSince: filters.postedSince || undefined,
    familyOrBachelors: filters.familyOrBachelors || undefined,
    amenities: filters.amenities || undefined,
    hasPhotos: filters.hasPhotos || undefined,
    parking: filters.parking || undefined,
    verified: filters.verified || undefined,
    area: filters.area || undefined,
  };
  (scope.omit || []).forEach((k) => { delete fromUrl[k]; });

  const query = {
    status: 'active',
    isApproved: true,
    ...fromUrl,
    page,
    limit: perPage,
    sort: SORT_MAP[filters.sort] || '-listedDate',
  };
  Object.entries(scope.fixed || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query[k] = v;
  });
  return query;
}

// Only the clean SEO listing pages (no URL filters, first few pages) go into the Next.js data
// cache. Every filter permutation or deep page would otherwise write its own fetch-cache file,
// and Next 14 never prunes those files, so they grow without bound as cities and areas grow.
export const MAX_CACHED_PAGE = 3;

export function listingFetchOpts(filters = {}, page = 1) {
  if (filters.hasFilters || page > MAX_CACHED_PAGE) return { cache: 'no-store' };
  return { revalidate: 900 };
}

// The API returns { properties, total, totalPages, ... }; every caller uses this shape instead.
export function normalizePropertyResult(r, perPage = PER_PAGE) {
  const properties = r?.data || r?.properties || [];
  const total = r?.total ?? properties.length;
  const totalPages = r?.totalPages || Math.max(1, Math.ceil(total / perPage));
  return { properties, total, totalPages };
}
