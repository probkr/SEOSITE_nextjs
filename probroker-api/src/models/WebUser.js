const mongoose = require('mongoose');

// Website accounts created via /auth/signup (name + mobile + email, mobile verified by OTP).
// Separate from the legacy "users" collection, which is auto-filled by the old /otp/verify flow.
const WebUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  isPhoneVerified: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  createdAt: { type: String },
  updatedAt: { type: String },
  lastLogin: { type: String },
  // Single active session: each login stores a fresh random token here and embeds it in the
  // JWT cookie as `sid`. A newer login overwrites it, which invalidates every older device.
  authToken: { type: String, select: false },
  authTokenIssuedAt: { type: String },
  lastLoginIp: { type: String },
  lastLoginUserAgent: { type: String },
},{ collection: 'web_users', versionKey: false, timestamps: false });

module.exports = mongoose.model('WebUser', WebUserSchema);
