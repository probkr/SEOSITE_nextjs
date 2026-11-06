const { processBulkImport } = require('./adminController');
const { revalidateSiteProperties } = require('../services/siteCache');
const Property = require('../models/Property');

// Synchronous endpoint: bigger feeds should go through admin bulk import (background job).
const MAX_RECORDS = 200;

/**
 * POST /api/v1/webhooks/listings
 * Body: an array of listings, a single listing object, or { properties: [...] }.
 * Each record is saved to the properties collection by propertyId (create or update), with the
 * same mapping as admin bulk import (services/importMapper.js). A non-active status takes an
 * existing listing down.
 */
exports.receiveListings = async (req, res) => {
  const body = req.body;
  const records = Array.isArray(body) ? body
    : Array.isArray(body?.properties) ? body.properties
      : body && typeof body === 'object' && Object.keys(body).length ? [body]
        : null;
  if (!records || !records.length) {
    return res.status(400).json({ success: false, error: 'Expected a JSON array of listings (or one listing object)' });
  }
  if (records.length > MAX_RECORDS) {
    return res.status(413).json({ success: false, error: `Send at most ${MAX_RECORDS} listings per request` });
  }
  if (records.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) {
    return res.status(400).json({ success: false, error: 'Every listing must be a JSON object' });
  }

  const result = await processBulkImport(records);
  const changed = result.imported + result.updated > 0;
  const siteRefreshed = changed ? await revalidateSiteProperties() : false;

  res.json({
    success: result.errors === 0,
    received: records.length,
    created: result.imported,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors,
    areas_created: result.areas_created,
    societies_created: result.societies_created,
    site_refreshed: siteRefreshed,
    results: result.results,
  });
};

// DELETE /api/v1/webhooks/listings/:propertyId -- takes a listing off the site without deleting it.
exports.removeListing = async (req, res) => {
  const { propertyId } = req.params;
  const result = await Property.updateOne({ propertyId }, { $set: { status: 'inactive', updatedAt: new Date().toISOString() } });
  if (!result.matchedCount) return res.status(404).json({ success: false, error: 'Listing not found' });
  const siteRefreshed = await revalidateSiteProperties();
  res.json({ success: true, action: 'deactivated', propertyId, site_refreshed: siteRefreshed });
};
