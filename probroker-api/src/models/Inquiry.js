const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  // Empty for general leads (LeadPopup, LeadCaptureCard), which aren't about one property.
  propertyId: { type: String, default: '', index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  message: { type: String, default: '' },
  budget: { type: String, default: '' },
  visitDate: { type: String, default: '' },
  // Set when the phone was confirmed by OTP (or is the logged-in user's own number).
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: String, index: true },
}, { collection: 'inquiries', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('Inquiry', InquirySchema);
