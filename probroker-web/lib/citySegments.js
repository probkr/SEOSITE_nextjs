import { getCity, getArea, getAreas, getProperties, getSociety, getSocieties } from './api';
import { fetchListingData, toTitle } from './listing';
import { SITE_URL } from './config';

const CATEGORY_TRANS_RE = /^(residential|commercial)-property-for-(sale|rent)$/;

const PT_MAP = {
  flats: ['flat', 'Flats', 'residential'],
  bungalows: ['bungalow', 'Bungalows', 'residential'],
  tenements: ['tenement', 'Tenements', 'residential'],
  penthouses: ['penthouse', 'Penthouses', 'residential'],
  villas: ['villa', 'Villas', 'residential'],
  plots: ['plot', 'Plots', 'residential'],
  offices: ['office', 'Offices', 'commercial'],
  shops: ['shop', 'Shops', 'commercial'],
  showrooms: ['showroom', 'Showrooms', 'commercial'],
  warehouses: ['warehouse', 'Warehouses', 'commercial'],
};

// Resolves everything the old FastAPI app served under `/{city_slug}/...`:
// - 1 extra segment: city category listing, area landing page, or SEO
//   catch-all (BHK/budget/property-type pages)
// - 2 extra segments: area category listing, or society detail page
// This lives in one function (used by a single `[...seg]` catch-all route)
// because Next.js App Router requires a single dynamic param name per route
// tree position — sibling folders like `[category]-property-for-[trans]`
// and `[areaSlug]` cannot coexist, unlike FastAPI's independent regex routes.
export async function resolveCitySegments(citySlug, segs, page = 1) {
  if (segs.length === 1) {
    return resolveOneSegment(citySlug, segs[0], page);
  }
  if (segs.length === 2) {
    return resolveTwoSegments(citySlug, segs[0], segs[1], page);
  }
  return { type: 'notfound' };
}

async function resolveOneSegment(citySlug, seg, page) {
  const mCat = seg.match(CATEGORY_TRANS_RE);
  if (mCat) {
    const data = await fetchListingData({ citySlug, category: mCat[1], trans: mCat[2], page });
    return { type: 'category-listing', data };
  }

  const city = await getCity(citySlug, { revalidate: 3600 });

  if (city) {
    const area = await getArea(seg, { revalidate: 900 });
    if (area && (area.cityId === (city.id || city._id) || !area.cityId)) {
      return { type: 'area-landing', city, area };
    }
  }

  return resolveCatchAll(citySlug, city, seg, page);
}

async function resolveCatchAll(citySlug, city, catchAll, page) {
  const cityName = city?.name || toTitle(citySlug);
  const filters = { status: 'active', isApproved: true, cityId: city?.id || city?._id };

  let propTypeLabel = '';
  let category = 'residential';
  let transactionType = 'buy';
  let tn = 'Sale';
  let tw = 'sale';

  const mBhk = catchAll.match(/^(\d+)-bhk-flats-for-(sale|rent)$/);
  const mBudget = catchAll.match(/^flats-under-(\d+)-(lakhs|crore)$/);
  const mRent = catchAll.match(/^rent-under-(\d+)$/);
  const mPt = catchAll.match(/^([a-z]+)-for-(sale|rent)$/);

  if (mBhk) {
    const bhkVal = parseInt(mBhk[1], 10);
    const trans = mBhk[2];
    filters.bhk = bhkVal;
    filters.category = 'residential';
    filters.transactionType = trans === 'sale' ? 'buy' : 'rent';
    transactionType = filters.transactionType;
    tn = trans === 'sale' ? 'Sale' : 'Rent';
    tw = trans;
    propTypeLabel = `${bhkVal} BHK Flats`;
  } else if (mBudget) {
    const val = parseInt(mBudget[1], 10);
    const unit = mBudget[2];
    filters.priceMax = unit === 'lakhs' ? val * 100000 : val * 10000000;
    filters.category = 'residential';
    filters.transactionType = 'buy';
    propTypeLabel = `Flats Under ${val} ${unit[0].toUpperCase()}${unit.slice(1)}`;
    tn = 'Sale'; tw = 'sale';
  } else if (mRent) {
    const maxRent = parseInt(mRent[1], 10);
    filters.priceMax = maxRent;
    filters.category = 'residential';
    filters.transactionType = 'rent';
    transactionType = 'rent';
    propTypeLabel = `Rentals Under ₹${maxRent.toLocaleString('en-IN')}`;
    tn = 'Rent'; tw = 'rent';
  } else if (mPt && PT_MAP[mPt[1]]) {
    const [dbType, label, cat] = PT_MAP[mPt[1]];
    const trans = mPt[2];
    filters.propertyType = dbType;
    filters.category = cat;
    filters.transactionType = trans === 'sale' ? 'buy' : 'rent';
    category = cat;
    transactionType = filters.transactionType;
    tn = trans === 'sale' ? 'Sale' : 'Rent';
    tw = trans;
    propTypeLabel = label;
  } else {
    return { type: 'notfound' };
  }

  const perPage = 12;
  filters.page = page;
  filters.limit = perPage;
  filters.sort = '-createdAt';
  const result = await getProperties(filters, { revalidate: 900 });
  const properties = result?.data || [];
  const total = result?.total ?? properties.length;
  const totalPages = result?.totalPages || Math.max(1, Math.ceil(total / perPage));

  const title = `${propTypeLabel} for ${tn} in ${cityName} | PRObroker`;
  const desc = `Browse ${total} verified ${propTypeLabel.toLowerCase()} for ${tw} in ${cityName}. Updated daily with prices, photos, and details on PRObroker.`;
  const canonical = `${SITE_URL}/${citySlug}/${catchAll}/`;
  const h1 = `${total}+ ${propTypeLabel} for ${tn} in ${cityName}`;

  let popularAreas = [];
  if (city) {
    popularAreas = ((await getAreas({ cityId: city.id || city._id }, { revalidate: 3600 })) || []).slice(0, 12);
  }

  return {
    type: 'catchall-listing',
    data: {
      title, metaDescription: desc, canonical, h1,
      city: city || { name: cityName, slug: citySlug },
      category, transactionType, properties, total, page, totalPages,
      popularAreas, societies: [],
    },
  };
}

async function resolveTwoSegments(citySlug, areaSlug, seg3, page) {
  const mCat = seg3.match(CATEGORY_TRANS_RE);
  if (mCat) {
    const data = await fetchListingData({ citySlug, category: mCat[1], trans: mCat[2], areaSlug, page });
    return { type: 'area-listing', data };
  }

  const [city, area, society] = await Promise.all([
    getCity(citySlug, { revalidate: 3600 }),
    getArea(areaSlug, { revalidate: 900 }),
    getSociety(seg3, { revalidate: 900 }),
  ]);
  if (!society) return { type: 'notfound' };

  const societyId = society.id || society._id;
  const [propResult, similarSocieties] = await Promise.all([
    getProperties({ societyId, status: 'active', isApproved: true, sort: '-createdAt', limit: 50 }, { revalidate: 900 }),
    getSocieties({ areaId: area?.id || area?._id }, { revalidate: 900 }),
  ]);

  return {
    type: 'society',
    city, area, society,
    properties: propResult?.data || [],
    similarSocieties: similarSocieties || [],
  };
}
