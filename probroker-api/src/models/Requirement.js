const mongoose = require('mongoose');

// Exact port of POST /api/submit-requirement fields in server.py (~line 1818), collection "requirements".
const RequirementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, default: 'buy' },
  budget_min: { type: Number, default: 0 },
  budget_max: { type: Number, default: 0 },
  city: { type: String, default: '' },
  area: { type: String, default: '' },
  bhk: { type: String, default: '' },
  property_type: { type: String, default: '' },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'new' },
  createdAt: { type: String },
}, { collection: 'requirements', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Requirement', RequirementSchema);
