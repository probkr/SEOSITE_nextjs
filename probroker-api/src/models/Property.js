const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String, required: true, unique: true }, // "PB" + 5 digits
  category: { type: String, enum: ['residential', 'commercial'], required: true },
  transactionType: { type: String, enum: ['buy', 'rent'], required: true },
  propertyType: { type: String, required: true }, // flat|bungalow|tenement|office|shop|showroom|penthouse|plot|warehouse|...
  bhk: { type: Number, default: null },
  sqft: { type: Number, default: 0 },
  price: { type: Number, default: 0, index: true },
  premiseName: { type: String, default: '' },
  societyId: { type: String, default: null, index: true },
  areaId: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  nearby: { type: String, default: '' },
  description: { type: String, default: '' },
  ageOfProperty: { type: Number, default: null },
  furnishing: { type: String, default: 'unfurnished' },
  familyOrBachelors: { type: String, default: null },
  floorNumber: { type: Number, default: null },
  totalFloors: { type: Number, default: null },
  parking: { type: Boolean, default: false },
  additionalDetails: { type: String, default: '' },
  photos: { type: [String], default: [] },
  images: { type: [mongoose.Schema.Types.Mixed], default: [] }, // rich image objects (alt_text, order_index, is_primary)
  contactName: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  listingType: { type: String, default: 'broker' },
  status: { type: String, enum: ['active', 'sold', 'rented', 'pending'], default: 'active', index: true },
  source: { type: String, enum: ['probroker', 'owner'], default: 'probroker' },
  isApproved: { type: Boolean, default: true, index: true },
  slug: { type: String, required: true, unique: true },
  oldSlug: { type: String, default: '' },
  title: { type: String, default: '' },
  aiDescription: { type: String, default: '' },
  custom_schema: { type: String, default: '' },
  views: { type: Number, default: 0 },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'properties', strict: false, versionKey: false, timestamps: false });

PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, status: 1, isApproved: 1 });
PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, areaId: 1, status: 1 });

module.exports = mongoose.model('Property', PropertySchema);
