import { NextResponse } from 'next/server';
import { getSociety } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

// Legacy /society/:slug/ route. Old app 301-redirected these to the new
// /:citySlug/:areaSlug/:societySlug/ URL, trying the raw slug, then a
// city-suffix-stripped slug. We rely on GET /societies/:slug from the API;
// the old app additionally did a regex partial-match fallback which is not
// exposed by the current API contract (flagged in the handoff report).
export async function GET(request, { params }) {
  const { societySlug } = params;
  let society = await getSociety(societySlug, { revalidate: 0, cache: 'no-store' });

  if (!society) {
    for (const suffix of ['-ahmedabad', '-gandhinagar']) {
      if (societySlug.endsWith(suffix)) {
        const clean = societySlug.slice(0, -suffix.length);
        society = await getSociety(clean, { revalidate: 0, cache: 'no-store' });
        if (society) break;
      }
    }
  }

  if (society && society.citySlug && society.areaSlug) {
    return NextResponse.redirect(
      `${SITE_URL}/${society.citySlug}/${society.areaSlug}/${society.slug}/`,
      301
    );
  }

  return new NextResponse('Society not found', { status: 404 });
}
