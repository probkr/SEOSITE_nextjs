const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const City = require('../models/City');
const Area = require('../models/Area');
const Society = require('../models/Society');
const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const OwnerListing = require('../models/OwnerListing');
const BlogPost = require('../models/BlogPost');
const Setting = require('../models/Setting');
const { generatePropertySlug, generatePropertyId } = require('../services/slugify');
const { getCurrentUser } = require('../middleware/userAuth');
const { normalizePhone, isValidPhone } = require('../services/otpService');
const { hasContact } = require('../services/creditService');
const { parsePhotos } = require('../services/importMapper');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Words the CRM puts in contactName when it has no real name. Showing "O***" or "b***" for
// them looks broken, so the site shows no name instead.
const PLACEHOLDER_NAMES = new Set(['owner', 'broker', 'dealer', 'agent', 'probroker', 'prbroker', 'na', 'n/a', 'none', 'null', 'unknown', 'test']);

// The site shows the first name and the surname's initial ("Kunal M."); the full name and the
// number come with Get Contact. A one-word name is just a first name, so it is shown as it is,
// the same as the first name of a two-word one.
function maskContactName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return PLACEHOLDER_NAMES.has(parts[0].toLowerCase()) ? '' : parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function cleanupDescription(text) {
  if (!text) return text;
  return String(text)
    .replace(/, Near /g, ', ')
    .replace(/ {2,}/g, ' ')
    .replace(/ +,/g, ',')
    .replace(/,{2,}/g, ',')
    .trim();
}

// Every listing response goes through this, so owner details never reach the public site:
// the phone number is removed and the name is masked.
function publicProperty(prop) {
  // alternatePhones are contact numbers like contactPhone; missingFields, dataIssues and
  // descriptionSource are the cleaner's data-quality notes, not for the site.
  const { contactPhone, alternatePhones, missingFields, dataIssues, descriptionSource, ...rest } = prop;
  return {
    ...rest,
    // Older imports stored several photo URLs joined by commas in one entry.
    photos: parsePhotos(prop.photos),
    contactName: maskContactName(prop.contactName),
    description: cleanupDescription(prop.description),
    hasContact: hasContact(prop),
  };
}

// ---------- Site settings (public, safe subset) ----------
exports.getSiteSettings = async (req, res) => {
  const s = (await Setting.findOne({ key: 'site' }, { _id: 0 }).lean()) || {};
  res.json({
    site_name: s.site_name || 'AllFlats',
    logo_url: s.logo_url || '',
    logo_width: s.logo_width || 0,
  });
};

// ---------- Cities ----------
exports.listCities = async (req, res) => {
  const cities = await City.find({ isActive: true }, { _id: 0 }).sort({ name: 1 }).lean();
  res.json(cities);
};

exports.getCityBySlug = async (req, res) => {
  const city = await City.findOne({ slug: req.params.slug }, { _id: 0 }).lean();
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json(city);
};

// ---------- Areas ----------
exports.listAreas = async (req, res) => {
  const q = {};
  if (req.query.cityId) q.cityId = req.query.cityId;
  if (req.query.isActive !== 'false') q.isActive = true;
  const areas = await Area.find(q, { _id: 0 }).sort({ name: 1 }).lean();
  res.json(areas);
};

exports.getAreaBySlug = async (req, res) => {
  const area = await Area.findOne({ slug: req.params.slug }, { _id: 0 }).lean();
  if (!area) return res.status(404).json({ error: 'Area not found' });
  const city = await City.findOne({ id: area.cityId }, { _id: 0 }).lean();
  res.json({ ...area, city });
};

// ---------- Societies ----------
// There are 13k+ societies (~10 MB as full documents), so callers that only need a number
// pass ?count=1, and list callers pass ?fields=a,b,c to download just those columns.
const SOCIETY_LIST_FIELDS = new Set([
  'id', 'name', 'slug', 'areaId', 'cityId', 'areaSlug', 'citySlug', 'project_type',
  'is_featured', 'createdAt', 'updatedAt',
]);

