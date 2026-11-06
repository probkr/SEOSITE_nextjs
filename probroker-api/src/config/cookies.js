/**
 * Login cookies are set by api.prbroker.in but read on prbroker.in by the admin middleware, so in
 * production they must cover the parent domain. Locally they stay on the current host.
 */
function cookieDomain() {
  return process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? '.prbroker.in' : undefined);
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
