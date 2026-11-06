require('dotenv').config();
require('./config/secrets').assertSecrets();

const express = require('express');
// Express 4 ignores rejected async handlers, so one failed request would kill the whole process.
// This sends them to the error handler below. It must load before any route is defined.
require('express-async-errors');
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
const webhookRoutes = require('./routes/webhook.routes');
const { resolveUserSession } = require('./middleware/userAuth');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Inbound webhooks (shared-secret auth) ----
// Mounted before the site CORS policy: callers authenticate with a Bearer WEBHOOK_AUTH_KEY,
// not cookies, so any origin (e.g. the CRM web app) may call it; without the key it is a 401.
app.use(
  '/api/v1/webhooks',
  cors({ origin: true, methods: ['POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }),
  express.json({ limit: '10mb' }),
  webhookRoutes,
);

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
// Bulk imports send large JSON bodies; everything else keeps the smaller limit.
app.use('/api/v1/admin', express.json({ limit: '50mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'probroker-api', time: new Date().toISOString() });
});

// Resolves the user_token cookie once per request and drops WebUser sessions that were
// replaced by a login on another device (see middleware/userAuth.js).
app.use('/api/v1', resolveUserSession);

// ---- Public JSON data API (new namespace consumed by the Next.js frontend) ----
app.use('/api/v1', publicRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/sitemap', sitemapRoutes);

// ---- Admin JSON API (behind JWT auth, consumed by the Next.js admin panel under /admin/...) ----
app.use('/api/v1/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const clientError = err.name === 'ValidationError' || err.name === 'MulterError';
  const status = err.status || (clientError ? 400 : 500);
  if (status >= 500) console.error(err);
  // Server-side failures can carry database details, so those stay in the logs.
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

// Background work such as bulk imports runs outside any request, so the handler above can't see it.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
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
