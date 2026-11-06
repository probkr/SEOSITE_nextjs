'use client';

import { useEffect, useState } from 'react';
import { clientFetch } from './api';

// Lets the header pick up a login/logout that happened elsewhere on the page without a reload.
export const AUTH_EVENT = 'pb:auth-change';
// Fired when the API says this device's session was ended server-side (e.g. the same
// account logged in on another device). detail: { code, message }.
export const SESSION_ENDED_EVENT = 'pb:session-ended';

// Fired with the new balance whenever credits change, so the header updates without a reload.
export const CREDITS_EVENT = 'pb:credits-change';

// How often a logged-in tab re-checks its session, on top of re-checking whenever it regains focus.
const RECHECK_MS = 60 * 1000;
const ENDED_CODES = ['SESSION_REPLACED', 'SESSION_EXPIRED', 'BLOCKED'];

export function notifyAuthChange(user) {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user || null }));
}

export function notifyCredits(freeCredits) {
  window.dispatchEvent(new CustomEvent(CREDITS_EVENT, { detail: freeCredits }));
}

async function fetchMe() {
  try {
    const r = await clientFetch('/auth/me', { cache: 'no-store' });
    const body = await r.json().catch(() => null);
    if (r.ok && body && body.phone) return { user: body };
    if (body && ENDED_CODES.includes(body.code)) return { user: null, ended: { code: body.code, message: body.error } };
    return { user: null };
  } catch {
    return { offline: true };
  }
}

// undefined while loading, null for guests, { name, phone, email, freeCredits } when logged in.
export function useWebUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let alive = true;

    async function check() {
      const res = await fetchMe();
      if (!alive || res.offline) return; // a network blip shouldn't log anyone out
      setUser(res.user);
      if (res.ended) window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: res.ended }));
    }
    check();

    const onChange = (e) => setUser(e.detail);
    const onCredits = (e) => setUser((u) => (u ? { ...u, freeCredits: e.detail } : u));
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener(CREDITS_EVENT, onCredits);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      alive = false;
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener(CREDITS_EVENT, onCredits);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // Poll only while signed in and the tab is visible, so a replaced session is noticed promptly.
  useEffect(() => {
    if (!user) return undefined;
    const id = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await fetchMe();
      if (res.offline || res.user) return;
      setUser(null);
      if (res.ended) window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: res.ended }));
    }, RECHECK_MS);
    return () => clearInterval(id);
  }, [user]);

  return user;
}

export async function logoutWebUser() {
  await clientFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  notifyAuthChange(null);
}

// Only allow same-site relative paths as post-login redirects.
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : '/';
}
