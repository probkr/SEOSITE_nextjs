const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Ad = require('../models/Ad');

// Kinds of page an ad can be placed on (see probroker-web/lib/ads.js).
const PLACEMENTS = ['listing', 'landing', 'society'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9-]+$/;
const PUBLIC_FIELDS = { _id: 0, id: 1, title: 1, subtitle: 1, image_url: 1, link_url: 1, cta_text: 1 };

const nowIso = () => new Date().toISOString();
// Start and end dates are whole days in India time.
const todayIst = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Ad links go to another site (https://...) or a page on this one (/path/). Anything else, such as
// javascript: links, is refused.
function cleanLink(value) {
  const u = String(value || '').trim();
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
  } catch (e) { /* invalid */ }
  return null;
}

function cleanImage(value) {
  const u = String(value || '').trim();
  try {
    const parsed = new URL(u);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
  } catch (e) { /* invalid */ }
  return null;
}

function cleanAd(body) {
  const title = String(body.title || '').trim().slice(0, 100);
  if (!title) return { error: 'Title is required' };
  const image_url = cleanImage(body.image_url);
  if (!image_url) return { error: 'Upload an image for the ad' };
  const link_url = cleanLink(body.link_url);
  if (!link_url) return { error: 'Link must start with https:// or / (a page on this site)' };

  const start_date = DATE_RE.test(body.start_date || '') ? body.start_date : '';
  const end_date = DATE_RE.test(body.end_date || '') ? body.end_date : '';
  if (start_date && end_date && end_date < start_date) return { error: 'End date is before the start date' };

  const list = (v) => (Array.isArray(v) ? v : []).map((s) => String(s).trim().toLowerCase());
  const priority = Math.max(-100, Math.min(100, parseInt(body.priority, 10) || 0));

  return {
    ad: {
      title,
      subtitle: String(body.subtitle || '').trim().slice(0, 200),
      image_url,
      link_url,
      cta_text: String(body.cta_text || '').trim().slice(0, 30) || 'Know More',
      placements: [...new Set(list(body.placements).filter((p) => PLACEMENTS.includes(p)))],
      cities: [...new Set(list(body.cities).filter((c) => SLUG_RE.test(c)))],
      priority,
      start_date,
      end_date,
      is_active: body.is_active !== false,
    },
  };
}

// ==================== ADMIN ====================
exports.listAds = async (req, res) => {
  const ads = await Ad.find({}, { _id: 0 }).sort({ is_active: -1, priority: -1, createdAt: -1 }).limit(500).lean();
  res.json(ads);
};

// Creates an ad, or updates it when body.id is an existing ad.
exports.saveAd = async (req, res) => {
  const { ad, error } = cleanAd(req.body || {});
  if (error) return res.status(400).json({ error });
  const id = req.body.id ? String(req.body.id) : '';
  if (id) {
    const result = await Ad.updateOne({ id }, { $set: { ...ad, updatedAt: nowIso() } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Ad not found' });
    return res.json({ success: true, ad: { id, ...ad } });
  }
  const doc = { id: uuidv4(), ...ad, clicks: 0, createdAt: nowIso(), updatedAt: nowIso() };
  await Ad.create(doc);
  res.json({ success: true, ad: doc });
};

exports.toggleAd = async (req, res) => {
  const ad = await Ad.findOne({ id: req.params.adId }, { _id: 0, is_active: 1 }).lean();
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  await Ad.updateOne({ id: req.params.adId }, { $set: { is_active: !ad.is_active, updatedAt: nowIso() } });
  res.json({ success: true, is_active: !ad.is_active });
};

exports.deleteAd = async (req, res) => {
  await Ad.deleteOne({ id: req.params.adId });
  res.json({ success: true });
};

// PRObroker's upload service encrypts every response (probroker_backend encryptionMiddleware.js):
// AES-256-CBC, PKCS7, key and IV as UTF-8 text, Base64 output of JSON.stringify(response).
// The key stays here on the server (ENCRYPTION_KEY / ENCRYPTION_IV in .env), never in the browser.
function decryptUploadResponse(encrypted) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'utf8');
  const iv = Buffer.from(process.env.ENCRYPTION_IV || '', 'utf8');
  if (key.length !== 32 || iv.length !== 16) {
    const err = new Error('ENCRYPTION_KEY (32 characters) and ENCRYPTION_IV (16 characters) are not set in the API .env');
    err.status = 500;
    err.expose = true;
    throw err;
  }
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const text = Buffer.concat([decipher.update(String(encrypted), 'base64'), decipher.final()]).toString('utf8');
  return JSON.parse(text);
}

// The admin browser uploads the file itself to PRObroker's upload service (S3), then sends what it
// got back here as JSON: { encrypted } (the service's encrypted reply) or { url }. This returns the
// image link; it is stored with the ad when the ad is saved.
exports.uploadAdImage = async (req, res) => {
  let raw = req.body?.url;
  if (!raw && req.body?.encrypted) {
    let reply;
    try {
      reply = decryptUploadResponse(req.body.encrypted);
    } catch (e) {
      if (e.expose) return res.status(500).json({ error: e.message });
      console.error('[ads] could not decrypt upload response:', e.message);
      return res.status(400).json({ error: 'Could not read the upload response (wrong ENCRYPTION_KEY / ENCRYPTION_IV?)' });
    }
    if (!reply?.files?.[0]?.url) {
      return res.status(400).json({ error: reply?.error || reply?.message || 'Upload response has no image link' });
    }
    raw = reply.files[0].url;
  }
  const url = cleanImage(raw);
  if (!url) return res.status(400).json({ error: 'No image link received from the upload' });
  res.json({ url });
};

// ==================== PUBLIC ====================
// GET /ads?placement=listing&city=ahmedabad -> ads live today for that kind of page and city.
// Without a city, only ads that are not limited to a city are returned.
exports.publicAds = async (req, res) => {
  const placement = PLACEMENTS.includes(req.query.placement) ? req.query.placement : 'listing';
  const city = SLUG_RE.test(String(req.query.city || '')) ? String(req.query.city) : '';
  const today = todayIst();
  const noValue = (field) => [{ [field]: '' }, { [field]: { $exists: false } }];

  const ads = await Ad.find({
    is_active: true,
    $and: [
      { $or: [...noValue('start_date'), { start_date: { $lte: today } }] },
      { $or: [...noValue('end_date'), { end_date: { $gte: today } }] },
      { $or: [{ placements: { $size: 0 } }, { placements: placement }] },
      city ? { $or: [{ cities: { $size: 0 } }, { cities: city }] } : { cities: { $size: 0 } },
    ],
  }, PUBLIC_FIELDS).sort({ priority: -1, createdAt: -1 }).limit(20).lean();

  // Every listing page view asks for this, so browsers and the CDN may keep it for 2 minutes.
  res.set('Cache-Control', 'public, max-age=120');
  res.json({ data: ads });
};

// POST /ads/:adId/click -> counts a click (sent with navigator.sendBeacon, nothing to read back).
exports.countAdClick = async (req, res) => {
  const id = String(req.params.adId || '');
  if (id.length <= 64) await Ad.updateOne({ id, is_active: true }, { $inc: { clicks: 1 } });
  res.status(204).end();
};
