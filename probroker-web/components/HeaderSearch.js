'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { startNavigationProgress } from '@/components/NavigationProgress';
import { API_URL, CITIES, CITY_EVENT, CITY_STORAGE_KEY } from '@/lib/config';

const NO_RESULTS = { areas: [], societies: [] };
const LISTING_LEAF_RE = /^((residential|commercial)-property|[a-z]+)-for-(sale|rent)$/;

// Keeps what the visitor is browsing (e.g. flats for rent) when they switch locality.
function listingLeaf(pathname) {
  const last = pathname.split('/').filter(Boolean).pop() || '';
  return LISTING_LEAF_RE.test(last) ? last : 'residential-property-for-sale';
}

export default function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const boxRef = useRef(null);
  const [city, setCity] = useState(CITIES[0].slug);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(NO_RESULTS);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const term = q.trim();
  const leaf = listingLeaf(pathname);
  const textHref = `/search/?q=${encodeURIComponent(term)}&city=${city}`;
  const items = term.length < 2 ? [] : [
    ...results.areas.map((a) => ({
      key: `area-${a.citySlug}-${a.slug}`,
      group: 'Localities',
      label: a.name,
      href: `/${a.citySlug}/${a.slug}/${leaf}/`,
    })),
    ...results.societies.map((s) => ({
      key: `society-${s.slug}`,
      group: 'Societies',
      label: s.name,
      sub: s.areaName,
      href: `/${s.citySlug}/${s.areaSlug}/${s.slug}/`,
    })),
    { key: 'text', group: 'Landmark or keyword', label: `Search for "${term}"`, href: textHref },
  ];

  useEffect(() => {
    const urlCity = pathname.split('/')[1];
    if (CITIES.some((c) => c.slug === urlCity)) {
      setCity(urlCity);
    } else {
      try {
        const saved = localStorage.getItem(CITY_STORAGE_KEY);
        if (CITIES.some((c) => c.slug === saved)) setCity(saved);
      } catch {}
    }
    setQ(pathname.startsWith('/search') ? new URLSearchParams(window.location.search).get('q') || '' : '');
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onCityChange = (e) => setCity(e.detail);
    window.addEventListener(CITY_EVENT, onCityChange);
    return () => window.removeEventListener(CITY_EVENT, onCityChange);
  }, []);

  useEffect(() => {
    if (term.length < 2) {
      setResults(NO_RESULTS);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/search-suggestions?q=${encodeURIComponent(term)}&city=${city}`, { signal: controller.signal });
        if (res.ok) setResults(await res.json());
      } catch {}
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, city]);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function go(href) {
    setOpen(false);
    setActive(-1);
    startNavigationProgress();
    router.push(href);
  }

  function onSubmit(e) {
    e.preventDefault();
    if (active >= 0 && items[active]) go(items[active].href);
    else if (term) go(textHref);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (items.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
      const last = items.length - 1;
      if (e.key === 'ArrowDown') setActive((i) => (i >= last ? 0 : i + 1));
      else setActive((i) => (i <= 0 ? last : i - 1));
    }
  }

  const showList = open && items.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
        <input
          type="search"
          role="combobox"
          aria-label="Search locality, society or landmark"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && items[active] ? `${listId}-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search locality, society or landmark"
          autoComplete="off"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:cursor-pointer"
        />
      </form>

      {showList && (
        <ul id={listId} role="listbox" className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-dropdown max-h-96 overflow-y-auto py-1">
          {items.map((item, i) => (
            <li key={item.key} role="presentation">
              {item.group !== items[i - 1]?.group && (
                <div className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.group}</div>
              )}
              <button
                id={`${listId}-${i}`}
                type="button"
                role="option"
                aria-selected={active === i}
                onClick={() => go(item.href)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-4 py-2 text-sm ${active === i ? 'bg-primary-50 text-primary' : 'text-gray-700'}`}
              >
                <span className="block truncate">{item.label}</span>
                {item.sub && <span className="block truncate text-xs text-gray-400">{item.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
