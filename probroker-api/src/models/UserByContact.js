const mongoose = require('mongoose');

// Properties a user has taken the contact of, one document per user. propertyIds holds each
// property's Mongo _id, oldest first. userId is the wallet's userId (see PaidUser), so a number
// with both a WebUser and a legacy "users" session still has a single list.
const UserByContactSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  propertyIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }], default: [] },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'UserByContact', versionKey: false, timestamps: false });

module.exports = mongoose.model('UserByContact', UserByContactSchema);
