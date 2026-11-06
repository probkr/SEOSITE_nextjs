const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Property = require('../models/Property');
const OwnerListing = require('../models/OwnerListing');
const Inquiry = require('../models/Inquiry');
const PropertyDraft = require('../models/PropertyDraft');
const Requirement = require('../models/Requirement');
const { normalizePhone, isValidPhone, maskPhone, issueOtp, checkOtp } = require('../services/otpService');
const WebUser = require('../models/WebUser');
const { getCurrentUser, setUserSession, clearUserSession } = require('../middleware/userAuth');
const { adminPhones } = require('../middleware/adminAuth');
const { ensureWallet } = require('../services/creditService');
const { sessionCookieOpts } = require('../config/cookies');

const cookieOpts = () => ({ ...sessionCookieOpts(), maxAge: 7 * 24 * 60 * 60 * 1000 });

// ---------- OTP ----------
// The only purposes a caller may name on /otp/*. Admin and WebUser flows set their own purpose
// server-side, so accepting them here would let this route create OTPs for those logins.
const PUBLIC_OTP_PURPOSES = new Set(['login', 'post-property']);

exports.otpSend = async (req, res) => {
  const { phone: rawPhone, name = '', purpose = 'login' } = req.body || {};
  const phone = normalizePhone(rawPhone);
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number. Must be 10 digits.' });
  }
  if (!PUBLIC_OTP_PURPOSES.has(purpose)) {
    return res.status(400).json({ success: false, error: 'Invalid OTP purpose' });
  }

  const result = await issueOtp({ phone, purpose, name });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, error: result.error });
  }

  const respData = { success: true, message: `OTP sent to ${maskPhone(phone)}` };
  if (result.devOtp && process.env.NODE_ENV !== 'production') respData.dev_otp = result.devOtp;
  res.json(respData);
};

exports.otpVerify = async (req, res) => {
  const { phone: rawPhone, otp: otpEntered = '', purpose = 'login' } = req.body || {};
  const phone = normalizePhone(rawPhone);
  const otp = String(otpEntered).trim();

  if (phone.length !== 10 || otp.length !== 4) {
    return res.status(400).json({ success: false, error: 'Invalid phone or OTP format' });
  }
  if (!PUBLIC_OTP_PURPOSES.has(purpose)) {
    return res.status(400).json({ success: false, error: 'Invalid OTP purpose' });
  }

  const check = await checkOtp({ phone, otp, purpose });
  if (!check.ok) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  const nowIso = new Date().toISOString();
  let userName = check.session.name || '';
  const existingUser = await User.findOne({ phone }, { _id: 0 }).lean();
  let userId;
  if (!existingUser) {
    userId = uuidv4();
    await User.create({ id: userId, phone, name: userName || 'User', createdAt: nowIso, lastLogin: nowIso });
  } else {
    userId = existingUser.id;
    const updateFields = { lastLogin: nowIso };
    if (userName && userName !== existingUser.name) updateFields.name = userName;
    await User.updateOne({ phone }, { $set: updateFields });
    if (!userName) userName = existingUser.name || 'User';
  }

  setUserSession(res, { phone, name: userName || 'User', userId });
  res.json({ success: true, phone, name: userName });
};

const SESSION_ENDED_MSG = {
  SESSION_REPLACED: 'You were logged out because your account was signed in on another device.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  BLOCKED: 'This account has been disabled. Please contact support.',
};

exports.me = async (req, res) => {
  if (req.sessionEnded) {
    return res.status(401).json({ error: SESSION_ENDED_MSG[req.sessionEnded], code: req.sessionEnded });
  }
  const user = getCurrentUser(req);
  if (!user) {
    // An expired token leaves the flag behind, which would make the site keep asking.
    clearUserSession(res);
    return res.status(401).json({ error: 'Not logged in' });
  }
  // Also covers sessions that started before wallets existed, which never pass through login.
  const wallet = await ensureWallet(user);
  res.json({ phone: user.phone, name: user.name, email: user.email || '', freeCredits: wallet.freeCredits });
};

exports.logout = async (req, res) => {
  const user = getCurrentUser(req);
  // Only revoke the token this device holds -- never sign out a newer session elsewhere.
  if (user && user.src === 'web' && user.sid) {
    await WebUser.updateOne({ id: user.userId, authToken: user.sid }, { $unset: { authToken: '' } });
  }
  clearUserSession(res);
  res.json({ success: true });
};

// ---------- Admin login (JWT httpOnly cookie, replaces FastAPI SessionMiddleware) ----------
// Admin login is mobile OTP only (2Factor), limited to the numbers in ADMIN_PHONES.
const ADMIN_OTP_PURPOSE = 'admin-login';

exports.adminSendOtp = async (req, res) => {
  const phone = normalizePhone((req.body || {}).phone);
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number.' });
  }
  const allowed = adminPhones();
  if (allowed.length === 0) {
    return res.status(503).json({ success: false, error: 'Admin login is not configured. Set ADMIN_PHONES in the API .env.' });
  }
  const body = { success: true, message: `OTP sent to ${maskPhone(phone)}` };
  // Same reply for any number, with no SMS sent, so this route can't be used to find admin numbers.
  if (!allowed.includes(phone)) return res.json(body);

  const result = await issueOtp({ phone, purpose: ADMIN_OTP_PURPOSE });
  if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });

  if (result.devOtp && process.env.NODE_ENV !== 'production') body.dev_otp = result.devOtp;
  res.json(body);
};

