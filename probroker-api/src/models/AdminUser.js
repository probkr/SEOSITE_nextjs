const mongoose = require('mongoose');

/**
 * NOTE: The original Python app does NOT have a DB-backed admin user collection --
 * it authenticates a single admin against ADMIN_USERNAME/ADMIN_PASSWORD env vars
 * (see server.py admin_login()). This model is provided for the Express app's
 * documented structure and to allow multi-admin support later, but src/middleware/adminAuth.js
 * and the /api/v1/admin/login route currently replicate the original single-admin,
 * env-var-based behavior for parity. Wire this model in if/when you need multiple admins.
 */
const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'admin_users' });

module.exports = mongoose.model('AdminUser', AdminUserSchema);
