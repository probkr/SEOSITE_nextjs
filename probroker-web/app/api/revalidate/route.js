import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { API_URL } from '@/lib/config';
import { PROPERTY_CACHE_TAG } from '@/lib/api';
import { secretMatches } from '@/lib/serverSecret';

// Clears cached property data (listing + detail pages) after a listing change.
// Allowed for a signed-in admin (cookie checked against the API), or for the API itself
// after a listings webhook push (x-revalidate-secret = REVALIDATE_SECRET).
export async function POST() {
  if (secretMatches(headers().get('x-revalidate-secret'))) {
    revalidateTag(PROPERTY_CACHE_TAG);
    return NextResponse.json({ revalidated: true });
  }

  const token = cookies().get('admin_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await fetch(`${API_URL}/admin/me`, {
    headers: { Cookie: `admin_token=${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!me || !me.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  revalidateTag(PROPERTY_CACHE_TAG);
  return NextResponse.json({ revalidated: true });
}
