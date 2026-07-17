const mongoose = require('mongoose');

const OtpSessionSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  name: { type: String, default: '' },
  otp: { type: String, required: true },
  session_id: { type: String, default: '' },
  purpose: { type: String, default: 'login' },
  createdAt: { type: String },
  expiresAt: { type: String },
  isUsed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
}, { collection: 'otp_sessions', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('OtpSession', OtpSessionSchema);
