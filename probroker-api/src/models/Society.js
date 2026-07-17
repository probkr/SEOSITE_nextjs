const mongoose = require('mongoose');

// society_edit.html adds a large set of rich-content/marketing fields beyond schemas.py.
const SocietySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  areaId: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  project_type: { type: String, default: 'residential' },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },
  builderName: { type: String, default: '' },
  reraNumber: { type: String, default: '' },
  totalUnits: { type: Number, default: null },
  amenities: { type: [String], default: [] },
  configuration: { type: String, default: '' },
  priceRange: { type: String, default: '' },
  min_price: { type: Number, default: null },
  max_price: { type: Number, default: null },
  possessionDate: { type: String, default: '' },
  location_advantages: { type: String, default: '' },
  facilities_description: { type: String, default: '' },
  faqs: { type: [{ question: String, answer: String }], default: [] },
  images: { type: [String], default: [] },
  brochureUrl: { type: String, default: '' },
  is_featured: { type: Boolean, default: false },
  custom_schema: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'societies', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Society', SocietySchema);
