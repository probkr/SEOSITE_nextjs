const express = require('express');
const router = express.Router();
const pub = require('../controllers/publicController');

router.get('/cities', pub.listCities);
router.get('/cities/:slug', pub.getCityBySlug);

router.get('/areas', pub.listAreas);
router.get('/areas/:slug', pub.getAreaBySlug);

router.get('/societies', pub.listSocieties);
router.get('/societies/:slug', pub.getSocietyBySlug);

router.get('/properties/latest', pub.latestProperties);
router.get('/properties/similar', pub.similarProperties);
router.get('/properties', pub.listProperties);
router.get('/properties/:slug', pub.getPropertyBySlug);
router.post('/properties', pub.createProperty);
router.patch('/properties/:id', pub.updateProperty);
router.delete('/properties/:id', pub.deleteProperty);

router.post('/inquiries', pub.createInquiry);
router.post('/requirements', pub.createRequirement);

router.get('/search', pub.search);
router.get('/stats/:citySlug', pub.cityStats);

router.get('/blog', pub.listBlogPosts);
router.get('/blog/latest', pub.latestBlogPosts);
router.get('/blog/:slug', pub.getBlogPostBySlug);

router.get('/societies-featured/popular', pub.popularSocieties);

module.exports = router;
