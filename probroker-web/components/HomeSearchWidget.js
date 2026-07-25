'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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

const selectCls =
  'h-12 px-3 rounded-lg border-0 focus:ring-2 focus:ring-primary outline-none text-sm text-gray-700 bg-transparent cursor-pointer';

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
    return areas
      .filter((a) => (!cid || a.cityId === cid) && a.name?.toLowerCase().includes(term))
      .slice(0, 8);
  }, [q, city, areas, cityList]);

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
    router.push(qs ? `${base}?${qs}` : base);
  }

  const tabBtn = (active) =>
    `px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-primary text-white shadow-card' : 'text-gray-600 hover:text-primary'
    }`;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Stage 1 — property category */}
      <div className="inline-flex flex-wrap items-center gap-1 bg-white rounded-xl p-1.5 shadow-card mb-3">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={tabBtn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stages 2-5 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-float border border-gray-100 p-2 flex flex-col lg:flex-row gap-2"
      >
        {/* Buy / Rent */}
        <select
          value={trans}
          onChange={(e) => setTrans(e.target.value)}
          aria-label="Buy or Rent"
          className={`${selectCls} bg-primary-50 rounded-lg lg:w-28 shrink-0`}
        >
          <option value="sale">Buy</option>
          <option value="rent">Rent</option>
        </select>

        {/* City */}
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPicked(null);
            setQ('');
          }}
          aria-label="City"
          className={`${selectCls} bg-gray-50 rounded-lg lg:w-40 shrink-0`}
        >
          {cityList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Locality autocomplete */}
        <div ref={boxRef} className="relative flex-1 min-w-0">
          <input
            type="text"
            value={picked ? picked.name : q}
            onChange={(e) => {
              setQ(e.target.value);
              setPicked(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search locality, society, or landmark..."
            aria-label="Search locality"
            className="w-full h-12 px-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary text-sm text-gray-700 placeholder:text-gray-400"
          />
          {picked && (
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setQ('');
              }}
              aria-label="Clear locality"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            >
              &times;
            </button>
          )}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-float max-h-64 overflow-y-auto py-1">
              {suggestions.map((a) => (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked({ slug: a.slug, name: a.name });
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Subtype */}
        <select
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
          aria-label="Property type"
          className={`${selectCls} bg-gray-50 rounded-lg lg:w-44 shrink-0`}
        >
          {subtypeList.map((s) => (
            <option key={s.slug || 'all'} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>

        {/* BHK — only meaningful for residential dwellings */}
        {tab === 'residential' && (
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            aria-label="BHK"
            className={`${selectCls} bg-gray-50 rounded-lg lg:w-24 shrink-0`}
          >
            <option value="">BHK</option>
            {BHK_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b} BHK
              </option>
            ))}
          </select>
        )}

        <button type="submit" className="btn-primary h-12 lg:w-32 shrink-0 justify-center">
          Search
        </button>
      </form>
    </div>
  );
}
