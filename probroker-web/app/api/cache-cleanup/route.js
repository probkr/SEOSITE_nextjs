import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { secretMatches } from '@/lib/serverSecret';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Next 14 writes one file per cached fetch under .next/cache/fetch-cache and never deletes them.
// A live entry is rewritten every time it revalidates (15 min to 1 h here), so a file untouched
// for a day belongs to a URL nobody asks for any more. Deleting it is safe: the next request
// for that URL fetches from the API again and writes a fresh file.
// Called on a schedule by the API (probroker-api/src/services/cacheCleanup.js).
const FETCH_CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'fetch-cache');
const DEFAULT_MAX_AGE_HOURS = 24;

export async function POST(request) {
  if (!secretMatches(headers().get('x-revalidate-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const hours = Number(body?.maxAgeHours) > 0 ? Number(body.maxAgeHours) : DEFAULT_MAX_AGE_HOURS;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  let names;
  try {
    names = await fs.readdir(FETCH_CACHE_DIR);
  } catch (e) {
    if (e.code === 'ENOENT') return NextResponse.json({ deleted: 0, kept: 0, maxAgeHours: hours });
    throw e;
  }

  let deleted = 0;
  let kept = 0;
  for (const name of names) {
    const file = path.join(FETCH_CACHE_DIR, name);
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile()) continue;
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(file);
        deleted += 1;
      } else {
        kept += 1;
      }
    } catch {
      // Next may rewrite or remove a file while we look at it; skip it.
    }
  }

  return NextResponse.json({ deleted, kept, maxAgeHours: hours });
}
