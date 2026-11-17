'use client';

// Opens the site-wide login popup (components/auth/LoginModalHost.js, mounted in the site
// layout) from anywhere, without leaving the page. onSuccess(user) runs after the OTP is verified.
export const OPEN_LOGIN_EVENT = 'pb:open-login';

export function openLogin({ mode = 'login', onSuccess } = {}) {
  window.dispatchEvent(new CustomEvent(OPEN_LOGIN_EVENT, { detail: { mode, onSuccess } }));
}
