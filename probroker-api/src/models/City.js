const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  state: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  createdAt: { type: String },
}, { collection: 'cities', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('City', CitySchema);
