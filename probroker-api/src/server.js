require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./config/db');
const publicRoutes = require('./routes/public.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const sitemapRoutes = require('./routes/sitemap.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'probroker-api', time: new Date().toISOString() });
});

// ---- Public JSON data API (new namespace consumed by the Next.js frontend) ----
app.use('/api/v1', publicRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/sitemap', sitemapRoutes);

// ---- Admin JSON API (behind JWT auth, consumed by the Next.js admin panel under /admin/...) ----
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    await connectDB();
  } catch (e) {
    console.error('[db] failed to connect to MongoDB. Server will still start, but requests that hit the DB will fail until MONGO_URL/DB_NAME are configured correctly.');
    console.error(e.message);
  }
  app.listen(PORT, () => {
    console.log(`[server] probroker-api listening on port ${PORT}`);
  });
}

start();

module.exports = app;
