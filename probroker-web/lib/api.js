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
export const getCity = (slug, opts) => apiFetch(`/cities/${slug}`, opts).then((r) => r?.data || r || null);
export const getAreas = (params, opts) => apiFetch('/areas', { params, ...opts }).then((r) => r?.data || r || []);
export const getArea = (slug, opts) => apiFetch(`/areas/${slug}`, opts).then((r) => r?.data || r || null);
export const getSocieties = (params, opts) => apiFetch('/societies', { params, ...opts }).then((r) => r?.data || r || []);
export const getSociety = (slug, opts) => apiFetch(`/societies/${slug}`, opts).then((r) => r?.data || r || null);
export const getProperties = (params, opts) => apiFetch('/properties', { params, ...opts }).then((r) => r || { data: [], total: 0 });
export const getProperty = (slug, opts) => apiFetch(`/properties/${slug}`, opts).then((r) => r?.data || r || null);
export const searchApi = (q, opts) => apiFetch('/search', { params: { q }, ...opts }).then((r) => r?.data || r || []);
export const getBlogPosts = (opts) => apiFetch('/blog', opts).then((r) => r?.data || r || []);
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

// ---- Browser-side 