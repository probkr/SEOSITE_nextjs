const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const { parse: csvParse } = require('csv-parse/sync');

const City = require('../models/City');
const Area = require('../models/Area');
const Society = require('../models/Society');
const Property = require('../models/Property');
const OwnerListing = require('../models/OwnerListing');
const Inquiry = require('../models/Inquiry');
const Redirect = require('../models/Redirect');
const BlogPost = require('../models/BlogPost');
const Page = require('../models/Page');
const Setting = require('../models/Setting');
const ImportJob = require('../models/ImportJob');

const { generateSlug, generatePropertySlug, generatePropertyId } = require('../services/slugify');
const { uploadImageToR2, uploadRawToR2 } = require('../services/r2Storage');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nowIso = () => new Date().toISOString();

// ==================== DASHBOARD ====================
exports.dashboard = async (req, res) => {
  const [totalActive, totalPending, totalCities, totalAreas, totalSocieties, totalInquiries, pendingOwnerListings] = await Promise.all([
    Property.countDocuments({ status: 'active' }),
    Property.countDocuments({ status: 'pending' }),
    City.countDocuments({}),
    Area.countDocuments({}),
    Society.countDocuments({}),
    Inquiry.countDocuments({}),
    OwnerListing.countDocuments({ isApproved: false }),
  ]);
  res.json({ totalActive, totalPending, totalCities, totalAreas, totalSocieties, totalInquiries, pendingOwnerListings });
};