exports.listSocieties = async (req, res) => {
  const q = {};
  if (req.query.areaId) q.areaId = req.query.areaId;
  if (req.query.cityId) q.cityId = req.query.cityId;
  if (req.query.isActive !== 'false') q.isActive = true;

  if (req.query.count === '1') {
    return res.json({ count: await Society.countDocuments(q) });
  }

  const projection = { _id: 0 };
  const fields = String(req.query.fields || '').split(',').map((f) => f.trim()).filter((f) => SOCIETY_LIST_FIELDS.has(f));
  for (const f of fields) projection[f] = 1;

  // ?limit= switches to a paged response: { data, total, page, pages }.
  const limit = Math.min(parseInt(req.query.limit, 10) || 0, 100);
  if (limit > 0) {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const [total, data] = await Promise.all([
      Society.countDocuments(q),
      Society.find(q, projection).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return res.json({ data, total, page, pages: Math.ceil(total / limit) });
  }

  const societies = await Society.find(q, projection).sort({ name: 1 }).lean();
  res.json(societies);
};

exports.getSocietyBySlug = async (req, res) => {
  const slug = req.params.slug.replace(/\/$/, '');
  const society = await Society.findOne({ slug }, { _id: 0 }).lean();
  if (!society) return res.status(404).json({ error: 'Society not found' });
  const area = await Area.findOne({ id: society.areaId }, { _id: 0 }).lean();
  const city = await City.findOne({ id: society.cityId }, { _id: 0 }).lean();
  res.json({ ...society, area, city });
};

// ---------- Properties ----------
// A listing has a photo when its first photo is a non-empty string, the same test the card uses.
// $gt '' only matches strings, so a missing or empty first photo falls in the second group.
const WITH_PHOTO = { 'photos.0': { $gt: '' } };
const WITHOUT_PHOTO = { 'photos.0': { $not: { $gt: '' } } };

// One page of listings with every photo listing ahead of every listing without one, each group
// in the given sort order. Paging runs through the photo group first and then carries on into
// the rest, so a page can hold the tail of one group and the start of the other.
async function findPhotosFirst(query, sort, skip, limit) {
  const withPhoto = { $and: [query, WITH_PHOTO] };
  const find = (q, s, l) => Property.find(q, { _id: 0 }).sort(sort).skip(s).limit(l).lean();
  const photoCount = await Property.countDocuments(withPhoto);
  const fromPhotos = skip < photoCount ? await find(withPhoto, skip, limit) : [];
  const remaining = limit - fromPhotos.length;
  if (!remaining) return fromPhotos;
  const rest = await find({ $and: [query, WITHOUT_PHOTO] }, Math.max(0, skip - photoCount), remaining);
  return fromPhotos.concat(rest);
}

// Port of GET /api/properties filter-building logic from server.py (~line 4881)
exports.listProperties = async (req, res) => {
  const {
    city, area, category,
    transaction_type, transactionType,
    bhk, min_price, minPrice, max_price, maxPrice,
    property_type, propertyType,
    furnishing, parking, familyOrBachelors, amenities, hasPhotos, verified,
    minSqft, maxSqft, min_sqft, max_sqft,
    totalFloors, minFloors, maxFloors,
    maxAge, minAge, ageOfProperty,
    postedBy, postedSince,
    search, q,
    sort, sortBy,
    societyId, areaId, cityId,
    page: pageParam, limit: limitParam,
  } = req.query;

  const _transactionType = transaction_type || transactionType;
  const _minPrice = min_price ?? minPrice;
  const _maxPrice = max_price ?? maxPrice;
  const _propertyType = property_type || propertyType;
  const _search = search || q;
  const _sort = sort || sortBy || 'newest';
  const page = parseInt(pageParam, 10) || 1;
  const limit = parseInt(limitParam, 10) || 12;

  const query = { status: 'active', isApproved: true };

  if (city) {
    const cityDoc = await City.findOne({ slug: { $regex: `^${esc(city)}$`, $options: 'i' } }, { _id: 0 }).lean();
    if (cityDoc) query.cityId = cityDoc.id;
  } else if (cityId) {
    query.cityId = cityId;
  }

  if (category) query.category = category;
  if (_transactionType) query.transactionType = _transactionType;

  if (bhk) {
    const bhkList = String(bhk).split(',').map((b) => parseInt(b, 10)).filter((b) => !Number.isNaN(b));
    if (bhkList.length) query.bhk = { $in: bhkList };
  }

  if (_minPrice !== undefined || _maxPrice !== undefined) {
    query.price = {};
    if (_minPrice !== undefined) query.price.$gte = Number(_minPrice);
    if (_maxPrice !== undefined) query.price.$lte = Number(_maxPrice);
  }

  if (_propertyType) query.propertyType = { $regex: `^${esc(_propertyType)}$`, $options: 'i' };
  if (furnishing) query.furnishing = { $regex: esc(furnishing), $options: 'i' };
  const and = [];
  // Parking is recorded either as the boolean or as a "Parking" amenity, depending on the source.
  if (parking && String(parking).toLowerCase() === 'true') and.push({ $or: [{ parking: true }, { amenities: 'Parking' }] });
  if (amenities) {
    const list = String(amenities).split(',').map((a) => a.trim()).filter(Boolean).slice(0, 20);
    if (list.length) query.amenities = { $all: list };
  }
  if (hasPhotos && String(hasPhotos).toLowerCase() === 'true') query['photos.0'] = { $exists: true };
  if (verified && String(verified).toLowerCase() === 'true') query.isVerified = true;
  if (familyOrBachelors) query.familyOrBachelors = { $regex: `^${esc(familyOrBachelors)}$`, $options: 'i' };

  // --- Area (sqft) range ---
  const _minSqft = min_sqft ?? minSqft;
  const _maxSqft = max_sqft ?? maxSqft;
  if (_minSqft !== undefined || _maxSqft !== undefined) {
    query.sqft = {};
    if (_minSqft !== undefined && _minSqft !== '') query.sqft.$gte = Number(_minSqft);
    if (_maxSqft !== undefined && _maxSqft !== '') query.sqft.$lte = Number(_maxSqft);
    if (!Object.keys(query.sqft).length) delete query.sqft;
  }

  // --- Total floors (multi-select CSV, or min/max range) ---
  if (totalFloors) {
    const fl = String(totalFloors).split(',').map((f) => parseInt(f, 10)).filter((f) => !Number.isNaN(f));
    if (fl.length) query.totalFloors = { $in: fl };
  } else if (minFloors !== undefined || maxFloors !== undefined) {
    query.totalFloors = {};
    if (minFloors !== undefined && minFloors !== '') query.totalFloors.$gte = Number(minFloors);
    if (maxFloors !== undefined && maxFloors !== '') query.totalFloors.$lte = Number(maxFloors);
    if (!Object.keys(query.totalFloors).length) delete query.totalFloors;
  }

  // --- Age of property (years) ---
  if (ageOfProperty !== undefined && ageOfProperty !== '') {
    query.ageOfProperty = Number(ageOfProperty);
  } else if (minAge !== undefined || maxAge !== undefined) {
    query.ageOfProperty = {};
    if (minAge !== undefined && minAge !== '') query.ageOfProperty.$gte = Number(minAge);
    if (maxAge !== undefined && maxAge !== '') query.ageOfProperty.$lte = Number(maxAge);
    if (!Object.keys(query.ageOfProperty).length) delete query.ageOfProperty;
  }

  // --- Posted by (owner vs broker/probroker) ---
  if (postedBy) {
    const pb = String(postedBy).toLowerCase();
    // Who posted it lives in listingType. `source` only records which pipeline created the row
    // (imports are all "probroker", even owner listings), so filtering on it hid 461 of 464 owners.
    if (pb === 'owner') query.listingType = 'owner';
    else if (pb === 'broker' || pb === 'probroker' || pb === 'agent') query.listingType = 'broker';
  }

  // --- Posted since (days ago) ---
  if (postedSince) {
    const days = parseInt(postedSince, 10);
    if (!Number.isNaN(days) && days > 0) {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();
      query.listedDate = { $gte: cutoff };
    }
  }

  if (area) {
    const areaDoc = await Area.findOne({ slug: { $regex: `^${esc(area)}$`, $options: 'i' } }, { _id: 0 }).lean();
    if (areaDoc) query.areaId = areaDoc.id;
  } else if (areaId) {
    query.areaId = areaId;
  }

  if (societyId) query.societyId = societyId;

  if (_search) {
    const searchRegex = { $regex: esc(_search), $options: 'i' };
    const [matchingAreas, matchingSocieties] = await Promise.all([
      Area.find({ name: searchRegex }, { _id: 0, id: 1 }).limit(20).lean(),
      Society.find({ name: searchRegex }, { _id: 0, id: 1 }).limit(20).lean(),
    ]);
    const orConditions = [
      { premiseName: searchRegex },
      { nearby: searchRegex },
      { additionalDetails: searchRegex },
      { aiDescription: searchRegex },
    ];
    if (matchingAreas.length) orConditions.push({ areaId: { $in: matchingAreas.map((a) => a.id) } });
    if (matchingSocieties.length) orConditions.push({ societyId: { $in: matchingSocieties.map((s) => s.id) } });
    query.$or = orConditions;
  }

  if (and.length) query.$and = and;

  // Newest first (the default) and oldest first both order by the listing date.
  let sortField = 'listedDate';
  let sortDir = -1;
  if (_sort === 'oldest' || _sort === 'listedDate') sortDir = 1;
  else if (_sort === 'price_asc') { sortField = 'price'; sortDir = 1; }
  else if (_sort === 'price_desc') { sortField = 'price'; sortDir = -1; }

  const skip = (page - 1) * limit;
  const sortSpec = { [sortField]: sortDir };
  // A visitor who asks for price order gets exactly that. Only the default "newest" order puts
  // listings with photos first.
  const photosFirst = sortField === 'listedDate';
  const [total, properties, priceStats] = await Promise.all([
    Property.countDocuments(query),
    photosFirst
      ? findPhotosFirst(query, sortSpec, skip, limit)
      : Property.find(query, { _id: 0 }).sort(sortSpec).skip(skip).limit(limit).lean(),
    Property.aggregate([
      { $match: query },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' }, avgPrice: { $avg: '$price' } } },
    ]),
  ]);

  const areaIds = [...new Set(properties.map((p) => p.areaId).filter(Boolean))];
  const cityIds = [...new Set(properties.map((p) => p.cityId).filter(Boolean))];
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean(),
    City.find({ id: { $in: cityIds } }, { _id: 0 }).lean(),
  ]);
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a]));
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  for (const p of properties) {
    p.areaName = areaMap[p.areaId]?.name || '';
    p.cityName = cityMap[p.cityId]?.name || '';
  }

  const ps = priceStats[0] || {};
  res.json({
    properties: properties.map(publicProperty),
    total,
    page,
    pages: Math.ceil(total / limit),
    totalPages: Math.ceil(total / limit),
    minPrice: ps.minPrice || 0,
    maxPrice: ps.maxPrice || 0,
    avgPrice: Math.round(ps.avgPrice || 0),
  });
};

