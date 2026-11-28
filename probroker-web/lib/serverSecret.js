import crypto from 'crypto';

// True when `sent` equals REVALIDATE_SECRET. The API sends it as x-revalidate-secret on its
// server-to-server calls (cache revalidate, scheduled cache cleanup). Server-only.
export function secretMatches(sent) {
  const secret = process.env.REVALIDATE_SECRET || '';
  if (!secret || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
