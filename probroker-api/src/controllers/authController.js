const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const OtpSession = require('../models/OtpSession');
const User = require('../models/User');
const Property = require('../models/Property');
const OwnerListing = require('../models/OwnerListing');
const Inquiry = require('../models/Inquiry');
const PropertyDraft = require('../models/PropertyDraft');
const { sendOtpSms, verifyOtpSession } = require('../services/smsService');
const { getCurrentUser } = require('../middleware/userAuth');

function normalizePhone(raw) {
  let phone = String(raw || '').trim().replace('+91', '').replace(/\s+/g, '');
  if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  return phone.slice(-10);
}

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// ---------- OTP ----------
exports.otpSend = async (req, res) => {
  const { phone: rawPhone, name = '', purpose = 'login' } = req.body || {};
  const phone = normalizePhone(rawPhone);
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number. Must be 10 digits.' });
  }

  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recentCount = await OtpSession.countDocuments({ phone, createdAt: { $gte: tenMinAgo } });
  if (recentCount >= 3) {
    return res.status(429).json({ success: false, error: 'Too many OTP requests. Please wait 10 minutes.' });
  }

  const result = await sendOtpSms(phone);
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error || 'Failed to send OTP' });
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);
  await OtpSession.create({
    phone, name, otp: result.otp, session_id: result.session_id || '',
    purpose, createdAt: now.toISOString(), expiresAt: expires.toISOString(),
    isUsed: false, attempts: 0,
  });

  const maskedPhone = `****${phone.slice(-4)}`;
  const respData = { success: true, message: `OTP sent to ${maskedPhone}` };
  if (result.dev_mode) respData.dev_otp = result.otp;
  res.json(respData);
};

exports.otpVerify = async (req, res) => {
  const { phone: rawPhone, otp: otpEntered = '', purpose = 'login' } = req.body || {};
  const phone = normalizePhone(rawPhone);
  const otp = String(otpEntered).trim();

  if (phone.length !== 10 || otp.length !== 4) {
    return res.status(400).json({ success: false, error: 'Invalid phone or OTP format' });
  }

  const nowIso = new Date().toISOString();
  const session = await OtpSession.findOne(
    { phone, purpose, isUsed: false, expiresAt: { $gte: nowIso } },
    { _id: 0 },
  ).sort({ createdAt: -1 }).lean();

  if (!session) {
    return res.status(400).json({ success: false, error: 'No valid OTP session found. Please request a new OTP.' });
  }

  if ((session.attempts || 0) >= 3) {
    await OtpSession.updateOne({ phone, session_id: session.session_id }, { $set: { isUsed: true } });
    return res.status(400).json({ success: false, error: 'Too many wrong attempts. Please request a new OTP.' });
  }

  let verified = false;
  if (session.session_id) verified = await verifyOtpSession(session.session_id, otp);
  if (!verified) verified = otp === session.otp;

  if (verified) {
    await OtpSession.updateOne({ phone, session_id: session.session_id }, { $set: { isUsed: true } });

    let userName = session.name || '';
    let existingUser = await User.findOne({ phone }, { _id: 0 }).lean();
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

    const token = jwt.sign({ phone, name: userName || 'User', userId }, process.env.SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.cookie('user_token', token, cookieOpts());
    return res.json({ success: true, phone, name: userName });
  }

  const remaining = 2 - (session.attempts || 0);
  await OtpSession.updateOne({ phone, session_id: session.session_id }, { $inc: { attempts: 1 } });
  const errorMsg = remaining > 0
    ? `Wrong OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    : 'Too many wrong attempts. Please request a new OTP.';
  res.status(400).json({ success: false, error: errorMsg });
};

exports.me = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ phone: user.phone, name: user.name });
};

exports.logout = async (req, res) => {
  res.clearCookie('user_token');
  res.json({ success: true });
};

// ---------- Admin login (JWT httpOnly cookie, replaces FastAPI SessionMiddleware) ----------
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true, username }, process.env.SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.cookie('admin_token', token, cookieOpts());
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Invalid username or password' });
};

exports.adminLogout = async (req, res) => {
  res.clearCookie('admin_token');
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
