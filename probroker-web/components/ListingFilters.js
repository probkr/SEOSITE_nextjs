'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { startNavigationProgress } from '@/components/NavigationProgress';
import { useListingResults } from '@/components/ListingResultsProvider';
import { parseListingFilters } from '@/lib/listingQuery';

const BHK_OPTIONS = ['1', '2', '3', '4'];

const PROPERTY_TYPES = [
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'villa', label: 'Villa' },
  { value: 'tenement', label: 'Tenement' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'plot', label: 'Plot / Land' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'warehouse', label: 'Warehouse' },
];

const PRICE_OPTIONS = [
  { label: 'Under ₹25L', min: '', max: '2500000' },
  { label: '₹25L - ₹50L', min: '2500000', max: '5000000' },
  { label: '₹50L - ₹1Cr', min: '5000000', max: '10000000' },
  { label: '₹1Cr - ₹2Cr', min: '10000000', max: '20000000' },
  { label: 'Above ₹2Cr', min: '20000000', max: '' },
];

// Monthly rent ranges, used when the page/filter is for rentals.
const RENT_PRICE_OPTIONS = [
  { label: 'Under ₹10K', min: '', max: '10000' },
  { label: '₹10K - ₹20K', min: '10000', max: '20000' },
  { label: '₹20K - ₹35K', min: '20000', max: '35000' },
  { label: '₹35K - ₹50K', min: '35000', max: '50000' },
  { label: '₹50K - ₹1L', min: '50000', max: '100000' },
  { label: 'Above ₹1L', min: '100000', max: '' },
];

const TRANS_OPTIONS = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
];

const SQFT_OPTIONS = [
  { label: 'Under 500 sq.ft', min: '', max: '500' },
  { label: '500 - 1000 sq.ft', min: '500', max: '1000' },
  { label: '1000 - 1500 sq.ft', min: '1000', max: '1500' },
  { label: '1500 - 2500 sq.ft', min: '1500', max: '2500' },
  { label: 'Above 2500 sq.ft', min: '2500', max: '' },
];

const FURNISHING_OPTIONS = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi-furnished', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const POSTED_BY_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'broker', label: 'Broker' },
];

// Days back from today, matched against each listing's listedDate.
const POSTED_SINCE_OPTIONS = [
  { value: '1', label: 'Yesterday' },
  { value: '7', label: 'Last Week' },
  { value: '14', label: 'Last 2 Weeks' },
  { value: '30', label: 'Last Month' },
  { value: '60', label: 'Last 2 Months' },
  { value: '120', label: 'Last 4 Months' },
];

const TENANT_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'bachelors', label: 'Bachelors' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Values as stored in properties.amenities (the most common ones in the data).
const AMENITY_OPTIONS = [
  'AC', 'Fan', 'Wardrobes', 'Geyser', 'Beds', 'Sofa', 'Dining Table', 'TV', 'Fridge', 'Washing Machine',
  'Lift', 'Security', 'CCTV', 'Gym', 'Garden', 'Children Play Area',
  'Reception Area', 'Signage Space', 'Shop Frontage',
];

// Query params owned by the "More Filters" panel.
const MORE_KEYS = ['verified', 'postedSince', 'familyOrBachelors', 'amenities', 'hasPhotos', 'parking'];

const MORE_SECTIONS = [
  { id: 'verified', label: 'Verified Properties' },
  { id: 'added', label: 'Posted Since' },
  { id: 'tenant', label: 'Tenants Preferred' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'photos', label: 'Photos' },
  { id: 'parking', label: 'Parking' },
];

const MORE_WIDTH = 900;

const listOf = (csv) => String(csv || '').split(',').map((v) => v.trim()).filter(Boolean);

const trigger = (active) =>
  `inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-sm font-medium whitespace-nowrap transition-colors ${
    active
      ? 'border-primary bg-primary-50 text-primary'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
  }`;

