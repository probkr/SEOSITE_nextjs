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
  // Separate from approval (every live listing is approved): set by admin, or by a CRM import
  // row with verifyStatus "verified". Drives the card badge and the "Verified" filter.
  isVerified: { type: Boolean, default: false },
  slug: { type: String, required: true, unique: true },
  oldSlug: { type: String, default: '' },
  title: { type: String, default: '' },
  aiDescription: { type: String, default: '' },
  custom_schema: { type: String, default: '' },
  views: { type: Number, default: 0 },
  // listedDate: when the listing was first listed (the CRM's listedDate when it sends one).
  // The site's "Posted X ago", "newest first" and "Added in last N days" all use it.
  // createdAt: when the row was added to this collection (webhook, import or owner approval).
  listedDate: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'properties', strict: false, versionKey: false, timestamps: false });

// Safety net for every create path: a new row always gets createdAt, and listedDate falls back
// to it. Runs on Property.create() / doc.save(), not on updateOne().
PropertySchema.pre('validate', function setListingDates() {
  if (!this.createdAt) this.createdAt = new Date().toISOString();
  if (!this.listedDate) this.listedDate = this.createdAt;
});

PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, status: 1, isApproved: 1 });
PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, areaId: 1, status: 1 });

// "Newest first" (the default order everywhere) sorts on listedDate. These let MongoDB walk an
// index already in that order instead of sorting every match in memory: filter fields first,
// listedDate last. Mongoose creates them when the API starts.
PropertySchema.index({ listedDate: -1 });
PropertySchema.index({ status: 1, isApproved: 1, listedDate: -1 }); // homepage, /search
PropertySchema.index({ status: 1, isApproved: 1, transactionType: 1, listedDate: -1 }); // homepage Sale / Rent rows
PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, status: 1, isApproved: 1, listedDate: -1 }); // city listing pages
PropertySchema.index({ category: 1, transactionType: 1, cityId: 1, areaId: 1, status: 1, listedDate: -1 }); // area listing pages

module.exports = mongoose.model('Property', PropertySchema);