exports.latestProperties = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const properties = await findPhotosFirst({ status: 'active', isApproved: true }, { listedDate: -1 }, 0, limit);
  await addPlaceNames(properties);
  res.json(properties.map(publicProperty));
};

// POST /api/v1/properties/saved { ids } -- the listings behind the hearts a visitor has tapped.
// The site keeps those ids in the browser (propertyId, or slug for older saves), newest last.
// Listings that are no longer live are left out.
exports.savedProperties = async (req, res) => {
  const raw = Array.isArray(req.body?.ids) ? req.body.ids : [];
  // Strings only: an object here would reach the query below as a Mongo operator.
  const ids = [...new Set(raw.filter((id) => typeof id === 'string' && id))].slice(-100);
  if (!ids.length) return res.json({ properties: [] });
  const properties = await Property.find(
    { status: 'active', isApproved: true, $or: [{ propertyId: { $in: ids } }, { slug: { $in: ids } }] },
    { _id: 0 },
  ).lean();
  await addPlaceNames(properties);
  const savedAt = (p) => Math.max(ids.indexOf(p.propertyId), ids.indexOf(p.slug));
  properties.sort((a, b) => savedAt(b) - savedAt(a)); // most recently saved first
  res.json({ properties: properties.map(publicProperty) });
};

// Fills in areaName and cityName, which listing cards show and the stored documents don't carry.
async function addPlaceNames(properties) {
  const areaIds = [...new Set(properties.map((p) => p.areaId).filter(Boolean))];
  const cityIds = [...new Set(properties.map((p) => p.cityId).filter(Boolean))];
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean(),
    City.find({ id: { $in: cityIds } }, { _id: 0 }).lean(),
  ]);
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a]));
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  for (const p of properties) {
    p.areaName = areaMap[p.areaId]?.name || '';
    p.cityName = cityMap[p.cityId]?.name || '';
  }
}

// ---------- Similar properties (property page) ----------
// 1. Must match (else never shown): active + approved, not the listing itself, same
//    transactionType, category, city, and a propertyType from the same group (flat ~ penthouse).
// 2. Candidates: same society / area first, then the rest of the city near the price and BHK.
// 3. Each candidate is scored on how close it is (see similarScore). A field only scores when
//    both listings have it, so blank data never counts against a listing.
// 4. Best scores first, at least SIMILAR_MIN_SCORE, copies of one flat dropped, at most two from
//    one society. Having photos is worth +15 in the score, so between close matches the one
//    with photos wins, but never over a much closer match. Short of the limit, lower minimums
//    fill in (the must-match rules never relax); a negative score (very different BHK or
//    price) is never shown. The result lists the ones with photos first.
const PROPERTY_TYPE_GROUPS = [
  ['flat', 'apartment', 'penthouse'],
  ['bungalow', 'villa', 'tenement', 'rowhouse', 'row house', 'independent house'],
  ['office'],
  ['shop', 'showroom'],
  ['warehouse', 'godown', 'shed'],
  ['plot', 'land'],
  ['basement'],
];
const SIMILAR_MIN_SCORE = [40, 25, 0];
const SIMILAR_MAX_PER_SOCIETY = 2;
const DAY_MS = 86400000;

