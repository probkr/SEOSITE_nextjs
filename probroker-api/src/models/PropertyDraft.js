const mongoose = require('mongoose');

const PropertyDraftSchema = new mongoose.Schema({
  draftId: { type: String, required: true, unique: true },
}, { collection: 'property_drafts', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('PropertyDraft', PropertyDraftSchema);