const panel =
  'fixed z-50 min-w-[200px] max-w-[min(300px,calc(100vw-16px))] max-h-[60vh] overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-float p-1.5';

const PANEL_WIDTH = 220;

const optBtn = (active) =>
  `block w-full text-left px-3 py-2 rounded-lg text-sm whitespace-normal transition-colors ${
    active ? 'bg-primary-50 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'
  }`;

const pill = (active) =>
  `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
    active ? 'border-primary bg-primary-50 text-primary font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-400'
  }`;

function Caret({ open = false }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function Check() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * Positions a position:fixed panel under its trigger and closes it on outside click / Escape.
 * Fixed (not absolute) so a horizontally scrolling filter bar can't clip it. `wrapRef` must
 * contain both the trigger and the panel.
 */
function useFixedPanel(open, wrapRef, btnRef, panelRef, { width = PANEL_WIDTH, align = 'left', onClose }) {
  const [pos, setPos] = useState(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    function place() {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const vw = window.innerWidth;
      const w = Math.min(panelRef.current?.offsetWidth || width, vw - 16);
      if (align === 'center') {
        // Big panels (More Filters) hang centred under the whole filter strip, not the button.
        const strip = btnRef.current.closest('.filter-strip');
        const top = (strip ? strip.getBoundingClientRect().bottom : r.bottom) + 8;
        setPos({ top, left: Math.max(8, (vw - w) / 2) });
        return;
      }
      const left = align === 'right' ? r.right - w : r.left;
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(left, vw - w - 8)) });
    }
    function onDoc(e) {
      if (wrapRef.current?.contains(e.target)) return;
      closeRef.current();
    }
    function onKey(e) {
      if (e.key === 'Escape') closeRef.current();
    }
    function onScroll(e) {
      // Scrolling inside the panel's own list shouldn't move it.
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      place();
    }
    place();
    // Re-place once the panel has rendered and its real width is known.
    const raf = requestAnimationFrame(place);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open, width, align, wrapRef, btnRef, panelRef]);

  return pos;
}

