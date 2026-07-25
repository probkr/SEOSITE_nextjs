'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

const POSTED_SINCE_OPTIONS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
];

const TENANT_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'bachelors', label: 'Bachelors' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const trigger = (active) =>
  `inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
    active
      ? 'border-primary bg-primary-50 text-primary'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
  }`;

const panel =
  'absolute z-40 top-full mt-1.5 min-w-[220px] max-h-[60vh] overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-float p-2';

const optBtn = (active) =>
  `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
    active ? 'bg-primary-50 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'
  }`;

function Caret() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

/** A dropdown that closes on outside click / Escape. */
function Dropdown({ id, label, active, openId, setOpenId, children, width, align = 'left' }) {
  const ref = useRef(null);
  const open = openId === id;

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpenId(null);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpenId(null);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpenId]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpenId(open ? null : id)} className={trigger(active)} aria-expanded={open}>
        {label}
        <Caret />
      </button>
      {open && (
        <div className={`${panel} ${align === 'right' ? 'right-0' : 'left-0'}`} style={width ? { width } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ListingFilters({ activeFilters = {}, resultCount, areas = [], showAreaFilter = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openId, setOpenId] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const f = activeFilters;

  function push(mutate) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setOpenId(null);
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

  const clearAll = () => router.push(pathname, { scroll: false });

  const priceLabel =
    PRICE_OPTIONS.find((o) => o.min === (f.minPrice || '') && o.max === (f.maxPrice || ''))?.label || 'Budget';
  const sqftLabel =
    SQFT_OPTIONS.find((o) => o.min === (f.minSqft || '') && o.max === (f.maxSqft || ''))?.label || 'Area (sq.ft)';
  const typeLabel = PROPERTY_TYPES.find((o) => o.value === f.propertyType)?.label || 'Property Type';
  const furnLabel = FURNISHING_OPTIONS.find((o) => o.value === f.furnishing)?.label || 'Furnishing';
  const postedByLabel = POSTED_BY_OPTIONS.find((o) => o.value === f.postedBy)?.label || 'Posted By';
  const areaLabel = areas.find((a) => a.slug === f.area)?.name || 'Locality';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === (f.sort || 'newest'))?.label || 'Newest First';

  // Chips for every applied filter, each individually removable.
  const chips = [];
  if (f.propertyType) chips.push({ k: 'propertyType', label: typeLabel, clear: () => setParam('propertyType', '') });
  if (f.bhk) chips.push({ k: 'bhk', label: `${f.bhk} BHK`, clear: () => setParam('bhk', '') });
  if (f.minPrice || f.maxPrice) chips.push({ k: 'price', label: priceLabel, clear: () => setRange('minPrice', 'maxPrice', null) });
  if (f.minSqft || f.maxSqft) chips.push({ k: 'sqft', label: sqftLabel, clear: () => setRange('minSqft', 'maxSqft', null) });
  if (f.furnishing) chips.push({ k: 'furnishing', label: furnLabel, clear: () => setParam('furnishing', '') });
  if (f.postedBy) chips.push({ k: 'postedBy', label: `By ${postedByLabel}`, clear: () => setParam('postedBy', '') });
  if (f.area) chips.push({ k: 'area', label: areaLabel, clear: () => setParam('area', '') });
  if (f.postedSince) {
    const l = POSTED_SINCE_OPTIONS.find((o) => o.value === f.postedSince)?.label || f.postedSince;
    chips.push({ k: 'postedSince', label: l, clear: () => setParam('postedSince', '') });
  }
  if (f.familyOrBachelors) {
    const l = TENANT_OPTIONS.find((o) => o.value === f.familyOrBachelors)?.label || f.familyOrBachelors;
    chips.push({ k: 'tenant', label: l, clear: () => setParam('familyOrBachelors', '') });
  }
  if (f.q) chips.push({ k: 'q', label: `"${f.q}"`, clear: () => setParam('q', '') });

  const moreCount = [f.postedSince, f.familyOrBachelors].filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card px-3 py-2">
      {/* Primary filters — always visible, horizontally scrollable on mobile */}
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown id="type" label={typeLabel} active={!!f.propertyType} openId={openId} setOpenId={setOpenId}>
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
          <Dropdown id="area" label={areaLabel} active={!!f.area} openId={openId} setOpenId={setOpenId}>
            <div className="max-h-72 overflow-y-auto">
              <button type="button" onClick={() => setParam('area', '')} className={optBtn(!f.area)}>
                All Localities
              </button>
              {areas.map((a) => (
                <button key={a.slug} type="button" onClick={() => setParam('area', a.slug)} className={optBtn(f.area === a.slug)}>
                  {a.name}
                </button>
              ))}
            </div>
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

        <Dropdown id="price" label={priceLabel} active={!!(f.minPrice || f.maxPrice)} openId={openId} setOpenId={setOpenId}>
          <button type="button" onClick={() => setRange('minPrice', 'maxPrice', null)} className={optBtn(!f.minPrice && !f.maxPrice)}>
            Any Budget
          </button>
          {PRICE_OPTIONS.map((o) => (
            <button key={o.label} type="button" onClick={() => setRange('minPrice', 'maxPrice', o)} className={optBtn(o.min === (f.minPrice || '') && o.max === (f.maxPrice || ''))}>
              {o.label}
            </button>
          ))}
        </Dropdown>

        <Dropdown id="sqft" label={sqftLabel} active={!!(f.minSqft || f.maxSqft)} openId={openId} setOpenId={setOpenId}>
          <button type="button" onClick={() => setRange('minSqft', 'maxSqft', null)} className={optBtn(!f.minSqft && !f.maxSqft)}>
            Any Size
          </button>
          {SQFT_OPTIONS.map((o) => (
            <button key={o.label} type="button" onClick={() => setRange('minSqft', 'maxSqft', o)} className={optBtn(o.min === (f.minSqft || '') && o.max === (f.maxSqft || ''))}>
              {o.label}
            </button>
          ))}
        </Dropdown>

        <Dropdown id="furn" label={furnLabel} active={!!f.furnishing} openId={openId} setOpenId={setOpenId}>
          <button type="button" onClick={() => setParam('furnishing', '')} className={optBtn(!f.furnishing)}>
            Any Furnishing
          </button>
          {FURNISHING_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setParam('furnishing', o.value)} className={optBtn(f.furnishing === o.value)}>
              {o.label}
            </button>
          ))}
        </Dropdown>

        <Dropdown id="postedBy" label={postedByLabel} active={!!f.postedBy} openId={openId} setOpenId={setOpenId}>
          <button type="button" onClick={() => setParam('postedBy', '')} className={optBtn(!f.postedBy)}>
            Anyone
          </button>
          {POSTED_BY_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setParam('postedBy', o.value)} className={optBtn(f.postedBy === o.value)}>
              {o.label}
            </button>
          ))}
        </Dropdown>

        <button type="button" onClick={() => setMoreOpen(true)} className={trigger(moreCount > 0)}>
          {moreCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold">
              {moreCount}
            </span>
          )}
          More Filters
        </button>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Dropdown id="sort" label={sortLabel} active={!!f.sort && f.sort !== 'newest'} openId={openId} setOpenId={setOpenId} align="right">
            {SORT_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => setParam('sort', o.value === 'newest' ? '' : o.value)} className={optBtn((f.sort || 'newest') === o.value)}>
                {o.label}
              </button>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Applied filters + result count */}
      {(chips.length > 0 || typeof resultCount === 'number') && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
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
        </div>
      )}

      {/* More filters modal */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setMoreOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-float max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold font-heading text-gray-900">More Filters</h3>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-1">
                &times;
              </button>
            </div>

            <div className="px-5 py-4 space-y-6">
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2.5">Posted Since</div>
                <div className="flex flex-wrap gap-2">
                  {POSTED_SINCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setParam('postedSince', f.postedSince === o.value ? '' : o.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        f.postedSince === o.value ? 'border-primary bg-primary-50 text-primary font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2.5">Preferred Tenant</div>
                <div className="flex flex-wrap gap-2">
                  {TENANT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setParam('familyOrBachelors', f.familyOrBachelors === o.value ? '' : o.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        f.familyOrBachelors === o.value ? 'border-primary bg-primary-50 text-primary font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Applies to rental listings.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button type="button" onClick={clearAll} className="text-sm font-semibold text-gray-500 hover:text-primary">
                Clear All
              </button>
              <button type="button" onClick={() => setMoreOpen(false)} className="btn-primary !py-2 !px-6">
                Show {typeof resultCount === 'number' ? resultCount.toLocaleString('en-IN') : ''} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