// Only what scoring needs; the chosen few are re-read in full afterwards.
const SIMILAR_SCORE_FIELDS = {
  _id: 0, propertyId: 1, societyId: 1, areaId: 1, bhk: 1, price: 1, sqft: 1, propertyType: 1,
  furnishing: 1, saleType: 1, familyOrBachelors: 1, workstations: 1, cabins: 1, washroomType: 1,
  boundaryWall: 1, ageRange: 1, ageOfProperty: 1, floorNumber: 1, facing: 1, bathrooms: 1,
  parking: 1, parkingType: 1, amenities: 1, reraApproved: 1, availableFrom: 1,
  maintenanceIncluded: 1, photos: { $slice: 1 }, isVerified: 1, listedDate: 1, createdAt: 1,
  views: 1, contactPhone: 1,
};

const filled = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const lc = (v) => String(v).trim().toLowerCase();
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
// Both present and equal (case and spacing ignored).
const sameVal = (a, b) => filled(a) && filled(b) && lc(a) === lc(b);
// Both numbers and a is within pct of b.
const nearNum = (a, b, pct) => {
  const x = num(a);
  const y = num(b);
  return x !== null && y !== null && y > 0 && Math.abs(x - y) <= y * pct;
};
const typeGroup = (t) => {
  const v = lc(t || '');
  return PROPERTY_TYPE_GROUPS.find((g) => g.includes(v)) || (v ? [v] : []);
};
const exactCi = (v) => new RegExp(`^${esc(v)}$`, 'i');
const timeOf = (d) => {
  const raw = d && typeof d === 'object' && d.$date ? d.$date : d;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
};
// Copies of one flat posted more than once by the same number.
const dupKey = (p) => (p.contactPhone ? [p.contactPhone, p.societyId || '', p.bhk || '', p.price || ''].join('|') : '');

function similarScore(base, p) {
  const isRent = base.transactionType === 'rent';
  const isPlot = typeGroup(base.propertyType).includes('plot');
  const isCommercial = base.category === 'commercial';
  let score = 0;

  // Location
  if (sameVal(base.societyId, p.societyId)) score += 30;
  if (sameVal(base.areaId, p.areaId)) score += 20;

  // Size and price
  if (!isCommercial && !isPlot && num(base.bhk) && num(p.bhk)) {
    const diff = Math.abs(num(base.bhk) - num(p.bhk));
    if (diff === 0) score += 20;
    else if (diff === 1) score += 8;
    else score -= 20; // 1 BHK vs 3 BHK is not similar, whatever else matches
  }
  if (nearNum(p.price, base.price, 0.15)) score += 20;
  else if (nearNum(p.price, base.price, 0.30)) score += 10;
  else if (num(p.price) && num(base.price) && !nearNum(p.price, base.price, 0.5)) score -= 20; // under half or over 1.5x
  if (nearNum(p.sqft, base.sqft, 0.20)) score += isCommercial || isPlot ? 20 : 10;
  const baseRate = num(base.price) && num(base.sqft) ? base.price / base.sqft : null;
  const rate = num(p.price) && num(p.sqft) ? p.price / p.sqft : null;
  if (baseRate && rate && nearNum(rate, baseRate, 0.15)) score += isPlot ? 15 : 5;

  // The property itself
  if (sameVal(base.propertyType, p.propertyType)) score += 10;
  if (sameVal(base.furnishing, p.furnishing)) score += 5;
  if (!isRent && sameVal(base.saleType, p.saleType)) score += 5;
  if (sameVal(base.ageRange, p.ageRange) || sameVal(base.ageOfProperty, p.ageOfProperty)) score += 4;
  if (num(base.floorNumber) !== null && num(p.floorNumber) !== null && Math.abs(num(base.floorNumber) - num(p.floorNumber)) <= 3) score += 3;
  if (sameVal(base.facing, p.facing)) score += 2;
  if (sameVal(base.bathrooms, p.bathrooms)) score += 3;
  const parks = (x) => x.parking === true || filled(x.parkingType);
  if (parks(base) && parks(p)) score += 3;
  if (Array.isArray(base.amenities) && Array.isArray(p.amenities)) {
    const mine = new Set(base.amenities.map(lc));
    score += Math.min(5, p.amenities.filter((a) => mine.has(lc(a))).length);
  }
  if (base.reraApproved === true && p.reraApproved === true) score += 2;

  // Rent only
  if (isRent) {
    if (sameVal(base.familyOrBachelors, p.familyOrBachelors)) score += 10;
    const a = timeOf(base.availableFrom);
    const b = timeOf(p.availableFrom);
    if (a && b && Math.abs(a - b) <= 30 * DAY_MS) score += 3;
    if (filled(base.maintenanceIncluded) && filled(p.maintenanceIncluded) && base.maintenanceIncluded === p.maintenanceIncluded) score += 2;
  }

  // Commercial only (instead of BHK)
  if (isCommercial) {
    if (nearNum(p.workstations, base.workstations, 0.25)) score += 8;
    if (num(base.cabins) !== null && num(p.cabins) !== null && Math.abs(num(base.cabins) - num(p.cabins)) <= 1) score += 5;
    if (sameVal(base.washroomType, p.washroomType)) score += 3;
  }

  // Plot only
  if (isPlot && sameVal(base.boundaryWall, p.boundaryWall)) score += 3;

  // Listing quality
  // Photos weigh a lot (a card without one is far less useful), but not enough to lift a
  // listing that is clearly less alike.
  if (Array.isArray(p.photos) && p.photos[0]) score += 15;
  if (p.isVerified === true) score += 5;
  if (Date.now() - timeOf(p.listedDate || p.createdAt) <= 30 * DAY_MS) score += 5;
  const views = num(p.views);
  if (views && views > 0) score += Math.min(3, Math.floor(Math.log10(views + 1)));

  return score;
}

