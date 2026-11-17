const mongoose = require('mongoose');

// Website accounts created via /auth/signup (mobile verified by OTP; name and email optional).
// Separate from the legacy "users" collection, which is auto-filled by the old /otp/verify flow.
const WebUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, trim: true, default: '' },
  phone: { type: String, required: true, unique: true },
  // Optional. Leave the field out (never '') when there is none: see the index below.
  email: { type: String, trim: true, lowercase: true },
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

// One account per email, counting only accounts that have one: a missing email is left out of
// the index, so any number of phone-only accounts can exist.
WebUserSchema.index(
  { email: 1 },
  { name: 'email_unique_if_set', unique: true, partialFilterExpression: { email: { $gt: '' } } },
);

// The first version required email, with a plain unique index (email_1) that counts a missing
// email as null, so a second phone-only account would be rejected. Swaps it for the index above.
// Safe to run on every start: it does nothing once email_1 is gone.
WebUserSchema.statics.migrateEmailIndex = async function migrateEmailIndex() {
  const indexes = await this.collection.indexes().catch(() => []);
  if (indexes.some((i) => i.name === 'email_1')) {
    await this.collection.dropIndex('email_1');
    console.log('[db] web_users: replaced email_1 with email_unique_if_set (email is now optional)');
  }
  await this.createIndexes();
};

module.exports = mongoose.model('WebUser', WebUserSchema);
