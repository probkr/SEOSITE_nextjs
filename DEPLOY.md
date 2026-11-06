# Deploying PRObroker to a Hostinger VPS

This deploys both `probroker-api` and `probroker-web` on ONE VPS using Docker Compose,
with Nginx as the reverse proxy handling SSL for both a main domain and an API subdomain.

## 0. Before you start

- Buy the Hostinger VPS (Ubuntu 22.04 template — pick that OS when Hostinger asks).
- Point DNS at your VPS's IP address, in your domain registrar (or Hostinger's DNS panel):
  - `A` record: `prbroker.in` → VPS IP
  - `A` record: `www.prbroker.in` → VPS IP
  - `A` record: `api.prbroker.in` → VPS IP
  (DNS can take up to a few hours to propagate — do this first so it's ready by the time
  you need certbot below.)
- Have ready: your MongoDB Atlas connection string (same DB as the old site), Cloudflare
  R2 credentials, and your SMS OTP provider (2Factor.in) API key.

## 1. SSH in and install Docker

```bash
ssh root@YOUR_VPS_IP

apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git
```

## 2. Get the code onto the server

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git probroker
cd probroker
```

(If the repo is private, use a Personal Access Token in the URL, or set up a deploy key.)

## 3. Configure environment variables

The API reads only `probroker-api/.env`. `.env.example` is a template that nothing reads at
runtime. `.env` is gitignored, so `git pull` never creates, changes or deletes it: create it
once on the server, and never commit it.

```bash
cp probroker-api/.env.example probroker-api/.env
nano probroker-api/.env
```

Run `openssl rand -hex 32` once for each of `SECRET_KEY`, `WEBHOOK_AUTH_KEY` and
`REVALIDATE_SECRET`, so each gets its own value. Use different values from your local machine.
The API will not start if `SECRET_KEY` is missing, or if any of the three is short or a known
example value. Changing `SECRET_KEY` logs everyone out, and a new `WEBHOOK_AUTH_KEY` must also be
updated in the CRM that calls the webhook.

Also fill in `MONGO_URL`, `DB_NAME`, `ADMIN_PHONES`, the R2 credentials and
`TWOFACTOR_API_KEY`, and set:

```
NODE_ENV=production
COOKIE_SECURE=true
OTP_DEV_MODE=false
SITE_URL=https://prbroker.in
CORS_ORIGINS=https://prbroker.in,https://www.prbroker.in
```

After any later change to `.env`, recreate the container. A plain `docker compose restart`
keeps the old values:

```bash
docker compose up -d --force-recreate api
```

Then create the root `.env` (used by docker-compose for the frontend build):

```bash
cat > .env << 'EOF'
NEXT_PUBLIC_API_URL=https://api.prbroker.in/api/v1
NEXT_PUBLIC_SITE_URL=https://prbroker.in
REVALIDATE_SECRET=same-value-as-in-probroker-api-.env
EOF
```

## 4. First-time SSL certificate (before enabling HTTPS in Nginx)

Edit `nginx/probroker.conf` and temporarily comment out (or delete) both `server { listen
443 ssl; ... }` blocks, keeping only the `listen 80` block — Nginx can't start with SSL
config pointing at certificates that don't exist yet.

```bash
docker compose up -d nginx
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d prbroker.in -d www.prbroker.in -d api.prbroker.in \
  --email you@example.com --agree-tos --no-eff-email
```

If that succeeds, restore the full `nginx/probroker.conf` (un-comment the 443 blocks).

## 5. Build and launch everything

```bash
docker compose up -d --build
docker compose ps
```

You should see `probroker-api`, `probroker-web`, `probroker-nginx`, and
`probroker-certbot` all running. Certbot auto-renews the certificate every 12 hours
(only actually renews when close to expiry, so this is safe to leave running).

## 6. Verify

- `https://prbroker.in` — homepage loads
- `https://prbroker.in/admin/login` — admin login page loads
- `https://api.prbroker.in/health` — should return `{"status":"ok",...}`
- Log into `/admin`, create a test area, confirm it saves to MongoDB
- `https://prbroker.in/sitemap.xml` — loads and lists real URLs

## 7. Point production traffic over (staged cutover)

Don't switch DNS for `prbroker.in` itself until you've verified step 6 against a
staging subdomain or by testing via the VPS IP with a hosts-file override. Once
confirmed, update DNS to make `prbroker.in` point here for real, then monitor Google
Search Console for crawl errors over the following 1–2 weeks before decommissioning
the old Emergent-hosted Python app.

## Updating the site later (your intern's day-to-day workflow)

```bash
cd probroker
git pull
docker compose up -d --build
```

## Logs / troubleshooting

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f nginx
```
