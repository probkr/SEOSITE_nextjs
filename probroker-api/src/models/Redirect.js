const mongoose = require('mongoose');

const RedirectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  source_url: { type: String, required: true, index: true },
  destination_url: { type: String, required: true },
  redirect_type: { type: String, default: '301' },
  is_active: { type: Boolean, default: true },
  createdAt: { type: String },
}, { collection: 'redirects', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Redirect', RedirectSchema);
