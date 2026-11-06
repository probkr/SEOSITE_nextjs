/**
 * Converts one bulk-import record into the shape processBulkImport() expects.
 *
 * Accepts either native PRObroker fields (price, transactionType, contactPhone, photos, ...)
 * or the CRM export format used by the JSON export and the CSV template
 * (type "Residential Rent", rentValue, number, furnishedType, images, isDeleted, ...).
 * Native fields always win when both are present.
 */
const { normalizePhone } = require('./otpService');

const UNIT_TYPES = [
  [/apartment|flat/, 'flat'],
  [/pent ?house/, 'penthouse'],
  [/row ?house/, 'rowhouse'],
  [/bungalow|villa|independent house/, 'bungalow'],
  [/tenement/, 'tenement'],
  [/plot|land/, 'plot'],
  [/showroom/, 'showroom'],
  [/shop/, 'shop'],
  [/office/, 'office'],
  [/warehouse|godown/, 'warehouse'],
  [/shed/, 'shed'],
  [/basement/, 'basement'],
];

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

function firstInt(v) {
  const m = str(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = Number(str(v).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// "Residential Rent" / "Commercial Sell" / "Residential Sale"
function parseType(type) {
  const t = str(type).toLowerCase();
  return {
    category: t.includes('commercial') ? 'commercial' : t.includes('residential') ? 'residential' : '',
    transactionType: /rent|lease/.test(t) ? 'rent' : /sell|sale|buy/.test(t) ? 'buy' : '',
  };
}

function parsePropertyType(unitType) {
  const u = str(unitType).toLowerCase();
  if (!u) return '';
  const hit = UNIT_TYPES.find(([re]) => re.test(u));
  return hit ? hit[1] : u;
}

// Stored values used by the rest of the collection and the admin edit form
// (unfurnished / semi-furnished / fully-furnished).
function parseFurnishing(v) {
  const f = str(v).toLowerCase();
  if (!f) return '';
  if (f.includes('semi')) return 'semi-furnished';
  if (f.includes('unfurnished') || f === 'no') return 'unfurnished';
  if (f.includes('furnished')) return 'fully-furnished';
  return '';
}

function parseCategory(v) {
  const c = str(v).toLowerCase();
  return c.includes('commercial') ? 'commercial' : c.includes('residential') ? 'residential' : '';
}

// "Rent" / "Lease" -> rent, "Sale" / "Sell" / "Buy" -> buy
function parseTransaction(v) {
  const t = str(v).toLowerCase();
  return /rent|lease/.test(t) ? 'rent' : /sell|sale|buy/.test(t) ? 'buy' : '';
}

// Matches the listing filter values (family / bachelors), anything else is open to both.
function parseTenant(v) {
  const t = str(v).toLowerCase();
  const family = t.includes('family');
  const bachelors = t.includes('bachelor');
  if (family && !bachelors) return 'family';
  if (bachelors && !family) return 'bachelors';
  return 'both';
}

function parseParking(v) {
  if (typeof v === 'boolean') return v;
  const p = str(v).toLowerCase();
  return !!p && !['0', 'no', 'none', 'false', '-', 'n/a'].includes(p);
}

// "Ahmedabad West" / "ahmedabad-east" -> "Ahmedabad"
function parseCity(v) {
  return str(v).replace(/[\s-]+(east|west|north|south|city)$/i, '').trim();
}

// Mongo extended JSON ({ $date: ... }) or plain values.
function parseDate(v) {
  const raw = v && typeof v === 'object' && v.$date ? v.$date : v;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : '';
}

// Rented-out, sold or deleted rows in the export must not go live.
function parseStatus(item) {
  if (item.isDeleted === 1 || item.isDeleted === true || item.isDeleted === '1') return 'inactive';
  const s = str(item.status).toLowerCase();
  if (!s || s === 'active') return 'active';
  if (s.includes('rent')) return 'rented';
  if (s.includes('sold')) return 'sold';
  return 'inactive';
}

function normalizeImportRecord(item) {
  const { category, transactionType } = parseType(item.type);
  const photos = Array.isArray(item.photos) ? item.photos : Array.isArray(item.images) ? item.images : [];
  const rawPhone = item.contactPhone || item.number || item.phone;
  const phone = rawPhone ? normalizePhone(rawPhone) : '';

  return {
    propertyId: str(item.propertyId) || undefined,
    category: parseCategory(item.category) || category || 'residential',
    transactionType: parseTransaction(item.transactionType) || transactionType || 'buy',
    propertyType: parsePropertyType(item.propertyType || item.unitType) || 'flat',
    bhk: typeof item.bhk === 'number' ? item.bhk : firstInt(item.bhk),
    sqft: toNumber(item.sqft) || toNumber(item.sqFt) || toNumber(item.builtUpArea) || toNumber(item.carpetArea) || toNumber(item.area_sqft),
    price: toNumber(item.price) || toNumber(item.rentValue) || toNumber(item.sellValue),
    premiseName: str(item.premiseName || item.society || item.title),
    city: parseCity(item.city || item.cityName),
    area: str(item.area || item.areaName),
    nearby: str(item.nearby || item.address),
    description: str(item.description),
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    furnishing: parseFurnishing(item.furnishing || item.furnishedType) || 'unfurnished',
    familyOrBachelors: item.familyOrBachelors ? parseTenant(item.familyOrBachelors) : parseTenant(item.tenant),
    floorNumber: firstInt(item.floorNumber ?? item.floor ?? item.floors),
    totalFloors: firstInt(item.totalFloors ?? item.totalFloor),
    ageOfProperty: item.ageOfProperty ?? (firstInt(item.age) || null),
    parking: parseParking(item.parking),
    additionalDetails: str(item.additionalDetails),
    contactName: str(item.contactName || item.name),
    contactPhone: /^\d{10}$/.test(phone) ? phone : '',
    listingType: item.listingType || (str(item.userType).toLowerCase() === 'owner' ? 'owner' : 'broker'),
    photos: photos.filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)),
    status: parseStatus(item),
    isVerified: item.isVerified === true || str(item.verifyStatus).toLowerCase() === 'verified',
    views: toNumber(item.views),
    slug: item.slug,
    createdAt: item.createdAt && typeof item.createdAt === 'string' ? item.createdAt : parseDate(item.listedDate || item.createdOn || item.createdAt),
  };
}

module.exports = { normalizeImportRecord };
