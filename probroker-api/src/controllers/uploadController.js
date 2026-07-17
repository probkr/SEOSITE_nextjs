const { uploadImageToR2, testR2Connection, getR2Stats } = require('../services/r2Storage');

// Generic image upload endpoint -- POST /api/v1/upload (port of POST /api/upload-image)
exports.uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const folder = req.body.folder || req.query.folder || 'properties';
  const result = await uploadImageToR2(req.file.buffer, req.file.originalname, folder);
  if (result.success) return res.json({ success: true, url: result.url });
  res.status(500).json({ success: false, error: result.error || 'Upload failed' });
};

exports.r2Status = async (req, res) => {
  const status = await testR2Connection();
  const stats = await getR2Stats();
  res.json({ ...status, ...stats });
};
