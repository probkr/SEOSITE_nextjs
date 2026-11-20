'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { buildPropertyQuery, normalizePropertyResult, parseListingFilters, readPage } from '@/lib/listingQuery';

// Listing pages render their first load on the server, so search engines index full HTML. After
// that, a filter, sort or page change only rewrites the URL (history.pushState, which Next.js keeps
// in sync with useSearchParams) and this provider fetches /properties as JSON straight from the
// browser, the way 99acres and Housing.com do. A changed path (Buy <-> Rent, another area) is a
// different SEO page and still goes through normal navigation.

const ListingResultsContext = createContext(null);

/** Live listing state, or null outside a listing page (callers then fall back to their props). */
export function useListingResults() {
  return useContext(ListingResultsContext);
}

const EMPTY = { properties: [], total: 0, totalPages: 1 };
const NO_QUERY = 'none';
const CACHE_LIMIT = 30;

async function fetchListing(query, signal) {
  const qs = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`${API_URL}/properties?${qs}`, { signal });
  if (!res.ok) throw new Error(`Properties request failed (${res.status})`);
  return normalizePropertyResult(await res.json(), query.limit);
}

/**
 * scope: the page's fixed query (see lib/listingQuery.js buildPropertyQuery), as the server used it.
 * mode 'search': /search, where the city comes from the URL and nothing loads without a ?q.
 * initial: { properties, total, totalPages } the server rendered for the current URL.
 */
export function ListingResultsProvider({ scope, mode = 'listing', initial, children }) {
  const searchParams = useSearchParams();

  // One string per distinct result set: the exact API query, so unrelated params (utm_*) don't refetch.
  const key = useMemo(() => {
    const filters = parseListingFilters(searchParams);
    if (mode === 'search' && !filters.q) return NO_QUERY;
    const pageScope = mode === 'search'
      ? { fixed: { city: searchParams.get('city') || undefined }, omit: ['area'] }
      : scope;
    return JSON.stringify(buildPropertyQuery(pageScope, filters, readPage(searchParams)));
  }, [searchParams, mode, scope]);

  const cache = useRef(null);
  if (cache.current === null) cache.current = new Map([[key, initial || EMPTY]]);

  const [shown, setShown] = useState(() => ({ key, ...(initial || EMPTY) }));
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [attempt, setAttempt] = useState(0);

  // A fresh server render of this same page (router.refresh, a link back to it) brings new data.
  const lastInitial = useRef(initial);
  useEffect(() => {
    if (initial === lastInitial.current) return;
    lastInitial.current = initial;
    cache.current.set(key, initial || EMPTY);
    setShown({ key, ...(initial || EMPTY) });
    setStatus('idle');
  }, [initial, key]);

  useEffect(() => {
    const hit = cache.current.get(key);
    if (hit) {
      setShown({ key, ...hit });
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    fetchListing(JSON.parse(key), controller.signal)
      .then((data) => {
        cache.current.set(key, data);
        if (cache.current.size > CACHE_LIMIT) cache.current.delete(cache.current.keys().next().value);
        setShown({ key, ...data });
        setStatus('idle');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('error');
      });
    return () => controller.abort();
  }, [key, attempt]);

  // Changes the query string without a server round trip; the effect above then loads the JSON.
  const navigate = useCallback((url, { scrollTop = false } = {}) => {
    window.history.pushState(null, '', url);
    if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(() => {
    const query = shown.key === NO_QUERY ? null : JSON.parse(shown.key);
    return {
      properties: shown.properties,
      total: shown.total,
      totalPages: shown.totalPages,
      page: query?.page || 1,
      hasQuery: !!query,
      loading: status === 'loading',
      error: status === 'error',
      retry,
      navigate,
    };
  }, [shown, status, retry, navigate]);

  return <ListingResultsContext.Provider value={value}>{children}</ListingResultsContext.Provider>;
}