exports.adminVerifyOtp = async (req, res) => {
  const body = req.body || {};
  const phone = normalizePhone(body.phone);
  const otp = String(body.otp || '').trim();
  if (!isValidPhone(phone) || !/^\d{4}$/.test(otp)) {
    return res.status(400).json({ success: false, error: 'Invalid phone or OTP format' });
  }
  // Matches checkOtp's "no session" reply, so a non-admin number looks like any expired OTP.
  if (!adminPhones().includes(phone)) {
    return res.status(400).json({ success: false, error: 'No valid OTP session found. Please request a new OTP.' });
  }

  const check = await checkOtp({ phone, otp, purpose: ADMIN_OTP_PURPOSE });
  if (!check.ok) return res.status(check.status).json({ success: false, error: check.error });

  const token = jwt.sign({ isAdmin: true, via: 'otp', phone, username: maskPhone(phone) }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('admin_token', token, cookieOpts());
  res.json({ success: true });
};

exports.adminMe = async (req, res) => {
  res.json({ phone: req.admin.phone, username: req.admin.username });
};

exports.adminLogout = async (req, res) => {
  res.clearCookie('admin_token', sessionCookieOpts());
  res.json({ success: true });
};

// ---------- My properties (owner dashboard) ----------
exports.myProperties = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const [active, pending] = await Promise.all([
    Property.find({ contactPhone: user.phone }, { _id: 0 }).sort({ createdAt: -1 }).lean(),
    OwnerListing.find({ contactPhone: user.phone }, { _id: 0 }).sort({ submittedAt: -1 }).lean(),
  ]);
  res.json({ properties: active, pending });
};

exports.myInquiries = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const myProps = await Property.find({ contactPhone: user.phone }, { _id: 0, propertyId: 1 }).lean();
  const propIds = myProps.map((p) => p.propertyId);
  const inquiries = await Inquiry.find({ propertyId: { $in: propIds } }, { _id: 0 }).sort({ createdAt: -1 }).lean();
  res.json(inquiries);
};

// Requirements carry no user id, only the phone typed into the form, so match on that.
// Older rows may hold a +91/91/0-prefixed number; new ones are normalised in createRequirement.
// type "contact-us" rows are Contact-page messages stored in the same collection -- not requirements.
exports.myRequirements = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const phone = normalizePhone(user.phone);
  if (!isValidPhone(phone)) return res.json({ requirements: [] });

  const requirements = await Requirement.find(
    { phone: { $in: [phone, `+91${phone}`, `+91 ${phone}`, `91${phone}`, `0${phone}`] }, type: { $ne: 'contact-us' } },
    { _id: 0, id: 1, type: 1, property_type: 1, bhk: 1, budget_min: 1, budget_max: 1, city: 1, area: 1, notes: 1, status: 1, createdAt: 1 },
  ).sort({ createdAt: -1 }).lean();
  res.json({ requirements });
};

exports.updateMyPropertyStatus = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const { propertyId } = req.params;
  const { status } = req.body;
  const prop = await Property.findOne({ propertyId }, { _id: 0 }).lean();
  if (!prop || prop.contactPhone !== user.phone) return res.status(403).json({ error: 'Not your listing' });
  await Property.updateOne({ propertyId }, { $set: { status, updatedAt: new Date().toISOString() } });
  res.json({ success: true });
};

exports.deleteMyProperty = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const { propertyId } = req.params;
  const prop = await Property.findOne({ propertyId }, { _id: 0 }).lean();
  if (!prop || prop.contactPhone !== user.phone) return res.status(403).json({ error: 'Not your listing' });
  await Property.deleteOne({ propertyId });
  res.json({ success: true });
};

exports.editMyProperty = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });
  const { propertyId } = req.params;
  const prop = await Property.findOne({ propertyId }, { _id: 0 }).lean();
  if (!prop || prop.contactPhone !== user.phone) return res.status(403).json({ error: 'Not your listing' });
  const update = { ...req.body, updatedAt: new Date().toISOString() };
  delete update.propertyId;
  await Property.updateOne({ propertyId }, { $set: update });
  res.json({ success: true });
};

// ---------- Draft auto-save (port of /api/save-partial-property) ----------
exports.savePartialProperty = async (req, res) => {
  const data = req.body || {};
  const phone = data.contactPhone || '';
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const draftId = data.draftId || `DRAFT-${uuidv4().slice(0, 8).toUpperCase()}`;
  const draft = {
    draftId,
    contactPhone: phone,
    contactName: data.contactName || '',
    listingType: data.listingType || '',
    category: data.category || 'residential',
    transactionType: data.transactionType || 'buy',
    propertyType: data.propertyType || 'flat',
    bhk: data.bhk,
    cityId: data.city || '',
    areaId: data.area || '',
    premiseName: data.premiseName || '',
    price: data.price,
    sqft: data.sqft,
    furnishing: data.furnishing || '',
    completionPercent: data.completionPercent || 0,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  await PropertyDraft.updateOne(
    { draftId },
    { $set: draft, $setOnInsert: { createdAt: new Date().toISOString() } },
    { upsert: true },
  );

  res.json({ success: true, draftId, completionPercent: draft.completionPercent });
};

exports.uploadPropertyPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const { uploadImageToR2 } = require('../services/r2Storage');
  const result = await uploadImageToR2(req.file.buffer, req.file.originalname, 'properties');
  if (result.success) return res.json({ url: result.url });
  res.status(500).json({ error: result.error || 'Upload failed' });
};