exports.similarProperties = async (req, res) => {
  const { propertyId } = req.query;
  const lim = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 12);
  if (!propertyId) return res.json([]);
  const base = await Property.findOne({ propertyId }, { _id: 0 }).lean();
  if (!base || !base.cityId || !base.transactionType) return res.json([]);

  // Must-match rules.
  const must = {
    propertyId: { $ne: propertyId },
    status: 'active',
    isApproved: true,
    transactionType: base.transactionType,
    cityId: base.cityId,
  };
  if (base.category) must.category = base.category;
  const group = typeGroup(base.propertyType);
  if (group.length) must.propertyType = { $in: group.map(exactCi) };

  // Candidates: same society / area, plus the rest of the city near the price and BHK.
  const local = [base.societyId && { societyId: base.societyId }, base.areaId && { areaId: base.areaId }].filter(Boolean);
  const wide = { ...must };
  if (base.areaId) wide.areaId = { $ne: base.areaId };
  if (num(base.price)) wide.price = { $gte: base.price * 0.5, $lte: base.price * 1.5 };
  const baseBhk = num(base.bhk);
  if (baseBhk && base.category !== 'commercial' && !group.includes('plot')) wide.bhk = { $in: [baseBhk - 1, baseBhk, baseBhk + 1] };

  const [nearDocs, wideDocs] = await Promise.all([
    local.length
      ? Property.find({ ...must, $or: local }, SIMILAR_SCORE_FIELDS).sort({ listedDate: -1 }).limit(200).lean()
      : [],
    Property.find(wide, SIMILAR_SCORE_FIELDS).sort({ listedDate: -1 }).limit(150).lean(),
  ]);

  const seenIds = new Set();
  const ranked = [...nearDocs, ...wideDocs]
    .filter((p) => !seenIds.has(p.propertyId) && seenIds.add(p.propertyId))
    .map((p) => ({ p, score: similarScore(base, p) }))
    .sort((a, b) => b.score - a.score || timeOf(b.p.listedDate || b.p.createdAt) - timeOf(a.p.listedDate || a.p.createdAt));

  // Pick: best first, no copies (of each other or of this flat), two per society at most.
  const chosen = [];
  const chosenIds = new Set();
  const usedKeys = new Set([dupKey(base)].filter(Boolean));
  const perSociety = new Map();
  const take = (minScore, capSociety) => {
    for (const { p, score } of ranked) {
      if (chosen.length >= lim) return;
      if (score < minScore || chosenIds.has(p.propertyId)) continue;
      const key = dupKey(p);
      if (key && usedKeys.has(key)) continue;
      const soc = p.societyId || '';
      if (capSociety && soc && (perSociety.get(soc) || 0) >= SIMILAR_MAX_PER_SOCIETY) continue;
      chosen.push(p.propertyId);
      chosenIds.add(p.propertyId);
      if (key) usedKeys.add(key);
      if (soc) perSociety.set(soc, (perSociety.get(soc) || 0) + 1);
    }
  };
  for (const minScore of SIMILAR_MIN_SCORE) take(minScore, true);
  take(0, false);

  if (!chosen.length) return res.json([]);

  // Full documents for the chosen ones, in ranked order, with the names the cards show.
  const docs = await Property.find({ propertyId: { $in: chosen } }, { _id: 0 }).lean();
  const byId = new Map(docs.map((d) => [d.propertyId, d]));
  // Photo listings first, each group still in score order.
  const ordered = chosen.map((id) => byId.get(id)).filter(Boolean);
  const withPhoto = (d) => (parsePhotos(d.photos).some(Boolean) ? 0 : 1);
  ordered.sort((a, b) => withPhoto(a) - withPhoto(b));
  const [areas, cities, societies] = await Promise.all([
    Area.find({ id: { $in: [...new Set(ordered.map((d) => d.areaId).filter(Boolean))] } }, { _id: 0, id: 1, name: 1 }).lean(),
    City.find({ id: { $in: [...new Set(ordered.map((d) => d.cityId).filter(Boolean))] } }, { _id: 0, id: 1, name: 1 }).lean(),
    Society.find({ id: { $in: [...new Set(ordered.map((d) => d.societyId).filter(Boolean))] } }, { _id: 0, id: 1, name: 1 }).lean(),
  ]);
  const areaName = new Map(areas.map((a) => [a.id, a.name]));
  const cityName = new Map(cities.map((c) => [c.id, c.name]));
  const societyName = new Map(societies.map((x) => [x.id, x.name]));
  for (const d of ordered) {
    d.areaName = areaName.get(d.areaId) || '';
    d.cityName = cityName.get(d.cityId) || '';
    d.societyName = societyName.get(d.societyId) || '';
  }
  res.json(ordered.map(publicProperty));
};

exports.getPropertyBySlug = async (req, res) => {
  const slug = req.params.slug.replace(/\/$/, '');
  // A listing whose slug was rebuilt keeps the old one in oldSlug. Returning it here lets the
  // property page redirect the old URL to the current slug instead of showing a 404.
  const prop = await Property.findOne({ slug }, { _id: 0 }).lean()
    || await Property.findOne({ oldSlug: slug }, { _id: 0 }).lean();
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  const [area, city, society] = await Promise.all([
    Area.findOne({ id: prop.areaId }, { _id: 0 }).lean(),
    City.findOne({ id: prop.cityId }, { _id: 0 }).lean(),
    prop.societyId ? Society.findOne({ id: prop.societyId }, { _id: 0 }).lean() : null,
  ]);
  prop.areaName = area ? area.name : '';
  prop.cityName = city ? city.name : '';
  prop.societyName = society ? society.name : '';
  prop.area = area;
  prop.city = city;
  prop.society = society;
  res.json(publicProperty(prop));
};

