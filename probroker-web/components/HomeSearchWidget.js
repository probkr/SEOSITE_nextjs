'use client';

import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { useRouter } from 'next/navigation';
import { CITY_STORAGE_KEY, CITY_EVENT } from '@/lib/config';
import { startNavigationProgress } from '@/components/NavigationProgress';
import { Highlight, LocalityIcon, TrendIcon } from './PlaceIcons';

// Category tabs -> which SEO category they map to.
// `pt` = property-type slug used by the /{city}/{type}s-for-{trans}/ router.
const TABS = [
  { key: 'residential', label: 'Residential', category: 'residential' },
  { key: 'commercial', label: 'Commercial', category: 'commercial' },
  { key: 'plot', label: 'Plot', category: 'residential', forcePt: 'plots' },
];

// Subtypes keyed by tab. `slug` is the PLURAL form the catch-all router understands
// (see lib/citySegments.js PT_MAP): /{city}/shops-for-sale/ etc.
const SUBTYPES = {
  residential: [
    { slug: '', label: 'All Residential' },
    { slug: 'flats', label: 'Flat / Apartment' },
    { slug: 'bungalows', label: 'Bungalow' },
    { slug: 'villas', label: 'Villa' },
    { slug: 'tenements', label: 'Tenement' },
    { slug: 'penthouses', label: 'Penthouse' },
  ],
  commercial: [
    { slug: '', label: 'All Commercial' },
    { slug: 'offices', label: 'Office' },
    { slug: 'shops', label: 'Shop' },
    { slug: 'showrooms', label: 'Showroom' },
    { slug: 'warehouses', label: 'Warehouse' },
  ],
  plot: [{ slug: 'plots', label: 'Plot / Land' }],
};

const BHK_OPTIONS = ['1', '2', '3', '4'];

