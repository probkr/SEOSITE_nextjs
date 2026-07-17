import { getCity, getArea, getAreas, getProperties } from '@/lib/api';
import { fetchListingData, toTitle } from '@/lib/listing';
import ListingView from '@/components/ListingView';
import AreaLandingView from '@/components/AreaLandingView';
import { SITE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';

// {citySlug}/{catchAll}/ is a single Next.js dynamic segment that must cover
// every 2-segment pattern the old FastAPI app matched here: the literal
// "residential|commercial-property-for-sale|rent" city listing route, the
// SEO catch-all (BHK/budget/type pages), and the area-landing page. Next.js
// does not allow sibling dynamic route folders with different param names at
// the same level, so all of it is resolved in JS instead of via separate
// literal-pattern folders.

export const revalidate = 900;
export const dynamic = 'force-dynamic';

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

async function resolve(citySlug, catchAll, page = 1) {
  const city = await getCity(citySlug, { revalidate: 3600 });

  // City-level category listing: {category}-property-for-{sale|rent}
  const mCat = catchAll.match(/^(residential|commercial)-property-for-(sale|rent)$/);
  if (mCat) {
    const data = await fetchListingData({ citySlug, category: mCat[1], trans: mCat[2], page });
    return { type: 'category-listing', data };
  }

  // Area landing page
  if (city) {
    const area = await getArea(catchAll, { revalidate: 900 });
    if (area && (area.cityId === (city.id || city._id) || !area.cityId)) {
      return { type: 'area-landing', city, area };
    }
  }

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

export async function generateMetadata({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const result = await resolve(params.citySlug, params.catchAll, page);
  if (result.type === 'notfound') return { robots: { index: false, follow: false } };
  if (result.type === 'category-listing' || result.type === 'catchall-listing') {
    const { data } = result;
    return {
      title: data.title,
      description: data.metaDescription,
      alternates: { canonical: data.canonical },
      openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
    };
  }
  if (result.type === 'area-landing') {
    const { area, city } = result;
    const canonical = `${SITE_URL}/${params.citySlug}/${params.catchAll}/`;
    const title = area.metaTitle || `Properties in ${area.name}, ${city?.name} — Flats, Bungalows, Plots for Sale & Rent | PRObroker`;
    const desc = area.metaDescription || `Browse verified properties in ${area.name}, ${city?.name}. Flats, bungalows, plots, offices for sale & rent. Contact owners directly on PRObroker.`;
    return { title, description: desc, alternates: { canonical }, openGraph: { title, description: desc, url: canonical } };
  }
  const { data } = result;
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: { canonical: data.canonical },
    openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
  };
}

export default async function CityCatchAllPage({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const result = await resolve(params.citySlug, params.catchAll, page);
  if (result.type === 'notfound') notFound();
  if (result.type === 'area-landing') {
    return <AreaLandingView area={result.area} city={result.city} />;
  }
  const basePath =
    result.type === 'category-listing'
      ? `/${params.citySlug}/${params.catchAll}/`
      : `/${params.citySlug}/${params.catchAll}/`;
  return <ListingView data={result.data} basePath={basePath} />;
}
