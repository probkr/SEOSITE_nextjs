# PRObroker Migration — Shared Contract

Source repo: https://github.com/probkr/newmainseosite (Python FastAPI + Jinja2 SSR).
Target: Node.js/Express API (`probroker-api`) + Next.js App Router frontend (`probroker-web`).

## CRITICAL: URL structure must not change

The live site currently ranks on these URL patterns. Any change to a public URL without a
301 redirect will cause a ranking crash. Every page below MUST resolve at the exact same path
as the old Jinja route (see backend/server.py route decorators). Trailing slashes must match too
(old app uses trailing slash on most routes, e.g. `/about/`, `/:citySlug/residential-property-for-sale/`).

Public route map (old FastAPI path -> meaning):
- `/` — homepage
- `/:citySlug/residential-property-for-sale/*` — city-level listing (also commercial-property-for-sale, residential-property-for-rent, commercial-property-for-rent)
- `/:citySlug/:areaSlug/residential-property-for-sale/*` — area-level listing (4 category/transaction combos)
- `/:citySlug/:catchAll/*` — SEO catch-all: BHK pages, budget pages, property-type pages (see frontend/src/App.js and backend templates bhk_area.html, budget.html, category_city.html for pattern)
- `/society/:societySlug/` — society detail
- `/property/:propertySlug/` — property detail
- `/societies/` and `/societies/:citySlug/` — society directory
- `/search/` — search page
- `/post-property/` — post property form (auth required via OTP)
- `/my-properties/` — user's own listings (auth required)
- `/edit-property/:propertyId/` — edit own listing
- `/submit-requirement/` — requirement form
- `/about/`, `/contact/`, `/privacy-policy/`, `/terms/` — static pages
- `/sitemap.xml`, `/sitemap-pages.xml`, `/sitemap-properties.xml`, `/sitemap-societies.xml`, `/sitemap-areas.xml`
- `/robots.txt`
- Old `/property-for-sale/` and `/property-for-rent/` paths 301-redirect to `residential-property-for-*` equivalents — preserve this redirect.
- Blog: check backend/server.py routes near line 4114+ and templates blog_list.html / blog_post.html for exact blog URL pattern.
- Admin: everything under `/api/admin/...` in the old app is actually the admin UI (not a JSON API — confusing naming from the original build). In the new app, put the admin UI under `/admin/...` (clean path) and keep `/api/admin/...` only for JSON endpoints the admin UI calls. Do NOT keep the admin UI on `/api/admin` in the new build.

## Data model (Mongoose schemas — mirrors backend/models/schemas.py)

Use MongoDB with the SAME database and collection names as the existing Python app so data
does not need migration: `cities`, `areas`, `societies`, `properties`, `inquiries`, `owner_listings`,
plus admin-managed collections inferred from backend/server.py admin routes: `redirects`, `blog_posts`,
`pages`, `settings`. Confirm exact field names for these last four by reading the admin route handlers
and corresponding templates (backend/templates/admin/redirects.html, blog.html/blog_edit.html,
pages.html/page_edit.html, settings.html) — do not guess field names, read the source.

Core fields (from backend/models/schemas.py):

```
City: { name, slug (unique), state, isActive }
Area: { name, slug, cityId, isActive, description, metaTitle, metaDescription, ...rich content fields added later — check backend/templates/admin/area_edit.html for the FULL current field list, schemas.py is outdated/incomplete }
Society: { name, slug (unique), areaId, cityId, description, totalUnits, amenities[], isActive, metaTitle, metaDescription, ...rich content fields — check backend/templates/admin/society_edit.html for FULL current field list }
Property: {
  propertyId (unique, format "PB" + 5 digits), category (residential|commercial), transactionType (buy|rent),
  propertyType (flat|bungalow|tenement|office|shop|showroom|penthouse|plot|warehouse), bhk, sqft, price,
  premiseName, societyId, areaId, cityId, nearby, description, ageOfProperty,
  furnishing (unfurnished|semi-furnished|fully-furnished), familyOrBachelors (family|bachelors|both),
  floorNumber, totalFloors, parking (bool), additionalDetails, photos[] (R2 URLs), contactName, contactPhone,
  status (active|sold|rented|pending), source (probroker|owner), isApproved (bool), slug (unique, SEO format
  below), aiDescription
}
Inquiry: { propertyId, name, phone, email, message, budget, visitDate, createdAt }
OwnerListing: same shape as Property + submittedAt (pending admin approval before becoming a real Property)
```

