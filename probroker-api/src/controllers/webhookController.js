const { processBulkImport } = require('./adminController');
const { revalidateSiteProperties } = require('../services/siteCache');
const Property = require('../models/Property');

const SITE_URL = (process.env.SITE_URL || 'https://prbroker.in').replace(/\/+$/, '');

function validationErrors(item) {
  const errors = [];
  if (typeof item.price !== 'number' || item.price <= 0) {
    errors.push('price is required and must be a positive number (absolute INR value, not lakh shorthand)');
  }
  if (!item.city && !item.cityName) errors.push('city (or cityName) is required');
  return errors;
}

async function importOne(item) {
  const errors = validationErrors(item || {});
  if (errors.length) {
    return { ok: false, propertyId: item && item.propertyId, error: 'validation_failed', details: errors };
  }
  const result = await processBulkImport([item], 0);
  if (result.errors > 0) {
    return { ok: false, propertyId: item.propertyId, error: 'import_failed', details: result.error_details };
  }
  if (result.skipped > 0) {
    return { ok: false, propertyId: item.propertyId, error: 'skipped', reason: 'price missing/zero or city not found and no default city configured' };
  }
  const saved = result.sample_results && result.sample_results[0];
  return {
    ok: true,
    action: result.imported > 0 ? 'created' : 'updated',
    propertyId: saved ? saved.propertyId : item.propertyId,
    slug: saved ? saved.slug : undefined,
    url: saved ? `${SITE_URL}/property/${saved.slug}` : undefined,
    areas_created: result.areas_created,
    societies_created: result.societies_created,
  };
}

/**
 * POST /api/v1/webhooks/listings
 * Body: one listing, an array of listings, { listings: [...] } or { properties: [...] }.
 * The same propertyId updates that listing in place. One listing returns its own result;
 * a batch returns { ok, total, succeeded, failed, results }.
 */
exports.receiveListings = async (req, res) => {
  const body = req.body || {};
  const batch = Array.isArray(body) ? body : body.listings || body.properties;
  const isBatch = Array.isArray(batch);
  const items = isBatch ? batch : [body];
  if (!items.length) {
    return res.status(422).json({ ok: false, error: 'validation_failed', details: ['no listings provided'] });
  }

  const results = [];
  for (let index = 0; index < items.length; index++) {
    try {
      results.push({ index, ...(await importOne(items[index])) });
    } catch (e) {
      console.error('webhook listing error:', e);
      results.push({ index, ok: false, propertyId: items[index] && items[index].propertyId, error: 'internal_error' });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  if (succeeded) await revalidateSiteProperties();

  if (!isBatch) {
    const { index, ok, ...rest } = results[0];
    if (!ok) return res.status(rest.error === 'internal_error' ? 500 : 422).json({ ok, ...rest });
    return res.status(rest.action === 'created' ? 201 : 200).json({ ok, ...rest });
  }

  const failed = results.length - succeeded;
  const status = failed === 0 ? 200 : succeeded === 0 ? 422 : 207;
  res.status(status).json({ ok: failed === 0, total: results.length, succeeded, failed, results });
};

// DELETE /api/v1/webhooks/listings/:propertyId -- takes a listing off the site without deleting it.
exports.removeListing = async (req, res) => {
  const { propertyId } = req.params;
  const result = await Property.updateOne({ propertyId }, { $set: { status: 'inactive', updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) return res.status(404).json({ ok: false, error: 'not_found' });
  await revalidateSiteProperties();
  res.json({ ok: true, action: 'deactivated', propertyId });
};
