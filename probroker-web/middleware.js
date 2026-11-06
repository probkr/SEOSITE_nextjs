import { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'admin_token';

// Reads the JWT payload without verifying it. Only used to route the browser: the Express API
// verifies the signature (and the ADMIN_PHONES allow-list) on every admin data request.
function readPayload(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}

// Protects every /admin/* route except /admin/login. Redirects to /admin/login when there is
// no admin cookie, or when it predates OTP login (old username/password sessions carry no
// `via: 'otp'`) or has expired -- otherwise those pages would load and then fail every API call.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const payload = token ? readPayload(token) : null;
  const valid = payload && payload.via === 'otp' && (!payload.exp || payload.exp * 1000 > Date.now());
  if (!valid) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const res = NextResponse.redirect(loginUrl);
    if (token) res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
