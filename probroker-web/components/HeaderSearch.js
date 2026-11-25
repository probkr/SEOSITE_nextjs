'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { startNavigationProgress } from '@/components/NavigationProgress';
import { API_URL, CITIES, CITY_EVENT, CITY_STORAGE_KEY } from '@/lib/config';
import { Highlight, LandmarkIcon, LocalityIcon, ProjectIcon, TrendIcon } from './PlaceIcons';

const NO_RESULTS = { areas: [], societies: [] };
const LISTING_LEAF_RE = /^((residential|commercial)-property|[a-z]+)-for-(sale|rent)$/;

const KIND = {
  locality: { label: 'Locality', Icon: LocalityIcon },
  project: { label: 'Project', Icon: ProjectIcon },
  landmark: { label: 'Landmark', Icon: LandmarkIcon },
};

// Popular localities per city (most listings), fetched once per visit for the empty box.
const popularCache = new Map();
function loadPopular(city) {
  if (!popularCache.has(city)) {
    popularCache.set(city, fetch(`${API_URL}/areas-featured/top?city=${encodeURIComponent(city)}&limit=6`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => (Array.isArray(list) ? list : []))
      .catch(() => { popularCache.delete(city); return []; }));
  }
  return popularCache.get(city);
}

// Keeps what the visitor is browsing (e.g. flats for rent) when they switch locality.
function listingLeaf(pathname) {
  const last = pathname.split('/').filter(Boolean).pop() || '';
  return LISTING_LEAF_RE.test(last) ? last : 'residential-property-for-sale';
}

// currentLabel: what the visitor is looking at (a locality name, a searched word), shown in the box
// so they can see what they searched. Pages without one start empty.
export default function HeaderSearch({ currentLabel = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const boxRef = useRef(null);
  const justFocused = useRef(false);
  const [city, setCity] = useState(CITIES[0].slug);
  const [q, setQ] = useState(currentLabel); // in the server HTML too, so it never flashes empty
  const [results, setResults] = useState(NO_RESULTS);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [popular, setPopular] = useState([]);

  const term = q.trim();
  const leaf = listingLeaf(pathname);
  const textHref = `/search/?q=${encodeURIComponent(term)}&city=${city}`;
  const cityName = (CITIES.find((c) => c.slug === city) || {}).name || '';
  const showPopular = term.length < 2;

  // Housing-style rows: "Jaldeep Park, Odhav, Ahmedabad" over "LOCALITY | AHMEDABAD". Localities
  // and projects are mixed, names starting with the typed text first; the last row searches the
  // text as a landmark or keyword.
  const lower = term.toLowerCase();
  const startsFirst = (a, b) => (b.name.toLowerCase().startsWith(lower) ? 1 : 0) - (a.name.toLowerCase().startsWith(lower) ? 1 : 0);
  const items = showPopular
    ? popular.map((a) => ({
      key: `pop-${a.slug}`,
      kind: 'locality',
      name: a.name,
      place: [a.name, a.cityName].filter(Boolean).join(', '),
      meta: a.propertyCount ? `${a.propertyCount.toLocaleString('en-IN')} properties` : a.cityName,
      href: `/${a.citySlug || city}/${a.slug}/${leaf}/`,
    }))
    : [
      ...[
        ...results.areas.map((a) => ({
          key: `area-${a.citySlug}-${a.slug}`,
          kind: 'locality',
          name: a.name,
          place: [a.name, a.cityName].filter(Boolean).join(', '),
          meta: a.cityName,
          href: `/${a.citySlug}/${a.slug}/${leaf}/`,
        })),
        ...results.societies.map((s) => ({
          key: `society-${s.slug}`,
          kind: 'project',
          name: s.name,
          place: [s.name, s.areaName, s.cityName].filter(Boolean).join(', '),
          meta: s.cityName,
          typeLabel: s.projectType === 'commercial' ? 'Commercial Project' : 'Project',
          href: `/${s.citySlug}/${s.areaSlug}/${s.slug}/`,
        })),
      ].sort(startsFirst),
      { key: 'text', kind: 'landmark', name: term, place: `Search "${term}"`, meta: 'Landmark or keyword', typeLabel: 'Landmark', href: textHref },
    ];

  // The empty box lists the city's popular localities.
  useEffect(() => {
    if (!open || !showPopular) return undefined;
    let alive = true;
    loadPopular(city).then((list) => { if (alive) setPopular(list); });
    return () => { alive = false; };
  }, [open, showPopular, city]);

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
    setQ(pathname.startsWith('/search') ? new URLSearchParams(window.location.search).get('q') || '' : currentLabel);
    setOpen(false);
  }, [pathname, currentLabel]);

  useEffect(() => {
    const onCityChange = (e) => setCity(e.detail);
    window.addEventListener(CITY_EVENT, onCityChange);
    return () => window.removeEventListener(CITY_EVENT, onCityChange);
  }, []);

  // Only while the list is open: the box can start filled with the page's locality, and that
  // shouldn't cost a request on every page view.
  useEffect(() => {
    if (term.length < 2 || !open) {
      if (term.length < 2) setResults(NO_RESULTS);
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
  }, [term, city, open]);

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
          onFocus={(e) => {
            setOpen(true);
            // Select the shown name, so typing replaces it with a new search.
            if (q) {
              e.target.select();
              justFocused.current = true;
            }
          }}
          onMouseUp={(e) => {
            // The mouseup of the focusing click would otherwise drop the selection.
            if (justFocused.current) e.preventDefault();
            justFocused.current = false;
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search locality, society or landmark"
          autoComplete="off"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:cursor-pointer"
        />
      </form>

      {showList && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-dropdown overflow-hidden">
          {showPopular && (
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 text-xs text-gray-500">
              <TrendIcon />
              Popular searches in <span className="font-bold text-gray-800">{cityName}</span>
            </div>
          )}
          <ul id={listId} role="listbox" className="max-h-[26rem] overflow-y-auto py-1">
            {items.map((item, i) => {
              const { label, Icon } = KIND[item.kind];
              return (
                <li key={item.key} role="presentation">
                  <button
                    id={`${listId}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${active === i ? 'bg-primary-50' : ''}`}
                  >
                    <span className={`shrink-0 ${active === i ? 'text-primary' : 'text-gray-500'}`}>
                      <Icon />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm text-gray-700">
                        {item.kind === 'landmark' ? item.place : <Highlight text={item.place} term={showPopular ? '' : term} />}
                      </span>
                      <span className="block mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {item.typeLabel || label}
                        {item.meta && <><span className="mx-1 font-normal text-gray-300">|</span>{item.meta}</>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
