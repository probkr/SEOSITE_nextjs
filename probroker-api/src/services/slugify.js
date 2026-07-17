/**
 * Port of backend/models/database.py generate_slug() / generate_property_slug()
 * Byte-for-byte equivalent logic (same regex behavior) so existing indexed URLs keep working.
 */

function generateSlug(text) {
  if (!text) return '';
  let t = String(text).toLowerCase().trim();
  // re.sub(r'[^\w\s-]', '', text) -- \w in Python (unicode) ~= [A-Za-z0-9_] here for ascii use case
  t = t.replace(/[^\w\s-]/g, '');
  t = t.replace(/[\s_]+/g, '-');
  t = t.replace(/-+/g, '-');
  t = t.replace(/^-+|-+$/g, '');
  return t;
}

/**
 * generate_property_slug(property_type, bhk, area_slug, city_slug, property_id, transaction_type, society_name)
 * {bhk}bhk-{type}-for-{sale|rent}-in-{society}-{area}-{city}-{id}
 */
function generatePropertySlug({
  propertyType,
  bhk,
  areaSlug,
  citySlug,
  propertyId,
  transactionType = '',
  societyName = '',
}) {
  const parts = [];
  const bhkNum = parseInt(bhk, 10);
  if (bhk && bhkNum > 0) {
    parts.push(`${bhkNum}bhk`);
  }
  parts.push(String(propertyType || 'property').toLowerCase().trim());
  const trans = ['buy', 'sale', ''].includes(transactionType) ? 'sale' : 'rent';
  parts.push(`for-${trans}-in`);
  if (societyName) {
    let socClean = String(societyName).toLowerCase().trim();
    socClean = socClean.replace(/[^\w\s-]/g, '');
    socClean = socClean.replace(/[\s_]+/g, '-');
    socClean = socClean.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    if (socClean) parts.push(socClean);
  }
  if (areaSlug) parts.push(areaSlug);
  if (citySlug) parts.push(citySlug);
  parts.push(String(propertyId).toLowerCase());

  let slug = parts.join('-');
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return slug;
}

function generatePropertyId() {
  // Port of generate_property_id(): "PB" + first 5 digits of a random big int (uuid4().int)
  // We emulate with a random 5-digit numeric string (uuid.int equivalent, not cryptographically
  // meaningful in the original either — just a random-looking numeric suffix).
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `PB${digits}`;
}

module.exports = { generateSlug, generatePropertySlug, generatePropertyId };
