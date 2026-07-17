const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Society = require('../models/Society');
const Area = require('../models/Area');
const City = require('../models/City');
const Page = require('../models/Page');
const BlogPost = require('../models/BlogPost');
const Redirect = require('../models/Redirect');

router.get('/properties', async (req, res) => {
  const properties = await Property.find({ status: 'active', isApproved: true }, { _id: 0, slug: 1, updatedAt: 1 }).lean();
  res.json(properties.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })));
});

router.get('/societies', async (req, res) => {
  const societies = await Society.find({ isActive: true }, { _id: 0, slug: 1, updatedAt: 1 }).lean();
  res.json(societies.map((s) => ({ slug: s.slug, updatedAt: s.updatedAt })));
});

router.get('/areas', async (req, res) => {
  const areas = await Area.find({ isActive: true }, { _id: 0, slug: 1, cityId: 1, updatedAt: 1 }).lean();
  const cities = await City.find({}, { _id: 0, id: 1, slug: 1 }).lean();
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c.slug]));
  res.json(areas.map((a) => ({ slug: a.slug, citySlug: cityMap[a.cityId] || '', updatedAt: a.updatedAt })));
});

router.get('/pages', async (req, res) => {
  const pages = await Page.find({}, { _id: 0, slug: 1, updated_at: 1 }).lean();
  res.json(pages);
});

router.get('/blogs', async (req, res) => {
  const posts = await BlogPost.find({ status: 'published' }, { _id: 0, slug: 1, updatedAt: 1 }).lean();
  res.json(posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })));
});

router.get('/redirect-lookup', async (req, res) => {
  const path = req.query.path || '';
  const redirect = await Redirect.findOne({ source_url: path, is_active: true }, { _id: 0 }).lean();
  if (!redirect) return res.status(404).json({ found: false });
  res.json({ found: true, destination: redirect.destination_url, type: redirect.redirect_type });
});

module.exports = router;