function Dropdown({ id, label, active, openId, setOpenId, children, width, align = 'left' }) {
  const ref = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const open = openId === id;
  const pos = useFixedPanel(open, ref, btnRef, panelRef, { width, align, onClose: () => setOpenId(null) });

  return (
    <div ref={ref} className="relative shrink-0">
      <button ref={btnRef} type="button" onClick={() => setOpenId(open ? null : id)} className={trigger(active)} aria-expanded={open}>
        {label}
        <Caret open={open} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className={panel}
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: width || undefined, visibility: pos ? 'visible' : 'hidden' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Result count from the in-place JSON load when there is one, else the server's. */
function useLiveCount(serverCount) {
  const live = useListingResults();
  return live && live.hasQuery ? live.total : serverCount;
}

/** URL-driven filter state + actions shared by the bar, the results row and the card. */
function useListingFilters(activeFilters, areas, pathTrans) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openId, setOpenId] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  // Inside a listing page, filter changes load JSON in place instead of re-rendering the page.
  const live = useListingResults();
  // The URL is the source of truth: after an in-place change the server's activeFilters are stale.
  const f = live ? parseListingFilters(searchParams) : activeFilters;
  const amenities = listOf(f.amenities);
  // Buy/Rent comes from the URL path on SEO listing pages (…-for-sale / …-for-rent) and
  // from the `transactionType` query param on /search.
  const trans = pathTrans || f.transactionType || '';
  const priceOptions = trans === 'rent' ? RENT_PRICE_OPTIONS : PRICE_OPTIONS;

  function push(mutate) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    const qs = params.toString();
    goTo(qs ? `${pathname}?${qs}` : pathname);
    setOpenId(null);
  }

  // Same path, new query string: JSON in place on listing pages, a normal navigation elsewhere.
  function goTo(url) {
    if (live) {
      live.navigate(url);
      return;
    }
    startNavigationProgress();
    router.push(url, { scroll: false });
  }

  const setParam = (key, value) =>
    push((p) => {
      if (!value) p.delete(key);
      else p.set(key, value);
    });

  const setRange = (minKey, maxKey, opt) =>
    push((p) => {
      if (opt?.min) p.set(minKey, opt.min); else p.delete(minKey);
      if (opt?.max) p.set(maxKey, opt.max); else p.delete(maxKey);
    });

  const toggleAmenity = (name) =>
    push((p) => {
      const list = listOf(p.get('amenities'));
      const next = list.includes(name) ? list.filter((a) => a !== name) : [...list, name];
      if (next.length) p.set('amenities', next.join(','));
      else p.delete('amenities');
    });

  const clearMore = () => push((p) => MORE_KEYS.forEach((k) => p.delete(k)));

  // Switch Buy <-> Rent. Budget ranges differ between sale and rent, so the price filter is dropped.
  const setTrans = (t) => {
    if (t === trans) {
      setOpenId(null);
      return;
    }
    if (!pathTrans) {
      push((p) => {
        if (t) p.set('transactionType', t); else p.delete('transactionType');
        p.delete('minPrice');
        p.delete('maxPrice');
      });
      return;
    }
    const word = t === 'rent' ? 'rent' : 'sale';
    const m = pathname.match(/^(.*\/)([^/]+)(\/?)$/);
    if (!m) return;
    const [, head, last, tail] = m;
    let nextLast;
    if (/-for-(sale|rent)$/.test(last)) nextLast = last.replace(/-for-(sale|rent)$/, `-for-${word}`);
    else if (/^(flats-under-|rent-under-)/.test(last)) nextLast = `residential-property-for-${word}`;
    else return;
    const params = new URLSearchParams(searchParams.toString());
    ['page', 'minPrice', 'maxPrice'].forEach((k) => params.delete(k));
    const qs = params.toString();
    const nextPath = `${head}${nextLast}${tail}`;
    startNavigationProgress();
    router.push(qs ? `${nextPath}?${qs}` : nextPath, { scroll: false });
    setOpenId(null);
  };

  const clearAll = () => {
    goTo(pathname);
    setMoreOpen(false);
  };

  const labels = {
    trans: TRANS_OPTIONS.find((o) => o.value === trans)?.label || 'Buy / Rent',
    price: priceOptions.find((o) => o.min === (f.minPrice || '') && o.max === (f.maxPrice || ''))?.label || 'Budget',
    sqft: SQFT_OPTIONS.find((o) => o.min === (f.minSqft || '') && o.max === (f.maxSqft || ''))?.label || 'Area (sq.ft)',
    type: PROPERTY_TYPES.find((o) => o.value === f.propertyType)?.label || 'Property Type',
    furn: FURNISHING_OPTIONS.find((o) => o.value === f.furnishing)?.label || 'Furnishing',
    postedBy: POSTED_BY_OPTIONS.find((o) => o.value === f.postedBy)?.label || 'Posted By',
    area: areas.find((a) => a.slug === f.area)?.name || 'Locality',
    sort: SORT_OPTIONS.find((o) => o.value === (f.sort || 'newest'))?.label || 'Newest First',
  };

  // Chips for every applied filter, each individually removable.
  const chips = [];
  // On listing pages Buy/Rent is the page itself (path), so it only gets a chip on /search.
  if (!pathTrans && f.transactionType) chips.push({ k: 'trans', label: labels.trans, clear: () => setTrans('') });
  if (f.propertyType) chips.push({ k: 'propertyType', label: labels.type, clear: () => setParam('propertyType', '') });
  if (f.bhk) chips.push({ k: 'bhk', label: `${f.bhk} BHK`, clear: () => setParam('bhk', '') });
  if (f.minPrice || f.maxPrice) chips.push({ k: 'price', label: labels.price, clear: () => setRange('minPrice', 'maxPrice', null) });
  if (f.minSqft || f.maxSqft) chips.push({ k: 'sqft', label: labels.sqft, clear: () => setRange('minSqft', 'maxSqft', null) });
  if (f.furnishing) chips.push({ k: 'furnishing', label: labels.furn, clear: () => setParam('furnishing', '') });
  if (f.postedBy) chips.push({ k: 'postedBy', label: `By ${labels.postedBy}`, clear: () => setParam('postedBy', '') });
  if (f.area) chips.push({ k: 'area', label: labels.area, clear: () => setParam('area', '') });
  if (f.postedSince) {
    const l = POSTED_SINCE_OPTIONS.find((o) => o.value === f.postedSince)?.label || f.postedSince;
    chips.push({ k: 'postedSince', label: l, clear: () => setParam('postedSince', '') });
  }
  if (f.familyOrBachelors) {
    const l = TENANT_OPTIONS.find((o) => o.value === f.familyOrBachelors)?.label || f.familyOrBachelors;
    chips.push({ k: 'tenant', label: l, clear: () => setParam('familyOrBachelors', '') });
  }
  amenities.forEach((a) => chips.push({ k: `amenity-${a}`, label: a, clear: () => toggleAmenity(a) }));
  if (f.verified) chips.push({ k: 'verified', label: 'Verified', clear: () => setParam('verified', '') });
  if (f.hasPhotos) chips.push({ k: 'hasPhotos', label: 'With photos', clear: () => setParam('hasPhotos', '') });
  if (f.parking) chips.push({ k: 'parking', label: 'Parking', clear: () => setParam('parking', '') });
  if (f.q) chips.push({ k: 'q', label: `"${f.q}"`, clear: () => setParam('q', '') });

  const sectionCounts = {
    verified: f.verified ? 1 : 0,
    added: f.postedSince ? 1 : 0,
    tenant: f.familyOrBachelors ? 1 : 0,
    amenities: amenities.length,
    photos: f.hasPhotos ? 1 : 0,
    parking: f.parking ? 1 : 0,
  };
  const moreCount = Object.values(sectionCounts).reduce((a, b) => a + b, 0);

  return {
    f, amenities, openId, setOpenId, moreOpen, setMoreOpen, trans, pathTrans, setTrans, priceOptions,
    setParam, setRange, toggleAmenity, clearMore, clearAll, labels, chips, sectionCounts, moreCount,
  };
}