// POST /api/v1/properties -- save-first-then-photos pattern (port of /api/post-property)
exports.createProperty = async (req, res) => {
  try {
    const body = req.body || {};
    const user = getCurrentUser(req);
    let contactPhone = body.contactPhone || '';
    let contactName = body.contactName || '';
    if (user) {
      contactPhone = contactPhone || user.phone;
      contactName = contactName || user.name;
    }

    const propertyId = generatePropertyId();

    const cityInput = body.city || body.cityId || '';
    const areaInput = body.area || body.areaId || '';

    let cityDoc = await City.findOne({ id: cityInput }, { _id: 0 }).lean();
    if (!cityDoc) cityDoc = await City.findOne({ slug: { $regex: `^${esc(cityInput)}$`, $options: 'i' } }, { _id: 0 }).lean();
    let areaDoc = await Area.findOne({ id: areaInput }, { _id: 0 }).lean();
    if (!areaDoc) areaDoc = await Area.findOne({ slug: { $regex: `^${esc(areaInput)}$`, $options: 'i' } }, { _id: 0 }).lean();

    const cityName = cityDoc ? cityDoc.name : cityInput;
    const citySlug = cityDoc ? cityDoc.slug : String(cityInput).toLowerCase().replace(/\s+/g, '-');
    const areaName = areaDoc ? areaDoc.name : areaInput;
    const areaSlug = areaDoc ? areaDoc.slug : String(areaInput).toLowerCase().replace(/\s+/g, '-');
    const cityId = cityDoc ? cityDoc.id : cityInput;
    const areaId = areaDoc ? areaDoc.id : areaInput;

    const propertyType = body.propertyType || 'flat';
    const transactionType = body.transactionType || 'buy';
    const bhk = body.bhk ? parseInt(body.bhk, 10) : null;
    const sqft = parseInt(body.sqft, 10) || 0;
    const premiseName = body.premiseName || '';
    const furnishing = body.furnishing || 'unfurnished';
    const floorNumber = body.floorNumber ? parseInt(body.floorNumber, 10) : null;
    const totalFloors = body.totalFloors ? parseInt(body.totalFloors, 10) : null;
    const ageOfProperty = body.ageOfProperty ? parseInt(body.ageOfProperty, 10) : null;
    const additionalDetails = body.additionalDetails || '';

    const slug = generatePropertySlug({
      propertyType, bhk, areaSlug, citySlug, propertyId, transactionType, societyName: premiseName,
    });

    const transText = transactionType === 'buy' ? 'sale' : 'rent';
    let aiDesc = bhk
      ? `${bhk} BHK ${propertyType} for ${transText} in ${premiseName}, ${areaName}, ${cityName}. This ${sqft} sqft ${furnishing.replace(/-/g, ' ')} property`
      : `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} for ${transText} in ${premiseName}, ${areaName}, ${cityName}. This ${sqft} sqft ${furnishing.replace(/-/g, ' ')} property`;
    aiDesc += floorNumber ? ` is on floor ${floorNumber} of ${totalFloors}.` : '.';
    if (ageOfProperty) aiDesc += ` Age of property: ${ageOfProperty} years.`;
    if (additionalDetails) aiDesc += ` ${additionalDetails}`;

    const nowIso = new Date().toISOString();

    // STEP 1: save WITHOUT photos first
    const listing = {
      id: uuidv4(),
      propertyId,
      category: body.category || 'residential',
      transactionType,
      propertyType,
      bhk,
      sqft,
      price: parseInt(body.price, 10) || 0,
      premiseName,
      societyId: null,
      areaId,
      cityId,
      nearby: body.nearby || '',
      description: body.description || '',
      ageOfProperty,
      furnishing,
      familyOrBachelors: body.familyOrBachelors || null,
      floorNumber,
      totalFloors,
      parking: body.parking === true || body.parking === 'true',
      additionalDetails,
      photos: [],
      contactName,
      contactPhone,
      listingType: body.listingType || 'owner',
      status: 'pending',
      source: 'owner',
      isApproved: false,
      slug,
      aiDescription: aiDesc,
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await OwnerListing.create(listing);

    // STEP 2: try to attach photos -- failure here must NOT lose the saved listing
    try {
      let photoUrls = [];
      if (body.photoUrls) {
        try {
          const urls = typeof body.photoUrls === 'string' ? JSON.parse(body.photoUrls) : body.photoUrls;
          if (Array.isArray(urls)) photoUrls = urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
        } catch (_) { /* ignore malformed photoUrls */ }
      }
      if (!photoUrls.length && req.files && req.files.length) {
        const { uploadImageToR2 } = require('../services/r2Storage');
        for (const file of req.files) {
          try {
            const result = await uploadImageToR2(file.buffer, file.originalname);
            if (result.success) photoUrls.push(result.url);
          } catch (pe) {
            console.error(`Photo upload error for ${file.originalname}:`, pe);
          }
        }
      }
      if (photoUrls.length) {
        await OwnerListing.updateOne({ propertyId }, { $set: { photos: photoUrls } });
      }
    } catch (photoErr) {
      console.error(`Photo processing failed for ${propertyId}:`, photoErr);
      // Listing is already saved -- do not fail the request.
    }

    return res.json({ success: true, propertyId });
  } catch (e) {
    console.error('Error submitting property:', e);
    res.status(500).json({ error: e.message });
  }
};

exports.updateProperty = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const { id } = req.params;
  const prop = await Property.findOne({ propertyId: id }, { _id: 0 }).lean()
    || await OwnerListing.findOne({ propertyId: id }, { _id: 0 }).lean();
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  if (prop.contactPhone !== user.phone) return res.status(403).json({ error: 'Not your listing' });

  const update = { ...req.body, updatedAt: new Date().toISOString() };
  delete update.propertyId;
  delete update.id;
  const result = await Property.updateOne({ propertyId: id }, { $set: update });
  if (result.matchedCount === 0) {
    await OwnerListing.updateOne({ propertyId: id }, { $set: update });
  }
  res.json({ success: true });
};

