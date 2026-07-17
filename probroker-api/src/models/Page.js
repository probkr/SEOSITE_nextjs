const mongoose = require('mongoose');

// Static site pages editor (about/privacy-policy/terms/contact) -- collection "site_pages" in the Python app.
const PageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  page_title: { type: String, default: '' },
  content: { type: String, default: '' },
  meta_title: { type: String, default: '' },
  meta_description: { type: String, default: '' },
  custom_schema: { type: String, default: '' },
  updated_at: { type: String, default: '' },
}, { collection: 'site_pages', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Page', PageSchema);
