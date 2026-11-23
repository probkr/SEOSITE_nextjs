const mongoose = require('mongoose');

// In-feed ad cards shown between property cards on the public site (admin: /admin/ads).
// placements: which kind of page shows it ('listing', 'landing', 'society'); empty = every kind.
// cities: city slugs it is limited to; empty = every city.
// start_date / end_date: 'YYYY-MM-DD' (inclusive, India time); empty = no limit.
const AdSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image_url: { type: String, required: true },
  link_url: { type: String, required: true },
  cta_text: { type: String, default: 'Know More' },
  placements: { type: [String], default: [] },
  cities: { type: [String], default: [] },
  priority: { type: Number, default: 0 },
  start_date: { type: String, default: '' },
  end_date: { type: String, default: '' },
  is_active: { type: Boolean, default: true, index: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'ads', versionKey: false, timestamps: false });

module.exports = mongoose.model('Ad', AdSchema);