exports.deleteProperty = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const { id } = req.params;
  const prop = await Property.findOne({ propertyId: id }, { _id: 0 }).lean()
    || await OwnerListing.findOne({ propertyId: id }, { _id: 0 }).lean();
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  if (prop.contactPhone !== user.phone) return res.status(403).json({ error: 'Not your listing' });
  await Property.deleteOne({ propertyId: id });
  await OwnerListing.deleteOne({ propertyId: id });
  res.json({ success: true });
};

// ---------- Inquiries / Requirements ----------
// True when a lead's phone was proved (inquiries and requirements): an OTP token from /otp/verify (purpose 'inquiry') for
// this number, or the logged-in user's own number. Unverified inquiries are still accepted.
function inquiryPhoneVerified(req, token, phone) {
  const phone10 = normalizePhone(phone);
  if (!isValidPhone(phone10)) return false;
  if (token) {
    try {
      const claims = jwt.verify(String(token), process.env.SECRET_KEY);
      if (claims.purpose === 'inquiry' && claims.phone === phone10) return true;
    } catch {}
  }
  const user = getCurrentUser(req);
  return !!(user && normalizePhone(user.phone) === phone10);
}

exports.createInquiry = async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }
  const doc = {
    phoneVerified: inquiryPhoneVerified(req, body.verifyToken, phone),
    id: uuidv4(),
    propertyId: body.propertyId || '',
    name,
    phone,
    email: body.email || '',
    message: body.message || '',
    budget: body.budget || '',
    visitDate: body.visitDate || '',
    createdAt: new Date().toISOString(),
  };
  await Inquiry.create(doc);
  res.json({ success: true, message: 'Inquiry submitted successfully' });
};

// Exact port of POST /api/submit-requirement (server.py ~line 1818)
exports.createRequirement = async (req, res) => {
  const body = req.body || {};
  const Requirement = require('../models/Requirement');
  // Stored as a bare 10-digit number so /my-requirements can find it by the user's login phone.
  const rawPhone = String(body.phone || '').trim();
  const phone10 = normalizePhone(rawPhone);
  const doc = {
    id: uuidv4(),
    type: body.type || 'buy',
    budget_min: body.budget_min || 0,
    budget_max: body.budget_max || 0,
    city: body.city || '',
    area: body.area || '',
    bhk: body.bhk || '',
    property_type: body.property_type || '',
    name: body.name || '',
    phone: isValidPhone(phone10) ? phone10 : rawPhone,
    notes: body.notes || '',
    phoneVerified: inquiryPhoneVerified(req, body.verifyToken, rawPhone),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  await Requirement.create(doc);
  res.json({ success: true, message: 'Your requirement has been submitted. Our team will contact you soon.' });
};

// ---------- Search ----------
exports.search = async (req, res) => {
  req.query.search = req.query.q;
  return exports.listProperties(req, res);
};

// ---------- Stats ----------
// GET /api/v1/search-suggestions?q=&city= -- places for the header search box. The full society
// list is too big to send to the browser, so it is searched here instead.
const SUGGESTION_LIMIT = 6;
const JUNK_PLACE_RE = /^#?n\/?a$/i;

exports.searchSuggestions = async (req, res) => {
  const term = String(req.query.q || '').trim().slice(0, 60);
  if (term.length < 2) return res.json({ areas: [], societies: [] });

  const cityDoc = req.query.city ? await City.findOne({ slug: String(req.query.city) }, { _id: 0, id: 1 }).lean() : null;
  const match = { name: { $regex: esc(term), $options: 'i' }, ...(cityDoc && { cityId: cityDoc.id }) };
  const [areaDocs, societyDocs] = await Promise.all([
    Area.find({ ...match, isActive: { $ne: false } }, { _id: 0, name: 1, slug: 1, cityId: 1 }).sort({ name: 1 }).limit(30).lean(),
    Society.find({ ...match, isActive: true }, { _id: 0, name: 1, slug: 1, areaId: 1, cityId: 1, project_type: 1 }).sort({ name: 1 }).limit(30).lean(),
  ]);

  const [cities, societyAreas] = await Promise.all([
    City.find({ id: { $in: [...new Set([...areaDocs, ...societyDocs].map((d) => d.cityId))] } }, { _id: 0, id: 1, slug: 1, name: 1 }).lean(),
    Area.find({ id: { $in: [...new Set(societyDocs.map((s) => s.areaId))] } }, { _id: 0, id: 1, name: 1, slug: 1 }).lean(),
  ]);
  const citySlug = new Map(cities.map((c) => [c.id, c.slug]));
  const cityName = new Map(cities.map((c) => [c.id, c.name]));
  const areaById = new Map(societyAreas.map((a) => [a.id, a]));

  // Names that begin with the typed text are the likeliest match, so they go first.
  const lower = term.toLowerCase();
  const rank = (d) => (d.name.toLowerCase().startsWith(lower) ? 0 : 1);
  const bestFirst = (docs) => [...docs].sort((a, b) => rank(a) - rank(b));

  // The areas collection has duplicate rows sharing one slug, which all open the same page.
  const seen = new Set();
  const areas = bestFirst(areaDocs)
    .filter((a) => {
      const key = `${a.cityId}/${a.slug}`;
      if (seen.has(key) || JUNK_PLACE_RE.test(a.name) || !citySlug.has(a.cityId)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, SUGGESTION_LIMIT)
    .map((a) => ({ name: a.name, slug: a.slug, citySlug: citySlug.get(a.cityId), cityName: cityName.get(a.cityId) || '' }));

  const societies = bestFirst(societyDocs)
    .filter((s) => areaById.has(s.areaId) && citySlug.has(s.cityId))
    .slice(0, SUGGESTION_LIMIT)
    .map((s) => {
      const area = areaById.get(s.areaId);
      return {
        name: s.name,
        slug: s.slug,
        citySlug: citySlug.get(s.cityId),
        cityName: cityName.get(s.cityId) || '',
        areaSlug: area.slug,
        areaName: area.name,
        projectType: s.project_type || '',
      };
    });

  res.json({ areas, societies });
};

exports.cityStats = async (req, res) => {
  const city = await City.findOne({ slug: req.params.citySlug }, { _id: 0 }).lean();
  if (!city) return res.status(404).json({ error: 'City not found' });
  const [total, forSale, forRent, areaCount, societyCount] = await Promise.all([
    Property.countDocuments({ cityId: city.id, status: 'active', isApproved: true }),
    Property.countDocuments({ cityId: city.id, status: 'active', isApproved: true, transactionType: 'buy' }),
    Property.countDocuments({ cityId: city.id, status: 'active', isApproved: true, transactionType: 'rent' }),
    Area.countDocuments({ cityId: city.id, isActive: true }),
    Society.countDocuments({ cityId: city.id, isActive: true }),
  ]);
  res.json({ city, total, forSale, forRent, areaCount, societyCount });
};

// ---------- Blog (public) ----------
// List views never render the body, and a body with pasted (base64) images can be several MB,
// so drop `content` inside MongoDB and send a precomputed read time instead.
function blogSummaryPipeline(q, { skip = 0, limit }) {
  return [
    { $match: q },
    { $sort: { publishedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $addFields: {
        readTime: {
          $max: [1, { $round: [{ $divide: [{ $size: { $split: [{ $ifNull: ['$content', ''] }, ' '] } }, 200] }, 0] }],
        },
      },
    },
    { $project: { _id: 0, content: 0 } },
  ];
}

exports.listBlogPosts = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 10;
  const q = { status: 'published' };
  const [total, posts] = await Promise.all([
    BlogPost.countDocuments(q),
    BlogPost.aggregate(blogSummaryPipeline(q, { skip: (page - 1) * limit, limit })),
  ]);
  res.json({ posts, total, page, pages: Math.ceil(total / limit) });
};

exports.getBlogPostBySlug = async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }, { _id: 0 }).lean();
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await BlogPost.updateOne({ slug: req.params.slug }, { $inc: { views: 1 } });
  res.json(post);
};

