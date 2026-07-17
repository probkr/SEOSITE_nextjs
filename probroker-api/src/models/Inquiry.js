const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  message: { type: String, default: '' },
  budget: { type: String, default: '' },
  visitDate: { type: String, default: '' },
  createdAt: { type: String, index: true },
}, { collection: 'inquiries', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Inquiry', InquirySchema);
