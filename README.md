# PRObroker — Node.js + Next.js Migration

Two deployable projects, converted from the original Python FastAPI + Jinja2 SSR app
(https://github.com/probkr/newmainseosite):

- **`probroker-api/`** — Node.js/Express + MongoDB (Mongoose) backend. Reuses the SAME
  MongoDB database and collection names as the old Python app, so no data migration is
  needed — point it at your existing MongoDB Atlas connection string and it works.
- **`probroker-web/`** — Next.js 14 (App Router) frontend, both the public SEO site and
  the `/admin` CMS panel, calling the Express API.
- **`API_CONTRACT.md`** — the spec both were built against: URL structure, data model,
  and endpoint list. Keep this if you extend either project later.

## Verified

Both projects were installed and built clean in a sandbox:
- `probroker-api`: boots successfully, connects/fails-gracefully to MongoDB, all routes
  load without syntax errors (~85 endpoints: public data API + ~35 admin CRUD routes).
- `probroker-web`: `npm run build` succeeds — all 45 routes (public + admin) compile with
  zero errors. Next.js pinned to `14.2.35` (patched; the initial scaffold used a version
  with a known CVE, since fixed).

Neither was tested against a live MongoDB/R2/SMS-provider connection (not available in
this sandbox) — that's the one remaining step before your intern can call it "done":
point both at real credentials and click through the admin CRUD + a few public pages.

## For your intern: getting this live

1. **Backend first.** `cd probroker-api`, copy `.env.example` to `.env`, fill in your
   real MongoDB Atlas URI (same DB as the old site — nothing to migrate), Cloudflare R2
   keys, SMS OTP provider key, and a random `SECRET_KEY`. `npm install && npm start`.
2. **Frontend.** `cd probroker-web`, set `NEXT_PUBLIC_API_URL` to wherever the API is
   deployed (e.g. `https://api.prbroker.in/api/v1`) and `NEXT_PUBLIC_SITE_URL` to
   `https://prbroker.in`. `npm install && npm run build && npm start`.
3. **DO NOT change any public URL.** Every public route was built to resolve at the exact
   same path as the old Jinja templates (see API_CONTRACT.md's URL section) specifically
   so the site doesn't lose its existing Google rankings during the switch. Verify a
   sample of URLs (homepage, one property page, one area page, sitemap.xml) return 200
   with correct content before pointing DNS/reverse proxy at the new stack.
4. **Go live with a staged cutover, not a hard swap:** deploy both new services on a
   staging subdomain, smoke-test the admin panel (create a listing, approve an owner
   submission, run a bulk import) and a handful of public pages against real data, check
   Google Search Console for crawl errors after cutover, then decommission the old
   Emergent-hosted Python app once you've confirmed indexing is stable for a week or two.

## One important caveat on your original SEO goal

The old site was already server-rendering (FastAPI + Jinja2, not a client-side SPA) with
meta tags, JSON-LD, and a sitemap — so this migration mainly solves your *maintainability*
problem (Emergent credits, ability for your intern to edit code directly) rather than a
technical-SEO problem the old stack necessarily had. If rankings are still down after this
goes live, the cause is more likely in Search Console signals, backlink profile, or content
quality than the framework — worth a Search Console audit alongside this rollout.