exports.latestBlogPosts = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 3;
  const posts = await BlogPost.aggregate(blogSummaryPipeline({ status: 'published' }, { limit }));
  res.json(posts);
};

exports.popularSocieties = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const societies = await Society.find({ isActive: true, is_featured: true }, { _id: 0 }).limit(limit).lean();
  res.json(societies);
};

// Areas ranked by number of active, approved listings ("Top Areas" on the homepage).
exports.topAreas = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  const match = { status: 'active', isApproved: true };
  if (req.query.cityId) {
    match.cityId = req.query.cityId;
  } else if (req.query.city) {
    const cityDoc = await City.findOne({ slug: String(req.query.city) }, { _id: 0, id: 1 }).lean();
    if (!cityDoc) return res.json([]);
    match.cityId = cityDoc.id;
  }

  const counts = await Property.aggregate([
    { $match: match },
    { $group: { _id: '$areaId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    // Headroom for areas that turn out to be inactive or deleted.
    { $limit: limit * 2 },
  ]);

  const areas = await Area.find(
    { id: { $in: counts.map((c) => c._id) }, isActive: { $ne: false } },
    { _id: 0, id: 1, name: 1, slug: 1, cityId: 1 }
  ).lean();
  const cities = await City.find({ id: { $in: [...new Set(areas.map((a) => a.cityId))] } }, { _id: 0, id: 1, name: 1, slug: 1 }).lean();

  const areaById = new Map(areas.map((a) => [a.id, a]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const result = counts
    .filter((c) => areaById.has(c._id))
    .slice(0, limit)
    .map((c) => {
      const area = areaById.get(c._id);
      const city = cityById.get(area.cityId);
      return { ...area, propertyCount: c.count, cityName: city?.name || '', citySlug: city?.slug || '' };
    });

  res.json(result);
};

// Societies ranked by number of active, approved listings ("Top Societies" on the homepage).
// Returns slim society docs plus propertyCount and the area/city names + slugs needed to link them.
exports.topSocieties = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 24);
  const match = { status: 'active', isApproved: true, societyId: { $nin: [null, ''] } };
  if (req.query.cityId) match.cityId = req.query.cityId;

  const counts = await Property.aggregate([
    { $match: match },
    { $group: { _id: '$societyId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    // Headroom for societies that turn out to be inactive or deleted.
    { $limit: limit * 2 },
  ]);

  const societies = await Society.find(
    { id: { $in: counts.map((c) => c._id) }, isActive: true },
    { _id: 0, id: 1, name: 1, slug: 1, areaId: 1, cityId: 1, project_type: 1 }
  ).lean();
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: [...new Set(societies.map((s) => s.areaId))] } }, { _id: 0, id: 1, name: 1, slug: 1 }).lean(),
    City.find({ id: { $in: [...new Set(societies.map((s) => s.cityId))] } }, { _id: 0, id: 1, name: 1, slug: 1 }).lean(),
  ]);

  const societyById = new Map(societies.map((s) => [s.id, s]));
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const result = counts
    .filter((c) => societyById.has(c._id))
    .slice(0, limit)
    .map((c) => {
      const s = societyById.get(c._id);
      const area = areaById.get(s.areaId);
      const city = cityById.get(s.cityId);
      return {
        ...s,
        propertyCount: c.count,
        areaName: area?.name || '',
        areaSlug: area?.slug || '',
        cityName: city?.name || '',
        citySlug: city?.slug || '',
      };
    });

  res.json(result);
};
