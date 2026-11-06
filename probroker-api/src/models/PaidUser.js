const mongoose = require('mongoose');

// Contact-credit wallet, one per phone number. Keyed on phone rather than user id because a
// verified number can hold both a WebUser and a legacy "users" session, and should only get one
// set of free credits. unlockedProperties is what makes re-opening a paid-for contact free.
const PaidUserSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  freeCredits: { type: Number, default: 0, min: 0 },
  unlockedProperties: {
    type: [new mongoose.Schema({ propertyId: String, unlockedAt: String }, { _id: false })],
    default: [],
  },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'PaidUsers', versionKey: false, timestamps: false });

module.exports = mongoose.model('PaidUser', PaidUserSchema);
