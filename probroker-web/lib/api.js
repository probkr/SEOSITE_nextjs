import { API_URL } from './config';

async function apiFetch(path, { revalidate = 900, params, method = 'GET', body, cache } = {}) {
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }
  try {
    const opts = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    };
    if (cache) {
      opts.cache = cache;
    } else {
      opts.next = { revalidate };
    }
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API fetch failed:', path, err.message);
    return null;
  }
}

export const getCities = (opts) => apiFetch('/cities', opts).then((r) => r?.data || r || []);

// Looks up a configured redirect for a URL that otherwise 404'd (source_url must match exactly,
// including leading/trailing slashes, as stored by the admin Redirects screen).
export const getRedirect = (pathname, opts) => apiFetch('/sitemap/redirect-lookup', { params: { path: pathname }, ...opts }).then((r) => (r?.found ? r : null));
export const getCity = (slug, opts) => apiFetch(`/cities/${slug}`, opts).then((r) => r?.data || r || null);
export const getAreas = (params, opts) => apiFetch('/areas', { params, ...opts }).then((r) => r?.data || r || []);
export const getArea = (slug, opts) => apiFetch(`/areas/${slug}`, opts).then((r) => r?.data || r || null);
export const getSocieties = (params, opts) => apiFetch('/societies', { params, ...opts }).then((r) => r?.data || r || []);
export const getSociety = (slug, opts) => apiFetch(`/societies/${slug}`, opts).then((r) => r?.data || r || null);
export const getProperties = (params, opts) => apiFetch('/properties', { params, ...opts }).then((r) => {
  // API returns { properties, total, page, pages, ... } — normalize to { data, total, ... }
  // so every caller can use latest.data consistently regardless of the API's own key name.
  if (!r) return { data: [], total: 0 };
  return { ...r, data: r.data || r.properties || [] };
});
export const getProperty = (slug, opts) => apiFetch(`/properties/${slug}`, opts).then((r) => r?.data || r || null);
export const searchApi = (q, opts) => apiFetch('/search', { params: { q }, ...opts }).then((r) => r?.data || r || []);
export const getBlogPosts = (opts) => apiFetch('/blog', opts).then((r) => {
  // API returns { posts: [...] } — normalize like getProperties above.
  if (!r) return [];
  if (Array.isArray(r)) return r;
  return r.data || r.posts || [];
});
export const getBlogPost = (slug, opts) => apiFetch(`/blog/${slug}`, opts).then((r) => r?.data || r || null);
export const getPage = (slug, opts) => apiFetch(`/pages/${slug}`, opts).then((r) => r?.data || r || null);

export async function postJson(path, body, method = 'POST') {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: err.message } };
  }
}

export const patchJson = (path, body) => postJson(path, body, 'PATCH');

// ---- Browser-side fetch for admin client components ----
// Sends the JWT httpOnly cookie automatically (credentials: 'include'), used by every
// admin form/table component under components/admin/*.js.
export async function clientFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const opts = { credentials: 'include', ...options };
  // Server Components / route handlers (e.g. /app/admin/**/page.js) run this fetch
  // on the Node server, which has no browser cookie jar -- credentials:'include' is a
  // no-op there. Forward the incoming request's cookies manually so admin_token reaches
  // the API in that context. Dynamic import keeps next/headers out of the client bundle.
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieHeader = cookies()
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
      if (cookieHeader) {
        opts.headers = { ...(opts.headers || {}), Cookie: cookieHeader };
      }
    } catch {}
  }
  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
  }
  if (opts.body && !(opts.body instanceof FormData) && !opts.headers) {
    opts.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, opts);
  return res;
}

export async function clientFetchJson(path, options = {}) {
  const res = await clientFetch(path, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const getSiteSettings = (opts) => apiFetch('/site-settings', opts).then((r) => r?.data || r || {});

// Alias: every /app/admin/**/page.js calls adminFetchJson, but only clientFetchJson
// was ever exported here. Re-export it under the expected name so the whole admin
// section (dashboard, listings, societies, cities, areas, settings, etc.) can fetch data.
export const adminFetchJson = clientFetchJson;

export { apiFetch };
