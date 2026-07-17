const mongoose = require('mongoose');

// schemas.py is outdated -- admin/area_edit.html adds rich content fields
// (overview, priceOverview, infrastructure, connectivity, lifestyle, faqs[]).
// `strict: false` lets any extra fields pass through untouched either way.
const AreaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },
  priceOverview: { type: String, default: '' },
  infrastructure: { type: String, default: '' },
  connectivity: { type: String, default: '' },
  lifestyle: { type: String, default: '' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  faqs: { type: [{ question: String, answer: String }], default: [] },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'areas', strict: false, versionKey: false, timestamps: false });

AreaSchema.index({ cityId: 1, isActive: 1 });

module.exports = mongoose.model('Area', AreaSchema);
