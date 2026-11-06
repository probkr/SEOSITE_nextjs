const { v4: uuidv4 } = require('uuid');
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

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function maskContactName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].length <= 2 ? parts[0] : `${parts[0][0]}***`;
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
  const { contactPhone, ...rest } = prop;
  return {
    ...rest,
    contactName: maskContactName(prop.contactName),
    description: cleanupDescription(prop.description),
    hasContact: hasContact(prop),
  };
}

// ---------- Site settings (public, safe subset) ----------
exports.getSiteSettings = async (req, res) => {
  const s = (await Setting.findOne({ key: 'site' }, { _id: 0 }).lean()) || {};
  res.json({
    site_name: s.site_name || 'PRObroker',
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
      query.createdAt = { $gte: cutoff };
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
      { additionalDetails: searchRegex },
      { aiDescription: searchRegex },
    ];
    if (matchingAreas.length) orConditions.push({ areaId: { $in: matchingAreas.map((a) => a.id) } });
    if (matchingSocieties.length) orConditions.push({ societyId: { $in: matchingSocieties.map((s) => s.id) } });
    query.$or = orConditions;
  }

  if (and.length) query.$and = and;

  let sortField = 'createdAt';
  let sortDir = -1;
  if (_sort === 'price_asc') { sortField = 'price'; sortDir = 1; }
  else if (_sort === 'price_desc') { sortField = 'price'; sortDir = -1; }

  const skip = (page - 1) * limit;
  const [total, properties, priceStats] = await Promise.all([
    Property.countDocuments(query),
    Property.find(query, { _id: 0 }).sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
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
  const properties = await Property.find({ status: 'active', isApproved: true }, { _id: 0 })
    .sort({ createdAt: -1 }).limit(limit).lean();
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
  res.json(properties.map(publicProperty));
};

exports.similarProperties = async (req, res) => {
  const { propertyId, limit } = req.query;
  const lim = parseInt(limit, 10) || 4;
  if (!propertyId) return res.json([]);
  const base = await Property.findOne({ propertyId }, { _id: 0 }).lean();
  if (!base) return res.json([]);
  const properties = await Property.find({
    propertyId: { $ne: propertyId },
    status: 'active',
    isApproved: true,
    category: base.category,
    transactionType: base.transactionType,
    $or: [{ areaId: base.areaId }, { cityId: base.cityId }],
  }, { _id: 0 }).sort({ createdAt: -1 }).limit(lim).lean();
  res.json(properties.map(publicProperty));
};

exports.getPropertyBySlug = async (req, res) => {
  const slug = req.params.slug.replace(/\/$/, '');
  const prop = await Property.findOne({ slug }, { _id: 0 }).lean();
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
exports.createInquiry = async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }
  const doc = {
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
  if (req.query.cityId) match.cityId = req.query.cityId;

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