Slug generation (port exactly — used for SEO, must match old output so existing indexed URLs don't break):
See backend/models/database.py `generate_slug()` and `generate_property_slug()`:
```
generate_property_slug = `{bhk}bhk-{propertyType}-for-{sale|rent}-in-{societyNameSlugified}-{areaSlug}-{citySlug}-{propertyIdLowercase}`
(bhk part omitted if falsy; societyName part omitted if empty)
```
Price formatting (Indian lakhs/crores) in `format_price()` — port exactly for display consistency.

## REST API (probroker-api, Express + Mongoose)

Prefix all JSON data endpoints with `/api/v1` (new, clean namespace) — the Next.js app is the only
consumer, so this doesn't need to match old `/api/*` paths, but old paths used by OTP/inquiry/property
submission forms should still be re-implemented (any path) since we're rebuilding the frontend forms too.

Minimum endpoint set (expand as needed while reading server.py, which has the authoritative logic
for every one of these):
- `GET /api/v1/cities`, `GET /api/v1/cities/:slug`
- `GET /api/v1/areas?cityId=`, `GET /api/v1/areas/:slug`
- `GET /api/v1/societies?areaId=&cityId=`, `GET /api/v1/societies/:slug`
- `GET /api/v1/properties` (filters: category, transactionType, propertyType, bhk min/max, price min/max,
  cityId, areaId, societyId, furnishing, familyOrBachelors, status=active, isApproved=true, pagination) —
  this powers every listing page; port the exact filter logic from the `/​:citySlug/...` listing routes
  in server.py (search for the shared query-building helper it uses).
- `GET /api/v1/properties/:slug`
- `POST /api/v1/properties` (create, used by post-property form — save-first-then-photos pattern per
  test_result.md / server.py `/api/post-property` — do NOT lose property data if photo upload fails)
- `PATCH /api/v1/properties/:id`, `DELETE /api/v1/properties/:id` (owner-scoped)
- `POST /api/v1/upload` (image upload → Cloudflare R2, port backend/services/r2_storage.py logic 1:1 using
  @aws-sdk/client-s3 since R2 is S3-compatible)
- `POST /api/v1/inquiries`
- `POST /api/v1/requirements` (submit-requirement form)
- `POST /api/v1/otp/send`, `POST /api/v1/otp/verify` (port backend/services/sms_service.py)
- `GET /api/v1/search?q=`
- `GET /api/v1/sitemap/*` data feeds (or compute sitemap XML directly in Next.js route handlers —
  either is fine, but XML output must match old sitemap structure)
- Admin (all behind session/JWT auth middleware mirroring backend/server.py admin login):
  full CRUD for properties, areas, societies, cities, redirects, blog_posts, pages, settings,
  bulk-import (CSV + JSON), inquiries list/export, owner_listings approve/reject.
  Port every `/api/admin/*` POST/GET handler in server.py — there are ~35 of them (see grep results),
  each has real business logic (approval workflows, redirect toggles, featured toggles, CSV export,
  backup export) that must be preserved, not stubbed.

Auth: replace FastAPI SessionMiddleware admin auth with JWT (httpOnly cookie) issued on
`/api/v1/admin/login`. Replace OTP-based user auth (property owners) the same way — httpOnly session
cookie after OTP verify.

## SEO requirements for every public page (Next.js)

Use App Router `generateMetadata` per page to emit: unique `<title>`, `<meta name="description">`,
canonical `<link rel="canonical">`, robots meta (index/noindex per old server.py context — many pages set
`noindex, nofollow` for auth/error/duplicate states, preserve that exactly), Open Graph tags, and JSON-LD
(`RealEstateListing`/`Product`/`BreadcrumbList`/`Organization` schema — read how `inject_meta()` and each
route's `context.update({...})` builds these in server.py, and how templates/property.html,
templates/society.html embed JSON-LD `<script type="application/ld+json">`). Do not simplify or drop
schema fields — replicate the exact JSON-LD shape.

Render all public pages as Server Components with SSR/ISR (revalidate, e.g. 300–3600s depending on page
type) — never client-side fetch the primary content, that would regress behind what the old Jinja2 SSR
already achieved.
