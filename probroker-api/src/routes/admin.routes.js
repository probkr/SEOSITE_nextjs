const express = require('express');
const multer = require('multer');
const router = express.Router();
const admin = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadFields = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// All routes below require a valid admin JWT (see middleware/adminAuth.js)
router.use(requireAdmin);

router.get('/dashboard', admin.dashboard);

// Listings (properties)
router.get('/listings', admin.listListings);
router.post('/listings/:propertyId/status', admin.updateListingStatus);
router.post('/listings/:propertyId/delete', admin.deleteListing);
router.get('/listings/:propertyId/edit', admin.getListingForEdit);
router.post('/listings/:propertyId/edit', admin.saveListingEdit);
router.post('/listings/:propertyId/upload-image', upload.single('file'), admin.uploadListingImage);

// Owner listings (pending approval)
router.get('/owner-listings', admin.listOwnerListings);
router.post('/owner-listings/:listingId/approve', admin.approveOwnerListing);
router.post('/owner-listings/:listingId/reject', admin.rejectOwnerListing);

// Areas
router.get('/areas', admin.listAreasAdmin);
router.post('/areas/add', admin.addArea);
router.get('/areas/edit/:areaId', admin.getAreaForEdit);
router.post('/areas/edit/:areaId', admin.saveAreaEdit);
router.post('/areas/delete/:areaId', admin.deleteArea);
router.post('/areas/toggle-featured/:areaId', admin.toggleAreaFeatured);

// Societies
router.get('/societies', admin.listSocietiesAdmin);
router.post('/societies/add', admin.addSociety);
router.get('/societies/edit/:societyId', admin.getSocietyForEdit);
router.post(
  '/societies/edit/:societyId',
  uploadFields.fields([{ name: 'new_images', maxCount: 20 }, { name: 'brochure_file', maxCount: 1 }]),
  admin.saveSocietyEdit,
);
router.post('/societies/delete/:societyId', admin.deleteSociety);
router.post('/societies/toggle-featured/:societyId', admin.toggleSocietyFeatured);

// Cities
router.get('/cities', admin.listCitiesAdmin);
router.post('/cities/add', admin.addCity);

// Inquiries
router.get('/inquiries', admin.listInquiries);
router.get('/inquiries/export', admin.exportInquiries);

// Bulk import
router.post('/bulk-import', admin.bulkImport);
router.post('/bulk-import-csv', upload.single('csv_file'), admin.bulkImportCsv);
router.get('/import-status/:jobId', admin.importStatus);

// Export
router.get('/export/:collection', admin.exportCollection);
router.get('/export-backup', admin.exportBackup);

// Settings
router.get('/settings', admin.getSettings);
router.post('/settings/password', admin.changeAdminPassword);
router.post('/settings/site', admin.saveSiteSettings);
router.post('/settings/homepage-schema', admin.saveHomepageSchema);
router.get('/settings/clear-homepage-schema', admin.clearHomepageSchema);

// Pages
router.get('/pages', admin.listPages);
router.get('/pages/edit/:slug', admin.getPageForEdit);
router.post('/pages/edit/:slug', admin.savePage);

// Redirects
router.get('/redirects', admin.listRedirects);
router.post('/redirects/add', admin.addRedirect);
router.post('/redirects/:redirectId/toggle', admin.toggleRedirect);
router.post('/redirects/:redirectId/delete', admin.deleteRedirect);

// Blog
router.get('/blog', admin.listBlogAdmin);
router.get('/blog/edit/:postId', admin.getBlogForEdit);
router.post('/blog/save', upload.single('featured_image_file'), admin.saveBlog);
router.post('/blog/delete/:postId', admin.deleteBlog);
router.post('/blog/upload-image', upload.single('image'), admin.uploadBlogImage);

// Utilities
router.get('/migrate-slugs', admin.migrateSlugs);
router.get('/r2-status', admin.r2Status);

module.exports = router;
