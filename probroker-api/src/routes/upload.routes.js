const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadCtrl = require('../controllers/uploadController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), uploadCtrl.uploadImage);

module.exports = router;
