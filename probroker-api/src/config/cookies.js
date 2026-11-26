/**
 * Login cookies are set by api.allflats.in but read on allflats.in by the admin middleware, so in
 * production they must cover the parent domain. Locally they stay on the current host.
 * (The site moved from prbroker.in; a cookie for .allflats.in can't be set from api.prbroker.in,
 * so the site must call api.allflats.in.)
 */
function cookieDomain() {
  return process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? '.allflats.in' : undefined);
}

function sessionCookieOpts() {
  const domain = cookieDomain();
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    ...(domain && { domain }),
  };
}

module.exports = { sessionCookieOpts };
