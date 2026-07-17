const mongoose = require('mongoose');

// Generic key/value settings doc: {key: "site", site_name, contact_phone, whatsapp}
// or {key: "homepage_schema", schema: "<json-ld string>"}
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
}, { collection: 'settings', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Setting', SettingSchema);
