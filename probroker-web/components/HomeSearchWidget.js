'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CITY_STORAGE_KEY, CITY_EVENT } from './Header';
import { startNavigationProgress } from '@/components/NavigationProgress';

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
const fieldCls = 'flex flex-col justify-center gap-0.5 px-4 py-2.5 rounded-xl hover:bg-gray-50 focus-within:bg-gray-50 transition-colors min-w-0';
const labelCls = 'text-[11px] font-bold uppercase tracking-wider text-gray-400';
const selectCls = 'w-full -ml-1 bg-transparent border-0 outline-none text-[15px] font-semibold text-gray-900 cursor-pointer';

export default function HomeSearchWidget({ cities = [], areas = [] }) {
  const router = useRouter();
  const [tab, setTab] = useState('residential');
  const [trans, setTrans] = useState('sale');
  const [city, setCity] = useState(cities[0]?.slug || 'ahmedabad');
  const [subtype, setSubtype] = useState('');
  const [bhk, setBhk] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null); // { slug, name } when a locality is chosen
  const [open, setOpen] = useState(false);
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
      {/* Category tabs + Buy/Rent, attached to the top of the same card */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-5 border-b border-gray-100">
        <div className="flex items-center" role="tablist" aria-label="Property category">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-3 md:px-4 py-4 text-sm md:text-[15px] font-semibold transition-colors ${
                tab === t.key ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-3 right-3 md:left-4 md:right-4 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-gray-100 rounded-full p-1 text-sm font-semibold" role="group" aria-label="Buy or Rent">
          {TRANS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={trans === o.value}
              onClick={() => setTrans(o.value)}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                trans === o.value ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row lg:items-stretch p-2">
        <div className="flex flex-col lg:flex-row flex-1 min-w-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* City */}
          <label className={`${fieldCls} lg:w-44`}>
            <span className={labelCls}>City</span>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPicked(null);
                setQ('');
              }}
              className={selectCls}
            >
              {cityList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {/* Locality autocomplete */}
          <div ref={boxRef} className={`${fieldCls} relative flex-1`}>
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
            {open && suggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-float max-h-64 overflow-y-auto py-1">
                {suggestions.map((a) => (
                  <li key={a.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked({ slug: a.slug, name: a.name });
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                    >
                      {a.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subtype */}
          <label className={`${fieldCls} lg:w-48`}>
            <span className={labelCls}>Property Type</span>
            <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className={selectCls}>
              {subtypeList.map((s) => (
                <option key={s.slug || 'all'} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* BHK — only meaningful for residential dwellings */}
          {tab === 'residential' && (
            <label className={`${fieldCls} lg:w-32`}>
              <span className={labelCls}>BHK</span>
              <select value={bhk} onChange={(e) => setBhk(e.target.value)} className={selectCls}>
                <option value="">Any</option>
                {BHK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b} BHK
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary !rounded-xl gap-2 h-14 lg:h-auto mt-2 lg:mt-0 lg:ml-2 lg:px-8 shrink-0 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></svg>
          Search
        </button>
      </form>
    </div>
  );
}
