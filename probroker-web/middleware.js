import { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'probroker_admin_token';

// Protects every /admin/* route except /admin/login. Redirects to /admin/login
// when the httpOnly JWT admin cookie is absent. Actual token validation happens
// server-side against the Express API on every data request — this middleware
// only gates page access so unauthenticated users never see the admin shell.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
