const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../controllers/authController');
const pub = require('../controllers/publicController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/otp/send', auth.otpSend);
router.post('/otp/verify', auth.otpVerify);
router.get('/auth/me', auth.me);
router.post('/auth/logout', auth.logout);

router.post('/admin/login', auth.adminLogin);
router.post('/admin/logout', auth.adminLogout);

router.get('/my-properties', auth.myProperties);
router.get('/my-inquiries', auth.myInquiries);
router.post('/my-properties/:propertyId/status', auth.updateMyPropertyStatus);
router.post('/my-properties/:propertyId/delete', auth.deleteMyProperty);
router.post('/my-properties/:propertyId/edit', auth.editMyProperty);

router.post('/save-partial-property', auth.savePartialProperty);
router.post('/upload-property-photo', upload.single('file'), auth.uploadPropertyPhoto);

// save-first-then-photos submission that also accepts multipart photos[] uploads
router.post('/post-property', upload.array('photos'), pub.createProperty);

module.exports = router;
