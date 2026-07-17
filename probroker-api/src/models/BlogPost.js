const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, default: '' },
  excerpt: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  featuredImage: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: String, default: 'Admin' },
  views: { type: Number, default: 0 },
  publishedAt: { type: String, default: '' },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'blog_posts', strict: false, versionKey: false, timestamps: false });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
