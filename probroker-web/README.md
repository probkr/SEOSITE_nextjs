# PRObroker Web (public site)

Next.js 14 App Router frontend for the public-facing PRObroker real-estate site
(SEO listing pages, property/society/area pages, blog, forms). The admin panel
lives alongside this app under `app/admin/`; this README covers the public
site build.

## Why the routing looks unusual

The old FastAPI + Jinja2 site ranks in Google on specific URL patterns
(e.g. `/ahmedabad/satellite/residential-property-for-sale/`,
`/ahmedabad/2-bhk-flats-for-sale/`, `/ahmedabad/satellite/shaligram-greens/`).
Every public route in this app is built to resolve at the **exact same path**
as the old app, including trailing slashes, to avoid a ranking crash.

FastAPI could register independent regex routes at the same path depth
(`/{city_slug}/{category}-property-for-{trans}/`, `/{city_slug}/{catch_all}/`,
`/{city_slug}/{area_slug}/{society_slug}/`, etc.) because each route pattern
was matched independently. **Next.js App Router does not allow this** — it
requires a single dynamic parameter name at each position in the route tree,
so sibling folders like `[category]-property-for-[trans]` and `[areaSlug]`
cannot coexist under `app/[citySlug]/`.

To work around this while preserving the exact old URLs, everything under
`/{citySlug}/...` is handled by **one** catch-all segment:

- `app/[citySlug]/[...seg]/page.js` — resolves 1 or 2 extra path segments via
  `lib/citySegments.js`, replicating the priority order of the old FastAPI
  handlers:
  - 1 segment: city category listing (`residential-property-for-sale`),
    area landing page (if the segment matches an area slug), or the SEO
    catch-all (BHK pages, budget pages, property-type pages).
  - 2 segments: area category listing, or society detail page (society
    lookup takes priority if the second segment doesn't match the
    category-listing pattern, mirroring `three_segment_page` in the old
    `server.py`).

Nav-friendly URLs (`/residential/buy/:city/`, `/commercial/rent/:city/:area/`)
are still literal top-level folders (`app/residential/...`,
`app/commercial/...`) since those don't collide with `[citySlug]` — Next.js
always prefers a literal path segment over a sibling dynamic one.

You'll also see `app/[citySlug]/_disabled_*` folders — these are the original
sibling-route attempts, renamed (not deleted — the sandbox this was built in
did not allow file deletion on this mount) with a leading underscore so
Next.js treats them as private folders excluded from routing. They can be
deleted safely once you have filesystem access that supports it.

## Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_URL` — base URL of the Express API, e.g.
  `http://localhost:4000/api/v1` in development.
- `NEXT_PUBLIC_SITE_URL` — canonical production domain, `https://prbroker.in`.
  Used for canonical URLs, JSON-LD `url` fields, and sitemap `<loc>` values.

## Running

```bash
npm install
npm run dev     # local development
npm run build   # production build (verified to succeed with no live API —
                 # every API call is wrapped in try/catch with safe fallbacks)
npm start
```

## Notes on data fetching

All public pages are Server Components that fetch directly from the Express
API with `fetch(..., { next: { revalidate: N } })` — never client-side for
primary content. `revalidate` ranges from 300s (homepage) to 3600s (static
pages, sitemaps). Every API call goes through `lib/api.js`, which always
returns a safe empty/null fallback on failure so `npm run build` and SSR never
throw even when the backend is unreachable.