const TRANS_OPTIONS = [
  { value: 'sale', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
];

// Each field is a labelled cell; focus-within highlights the whole cell instead of a ring on the bare control.
// Phones: every field is its own bordered box (Locality full width, City | Type, then BHK chips),
// so no value is cut off. Desktop: one borderless row split by dividers.
const fieldCls = 'flex flex-col justify-center gap-0.5 px-3 lg:px-4 py-1.5 lg:py-2.5 rounded-xl border border-gray-200 lg:border-0 hover:bg-gray-50 focus-within:bg-gray-50 focus-within:border-primary/40 transition-colors min-w-0';
const labelCls = 'text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate';

// A styled replacement for <select>: the browser's own option list can't be themed.
// `align="right"` opens the list from the field's right edge (for the right-hand column on phones).
function FieldSelect({ label, value, options, onChange, align = 'left', className = '' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(o) {
    onChange(o.value);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault();
      choose(options[active]);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className={`${fieldCls} w-full h-full text-left outline-none ${open ? 'bg-gray-50 border-primary/40' : ''}`}
      >
        <span className={labelCls}>{label}</span>
        <span className="flex items-center justify-between gap-2 min-w-0">
          <span className="truncate text-sm lg:text-[15px] font-semibold text-gray-900">{current?.label}</span>
          <svg
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : 'text-gray-400'}`}
            fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-30 top-full mt-2 min-w-full w-max max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto p-1.5 bg-white border border-gray-100 rounded-xl shadow-float ${
            align === 'right' ? 'right-0 lg:right-auto lg:left-0' : 'left-0'
          }`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value || 'all'}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                className={`flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                  selected ? 'text-primary font-semibold' : 'text-gray-700'
                } ${i === active ? 'bg-primary-50' : ''}`}
              >
                {o.label}
                {selected && (
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// popularAreas: { [citySlug]: [{ name, slug, count }] }, shown before anything is typed.
export default function HomeSearchWidget({ cities = [], areas = [], popularAreas = {} }) {
  const router = useRouter();
  const [tab, setTab] = useState('residential');
  const [trans, setTrans] = useState('sale');
  const [city, setCity] = useState(cities[0]?.slug || 'ahmedabad');
  const [subtype, setSubtype] = useState('');
  const [bhk, setBhk] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null); // { slug, name } when a locality is chosen
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);

  const cityList = cities.length ? cities : [{ slug: 'ahmedabad', name: 'Ahmedabad' }];
  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];
  const subtypeList = SUBTYPES[tab] || SUBTYPES.residential;

  // Reset subtype when the tab changes so we never carry a commercial type into residential.
  useEffect(() => {
    setSubtype(tab === 'plot' ? 'plots' : '');
  }, [tab]);

  // Locality suggestions, filtered to the selected city.
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const cityObj = cityList.find((c) => c.slug === city);
    const cid = cityObj?.id || cityObj?._id;
    // The areas collection has duplicate rows sharing one slug (e.g. three "Chandkheda"s);
    // they all open the same page, so show each slug once.
    const seen = new Set();
    return areas
      .filter((a) => {
        if ((cid && a.cityId !== cid) || !a.name?.toLowerCase().includes(term) || seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
      })
      .slice(0, 8);
  }, [q, city, areas, cityList]);

  // Empty box: the city's popular localities. Typing: the matching ones.
  const cityName = (cityList.find((c) => c.slug === city) || {}).name || '';
  const showPopular = !q.trim() && !picked;
  const localityList = showPopular ? popularAreas[city] || [] : suggestions;

  useEffect(() => { setActive(0); }, [q, city, showPopular]);

  function chooseLocality(a) {
    setPicked({ slug: a.slug, name: a.name });
    setOpen(false);
  }

  function onLocalityKey(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!localityList.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + localityList.length) % localityList.length);
    } else if (e.key === 'Enter' && open && localityList[active]) {
      // Pick the highlighted locality instead of submitting the form.
      e.preventDefault();
      chooseLocality(localityList[active]);
    }
  }

  // Follow the city chosen in the header's city picker.
  useEffect(() => {
    const apply = (slug) => {
      if (slug && cityList.some((c) => c.slug === slug)) {
        setCity(slug);
        setPicked(null);
        setQ('');
      }
    };
    try { apply(localStorage.getItem(CITY_STORAGE_KEY)); } catch {}
    const onChange = (e) => apply(e.detail);
    window.addEventListener(CITY_EVENT, onChange);
    return () => window.removeEventListener(CITY_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    // Build the most keyword-rich URL the router can actually serve.
    const areaSeg = picked?.slug ? `${picked.slug}/` : '';
    let leaf;

    if (subtype) {
      // /{city}/[{area}/]{subtype}-for-{trans}/  e.g. /ahmedabad/shops-for-sale/
      leaf = `${subtype}-for-${trans}`;
    } else {
      // /{city}/[{area}/]{category}-property-for-{trans}/
      leaf = `${activeTab.category}-property-for-${trans}`;
    }

    const params = new URLSearchParams();
    if (bhk) params.set('bhk', bhk);
    // Free text that didn't resolve to a known locality still gets passed as a query.
    if (!picked && q.trim()) params.set('q', q.trim());

    const base = `/${city}/${areaSeg}${leaf}/`;
    const qs = params.toString();
    startNavigationProgress();
    router.push(qs ? `${base}?${qs}` : base);
  }

  return (
    <div className="w-full max-w-5xl mx-auto text-left bg-white rounded-2xl border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)]">
      {/* Category tabs on the left, Buy/Rent on the right -- one line on every screen size */}
      <div className="flex items-center justify-between gap-2 px-2 md:px-5 border-b border-gray-100">
        <div className="flex items-center min-w-0 overflow-x-auto no-scrollbar" role="tablist" aria-label="Property category">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative shrink-0 px-2 sm:px-3 md:px-4 py-4 text-[13px] sm:text-sm md:text-[15px] font-semibold transition-colors ${
                tab === t.key ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        <div className="shrink-0 flex items-center bg-gray-100 rounded-full p-1 text-xs sm:text-sm font-semibold" role="group" aria-label="Buy or Rent">
          {TRANS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={trans === o.value}
              onClick={() => setTrans(o.value)}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-colors ${
                trans === o.value ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row lg:items-stretch p-2">
        {/* Phones: Locality full width on top, City | Type side by side, BHK chips below.
            Desktop: one row in DOM order (City, Locality, Type, BHK). */}
        <div className="grid grid-cols-2 gap-2 lg:gap-0 lg:flex lg:flex-row flex-1 min-w-0 lg:divide-x divide-gray-100">
          {/* City */}
          <FieldSelect
            label="City"
            value={city}
            options={cityList.map((c) => ({ value: c.slug, label: c.name }))}
            onChange={(v) => {
              setCity(v);
              setPicked(null);
              setQ('');
            }}
            className="lg:w-44"
          />

          {/* Locality autocomplete */}
          <div ref={boxRef} className={`${fieldCls} relative flex-1 col-span-2 order-first lg:order-none`}>
            <label htmlFor="home-locality" className={labelCls}>Locality</label>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
              <input
                id="home-locality"
                type="text"
                value={picked ? picked.name : q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPicked(null);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onKeyDown={onLocalityKey}
                role="combobox"
                aria-expanded={open && localityList.length > 0}
                aria-controls="home-locality-list"
                aria-autocomplete="list"
                placeholder="Search locality, society or landmark"
                autoComplete="off"
                className="w-full bg-transparent border-0 p-0 outline-none text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              />
              {picked && (
                <button
                  type="button"
                  onClick={() => {
                    setPicked(null);
                    setQ('');
                  }}
                  aria-label="Clear locality"
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
                >
                  &times;
                </button>
              )}
            </div>
            {open && localityList.length > 0 && (
              <div className="absolute z-30 left-0 right-0 lg:right-auto lg:min-w-[26rem] top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-float overflow-hidden">
                {showPopular && (
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 text-xs text-gray-500">
                    <TrendIcon />
                    Popular searches in <span className="font-bold text-gray-800">{cityName}</span>
                  </div>
                )}
                <ul id="home-locality-list" role="listbox" aria-label="Localities" className="max-h-80 overflow-y-auto pb-1.5">
                  {localityList.map((a, i) => (
                    <li key={a.slug} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => chooseLocality(a)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${i === active ? 'bg-primary-50' : ''}`}
                      >
                        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${i === active ? 'bg-white text-primary' : 'bg-gray-100 text-gray-500'}`}>
                          <LocalityIcon />
                        </span>
                        <span className="min-w-0 leading-tight">
                          <span className="block text-[15px] text-gray-700 truncate">
                            <Highlight text={a.name} term={showPopular ? '' : q} />
                          </span>
                          <span className="block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Locality{a.count ? ` · ${a.count.toLocaleString('en-IN')} properties` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Subtype */}
          <FieldSelect
            label={
              <>
                <span className="lg:hidden">Type</span>
                <span className="hidden lg:inline">Property Type</span>
              </>
            }
            value={subtype}
            options={subtypeList.map((s) => ({ value: s.slug, label: s.label }))}
            onChange={setSubtype}
            align="right"
            className="lg:w-48"
          />

          {/* BHK — only meaningful for residential dwellings. Phones: a row of chips, one tap each. */}
          {tab === 'residential' && (
            <div className={`${fieldCls} col-span-2 lg:hidden`}>
              <span className={labelCls}>BHK</span>
              <div className="grid grid-cols-5 gap-1.5 mt-1" role="group" aria-label="BHK">
                {[{ v: '', l: 'Any' }, ...BHK_OPTIONS.map((b) => ({ v: b, l: `${b} BHK` }))].map((o) => (
                  <button
                    key={o.v || 'any'}
                    type="button"
                    aria-pressed={bhk === o.v}
                    onClick={() => setBhk(o.v)}
                    className={`py-1.5 rounded-lg border text-[13px] font-semibold whitespace-nowrap transition-colors ${
                      bhk === o.v ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary/40'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === 'residential' && (
            <FieldSelect
              label="BHK"
              value={bhk}
              options={[{ value: '', label: 'Any' }, ...BHK_OPTIONS.map((b) => ({ value: b, label: `${b} BHK` }))]}
              onChange={setBhk}
              className="hidden lg:block lg:w-32"
            />
          )}
        </div>

        <button
          type="submit"
          className="btn-primary !rounded-xl gap-2 h-11 lg:h-auto !py-0 lg:!py-3 mt-2 lg:mt-0 lg:ml-2 lg:px-8 shrink-0 text-[15px] lg:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
          Search
        </button>
      </form>
    </div>
  );
}
