const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String, required: true, unique: true }, // "PB" + 5 digits
  category: { type: String, enum: ['residential', 'commercial'], required: true },
  transactionType: { type: String, enum: ['buy', 'rent'], required: true },
  propertyType: { type: String, required: true }, // flat|bungalow|tenement|office|shop|showroom|penthouse|plot|warehouse|... (lower-case, typos fixed by propertyCleaner)
  bhk: { type: Number, default: null },           // null when unknown / commercial (was 0)
  sqft: { type: Number, default: 0 },
  price: { type: Number, default: 0, index: true },
  premiseName: { type: String, default: '' },
  societyId: { type: String, default: null, index: true },
  areaId: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  nearby: { type: String, default: '' },
  description: { type: String, default: '' },      // 5-10 plain sentences built from the fields (2 paragraphs); no brokerage, phones, emojis
  ageOfProperty: { type: Number, default: null },  // years; lower end of a range ("5-10 years" -> 5), 0 = new
  furnishing: { type: String, default: 'unfurnished' },   // unfurnished | kitchen-fix | semi-furnished | furnished (normalised by propertyCleaner)
  familyOrBachelors: { type: String, default: null },     // family | bachelors | both; residential rent only, null otherwise
  floorNumber: { type: Number, default: null },    // 0 = ground, -1 = basement, null = unknown
  totalFloors: { type: Number, default: null },
  parking: { type: Boolean, default: false },
  additionalDetails: { type: String, default: '' },// only the free text that fits no field
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
  oldSlug: { type: String, default: '', index: true }, // old URLs redirect to the current slug
  title: { type: String, default: '' },
  aiDescription: { type: String, default: '' },
  custom_schema: { type: String, default: '' },
  views: { type: Number, default: 0 },
  amenities: { type: [String], default: [] },
  // listedDate: when the listing was first listed (the CRM's listedDate when it sends one).
  // The site's "Posted X ago", "newest first" and "Added in last N days" all use it.
  // createdAt: when the row was added to this collection (webhook, import or owner approval).
  listedDate: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },

  // ---- Fields pulled out of the description by propertyCleaner.js ----
  bedrooms: { type: Number, default: null },
  bathrooms: { type: Number, default: null },       // washrooms for commercial
  balconies: { type: Number, default: null },
  facing: { type: String, default: null },          // "East", "North-East", ...
  ageRange: { type: String, default: null },        // display text: "5-10 years", "New", "50+ years"
  washroomType: { type: String, enum: ['attached', 'common', 'none', null], default: null },
  parkingType: { type: String, enum: ['allotted', 'common', 'covered', null], default: null },
  parkingCount: { type: Number, default: null },
  maintenanceAmount: { type: Number, default: null },   // ₹
  maintenanceIncluded: { type: Boolean, default: null }, // in rent/price; null = not stated
  furnishingItems: { type: [String], default: [] },     // "Modular Kitchen", "AC", "Wardrobe", ...
  workstations: { type: Number, default: null },
  cabins: { type: Number, default: null },
  possessionStatus: { type: String, enum: ['ready_to_move', 'under_construction', null], default: null },
  possessionDate: { type: String, default: null },  // "Dec 2026"
  availableFrom: { type: String, default: null },   // "1st December", "01-04-2025"
  saleType: { type: String, enum: ['resale', 'new', null], default: null }, // buy only
  ownership: { type: String, enum: ['freehold', 'leasehold', null], default: null },
  reraApproved: { type: Boolean, default: null },
  // { carpet|superBuiltUp|builtUp|plot|construction|terrace: { value: Number, unit: 'sqft'|'sqyd'|'sqm' } }
  areaDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  alternatePhones: { type: [String], default: [] }, // extra numbers that were typed into the description; never sent to the site
  boundaryWall: { type: Boolean, default: null },   // plots
  // Data quality, recalculated on every clean
  missingFields: { type: [String], default: [], index: true }, // fields this property type should have but doesn't
  dataIssues: { type: [String], default: [] },                 // contradictions to check by hand
  // 'generated' = description was written by propertyCleaner from the fields. A raw CRM row never has it,
  // so the cleaner knows when to parse the text and when to trust the fields.
  descriptionSource: { type: String, default: null },
}, {
  // Live server: no env var, so it reads 'properties'. Local testing against another collection:
  // PROPERTIES_COLLECTION=properties_cleaned in probroker-api/.env (the API reads only .env).
  collection: process.env.PROPERTIES_COLLECTION || 'properties',
  strict: false, versionKey: false, timestamps: false,
});

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
