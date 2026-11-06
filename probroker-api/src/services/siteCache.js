/**
 * Asks the Next.js site to drop its cached property pages (app/api/revalidate) so listings
 * written outside the admin panel (e.g. the listings webhook) show up right away instead of
 * after the 15-minute revalidate window. No-op unless SITE_URL and REVALIDATE_SECRET are set.
 */
async function revalidateSiteProperties() {
  const site = (process.env.SITE_URL || '').replace(/\/+$/, '');
  const secret = process.env.REVALIDATE_SECRET || '';
  if (!site || !secret) return false;
  try {
    const res = await fetch(`${site}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[siteCache] revalidate failed: HTTP ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error('[siteCache] revalidate failed:', e.message);
    return false;
  }
}

module.exports = { revalidateSiteProperties };
