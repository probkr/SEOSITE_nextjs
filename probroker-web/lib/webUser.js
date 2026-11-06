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

// The API sets this readable cookie beside the httpOnly login token. Without it there is no
// session, so guests never call /auth/me.
const SESSION_FLAG = 'pb_session=1';
const CACHE_KEY = 'pb_user';
// A logged-in user is re-checked at most this often, however many components ask.
const RECHECK_MS = 5 * 60 * 1000;
const TICK_MS = 60 * 1000;
const ENDED_CODES = ['SESSION_REPLACED', 'SESSION_EXPIRED', 'BLOCKED'];

let cache = null; // { user, at }
let inFlight = null;

const hasSessionFlag = () => document.cookie.split('; ').includes(SESSION_FLAG);

function readCache() {
  if (cache) return cache;
  try {
    cache = JSON.parse(sessionStorage.getItem(CACHE_KEY));
  } catch {
    cache = null;
  }
  return cache;
}

function writeCache(user) {
  cache = user ? { user, at: Date.now() } : null;
  try {
    if (cache) sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function notifyAuthChange(user) {
  writeCache(user);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user || null }));
}

export function notifyCredits(freeCredits) {
  const current = readCache();
  if (current) writeCache({ ...current.user, freeCredits });
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

async function loadUser() {
  if (!hasSessionFlag()) {
    writeCache(null);
    return { user: null };
  }
  const cached = readCache();
  if (cached && Date.now() - cached.at < RECHECK_MS) return { user: cached.user };

  if (!inFlight) inFlight = fetchMe().finally(() => { inFlight = null; });
  const res = await inFlight;
  if (res.offline) return cached ? { user: cached.user } : res; // a network blip shouldn't log anyone out
  writeCache(res.user);
  return res;
}

// undefined while loading, null for guests, { name, phone, email, freeCredits } when logged in.
export function useWebUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let alive = true;

    async function check() {
      const res = await loadUser();
      if (!alive || res.offline) return;
      setUser(res.user);
      if (res.ended) window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: res.ended }));
    }
    check();

    const onChange = (e) => setUser(e.detail);
    const onCredits = (e) => setUser((u) => (u ? { ...u, freeCredits: e.detail } : u));
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    const tick = setInterval(onVisible, TICK_MS);
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener(CREDITS_EVENT, onCredits);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      alive = false;
      clearInterval(tick);
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener(CREDITS_EVENT, onCredits);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

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
