import { getCity, getArea, getAreas, getProperties, getSocieties } from './api';
import { fmtPrice } from './format';
import { SITE_URL } from './config';

// Port of backend/server.py `_listing_data` — builds listing page context for
// category_city.html (city-level) and area.html (area-level) equivalents.
export async function fetchListingData({ citySlug, category, trans, areaSlug, page = 1, perPage = 12 }) {
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

  const filters = {
    status: 'active',
    isApproved: true,
    category: ['residential', 'commercial'].includes(category) ? category : undefined,
    transactionType: transDb,
    cityId: city?.id || city?._id,
    areaId: area?.id || area?._id,
    page,
    limit: perPage,
    sort: '-createdAt',
  };

  const result = await getProperties(filters, { revalidate: 900 });
  const properties = result?.data || [];
  const total = result?.total ?? properties.length;
  const totalPages = result?.totalPages || Math.max(1, Math.ceil(total / perPage));

  const location = areaName ? `${areaName}, ${cityName}` : cityName;
  const minPrice = result?.minPrice || 0;
  const maxPrice = result?.maxPrice || 0;
  const priceRangeText = minPrice && maxPrice ? ` Price range ${fmtPrice(minPrice)} to ${fmtPrice(maxPrice)}.` : '';

  const title = `${total}+ ${catName} Properties for ${tn} in ${location} | PRObroker`;
  const desc = `Browse ${total} verified ${catName.toLowerCase()} properties for ${tw} in ${location}.${priceRangeText} Updated daily on PRObroker.`;
  const h1 = `${total}+ ${catName} Properties for ${tn} in ${location}`;
  const pathArea = areaSlug ? `${areaSlug}/` : '';
  const canonical = `${SITE_URL}/${citySlug}/${pathArea}${category}-property-for-${trans}/`;

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
    city: city || { name: cityName, slug: citySlug },
    area, category, transactionType: transDb,
    properties, total, page, totalPages,
    minPrice, maxPrice,
    popularAreas, societies,
  };
}

export function toTitle(slug) {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
