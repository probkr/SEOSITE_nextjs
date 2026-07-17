/**
 * Port of backend/models/database.py format_price() -- Indian lakhs/crores formatting.
 */
function formatPrice(price, transactionType = 'buy') {
  const p = Number(price) || 0;
  if (transactionType === 'rent') {
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L/mo`;
    return `₹${p.toLocaleString('en-IN')}/mo`;
  }
  if (p >= 10000000) {
    const crores = p / 10000000;
    if (Number.isInteger(crores)) return `₹${crores} Cr`;
    return `₹${crores.toFixed(2)} Cr`;
  } else if (p >= 100000) {
    const lakhs = p / 100000;
    if (Number.isInteger(lakhs)) return `₹${lakhs} L`;
    return `₹${lakhs.toFixed(1)} L`;
  }
  return `₹${p.toLocaleString('en-IN')}`;
}

/**
 * Port of generate_ai_description() in database.py
 */
function generateAiDescription(property, areaName, cityName) {
  const bhk = property.bhk;
  const propType = String(property.propertyType || '').replace(/-/g, ' ');
  const transType = property.transactionType === 'buy' ? 'sale' : 'rent';
  const society = property.premiseName || '';
  const sqft = property.sqft || 0;
  const furnishing = String(property.furnishing || '').replace(/-/g, ' ');
  const floor = property.floorNumber;
  const totalFloors = property.totalFloors;
  const age = property.ageOfProperty;
  const additional = property.additionalDetails || '';

  const parts = [];
  if (bhk) {
    parts.push(`${bhk} BHK ${propType} for ${transType} in ${society}, ${areaName}, ${cityName}.`);
  } else {
    const titled = propType.charAt(0).toUpperCase() + propType.slice(1);
    parts.push(`${titled} for ${transType} in ${society}, ${areaName}, ${cityName}.`);
  }

  let floorInfo = '';
  if (floor !== null && floor !== undefined && totalFloors) {
    floorInfo = ` on floor ${floor} of ${totalFloors}`;
  }
  parts.push(`This ${sqft} sqft ${furnishing} property is located${floorInfo}.`);

  if (age) parts.push(`Age of property: ${age} years.`);
  if (additional) parts.push(additional);

  return parts.join(' ');
}

module.exports = { formatPrice, generateAiDescription };
