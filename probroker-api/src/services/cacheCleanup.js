/**
 * Once a day, asks the Next.js site to delete fetch-cache files nobody has used for a while
 * (probroker-web/app/api/cache-cleanup). The web container owns those files, so the API can only
 * ask over HTTP, the same way siteCache.js asks it to revalidate.
 *
 * Env (all optional):
 *   CACHE_CLEANUP_TIME       daily run time in India time, HH:MM 24-hour (default 03:30)
 *   CACHE_CLEANUP_MAX_AGE_H  delete files untouched for this many hours (default 24)
 *   CACHE_CLEANUP_ENABLED    set to false to turn it off
 * Needs SITE_URL and REVALIDATE_SECRET, like siteCache.js; without them it does nothing.
 */

// India has no daylight saving, so a fixed +05:30 offset is exact.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function parseTime(value) {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

// Milliseconds from `now` until the next HH:MM India time.
function msUntilNext({ hour, minute }, now = Date.now()) {
  const ist = new Date(now + IST_OFFSET_MS);
  let target = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), hour, minute) - IST_OFFSET_MS;
  if (target <= now) target += 24 * 60 * 60 * 1000;
  return target - now;
}

async function runCacheCleanup() {
  const site = (process.env.SITE_URL || '').replace(/\/+$/, '');
  const secret = process.env.REVALIDATE_SECRET || '';
  if (!site || !secret) return null;
  const maxAgeHours = Number(process.env.CACHE_CLEANUP_MAX_AGE_H) || 24;
  try {
    const res = await fetch(`${site}/api/cache-cleanup`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxAgeHours }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) {
      console.error(`[cacheCleanup] failed: HTTP ${res.status}`);
      return null;
    }
    const result = await res.json();
    console.log(`[cacheCleanup] deleted ${result.deleted}, kept ${result.kept} (older than ${result.maxAgeHours}h)`);
    return result;
  } catch (e) {
    console.error('[cacheCleanup] failed:', e.message);
    return null;
  }
}

function startCacheCleanupSchedule() {
  if (String(process.env.CACHE_CLEANUP_ENABLED).toLowerCase() === 'false') return;
  if (!process.env.SITE_URL || !process.env.REVALIDATE_SECRET) {
    console.log('[cacheCleanup] off: SITE_URL or REVALIDATE_SECRET not set');
    return;
  }
  const raw = process.env.CACHE_CLEANUP_TIME || '03:30';
  const time = parseTime(raw) || parseTime('03:30');
  if (!parseTime(raw)) console.error(`[cacheCleanup] bad CACHE_CLEANUP_TIME "${raw}", using 03:30`);

  const scheduleNext = () => {
    const wait = msUntilNext(time);
    // unref: a pending cleanup must never keep the process alive on shutdown.
    setTimeout(async () => {
      await runCacheCleanup();
      scheduleNext();
    }, wait).unref();
  };
  scheduleNext();
  const hh = String(time.hour).padStart(2, '0');
  const mm = String(time.minute).padStart(2, '0');
  console.log(`[cacheCleanup] scheduled daily at ${hh}:${mm} IST`);
}

module.exports = { startCacheCleanupSchedule, runCacheCleanup, msUntilNext, parseTime };
