const mongoose = require('mongoose');

const ImportJobSchema = new mongoose.Schema({
  job_id: { type: String, required: true, unique: true },
}, { collection: 'import_jobs', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('ImportJob', ImportJobSchema);
