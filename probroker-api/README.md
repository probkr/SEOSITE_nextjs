# probroker-api

Node.js / Express + MongoDB (Mongoose) port of the PRObroker Python FastAPI backend
(`https://github.com/probkr/newmainseosite`, `backend/server.py`). Reuses the **same MongoDB
database and collection names** as the Python app (`cities`, `areas`, `societies`, `properties`,
`inquiries`, `owner_listings`, `redirects`, `blog_posts`, `site_pages`, `settings`, `users`,
`otp_sessions`, `property_drafts`, `import_jobs`, `requirements`) — no data migration needed.

## Setup

```bash
cd probroker-api
cp .env.example .env   # fill in real values
npm install
npm start               # or: npm run dev (nodemon)
```

Server listens on `PORT` (default 8000). `GET /health` is a liveness check that does not touch
the database.

## Environment variables

| Var | Purpose | Old Python equivalent |
|---|---|---|
| `MONGO_URL` | MongoDB connection string | `os.environ['MONGO_URL']` |
| `DB_NAME` | Database name | `os.environ['DB_NAME']` |
| `PORT` | HTTP port | `os.environ.get('PORT')` |
| `NODE_ENV` | `development`/`production` | — |
| `CORS_ORIGINS` | Comma-separated allowed origins for the Next.js app(s) | (FastAPI CORSMiddleware) |
| `SECRET_KEY` | JWT signing secret for both admin and OTP-user sessions | `os.environ.get('SECRET_KEY')` (session signing) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Single-admin credentials checked on login | `os.environ.get('ADMIN_USERNAME'/'ADMIN_PASSWORD')` |
| `JWT_EXPIRES_IN` | JWT/cookie lifetime (default `7d`) | (session cookie lifetime) |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cloudflare R2 (S3-compatible) storage | same names in `services/r2_storage.py` |
| `TWOFACTOR_API_KEY` / `TWOFACTOR_TEMPLATE` | 2Factor.in SMS OTP provider | same names in `services/sms_service.py`. Blank/placeholder falls back to **dev mode**, returning `dev_otp` directly in the `/api/v1/otp/send` response body. |
| `WEBHOOK_SECRET` | Reserved for the `/api/webhook/property` equivalent (not yet wired — see "Not ported" below) | `os.environ.get('WEBHOOK_SECRET')` |

## Project layout

```
src/
  server.js              Express app entrypoint, mounts all routers, connects DB (non-fatal on failure)
  config/db.js            Mongoose connection
  models/                 One file per Mongoose schema (collection names match the Python app)
  routes/
    public.routes.js      Public JSON data API -> /api/v1/*
    auth.routes.js        OTP auth + admin login + owner "my properties" dashboard -> /api/v1/*
    upload.routes.js       Generic image upload -> /api/v1/upload
    admin.routes.js        All ~35 admin CRUD endpoints, behind requireAdmin -> /api/admin/*
    sitemap.routes.js      JSON data feeds for the Next.js app to build sitemap-*.xml -> /api/v1/sitemap/*
  controllers/            Route handler logic (publicController, authController, adminController, uploadController)
  middleware/
    adminAuth.js           JWT httpOnly-cookie admin guard (replaces FastAPI SessionMiddleware is_admin check)
    userAuth.js             JWT httpOnly-cookie OTP-user guard
  services/
    slugify.js              generateSlug / generatePropertySlug / generatePropertyId (byte-for-byte port of database.py)
    priceFormat.js           formatPrice + generateAiDescription (port of database.py)
    r2Storage.js             Cloudflare R2 upload/delete/stats via @aws-sdk/client-s3 + sharp (port of r2_storage.py)
    smsService.js            2Factor.in OTP send/verify with dev-mode fallback (port of sms_service.py)
```

## Mapping to the old Python routes

The old app conflated "admin UI" and "admin API" under `/api/admin/...` (HTML templates,
not JSON). This Express app is JSON-only; the Next.js admin panel (separate workstream)
renders `/admin/...` in the browser and calls this API at `/api/admin/...` under the hood.