/** Housing.com-style "More Filters" panel: section index on the left, scrolling options on the right. */
function MoreFilters({ s, resultCount }) {
  const { f, amenities, moreOpen, setMoreOpen, setOpenId, setParam, toggleAmenity, clearMore, sectionCounts, moreCount } = s;
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const [active, setActive] = useState(MORE_SECTIONS[0].id);
  const pos = useFixedPanel(moreOpen, wrapRef, btnRef, panelRef, { width: MORE_WIDTH, align: 'center', onClose: () => setMoreOpen(false) });

  const sectionEl = (id) => bodyRef.current?.querySelector(`[data-section="${id}"]`);

  // Highlight the section currently at the top of the scroll area.
  function onBodyScroll() {
    const body = bodyRef.current;
    if (!body) return;
    let current = MORE_SECTIONS[0].id;
    for (const sec of MORE_SECTIONS) {
      const el = sectionEl(sec.id);
      if (el && el.offsetTop <= body.scrollTop + 24) current = sec.id;
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) current = MORE_SECTIONS[MORE_SECTIONS.length - 1].id;
    setActive(current);
  }

  function jumpTo(id) {
    const el = sectionEl(id);
    if (el) bodyRef.current.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    setActive(id);
  }

  const section = (id, title, children, note) => (
    <section data-section={id} className="pb-6 mb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <h4 className="text-[15px] font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
      {note && <p className="text-xs text-gray-400 mt-2">{note}</p>}
    </section>
  );

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpenId(null); setMoreOpen(!moreOpen); }}
        className={trigger(moreCount > 0 || moreOpen)}
        aria-expanded={moreOpen}
      >
        {moreCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold">
            {moreCount}
          </span>
        )}
        More Filters
        <Caret open={moreOpen} />
      </button>

      {moreOpen && (
        <>
        {/* Dims the page below the filter strip, like Magicbricks. It sits inside wrapRef, so the
            outside-click handler ignores it; it closes the panel itself. */}
        <div
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-x-0 bottom-0 z-40 bg-black/40"
          style={{ top: pos ? pos.top - 8 : 0, visibility: pos ? 'visible' : 'hidden' }}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-label="More filters"
          className="fixed z-50 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            width: `min(${MORE_WIDTH}px, calc(100vw - 16px))`,
            height: `min(560px, calc(100vh - ${(pos?.top ?? 0) + 16}px))`,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          <div className="flex flex-1 min-h-0">
            <nav className="w-36 sm:w-60 shrink-0 border-r border-gray-100 overflow-y-auto" aria-label="Filter sections">
              {MORE_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => jumpTo(sec.id)}
                  className={`w-full flex items-center justify-between gap-2 px-4 sm:px-6 py-4 text-left text-sm border-b border-gray-100 border-l-[3px] transition-colors ${
                    active === sec.id ? 'border-l-primary bg-primary-50/60 text-primary font-semibold' : 'border-l-transparent text-gray-700 font-medium hover:bg-gray-50'
                  }`}
                >
                  {sec.label}
                  {sectionCounts[sec.id] > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px]">
                      {sectionCounts[sec.id]}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div ref={bodyRef} onScroll={onBodyScroll} className="relative flex-1 min-w-0 overflow-y-auto px-5 sm:px-7 py-5">
              {section('verified', 'Verified', (
                <button type="button" onClick={() => setParam('verified', f.verified ? '' : 'true')} className={pill(!!f.verified)} aria-pressed={!!f.verified}>
                  {f.verified && <Check />}
                  Verified properties only
                </button>
              ), 'Listings checked by the PRObroker team.')}

              {section('added', 'Posted Since', [
                <button key="all" type="button" onClick={() => setParam('postedSince', '')} className={pill(!f.postedSince)}>
                  All
                </button>,
                ...POSTED_SINCE_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setParam('postedSince', f.postedSince === o.value ? '' : o.value)} className={pill(f.postedSince === o.value)}>
                    {o.label}
                  </button>
                )),
              ], 'Based on the date each property was listed.')}

              {section('tenant', 'Tenants Preferred', TENANT_OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => setParam('familyOrBachelors', f.familyOrBachelors === o.value ? '' : o.value)} className={pill(f.familyOrBachelors === o.value)}>
                  {o.label}
                </button>
              )), 'Applies to rental listings.')}

              {section('amenities', 'Amenities', AMENITY_OPTIONS.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} className={pill(on)} aria-pressed={on}>
                    {on && <Check />}
                    {a}
                  </button>
                );
              }), 'Shows listings that have every amenity you pick.')}

              {section('photos', 'Photos', (
                <button type="button" onClick={() => setParam('hasPhotos', f.hasPhotos ? '' : 'true')} className={pill(!!f.hasPhotos)} aria-pressed={!!f.hasPhotos}>
                  {f.hasPhotos && <Check />}
                  With photos only
                </button>
              ))}

              {section('parking', 'Parking', (
                <button type="button" onClick={() => setParam('parking', f.parking ? '' : 'true')} className={pill(!!f.parking)} aria-pressed={!!f.parking}>
                  {f.parking && <Check />}
                  Parking available
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Close"
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex items-center justify-end gap-5 px-5 py-3.5 border-t border-gray-100 bg-white">
            <button type="button" onClick={clearMore} disabled={moreCount === 0} className="text-sm font-semibold text-primary hover:underline disabled:text-gray-400 disabled:no-underline">
              Clear All
            </button>
            <button type="button" onClick={() => setMoreOpen(false)} className="btn-primary !py-2.5 !px-6 text-sm">
              View {typeof resultCount === 'number' ? `${resultCount.toLocaleString('en-IN')} ` : ''}Properties
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function FilterButtons({ s, areas: rawAreas, showAreaFilter, resultCount }) {
  const { f, openId, setOpenId, setParam, setRange, labels, trans, pathTrans, setTrans, priceOptions } = s;
  // Duplicate area rows (same slug) open the same page; show each once.
  const areas = rawAreas.filter((a, i) => a.slug && rawAreas.findIndex((b) => b.slug === a.slug) === i);
  return (
    <>
      <Dropdown id="trans" label={labels.trans} active={!!trans} openId={openId} setOpenId={setOpenId}>
        {!pathTrans && (
          <button type="button" onClick={() => setTrans('')} className={optBtn(!trans)}>
            Buy &amp; Rent
          </button>
        )}
        {TRANS_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setTrans(o.value)} className={optBtn(trans === o.value)}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      <Dropdown id="type" label={labels.type} active={!!f.propertyType} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setParam('propertyType', '')} className={optBtn(!f.propertyType)}>
          All Types
        </button>
        {PROPERTY_TYPES.map((o) => (
          <button key={o.value} type="button" onClick={() => setParam('propertyType', o.value)} className={optBtn(f.propertyType === o.value)}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      {showAreaFilter && areas.length > 0 && (
        <Dropdown id="area" label={labels.area} active={!!f.area} openId={openId} setOpenId={setOpenId}>
          <button type="button" onClick={() => setParam('area', '')} className={optBtn(!f.area)}>
            All Localities
          </button>
          {areas.map((a) => (
            <button key={a.slug} type="button" onClick={() => setParam('area', a.slug)} className={optBtn(f.area === a.slug)}>
              {a.name}
            </button>
          ))}
        </Dropdown>
      )}

      <Dropdown id="bhk" label={f.bhk ? `${f.bhk} BHK` : 'BHK'} active={!!f.bhk} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setParam('bhk', '')} className={optBtn(!f.bhk)}>
          Any BHK
        </button>
        {BHK_OPTIONS.map((b) => (
          <button key={b} type="button" onClick={() => setParam('bhk', b)} className={optBtn(f.bhk === b)}>
            {b} BHK
          </button>
        ))}
      </Dropdown>

      <Dropdown id="price" label={labels.price} active={!!(f.minPrice || f.maxPrice)} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setRange('minPrice', 'maxPrice', null)} className={optBtn(!f.minPrice && !f.maxPrice)}>
          Any Budget
        </button>
        {priceOptions.map((o) => (
          <button key={o.label} type="button" onClick={() => setRange('minPrice', 'maxPrice', o)} className={optBtn(o.min === (f.minPrice || '') && o.max === (f.maxPrice || ''))}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      <Dropdown id="sqft" label={labels.sqft} active={!!(f.minSqft || f.maxSqft)} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setRange('minSqft', 'maxSqft', null)} className={optBtn(!f.minSqft && !f.maxSqft)}>
          Any Size
        </button>
        {SQFT_OPTIONS.map((o) => (
          <button key={o.label} type="button" onClick={() => setRange('minSqft', 'maxSqft', o)} className={optBtn(o.min === (f.minSqft || '') && o.max === (f.maxSqft || ''))}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      <Dropdown id="furn" label={labels.furn} active={!!f.furnishing} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setParam('furnishing', '')} className={optBtn(!f.furnishing)}>
          Any Furnishing
        </button>
        {FURNISHING_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setParam('furnishing', o.value)} className={optBtn(f.furnishing === o.value)}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      <Dropdown id="postedBy" label={labels.postedBy} active={!!f.postedBy} openId={openId} setOpenId={setOpenId}>
        <button type="button" onClick={() => setParam('postedBy', '')} className={optBtn(!f.postedBy)}>
          All
        </button>
        {POSTED_BY_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setParam('postedBy', o.value)} className={optBtn(f.postedBy === o.value)}>
            {o.label}
          </button>
        ))}
      </Dropdown>

      <MoreFilters s={s} resultCount={resultCount} />
    </>
  );
}

function SortDropdown({ s, withPrefix = false }) {
  const { f, openId, setOpenId, setParam, labels } = s;
  const label = withPrefix ? (
    <>
      <span className="hidden sm:inline text-gray-500 font-normal">Sort by:</span> {labels.sort}
    </>
  ) : labels.sort;
  return (
    <Dropdown id="sort" label={label} active={!!f.sort && f.sort !== 'newest'} openId={openId} setOpenId={setOpenId} align="right">
      {SORT_OPTIONS.map((o) => (
        <button key={o.value} type="button" onClick={() => setParam('sort', o.value === 'newest' ? '' : o.value)} className={optBtn((f.sort || 'newest') === o.value)}>
          {o.label}
        </button>
      ))}
    </Dropdown>
  );
}

function Chips({ s, resultCount }) {
  const { chips, clearAll } = s;
  return (
    <>
      {typeof resultCount === 'number' && (
        <span className="text-sm text-gray-600 font-medium mr-1">
          {resultCount.toLocaleString('en-IN')} {resultCount === 1 ? 'property' : 'properties'} found
        </span>
      )}
      {chips.map((c) => (
        <button
          key={c.k}
          type="button"
          onClick={c.clear}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-medium hover:bg-primary-100 transition-colors"
        >
          {c.label}
          <span aria-hidden="true" className="text-sm leading-none">&times;</span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      {chips.length > 0 && (
        <button type="button" onClick={clearAll} className="text-xs font-semibold text-gray-500 hover:text-primary underline underline-offset-2">
          Clear All
        </button>
      )}
    </>
  );
}

/**
 * Full-width filter strip stuck under the site header (Housing.com style). One row; it scrolls
 * sideways on narrow screens instead of wrapping.
 */
export function ListingFilterBar({ activeFilters = {}, resultCount: serverCount, areas = [], showAreaFilter = false, transactionType }) {
  const s = useListingFilters(activeFilters, areas, transactionType);
  const resultCount = useLiveCount(serverCount);
  return (
    <div className="filter-strip sticky top-[var(--header-h)] z-30 bg-white border-b border-gray-200">
      {/* Phones: the whole row (every filter, then Sort) scrolls sideways, fading out on the
          right as a hint that there is more. sm and up: filters scroll, Sort stays pinned right. */}
      <div className="container-px flex items-center gap-2 py-3 overflow-x-auto no-scrollbar sm:overflow-visible [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:[mask-image:none]">
        <div className="flex items-center gap-2 shrink-0 sm:shrink sm:flex-1 sm:min-w-0 sm:overflow-x-auto no-scrollbar">
          <FilterButtons s={s} areas={areas} showAreaFilter={showAreaFilter} resultCount={resultCount} />
          {/* Shown only while a filter is applied; the active dropdowns themselves show what's set. */}
          {s.chips.length > 0 && (
            <button
              type="button"
              onClick={s.clearAll}
              className="shrink-0 ml-1 px-2 text-sm font-semibold text-primary underline underline-offset-2 whitespace-nowrap hover:text-primary-700"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="shrink-0 pl-2 sm:pl-3 pr-4 sm:pr-0 border-l border-gray-200">
          <SortDropdown s={s} withPrefix />
        </div>
      </div>
    </div>
  );
}

/** Self-contained filter card (used in the /search sidebar). */
export default function ListingFilters({ activeFilters = {}, resultCount: serverCount, areas = [], showAreaFilter = false }) {
  const s = useListingFilters(activeFilters, areas);
  const resultCount = useLiveCount(serverCount);
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <FilterButtons s={s} areas={areas} showAreaFilter={showAreaFilter} resultCount={resultCount} />
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <SortDropdown s={s} />
        </div>
      </div>
      {(s.chips.length > 0 || typeof resultCount === 'number') && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <Chips s={s} resultCount={resultCount} />
        </div>
      )}
    </div>
  );
}
