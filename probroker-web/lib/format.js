// Port of backend/server.py fmt_price()
export function fmtPrice(p) {
  if (!p) return '';
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
  if (p >= 100000) return `₹${Math.round(p / 100000)}L`;
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Port of backend/server.py build_property_title()
export function buildPropertyTitle(p) {
  const bhk = p.bhk || 0;
  const pt = (p.propertyType || 'property').charAt(0).toUpperCase() + (p.propertyType || 'property').slice(1);
  const trans = p.transactionType || 'buy';
  const tn = trans === 'buy' ? 'Sale' : 'Rent';
  const soc = p.premiseName || '';
  const area = p.areaName || p.area || '';
  const city = p.cityName || '';
  const furnishing = (p.furnishing || '').replace('-', ' ').trim();

  let prefix = '';
  if (bhk && bhk > 0) {
    prefix = `${parseInt(bhk)} BHK `;
  } else if (furnishing && !['unfurnished', ''].includes(furnishing.toLowerCase())) {
    prefix = `${furnishing.charAt(0).toUpperCase() + furnishing.slice(1)} `;
  }

  const locParts = [soc, area, city].filter(Boolean);
  const loc = locParts.join(', ');
  if (loc) return `${prefix}${pt} for ${tn} in ${loc}`;
  return `${prefix}${pt} for ${tn}`;
}

// Port of backend/models/database.py generate_property_slug + build_property_slug
export function buildPropertySlug(p) {
  const bhk = p.bhk || 0;
  const propertyType = (p.propertyType || 'property').toLowerCase();
  let areaSlug = p.areaSlug || '';
  let citySlug = p.citySlug || '';
  const propertyId = p.propertyId || '';
  const transactionType = p.transactionType || 'buy';
  const societyName = p.premiseName || '';

  if (!areaSlug) {
    const areaName = p.areaName || p.area || '';
    if (areaName) areaSlug = slugify(areaName);
  }
  if (!citySlug) {
    const cityName = p.cityName || '';
    if (cityName) citySlug = slugify(cityName);
  }

  const saleRent = transactionType === 'buy' ? 'sale' : 'rent';
  const parts = [];
  if (bhk) parts.push(`${parseInt(bhk)}bhk`);
  parts.push(propertyType);
  parts.push('for');
  parts.push(saleRent);
  parts.push('in');
  const locBits = [];
  if (societyName) locBits.push(slugify(societyName));
  if (areaSlug) locBits.push(areaSlug);
  if (citySlug) locBits.push(citySlug);
  let slug = parts.join('-');
  if (locBits.length) slug += `-${locBits.join('-')}`;
  slug += `-${String(propertyId).toLowerCase()}`;
  return slug;
}

export function fmtPropDesc(p) {
  const bhk = p.bhk || 0;
  const pt = (p.propertyType || 'property').charAt(0).toUpperCase() + (p.propertyType || 'property').slice(1);
  const trans = p.transactionType || 'buy';
  const soc = p.premiseName || '';
  const area = p.areaName || '';
  const city = p.cityName || '';
  const loc = [soc, area, city].filter(Boolean).join(', ');
  const bhkPrefix = bhk && bhk > 0 ? `${parseInt(bhk)} BHK ` : '';
  return `${bhkPrefix}${pt} for ${trans === 'buy' ? 'sale' : 'rent'} in ${loc}. ${p.sqft || ''} sqft, ${p.furnishing || ''}. ${fmtPrice(p.price)}. Contact owner on PRObroker.`;
}

// Alias used by adm
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPrice(value) {
  return fmtPrice(value);
}