| Old FastAPI (server.py) | New Express |
|---|---|
| `GET /api/cities`, `/api/areas`, `/api/societies`, `/api/properties`, `/api/properties/{slug}`, `/api/society/{slug}`, `/api/area/{city}/{area}`, `/api/stats/{city}` | `GET /api/v1/cities[...]`, `/api/v1/areas[...]`, `/api/v1/societies[...]`, `/api/v1/properties[...]` (same filter semantics, both snake_case and camelCase query params accepted, see `publicController.listProperties`) |
| `POST /api/post-property`, `POST /post-property/` | `POST /api/v1/post-property` and `POST /api/v1/properties` (identical save-first-then-photos logic in `publicController.createProperty`) |
| `POST /api/save-partial-property` | `POST /api/v1/save-partial-property` |
| `POST /api/upload-property-photo`, `POST /api/upload-image` | `POST /api/v1/upload-property-photo`, `POST /api/v1/upload` |
| `POST /api/otp/send`, `POST /api/otp/verify` | `POST /api/v1/otp/send`, `POST /api/v1/otp/verify` (issues an httpOnly `user_token` JWT cookie instead of a server session) |
| `POST /api/admin/login/`, `GET /api/admin/logout/` | `POST /api/v1/admin/login`, `POST /api/v1/admin/logout` (issues an httpOnly `admin_token` JWT cookie) |
| `GET/POST /api/admin/listings/...`, `/api/admin/owner-listings/...`, `/api/admin/areas/...`, `/api/admin/societies/...`, `/api/admin/cities/...`, `/api/admin/inquiries/...`, `/api/admin/import*`, `/api/admin/export*`, `/api/admin/settings/...`, `/api/admin/pages/...`, `/api/admin/redirects/...`, `/api/admin/blog/...` | Same paths, JSON-only, under `/api/admin/...`, all behind `requireAdmin` -- see `src/routes/admin.routes.js` for the full 1:1 route table and `src/controllers/adminController.js` for the ported logic (approval workflow, CSV/XLSX export, ZIP backup export, redirect-loop detection, featured toggles, etc.) |
| `GET /sitemap*.xml` | `GET /api/v1/sitemap/{properties,societies,areas,pages,blogs}` return JSON feeds; the Next.js app renders the actual XML (contract explicitly allows either approach) |
| `GET /api/inquiry`, `/api/inquiries` | `POST /api/v1/inquiries` |
| `POST /api/submit-requirement` | `POST /api/v1/requirements` |
| `GET /api/my-properties`, `/api/my-inquiries`, `POST /api/my-properties/{id}/status` | `GET /api/v1/my-properties`, `/api/v1/my-inquiries`, `POST /api/v1/my-properties/:propertyId/status` |
| `GET /blog/`, `/blog/{slug}/` | `GET /api/v1/blog`, `/api/v1/blog/:slug` |
| `GET /api/admin/migrate-slugs/` | `GET /api/admin/migrate-slugs` (one-time slug regeneration utility) |
| `GET /api/admin/r2-status` | `GET /api/admin/r2-status` |

## Not fully ported / simplified (be aware before going to production)

- **HTML admin UI, Jinja2 templates, session-cookie CSRF**: intentionally dropped per the shared
  contract -- the Next.js admin panel replaces all `templates/admin/*.html` rendering. Only the
  JSON logic behind each handler was ported.
- **`POST /api/webhook/property`** (external webhook ingesting a single property, guarded by
  `WEBHOOK_SECRET`) was not ported -- not in the contract's minimum endpoint set and its payload
  shape wasn't fully specified in the time available. `WEBHOOK_SECRET` is still in `.env.example`
  as a placeholder for whoever adds it.
- **`POST /api/admin/seed-sample-data`** (dev-only sample data seeder using `SAMPLE_PROBROKER_DATA`)
  was not ported -- low value for a production port; `bulk-import`/`bulk-import-csv` cover the
  real-world import path and were fully ported instead.
- **`utils/property_mapper.py`'s full `map_probroker_to_seo` / `generate_amenities` pipeline**
  (unit-type dictionaries, amenity-keyword extraction, 80-word-minimum SEO description generator)
  was simplified in `adminController.processBulkImport` to field-name normalization + slug/area/
  society auto-creation, matching the *data* that ends up in Mongo but not the full auto-generated
  marketing copy. If bulk imports need the original ProBroker CRM field mapping (`unitType`,
  `rentValue`, etc.), port the rest of `property_mapper.py` into `src/services/propertyMapper.js`.
- **`generatePropertyId()`** uses a random 5-digit number instead of Python's
  `str(uuid.uuid4().int)[:5]` -- same format (`PB` + 5 digits), not a byte-for-byte RNG port,
  collision risk is handled the same way the old app did (none -- rely on the unique index).
- **XLSX auto-column-width / styling** in exports/backup uses `exceljs` instead of `openpyxl`;
  visually equivalent (bold white-on-navy header row, ~50-char column cap) but not pixel-identical.
- **Admin password change** (`POST /api/admin/settings/password`) is in-memory only, matching the
  original Python behavior (`global ADMIN_PASSWORD`) -- it resets to `.env` on restart. Flag this
  as a known limitation if the intern expects persistence; wire it to the `AdminUser` model
  (`src/models/AdminUser.js`, currently unused) for a durable fix.
- **`AdminUser` Mongoose model** is scaffolded but not wired into login, since the original app
  has no DB-backed multi-admin support either (see the NOTE at the top of that file).

## Verifying the app boots

```bash
node -c src/server.js   # syntax check
npm start                # full boot; safe even without a reachable MongoDB (logs a warning, keeps serving)
```
