const mongoose = require('mongoose');

// Property-owner users created/updated on successful OTP verification (collection "users").
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: 'User' },
  createdAt: { type: String },
  lastLogin: { type: String },
}, { collection: 'users', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('User', UserSchema);