// ==================== LISTINGS (properties) ====================
exports.listListings = async (req, res) => {
  const { page: pageParam = 1, city = '', status = '', q = '', date_from = '', date_to = '' } = req.query;
  const page = parseInt(pageParam, 10) || 1;
  const filters = {};
  if (city) {
    const cityDoc = await City.findOne({ slug: city }, { _id: 0 }).lean();
    if (cityDoc) filters.cityId = cityDoc.id;
  }
  if (status) filters.status = status;
  if (q) {
    filters.$or = [
      { title: { $regex: esc(q), $options: 'i' } },
      { premiseName: { $regex: esc(q), $options: 'i' } },
      { propertyId: { $regex: esc(q), $options: 'i' } },
    ];
  }
  if (date_from || date_to) {
    const dateFilter = {};
    if (date_from) dateFilter.$gte = `${date_from}T00:00:00`;
    if (date_to) dateFilter.$lte = `${date_to}T23:59:59`;
    filters.createdAt = dateFilter;
  }

  const perPage = 20;
  const skip = (page - 1) * perPage;
  const [total, listings] = await Promise.all([
    Property.countDocuments(filters),
    Property.find(filters, { _id: 0 }).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
  ]);

  const areaIds = [...new Set(listings.map((l) => l.areaId).filter(Boolean))];
  const cityIds = [...new Set(listings.map((l) => l.cityId).filter(Boolean))];
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean(),
    City.find({ id: { $in: cityIds } }, { _id: 0 }).lean(),
  ]);
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a]));
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  for (const l of listings) {
    l.areaName = areaMap[l.areaId]?.name || '';
    l.cityName = cityMap[l.cityId]?.name || '';
    l.areaSlug = areaMap[l.areaId]?.slug || '';
    l.citySlug = cityMap[l.cityId]?.slug || '';
  }

  res.json({ listings, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.updateListingStatus = async (req, res) => {
  const { propertyId } = req.params;
  const { status } = req.body;
  await Property.updateOne({ propertyId }, { $set: { status, updatedAt: nowIso() } });
  res.json({ success: true });
};

exports.deleteListing = async (req, res) => {
  await Property.deleteOne({ propertyId: req.params.propertyId });
  res.json({ success: true });
};

exports.getListingForEdit = async (req, res) => {
  const prop = await Property.findOne({ propertyId: req.params.propertyId }, { _id: 0 }).lean();
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  const [area, city, cities, areas, societies] = await Promise.all([
    Area.findOne({ id: prop.areaId }, { _id: 0 }).lean(),
    City.findOne({ id: prop.cityId }, { _id: 0 }).lean(),
    City.find({ isActive: true }, { _id: 0 }).sort({ name: 1 }).lean(),
    Area.find({ isActive: true }, { _id: 0 }).lean(),
    Society.find({ isActive: true }, { _id: 0 }).lean(),
  ]);
  prop.areaName = area ? area.name : '';
  prop.cityName = city ? city.name : '';
  prop.areaSlug = area ? area.slug : '';
  prop.citySlug = city ? city.slug : '';
  res.json({ property: prop, cities, areas, societies });
};

function buildPropertyTitle(prop) {
  const bhkPart = prop.bhk && prop.bhk > 0 ? `${prop.bhk} BHK ` : '';
  const trans = prop.transactionType === 'buy' ? 'for Sale' : 'for Rent';
  const typeTitle = String(prop.propertyType || '').replace(/-/g, ' ');
  return `${bhkPart}${typeTitle} ${trans} in ${prop.premiseName || prop.areaName || ''}, ${prop.areaName || ''}, ${prop.cityName || ''}`.replace(/\s+/g, ' ').trim();
}

function buildPropertySlug(prop) {
  return generatePropertySlug({
    propertyType: prop.propertyType,
    bhk: prop.bhk,
    areaSlug: prop.areaSlug,
    citySlug: prop.citySlug,
    propertyId: prop.propertyId,
    transactionType: prop.transactionType,
    societyName: prop.premiseName,
  });
}

exports.saveListingEdit = async (req, res) => {
  const { propertyId } = req.params;
  const form = req.body || {};
  const update = {};

  if (form.cityId) update.cityId = form.cityId;
  if (form.areaId) update.areaId = form.areaId;
  if (form.societyId) {
    const soc = await Society.findOne({ id: form.societyId }, { _id: 0 }).lean();
    if (soc) { update.societyId = soc.id; update.premiseName = soc.name; }
  } else if (form.premiseName !== undefined) {
    update.premiseName = form.premiseName;
  }

  if (form.category) update.category = form.category;
  if (form.propertyType) update.propertyType = form.propertyType;
  if (form.transactionType) update.transactionType = form.transactionType;

  update.bhk = parseInt(form.bhk, 10) || 0;

  for (const field of ['price', 'sqft', 'floorNumber', 'totalFloors']) {
    if (form[field] !== undefined && form[field] !== '') {
      const val = parseFloat(form[field]);
      if (!Number.isNaN(val)) update[field] = val;
    }
  }

  for (const field of ['furnishing', 'description', 'contactName', 'contactPhone']) {
    if (form[field] !== undefined) update[field] = form[field];
  }

  if (form.status) update.status = form.status;
  if (form.isApproved !== undefined) update.isApproved = form.isApproved === 'true' || form.isApproved === true;

  if (form.custom_schema && form.custom_schema.trim()) {
    try {
      JSON.parse(form.custom_schema);
      update.custom_schema = form.custom_schema;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in schema markup' });
    }
  } else {
    update.custom_schema = '';
  }

  if (form.images_json) {
    try {
      const images = JSON.parse(form.images_json);
      const areaDoc = update.areaId ? await Area.findOne({ id: update.areaId }, { _id: 0 }).lean() : null;
      const cityDoc = update.cityId ? await City.findOne({ id: update.cityId }, { _id: 0 }).lean() : null;
      let ad = areaDoc, cd = cityDoc;
      if (!ad || !cd) {
        const prop = await Property.findOne({ propertyId }, { _id: 0 }).lean();
        if (prop) {
          ad = ad || await Area.findOne({ id: prop.areaId }, { _id: 0 }).lean();
          cd = cd || await City.findOne({ id: prop.cityId }, { _id: 0 }).lean();
        }
      }
      const autoAlt = buildPropertyTitle({ ...update, areaName: ad ? ad.name : '', cityName: cd ? cd.name : '' });
      images.forEach((img, i) => {
        if (!img.alt_text || !img.alt_text.trim()) {
          img.alt_text = autoAlt + (i > 0 ? ` - image ${i + 1}` : '');
        }
        img.order_index = i;
      });
      if (images.length && !images.some((im) => im.is_primary)) images[0].is_primary = true;
      update.images = images;
      update.photos = [...images].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((im) => im.url);
    } catch (e) {
      console.error('Error parsing images JSON:', e);
    }
  }

  const existing = await Property.findOne({ propertyId }, { _id: 0 }).lean() || {};
  const propForSlug = { ...existing, ...update, propertyId };
  const area = await Area.findOne({ id: propForSlug.areaId }, { _id: 0 }).lean();
  const city = await City.findOne({ id: propForSlug.cityId }, { _id: 0 }).lean();
  propForSlug.areaName = area ? area.name : '';
  propForSlug.cityName = city ? city.name : '';
  propForSlug.areaSlug = area ? area.slug : '';
  propForSlug.citySlug = city ? city.slug : '';

  const newSlug = buildPropertySlug(propForSlug);
  const newTitle = buildPropertyTitle(propForSlug);
  const oldSlug = existing.slug || '';
  update.slug = newSlug;
  update.title = newTitle;
  if (oldSlug && oldSlug !== newSlug) update.oldSlug = oldSlug;
  update.updatedAt = nowIso();

  await Property.updateOne({ propertyId }, { $set: update });
  res.json({ success: true });
};

exports.uploadListingImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const result = await uploadImageToR2(req.file.buffer, req.file.originalname, 'properties');
  if (!result.success) return res.status(500).json({ error: result.error || 'Upload failed' });

  const prop = await Property.findOne({ propertyId: req.params.propertyId }, { _id: 0 }).lean();
  let altText = '';
  if (prop) {
    const area = await Area.findOne({ id: prop.areaId }, { _id: 0 }).lean();
    const city = await City.findOne({ id: prop.cityId }, { _id: 0 }).lean();
    altText = buildPropertyTitle({ ...prop, areaName: area ? area.name : '', cityName: city ? city.name : '' });
  }
  res.json({ success: true, url: result.url, alt_text: altText });
};

// ==================== OWNER LISTINGS (pending approval) ====================
exports.listOwnerListings = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
  const [total, listings] = await Promise.all([
    OwnerListing.countDocuments({ isApproved: false }),
    OwnerListing.find({ isApproved: false }, { _id: 0 }).sort({ submittedAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  const areaIds = [...new Set(listings.map((l) => l.areaId).filter(Boolean))];
  const cityIds = [...new Set(listings.map((l) => l.cityId).filter(Boolean))];
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean(),
    City.find({ id: { $in: cityIds } }, { _id: 0 }).lean(),
  ]);
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a]));
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  for (const l of listings) {
    l.areaName = areaMap[l.areaId]?.name || '';
    l.cityName = cityMap[l.cityId]?.name || '';
  }
  res.json({ listings, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.approveOwnerListing = async (req, res) => {
  const listing = await OwnerListing.findOne({ id: req.params.listingId }, { _id: 0 }).lean();
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  listing.isApproved = true;
  listing.status = 'active';
  listing.updatedAt = nowIso();
  await Property.create(listing);
  await OwnerListing.deleteOne({ id: req.params.listingId });
  res.json({ success: true });
};

exports.rejectOwnerListing = async (req, res) => {
  await OwnerListing.deleteOne({ id: req.params.listingId });
  res.json({ success: true });
};

// ==================== AREAS ====================
exports.listAreasAdmin = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const q = req.query.q || '';
  const perPage = 20;
  const query = {};
  if (q) query.name = { $regex: esc(q), $options: 'i' };
  const [total, areas] = await Promise.all([
    Area.countDocuments(query),
    Area.find(query, { _id: 0 }).sort({ name: 1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  const cityIds = [...new Set(areas.map((a) => a.cityId).filter(Boolean))];
  const cities = await City.find({ id: { $in: cityIds } }, { _id: 0 }).lean();
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  const areaIds = areas.map((a) => a.id);
  const counts = await Property.aggregate([
    { $match: { areaId: { $in: areaIds } } },
    { $group: { _id: '$areaId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  for (const a of areas) {
    a.cityName = cityMap[a.cityId]?.name || '';
    a.propertyCount = countMap[a.id] || 0;
  }
  res.json({ areas, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.addArea = async (req, res) => {
  const { name, cityId, description = '', metaTitle = '', metaDescription = '' } = req.body;
  const trimmed = (name || '').trim();
  if (!trimmed) return res.status(400).json({ error: 'Area name is required' });
  const existing = await Area.findOne({ name: { $regex: `^${esc(trimmed)}$`, $options: 'i' } }).lean();
  if (existing) return res.status(400).json({ error: `Area '${trimmed}' already exists` });
  const slug = generateSlug(trimmed);
  const area = {
    id: uuidv4(), name: trimmed, slug, cityId, isActive: true, description,
    metaTitle: metaTitle || `Properties in ${trimmed} | PRObroker`,
    metaDescription: metaDescription || `Find properties for sale and rent in ${trimmed}.`,
    createdAt: nowIso(),
  };
  await Area.create(area);
  res.json({ success: true, area });
};

exports.getAreaForEdit = async (req, res) => {
  const area = await Area.findOne({ id: req.params.areaId }, { _id: 0 }).lean();
  if (!area) return res.status(404).json({ error: 'Area not found' });
  const [city, cities] = await Promise.all([
    City.findOne({ id: area.cityId }, { _id: 0 }).lean(),
    City.find({ isActive: true }, { _id: 0 }).sort({ name: 1 }).lean(),
  ]);
  res.json({ area, city, cities });
};

exports.saveAreaEdit = async (req, res) => {
  const { areaId } = req.params;
  const form = req.body || {};
  const faqs = [];
  let i = 0;
  while (form[`faq_q_${i}`] !== undefined) {
    const q = (form[`faq_q_${i}`] || '').trim();
    const a = (form[`faq_a_${i}`] || '').trim();
    if (q && a) faqs.push({ question: q, answer: a });
    i += 1;
  }
  const update = {
    name: form.name || '',
    description: form.description || '',
    overview: form.overview || '',
    priceOverview: form.priceOverview || '',
    infrastructure: form.infrastructure || '',
    connectivity: form.connectivity || '',
    lifestyle: form.lifestyle || '',
    metaTitle: form.metaTitle || '',
    metaDescription: form.metaDescription || '',
    faqs: form.faqs || faqs,
    updatedAt: nowIso(),
  };
  await Area.updateOne({ id: areaId }, { $set: update });
  res.json({ success: true });
};

exports.deleteArea = async (req, res) => {
  const { areaId } = req.params;
  const socCount = await Society.countDocuments({ areaId });
  if (socCount > 0) {
    return res.status(400).json({ success: false, error: `Cannot delete: area has ${socCount} societies. Remove or reassign them first.` });
  }
  const propCount = await Property.countDocuments({ areaId });
  if (propCount > 0) {
    await Area.updateOne({ id: areaId }, { $set: { isActive: false } });
    return res.json({ success: true, message: `Area has ${propCount} properties. Marked as inactive instead of deleting.` });
  }
  await Area.deleteOne({ id: areaId });
  res.json({ success: true, message: 'Area deleted successfully.' });
};

exports.toggleAreaFeatured = async (req, res) => {
  const area = await Area.findOne({ id: req.params.areaId }, { _id: 0, is_featured: 1 }).lean();
  const newVal = area ? !area.is_featured : true;
  await Area.updateOne({ id: req.params.areaId }, { $set: { is_featured: newVal } });
  res.json({ success: true, is_featured: newVal });
};

// ==================== SOCIETIES ====================
function parsePriceRange(text) {
  if (!text) return [null, null];
  const nums = String(text).match(/[\d.]+/g);
  if (!nums) return [null, null];
  const parsed = nums.map(Number);
  if (parsed.length === 1) return [parsed[0], parsed[0]];
  return [Math.min(...parsed), Math.max(...parsed)];
}

exports.listSocietiesAdmin = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const q = req.query.q || '';
  const perPage = 20;
  const query = {};
  if (q) query.name = { $regex: esc(q), $options: 'i' };
  const [total, societies] = await Promise.all([
    Society.countDocuments(query),
    Society.find(query, { _id: 0 }).sort({ name: 1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  const areaIds = [...new Set(societies.map((s) => s.areaId).filter(Boolean))];
  const cityIds = [...new Set(societies.map((s) => s.cityId).filter(Boolean))];
  const [areas, cities] = await Promise.all([
    Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean(),
    City.find({ id: { $in: cityIds } }, { _id: 0 }).lean(),
  ]);
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a]));
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  const socIds = societies.map((s) => s.id);
  const counts = await Property.aggregate([
    { $match: { societyId: { $in: socIds } } },
    { $group: { _id: '$societyId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  for (const s of societies) {
    s.areaName = areaMap[s.areaId]?.name || '';
    s.cityName = cityMap[s.cityId]?.name || '';
    s.citySlug = cityMap[s.cityId]?.slug || 'ahmedabad';
    s.areaSlug = areaMap[s.areaId]?.slug || 'unknown';
    s.propertyCount = countMap[s.id] || 0;
  }
  res.json({ societies, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.addSociety = async (req, res) => {
  const { name, areaId, project_type = 'residential', description = '', totalUnits, amenities = '', metaTitle = '', metaDescription = '' } = req.body;
  const trimmed = (name || '').trim();
  if (!trimmed) return res.status(400).json({ error: 'Society name is required' });
  const existing = await Society.findOne({ name: { $regex: `^${esc(trimmed)}$`, $options: 'i' } }).lean();
  if (existing) return res.status(400).json({ error: `Society '${trimmed}' already exists` });
  const areaDoc = await Area.findOne({ id: areaId }, { _id: 0 }).lean();
  if (!areaDoc) return res.status(400).json({ error: 'Invalid area selected' });
  const cityDoc = await City.findOne({ id: areaDoc.cityId }, { _id: 0 }).lean();
  const citySlugVal = cityDoc ? cityDoc.slug : 'ahmedabad';
  const slug = `${generateSlug(trimmed)}-${citySlugVal}`;
  const amenitiesList = String(amenities).split(',').map((a) => a.trim()).filter(Boolean);
  const soc = {
    id: uuidv4(), name: trimmed, slug, areaId, cityId: areaDoc.cityId, project_type, description,
    totalUnits: totalUnits ? parseInt(totalUnits, 10) : null, amenities: amenitiesList, isActive: true,
    metaTitle: metaTitle || `${trimmed} - Properties | PRObroker`,
    metaDescription: metaDescription || `Find properties in ${trimmed}.`,
    createdAt: nowIso(),
  };
  await Society.create(soc);
  res.json({ success: true, society: soc });
};

exports.getSocietyForEdit = async (req, res) => {
  const society = await Society.findOne({ id: req.params.societyId }, { _id: 0 }).lean();
  if (!society) return res.status(404).json({ error: 'Society not found' });
  const [area, city, areasList, allCities] = await Promise.all([
    Area.findOne({ id: society.areaId }, { _id: 0 }).lean(),
    City.findOne({ id: society.cityId }, { _id: 0 }).lean(),
    Area.find({ isActive: true }, { _id: 0 }).lean(),
    City.find({}, { _id: 0 }).lean(),
  ]);
  const citiesMap = Object.fromEntries(allCities.map((c) => [c.id, c.name]));
  for (const a of areasList) a.cityName = citiesMap[a.cityId] || '';
  res.json({ society, area, city, areas: areasList });
};

exports.saveSocietyEdit = async (req, res) => {
  const { societyId } = req.params;
  const form = req.body || {};
  const amenities = String(form.amenities || '').split(',').map((a) => a.trim()).filter(Boolean);
  const faqs = [];
  let i = 0;
  while (form[`faq_q_${i}`] !== undefined) {
    const q = (form[`faq_q_${i}`] || '').trim();
    const a = (form[`faq_a_${i}`] || '').trim();
    if (q && a) faqs.push({ question: q, answer: a });
    i += 1;
  }

  const existingSoc = await Society.findOne({ id: societyId }, { _id: 0 }).lean();
  const existingImages = (existingSoc && existingSoc.images) || [];
  let keptImages = existingImages.filter((_, idx) => form[`keep_image_${idx}`] === '1');
  // req.files.new_images populated by multer.fields()
  if (req.files && req.files.new_images) {
    for (const file of req.files.new_images) {
      const result = await uploadImageToR2(file.buffer, file.originalname, 'societies');
      if (result.success) keptImages.push(result.url);
    }
  }
  if (Array.isArray(form.images)) keptImages = form.images; // JSON API clients may just send final array

  let brochureUrl = (existingSoc && existingSoc.brochureUrl) || '';
  if (form.remove_brochure === '1') brochureUrl = '';
  if (req.files && req.files.brochure_file && req.files.brochure_file[0]) {
    const bf = req.files.brochure_file[0];
    try {
      brochureUrl = await uploadRawToR2(bf.buffer, `brochures/${uuidv4()}.pdf`, 'application/pdf');
    } catch (e) {
      console.error('Brochure upload error:', e);
    }
  }

  const priceRangeText = form.priceRange || '';
  const [parsedMin, parsedMax] = parsePriceRange(priceRangeText);

  const newAreaId = form.areaId || '';
  const newArea = newAreaId ? await Area.findOne({ id: newAreaId }, { _id: 0 }).lean() : null;
  const newCityId = newArea ? newArea.cityId : (existingSoc ? existingSoc.cityId : '');

  const update = {
    name: form.name || '',
    slug: (form.slug || '').trim().toLowerCase().replace(/\s+/g, '-') || generateSlug(form.name || ''),
    project_type: form.project_type || 'residential',
    description: form.description || '',
    overview: form.overview || '',
    builderName: form.builderName || '',
    reraNumber: form.reraNumber || '',
    totalUnits: parseInt(form.totalUnits, 10) || null,
    amenities,
    configuration: form.configuration || '',
    priceRange: priceRangeText,
    min_price: parsedMin,
    max_price: parsedMax,
    possessionDate: form.possessionDate || '',
    metaTitle: form.metaTitle || '',
    metaDescription: form.metaDescription || '',
    location_advantages: form.location_advantages || '',
    facilities_description: form.facilities_description || '',
    faqs: form.faqs || faqs,
    images: keptImages,
    brochureUrl,
    is_featured: form.is_featured === '1' || form.is_featured === true,
    areaId: newAreaId || (existingSoc ? existingSoc.areaId : ''),
    cityId: newCityId,
    updatedAt: nowIso(),
  };

  const customSchema = (form.custom_schema || '').trim();
  if (customSchema) {
    try {
      JSON.parse(customSchema);
      update.custom_schema = customSchema;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in schema markup' });
    }
  } else {
    update.custom_schema = '';
  }

  await Society.updateOne({ id: societyId }, { $set: update });
  res.json({ success: true });
};

exports.deleteSociety = async (req, res) => {
  const { societyId } = req.params;
  const propCount = await Property.countDocuments({ societyId });
  if (propCount > 0) {
    await Society.updateOne({ id: societyId }, { $set: { isActive: false } });
    return res.json({ success: true, message: `Society has ${propCount} properties. Marked as inactive instead of deleting.` });
  }
  await Society.deleteOne({ id: societyId });
  res.json({ success: true, message: 'Society deleted successfully.' });
};

exports.toggleSocietyFeatured = async (req, res) => {
  const soc = await Society.findOne({ id: req.params.societyId }, { _id: 0, is_featured: 1 }).lean();
  const newVal = soc ? !soc.is_featured : true;
  await Society.updateOne({ id: req.params.societyId }, { $set: { is_featured: newVal } });
  res.json({ success: true, is_featured: newVal });
};

// ==================== CITIES ====================
exports.listCitiesAdmin = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const q = req.query.q || '';
  const perPage = 20;
  const query = {};
  if (q) query.name = { $regex: esc(q), $options: 'i' };
  const [total, cities] = await Promise.all([
    City.countDocuments(query),
    City.find(query, { _id: 0 }).sort({ name: 1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  const cityIds = cities.map((c) => c.id);
  const [propCounts, areaCounts] = await Promise.all([
    Property.aggregate([{ $match: { cityId: { $in: cityIds } } }, { $group: { _id: '$cityId', count: { $sum: 1 } } }]),
    Area.aggregate([{ $match: { cityId: { $in: cityIds } } }, { $group: { _id: '$cityId', count: { $sum: 1 } } }]),
  ]);
  const propMap = Object.fromEntries(propCounts.map((c) => [c._id, c.count]));
  const areaMap = Object.fromEntries(areaCounts.map((c) => [c._id, c.count]));
  for (const c of cities) {
    c.propertyCount = propMap[c.id] || 0;
    c.areaCount = areaMap[c.id] || 0;
  }
  res.json({ cities, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.addCity = async (req, res) => {
  const { name, state } = req.body;
  const trimmed = (name || '').trim();
  if (!trimmed) return res.status(400).json({ error: 'City name is required' });
  const existing = await City.findOne({ name: { $regex: `^${esc(trimmed)}$`, $options: 'i' } }).lean();
  if (existing) return res.status(400).json({ error: `City '${trimmed}' already exists` });
  const slug = generateSlug(trimmed);
  const city = { id: uuidv4(), name: trimmed, slug, state: (state || '').trim(), isActive: true, createdAt: nowIso() };
  await City.create(city);
  res.json({ success: true, city });
};

// ==================== INQUIRIES ====================
exports.listInquiries = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 30;
  const [total, inquiries] = await Promise.all([
    Inquiry.countDocuments({}),
    Inquiry.find({}, { _id: 0 }).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  res.json({ inquiries, total, page, totalPages: Math.ceil(total / perPage) || 1 });
};

exports.exportInquiries = async (req, res) => {
  const inquiries = await Inquiry.find({}, { _id: 0 }).sort({ createdAt: -1 }).lean();
  const headers = ['Property ID', 'Name', 'Phone', 'Email', 'Message', 'Budget', 'Visit Date', 'Created At'];
  const rows = inquiries.map((i) => [i.propertyId, i.name, i.phone, i.email, i.message, i.budget, i.visitDate, i.createdAt]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=inquiries.csv');
  res.write(`${headers.join(',')}\n`);
  for (const row of rows) {
    res.write(`${row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')}\n`);
  }
  res.end();
};

// ==================== BULK IMPORT ====================
async function processBulkImport(body, startIdx = 0) {
  let imported = 0, updated = 0, skipped = 0, errors = 0, areasCreated = 0, societiesCreated = 0;
  const errorDetails = [];
  const sampleResults = [];

  for (let idx = 0; idx < body.length; idx++) {
    const item = body[idx];
    try {
      if (item.status === 'inactive') { skipped++; continue; }
      const price = Number(item.price) || 0;
      if (!price) { skipped++; continue; }

      const cityName = item.city || item.cityName || 'Ahmedabad';
      let cityDoc = await City.findOne({ name: { $regex: `^${esc(cityName)}$`, $options: 'i' } }, { _id: 0 }).lean();
      if (!cityDoc) cityDoc = await City.findOne({ isActive: true }, { _id: 0 }).lean();
      if (!cityDoc) { skipped++; continue; }
      const resolvedCityId = cityDoc.id;
      const resolvedCitySlug = cityDoc.slug;

      const areaName = item.area || item.areaName || '';
      let areaDoc = null;
      if (areaName) {
        areaDoc = await Area.findOne({ name: { $regex: `^${esc(areaName)}$`, $options: 'i' }, cityId: resolvedCityId }, { _id: 0 }).lean();
        if (!areaDoc) {
          const newAreaSlug = generateSlug(areaName);
          const titled = areaName.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
          const newArea = {
            id: uuidv4(), name: titled, slug: newAreaSlug, cityId: resolvedCityId, isActive: true, description: '',
            metaTitle: `Properties in ${titled} | PRObroker`, metaDescription: `Find properties for sale and rent in ${titled}.`,
            createdAt: nowIso(),
          };
          await Area.create(newArea);
          areaDoc = newArea;
          areasCreated++;
        }
      }
      const resolvedAreaId = areaDoc ? areaDoc.id : '';
      const resolvedAreaSlug = areaDoc ? areaDoc.slug : 'unknown';

      const premiseName = item.premiseName || '';
      let societyDoc = null;
      if (premiseName && areaDoc) {
        societyDoc = await Society.findOne({ name: { $regex: `^${esc(premiseName)}$`, $options: 'i' }, areaId: resolvedAreaId }, { _id: 0 }).lean();
        if (!societyDoc) {
          const newSoc = {
            id: uuidv4(), name: premiseName, slug: `${generateSlug(premiseName)}-${resolvedAreaSlug}-${resolvedCitySlug}`,
            areaId: resolvedAreaId, cityId: resolvedCityId, description: '', totalUnits: null, amenities: [], isActive: true,
            metaTitle: `${premiseName} - Properties | PRObroker`, metaDescription: `Find properties in ${premiseName}.`,
            createdAt: nowIso(),
          };
          await Society.create(newSoc);
          societyDoc = newSoc;
          societiesCreated++;
        }
      }
      const resolvedSocietyId = societyDoc ? societyDoc.id : null;
      const propertyId = item.propertyId || generatePropertyId();
      const existing = await Property.findOne({ propertyId }, { _id: 0 }).lean();

      const slug = item.slug || generatePropertySlug({
        propertyType: item.propertyType || 'flat', bhk: item.bhk, areaSlug: resolvedAreaSlug,
        citySlug: resolvedCitySlug, propertyId, transactionType: item.transactionType || 'buy', societyName: premiseName,
      });

      const doc = {
        id: uuidv4(), propertyId, category: item.category || 'residential',
        transactionType: item.transactionType || 'buy', propertyType: item.propertyType || 'flat',
        bhk: item.bhk || 0, sqft: item.sqft || 0, price, premiseName,
        societyId: resolvedSocietyId, areaId: resolvedAreaId, cityId: resolvedCityId,
        nearby: item.nearby || '', description: item.description || '', amenities: item.amenities || [],
        furnishing: item.furnishing || 'unfurnished', familyOrBachelors: item.familyOrBachelors || 'both',
        floorNumber: item.floorNumber || 0, totalFloors: item.totalFloors || 0, parking: !!item.parking,
        additionalDetails: item.additionalDetails || '', contactName: item.contactName || 'PRObroker',
        contactPhone: item.contactPhone || '0000000000', listingType: item.listingType || 'broker',
        photos: item.photos || [], status: item.status || 'active', source: 'probroker', isApproved: true,
        views: item.views || 0, slug, createdAt: item.createdAt || nowIso(), updatedAt: nowIso(),
      };

      if (existing) {
        const { id, ...rest } = doc;
        await Property.updateOne({ propertyId }, { $set: rest });
        updated++;
      } else {
        await Property.create(doc);
        imported++;
      }
      if (sampleResults.length < 5) sampleResults.push(doc);
    } catch (e) {
      errors++;
      errorDetails.push(`Row ${startIdx + idx}: ${e.message}`);
    }
  }

  return {
    imported, updated, skipped, errors, areas_created: areasCreated, societies_created: societiesCreated,
    total_processed: body.length, error_details: errorDetails.slice(0, 20), sample_results: sampleResults.slice(0, 5),
  };
}

async function processBulkImportBackground(body, jobId) {
  const BATCH_SIZE = 50;
  let imported = 0, updated = 0, skipped = 0, errors = 0, areasCreated = 0, societiesCreated = 0;
  const errorDetails = [];
  for (let i = 0; i < body.length; i += BATCH_SIZE) {
    const batch = body.slice(i, i + BATCH_SIZE);
    const result = await processBulkImport(batch, i);
    imported += result.imported; updated += result.updated; skipped += result.skipped; errors += result.errors;
    areasCreated += result.areas_created; societiesCreated += result.societies_created;
    errorDetails.push(...result.error_details);
    await ImportJob.updateOne({ job_id: jobId }, { $set: {
      imported, updated, skipped, errors, areas_created: areasCreated, societies_created: societiesCreated,
      processed: Math.min(i + BATCH_SIZE, body.length),
    } });
  }
  await ImportJob.updateOne({ job_id: jobId }, { $set: {
    status: 'completed', imported, updated, skipped, errors, areas_created: areasCreated, societies_created: societiesCreated,
    error_details: errorDetails.slice(0, 50), completed_at: nowIso(),
  } });
}

exports.bulkImport = async (req, res) => {
  const body = req.body;
  if (!Array.isArray(body)) return res.status(400).json({ error: 'Expected a JSON array of property objects' });
  const total = body.length;
  if (total <= 200) {
    const result = await processBulkImport(body);
    return res.json(result);
  }
  const jobId = uuidv4();
  await ImportJob.create({
    job_id: jobId, status: 'processing', total, imported: 0, updated: 0, skipped: 0, errors: 0,
    areas_created: 0, societies_created: 0, started_at: nowIso(),
  });
  processBulkImportBackground(body, jobId).catch((e) => console.error('Background import failed:', e));
  res.json({ success: true, job_id: jobId, message: `Import started for ${total} records. Processing in background.`, total });
};

exports.importStatus = async (req, res) => {
  const job = await ImportJob.findOne({ job_id: req.params.jobId }, { _id: 0 }).lean();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};

exports.bulkImportCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file provided' });
  try {
    const text = req.file.buffer.toString('utf-8').replace(/^﻿/, '');
    const records = csvParse(text, { columns: true, skip_empty_lines: true, trim: true });
    const rows = records.map((row) => {
      const cleaned = {};
      for (const [k, v] of Object.entries(row)) {
        if (!k) continue;
        cleaned[k.trim()] = typeof v === 'string' ? v.trim() : v;
      }
      for (const numField of ['price', 'rentValue', 'bhk', 'area_sqft', 'builtUpArea', 'carpetArea']) {
        if (cleaned[numField]) {
          const n = Number(String(cleaned[numField]).replace(/,/g, ''));
          if (!Number.isNaN(n)) cleaned[numField] = n;
        }
      }
      return cleaned;
    });
    if (!rows.length) return res.status(400).json({ error: 'CSV file is empty or has no valid rows' });
    const result = await processBulkImport(rows);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: `CSV parsing error: ${e.message}` });
  }
};

// ==================== EXPORT ====================
async function buildWorkbookSheet(wb, sheetName, headers, rows) {
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  ws.getRow(1).alignment = { horizontal: 'center' };
  rows.forEach((r) => ws.addRow(r));
  headers.forEach((h, i) => {
    let maxLen = String(h).length;
    rows.slice(0, 100).forEach((r) => { maxLen = Math.max(maxLen, String(r[i] ?? '').length); });
    ws.getColumn(i + 1).width = Math.min(maxLen + 4, 50);
  });
  return ws;
}

exports.exportCollection = async (req, res) => {
  const { collection } = req.params;
  const fmt = req.query.fmt || 'xlsx';
  const today = new Date().toISOString().slice(0, 10);
  let headers, rows, filename;

  if (collection === 'societies') {
    const items = await Society.find({}, { _id: 0 }).sort({ name: 1 }).lean();
    const areaIds = [...new Set(items.map((s) => s.areaId))];
    const cityIds = [...new Set(items.map((s) => s.cityId))];
    const aMap = Object.fromEntries((await Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean()).map((a) => [a.id, a]));
    const cMap = Object.fromEntries((await City.find({ id: { $in: cityIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
    headers = ['Name', 'Slug', 'City', 'Area', 'Project Type', 'Description', 'Location Advantages', 'Facilities Description', 'Amenities', 'Price Range', 'Builder Name', 'Total Units', 'Status', 'Featured', 'Created At'];
    rows = items.map((s) => [
      s.name, s.slug, cMap[s.cityId]?.name || '', aMap[s.areaId]?.name || '', s.project_type || '', s.description || '',
      s.location_advantages || '', s.facilities_description || '', Array.isArray(s.amenities) ? s.amenities.join(', ') : (s.amenities || ''),
      s.priceRange || '', s.builderName || '', s.totalUnits || '', s.isActive ? 'Active' : 'Inactive', s.is_featured ? 'Yes' : 'No', s.createdAt || '',
    ]);
    filename = `societies_${today}`;
  } else if (collection === 'properties') {
    const items = await Property.find({}, { _id: 0 }).sort({ createdAt: -1 }).lean();
    const areaIds = [...new Set(items.map((p) => p.areaId))];
    const cityIds = [...new Set(items.map((p) => p.cityId))];
    const aMap = Object.fromEntries((await Area.find({ id: { $in: areaIds } }, { _id: 0 }).lean()).map((a) => [a.id, a]));
    const cMap = Object.fromEntries((await City.find({ id: { $in: cityIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
    headers = ['Property ID', 'Title', 'Slug', 'Property Type', 'Category', 'Transaction', 'BHK', 'Price', 'Area (sqft)', 'Furnishing', 'Floor', 'Society', 'Area', 'City', 'Status', 'Approved', 'Contact Name', 'Contact Phone', 'Description', 'Views', 'Created At'];
    rows = items.map((p) => [
      p.propertyId, p.title || '', p.slug, p.propertyType, p.category, p.transactionType,
      p.bhk && p.bhk > 0 ? p.bhk : '', p.price, p.sqft, p.furnishing, p.floorNumber, p.premiseName,
      aMap[p.areaId]?.name || '', cMap[p.cityId]?.name || '', p.status, p.isApproved ? 'Yes' : 'No',
      p.contactName, p.contactPhone, (p.description || p.aiDescription || '').slice(0, 500), p.views || 0, p.createdAt,
    ]);
    filename = `properties_${today}`;
  } else if (collection === 'areas') {
    const items = await Area.find({}, { _id: 0 }).sort({ name: 1 }).lean();
    const cityIds = [...new Set(items.map((a) => a.cityId))];
    const cMap = Object.fromEntries((await City.find({ id: { $in: cityIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
    const areaIds = items.map((a) => a.id);
    const counts = Object.fromEntries((await Property.aggregate([
      { $match: { areaId: { $in: areaIds } } }, { $group: { _id: '$areaId', count: { $sum: 1 } } },
    ])).map((c) => [c._id, c.count]));
    headers = ['Name', 'Slug', 'City', 'Property Count', 'Status', 'Featured', 'Meta Title', 'Meta Description', 'Created At'];
    rows = items.map((a) => [
      a.name, a.slug, cMap[a.cityId]?.name || '', counts[a.id] || 0, a.isActive ? 'Active' : 'Inactive',
      a.is_featured ? 'Yes' : 'No', a.metaTitle || '', a.metaDescription || '', a.createdAt || '',
    ]);
    filename = `areas_${today}`;
  } else {
    return res.status(400).json({ error: `Unknown collection: ${collection}` });
  }

  if (fmt === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    res.write(`${headers.join(',')}\n`);
    for (const row of rows) res.write(`${row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')}\n`);
    return res.end();
  }
  const wb = new ExcelJS.Workbook();
  await buildWorkbookSheet(wb, collection.charAt(0).toUpperCase() + collection.slice(1), headers, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
};

exports.exportBackup = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=probroker_backup_${today}.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  // Properties
  const properties = await Property.find({}, { _id: 0 }).sort({ createdAt: -1 }).lean();
  const aIds = [...new Set(properties.map((p) => p.areaId))];
  const cIds = [...new Set(properties.map((p) => p.cityId))];
  const aMap = Object.fromEntries((await Area.find({ id: { $in: aIds } }, { _id: 0 }).lean()).map((a) => [a.id, a]));
  const cMap = Object.fromEntries((await City.find({ id: { $in: cIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
  const pHeaders = ['Property ID', 'Title', 'Property Type', 'Category', 'Transaction', 'BHK', 'Price', 'Area (sqft)', 'Furnishing', 'Society', 'Area', 'City', 'Status', 'Contact', 'Phone', 'Views', 'Created At'];
  const pRows = properties.map((p) => [p.propertyId, p.title || '', p.propertyType, p.category, p.transactionType, p.bhk > 0 ? p.bhk : '', p.price, p.sqft, p.furnishing, p.premiseName, aMap[p.areaId]?.name || '', cMap[p.cityId]?.name || '', p.status, p.contactName, p.contactPhone, p.views || 0, p.createdAt]);
  const wb1 = new ExcelJS.Workbook();
  await buildWorkbookSheet(wb1, 'Properties', pHeaders, pRows);
  archive.append(await wb1.xlsx.writeBuffer(), { name: `properties_${today}.xlsx` });

  // Societies
  const societies = await Society.find({}, { _id: 0 }).sort({ name: 1 }).lean();
  const saIds = [...new Set(societies.map((s) => s.areaId))];
  const scIds = [...new Set(societies.map((s) => s.cityId))];
  const saMap = Object.fromEntries((await Area.find({ id: { $in: saIds } }, { _id: 0 }).lean()).map((a) => [a.id, a]));
  const scMap = Object.fromEntries((await City.find({ id: { $in: scIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
  const sHeaders = ['Name', 'Slug', 'City', 'Area', 'Project Type', 'Description', 'Amenities', 'Price Range', 'Total Units', 'Status', 'Featured', 'Created At'];
  const sRows = societies.map((s) => [s.name, s.slug, scMap[s.cityId]?.name || '', saMap[s.areaId]?.name || '', s.project_type || '', s.description || '', Array.isArray(s.amenities) ? s.amenities.join(', ') : (s.amenities || ''), s.priceRange || '', s.totalUnits || '', s.isActive ? 'Active' : 'Inactive', s.is_featured ? 'Yes' : 'No', s.createdAt || '']);
  const wb2 = new ExcelJS.Workbook();
  await buildWorkbookSheet(wb2, 'Societies', sHeaders, sRows);
  archive.append(await wb2.xlsx.writeBuffer(), { name: `societies_${today}.xlsx` });

  // Areas
  const areas = await Area.find({}, { _id: 0 }).sort({ name: 1 }).lean();
  const acIds = [...new Set(areas.map((a) => a.cityId))];
  const acMap = Object.fromEntries((await City.find({ id: { $in: acIds } }, { _id: 0 }).lean()).map((c) => [c.id, c]));
  const aHeaders = ['Name', 'Slug', 'City', 'Status', 'Featured', 'Meta Title', 'Created At'];
  const aRows = areas.map((a) => [a.name, a.slug, acMap[a.cityId]?.name || '', a.isActive ? 'Active' : 'Inactive', a.is_featured ? 'Yes' : 'No', a.metaTitle || '', a.createdAt || '']);
  const wb3 = new ExcelJS.Workbook();
  await buildWorkbookSheet(wb3, 'Areas', aHeaders, aRows);
  archive.append(await wb3.xlsx.writeBuffer(), { name: `areas_${today}.xlsx` });

  // Inquiries
  const inquiries = await Inquiry.find({}, { _id: 0 }).sort({ createdAt: -1 }).lean();
  const iHeaders = ['Property ID', 'Name', 'Phone', 'Email', 'Message', 'Budget', 'Created At'];
  const iRows = inquiries.map((i) => [i.propertyId, i.name, i.phone, i.email, i.message, i.budget, i.createdAt]);
  const wb4 = new ExcelJS.Workbook();
  await buildWorkbookSheet(wb4, 'Inquiries', iHeaders, iRows);
  archive.append(await wb4.xlsx.writeBuffer(), { name: `inquiries_${today}.xlsx` });

  await archive.finalize();
};

// ==================== SETTINGS ====================
exports.getSettings = async (req, res) => {
  const settings = await Setting.findOne({ key: 'site' }, { _id: 0 }).lean() || {};
  const hpSchemaDoc = await Setting.findOne({ key: 'homepage_schema' }, { _id: 0 }).lean();
  res.json({ settings, homepage_schema: hpSchemaDoc ? hpSchemaDoc.schema : '' });
};

exports.changeAdminPassword = async (req, res) => {
  // NOTE: matches the Python app's behavior -- password is env-var based and this only
  // changes it in-memory for the life of the process (not persisted). Set ADMIN_PASSWORD
  // in your env/secret manager for a durable change.
  const { current_password, new_password, confirm_password } = req.body;
  if (current_password !== process.env.ADMIN_PASSWORD) return res.status(400).json({ error: 'Current password is incorrect' });
  if (new_password !== confirm_password) return res.status(400).json({ error: 'Passwords do not match' });
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  process.env.ADMIN_PASSWORD = new_password;
  res.json({ success: true });
};

exports.saveSiteSettings = async (req, res) => {
  const { site_name = 'PRObroker', contact_phone = '', whatsapp = '', logo_url = '', logo_width = 0 } = req.body;
  await Setting.updateOne({ key: 'site' }, { $set: { key: 'site', site_name, contact_phone, whatsapp, logo_url, logo_width } }, { upsert: true });
  res.json({ success: true });
};

exports.saveHomepageSchema = async (req, res) => {
  const schemaText = (req.body.homepage_schema || '').trim();
  if (schemaText) {
    try { JSON.parse(schemaText); } catch (e) { return res.status(400).json({ error: 'Invalid JSON in homepage schema' }); }
  }
  await Setting.updateOne({ key: 'homepage_schema' }, { $set: { key: 'homepage_schema', schema: schemaText } }, { upsert: true });
  res.json({ success: true });
};

exports.clearHomepageSchema = async (req, res) => {
  await Setting.updateOne({ key: 'homepage_schema' }, { $set: { schema: '' } }, { upsert: true });
  res.json({ success: true });
};

// ==================== SITE PAGES ====================
const SITE_PAGES = [
  { slug: 'about', label: 'About Us', url: '/about/' },
  { slug: 'privacy-policy', label: 'Privacy Policy', url: '/privacy-policy/' },
  { slug: 'terms', label: 'Terms & Conditions', url: '/terms/' },
  { slug: 'contact', label: 'Contact Us', url: '/contact/' },
];

exports.listPages = async (req, res) => {
  const pages = [];
  for (const p of SITE_PAGES) {
    const doc = await Page.findOne({ slug: p.slug }, { _id: 0 }).lean();
    pages.push({ ...p, updated_at: doc ? doc.updated_at : '' });
  }
  res.json(pages);
};

exports.getPageForEdit = async (req, res) => {
  const pageInfo = SITE_PAGES.find((p) => p.slug === req.params.slug);
  if (!pageInfo) return res.status(404).json({ error: 'Page not found' });
  const pageData = await Page.findOne({ slug: req.params.slug }, { _id: 0 }).lean() || {};
  res.json({ ...pageInfo, page_data: pageData });
};

exports.savePage = async (req, res) => {
  const { slug } = req.params;
  const form = req.body || {};
  const update = {
    slug, page_title: form.page_title || '', content: form.content || '',
    meta_title: form.meta_title || '', meta_description: form.meta_description || '',
    updated_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  const customSchema = (form.custom_schema || '').trim();
  if (customSchema) {
    try { JSON.parse(customSchema); update.custom_schema = customSchema; } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in schema markup' });
    }
  } else {
    update.custom_schema = '';
  }
  await Page.updateOne({ slug }, { $set: update }, { upsert: true });
  res.json({ success: true });
};

// ==================== REDIRECTS ====================
function normalizeRedirectUrl(url) {
  let u = (url || '').trim();
  if (!u) return '/';
  if (u.startsWith('http://') || u.startsWith('https://')) {
    try {
      const parsed = new URL(u);
      u = parsed.pathname + (parsed.search || '');
    } catch (e) { /* ignore */ }
  }
  if (!u.startsWith('/')) u = `/${u}`;
  const [pathPart, queryPart] = u.split('?');
  const collapsed = pathPart.replace(/\/+/g, '/');
  return queryPart ? `${collapsed}?${queryPart}` : collapsed;
}

exports.listRedirects = async (req, res) => {
  const redirects = await Redirect.find({}, { _id: 0 }).sort({ createdAt: -1 }).limit(500).lean();
  res.json(redirects);
};

exports.addRedirect = async (req, res) => {
  let { source_url = '', destination_url = '/', redirect_type = '301' } = req.body;
  source_url = source_url.trim();
  if (!source_url) return res.status(400).json({ error: 'Source URL is required' });
  source_url = normalizeRedirectUrl(source_url);
  destination_url = normalizeRedirectUrl(destination_url);
  if (!source_url) return res.status(400).json({ error: 'Invalid source URL' });
  if (source_url === destination_url) return res.status(400).json({ error: 'Source and destination cannot be the same' });

  const existing = await Redirect.findOne({ source_url }).lean();
  if (existing) return res.status(400).json({ error: 'Redirect for this URL already exists' });

  let chainDest = destination_url;
  for (let hop = 0; hop < 10; hop++) {
    const chainRedirect = await Redirect.findOne({ source_url: chainDest, is_active: true }, { _id: 0 }).lean();
    if (!chainRedirect) break;
    chainDest = chainRedirect.destination_url;
    if (chainDest === source_url) return res.status(400).json({ error: 'This would create a redirect loop' });
  }

  const doc = { id: uuidv4(), source_url, destination_url, redirect_type, is_active: true, createdAt: nowIso() };
  await Redirect.create(doc);
  res.json({ success: true, redirect: doc });
};

exports.toggleRedirect = async (req, res) => {
  const redirect = await Redirect.findOne({ id: req.params.redirectId }, { _id: 0 }).lean();
  if (redirect) {
    const newStatus = !redirect.is_active;
    await Redirect.updateOne({ id: req.params.redirectId }, { $set: { is_active: newStatus } });
  }
  res.json({ success: true });
};

exports.deleteRedirect = async (req, res) => {
  await Redirect.deleteOne({ id: req.params.redirectId });
  res.json({ success: true });
};

// ==================== BLOG (admin) ====================
exports.listBlogAdmin = async (req, res) => {
  const posts = await BlogPost.find({}, { _id: 0 }).sort({ createdAt: -1 }).limit(100).lean();
  res.json(posts);
};

exports.getBlogForEdit = async (req, res) => {
  const post = await BlogPost.findOne({ id: req.params.postId }, { _id: 0 }).lean();
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
};

exports.saveBlog = async (req, res) => {
  const form = req.body || {};
  const postId = (form.post_id || '').trim();
  const isNew = !postId;

  let slug = (form.slug || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!slug) slug = generateSlug(form.title || '');

  const tags = String(form.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  let featuredImage = '';
  let existingPost = null;
  if (!isNew) {
    existingPost = await BlogPost.findOne({ id: postId }, { _id: 0 }).lean();
    featuredImage = existingPost ? existingPost.featuredImage : '';
  }
  if (req.file) {
    const result = await uploadImageToR2(req.file.buffer, req.file.originalname, 'blog');
    if (result.success) featuredImage = result.url;
  }
  if (form.featured_image_url && form.featured_image_url.trim()) featuredImage = form.featured_image_url.trim();

  const now = nowIso();
  const doc = {
    title: form.title || '', slug, content: form.content || '', excerpt: form.excerpt || '',
    category: form.category || '', tags, metaTitle: form.metaTitle || '', metaDescription: form.metaDescription || '',
    featuredImage, status: form.status || 'draft', updatedAt: now,
  };

  let finalId = postId;
  if (isNew) {
    finalId = uuidv4();
    doc.id = finalId;
    doc.createdAt = now;
    doc.publishedAt = doc.status === 'published' ? now : '';
    doc.author = 'Admin';
    doc.views = 0;
    await BlogPost.create(doc);
  } else {
    if (doc.status === 'published' && existingPost && !existingPost.publishedAt) doc.publishedAt = now;
    await BlogPost.updateOne({ id: postId }, { $set: doc });
  }

  res.json({ success: true, id: finalId });
};

exports.deleteBlog = async (req, res) => {
  await BlogPost.deleteOne({ id: req.params.postId });
  res.json({ success: true });
};

exports.uploadBlogImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const result = await uploadImageToR2(req.file.buffer, req.file.originalname, 'blog');
  if (result.success) return res.json({ url: result.url });
  res.status(500).json({ error: result.error || 'Upload failed' });
};

exports.uploadSiteLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const result = await uploadImageToR2(req.file.buffer, req.file.originalname, 'site');
  if (result.success) return res.json({ url: result.url });
  res.status(500).json({ error: result.error || 'Upload failed' });
};

// ==================== SLUG MIGRATION (one-time utility, port of GET /api/admin/migrate-slugs/) ====================
exports.migrateSlugs = async (req, res) => {
  const allAreas = await Area.find({}, { _id: 0 }).lean();
  const areasMap = Object.fromEntries(allAreas.map((a) => [a.id, a]));
  const allCities = await City.find({}, { _id: 0 }).lean();
  const citiesMap = Object.fromEntries(allCities.map((c) => [c.id, c]));

  const allProps = await Property.find({}, { _id: 0 }).lean();
  let updated = 0;
  const ops = [];
  for (const p of allProps) {
    const areaDoc = areasMap[p.areaId];
    const cityDoc = citiesMap[p.cityId];
    const areaSlug = areaDoc ? areaDoc.slug : 'unknown';
    const citySlug = cityDoc ? cityDoc.slug : 'unknown';
    const newSlug = generatePropertySlug({
      propertyType: p.propertyType || 'flat', bhk: p.bhk || 0, areaSlug, citySlug,
      propertyId: p.propertyId, transactionType: p.transactionType || 'buy', societyName: p.premiseName || '',
    });
    if (newSlug !== p.slug) {
      ops.push({ updateOne: { filter: { propertyId: p.propertyId }, update: { $set: { slug: newSlug, oldSlug: p.slug } } } });
      updated++;
    }
  }
  if (ops.length) await Property.bulkWrite(ops);
  res.json({ success: true, total: allProps.length, updated });
};

// ==================== R2 status ====================
exports.r2Status = async (req, res) => {
  const { testR2Connection, getR2Stats } = require('../services/r2Storage');
  const status = await testR2Connection();
  const stats = await getR2Stats();
  res.json({ ...status, ...stats });
};
