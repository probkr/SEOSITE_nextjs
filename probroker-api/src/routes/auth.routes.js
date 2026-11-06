const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../controllers/authController');
const webAuth = require('../controllers/webAuthController');
const pub = require('../controllers/publicController');
const contact = require('../controllers/contactController');
const { requireAdmin } = require('../middleware/adminAuth');
const { requireUser } = require('../middleware/userAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Express 4 doesn't forward rejected promises to the error handler -- route them there explicitly.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/otp/send', wrap(auth.otpSend));
router.post('/otp/verify', wrap(auth.otpVerify));
router.get('/auth/me', wrap(auth.me));
router.post('/auth/logout', auth.logout);

// WebUser accounts (/auth/signup and /auth/login pages on the site)
router.post('/auth/signup/send-otp', wrap(webAuth.signupSendOtp));
router.post('/auth/signup/verify', wrap(webAuth.signupVerify));
router.post('/auth/login/send-otp', wrap(webAuth.loginSendOtp));
router.post('/auth/login/verify', wrap(webAuth.loginVerify));

// "Get Contact" on a property page: spends one credit from the user's PaidUsers wallet.
// Off by default: owner numbers stay private and visitors use the inquiry form.
const creditsEnabled = (req, res, next) => (
  process.env.CONTACT_CREDITS_ENABLED === 'true' ? next() : res.status(404).json({ error: 'Not found' })
);
router.post('/properties/contact', creditsEnabled, requireUser, wrap(contact.getContact));
router.get('/my-contacts', creditsEnabled, requireUser, wrap(contact.myContacts));

router.post('/admin/login/send-otp', wrap(auth.adminSendOtp));
router.post('/admin/login/verify', wrap(auth.adminVerifyOtp));
router.get('/admin/me', requireAdmin, auth.adminMe);
router.post('/admin/logout', auth.adminLogout);

router.get('/my-properties', auth.myProperties);
router.get('/my-inquiries', auth.myInquiries);
router.get('/my-requirements', auth.myRequirements);
router.post('/my-properties/:propertyId/status', auth.updateMyPropertyStatus);
router.post('/my-properties/:propertyId/delete', auth.deleteMyProperty);
router.post('/my-properties/:propertyId/edit', auth.editMyProperty);

router.post('/save-partial-property', auth.savePartialProperty);
router.post('/upload-property-photo', upload.single('file'), auth.uploadPropertyPhoto);

// save-first-then-photos submission that also accepts multipart photos[] uploads
router.post('/post-property', upload.array('photos'), pub.createProperty);

module.exports = router;
