'use client';

import { Fragment, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from './PropertyCard';
import PaginationLinks from './PaginationLinks';
import AdSlot from './AdSlot';
import { useListingResults } from './ListingResultsProvider';
import { AD_EVERY, adSlotAfter } from '@/lib/ads';

/**
 * Property list for a listing page, kept in sync with the URL by ListingResultsProvider.
 * empty: shown when nothing matches. prompt: shown on /search before anything is searched.
 * adCity: city slug for the in-feed ads (lib/ads.js); without it only all-city ads show.
 */
export default function ListingResults({ layout = 'row', basePath, empty, prompt = null, adCity }) {
  const r = useListingResults();
  if (!r) return null;

  if (!r.hasQuery) return prompt;

  if (r.error) {
    return (
      <div className="card p-8 text-center" role="alert">
        <p className="text-gray-700 font-medium mb-3">Couldn&apos;t load properties. Please check your connection.</p>
        <button type="button" onClick={r.retry} className="btn-primary text-sm !py-2">Try again</button>
      </div>
    );
  }

  // Page 2 carries on from the ads page 1 showed instead of starting again from the first one.
  // In-feed ads plus the one closing the list.
  const feedAds = r.properties.filter((_, i) => adSlotAfter(i, r.properties.length) >= 0).length;
  const adsPerPage = feedAds + 1;
  const adOffset = (Math.max(1, r.page || 1) - 1) * adsPerPage;

  const listClass = layout === 'grid'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8'
    : 'flex flex-col gap-4 mb-8';

  return (
    <div aria-busy={r.loading} className={`transition-opacity ${r.loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {r.properties.length === 0 ? (
        r.loading ? <div className="card p-10" /> : empty
      ) : (
        <div className={listClass}>
          {r.properties.map((p, i) => {
            const slot = adSlotAfter(i, r.properties.length);
            return (
              <Fragment key={p.propertyId || p.slug}>
                <PropertyCard p={p} variant={layout === 'row' ? 'row' : undefined} />
                {slot >= 0 && (
                  <AdSlot placement="listing" city={adCity} slot={slot + adOffset} variant={layout === 'row' ? 'row' : 'grid'} />
                )}
              </Fragment>
            );
          })}
          {/* The list always closes with an ad (the next one in turn). */}
          <AdSlot placement="listing" city={adCity} slot={feedAds + adOffset} variant={layout === 'row' ? 'row' : 'grid'} />
        </div>
      )}
      {r.totalPages > 1 && <PaginationLinks basePath={basePath} page={r.page} totalPages={r.totalPages} />}
    </div>
  );
}

const PAGE_SUFFIX = (n) => (n > 1 ? ` – Page ${n}` : '');
const TITLE_TAIL = ' | AllFlats';

// Rewrites a server-built heading ("245+ ... – Page 2") for the live count and page.
function retext(text, from, to) {
  let s = text;
  let tail = '';
  if (s.endsWith(TITLE_TAIL)) {
    tail = TITLE_TAIL;
    s = s.slice(0, -TITLE_TAIL.length);
  }
  const oldSuffix = PAGE_SUFFIX(from.page);
  if (oldSuffix && s.endsWith(oldSuffix)) s = s.slice(0, -oldSuffix.length);
  s = s.replace(`${from.total}+`, `${to.total}+`);
  return `${s}${PAGE_SUFFIX(to.page)}${tail}`;
}

/** Listing page H1 (and the tab title) with the live result count and page number. */
export function ListingHeading({ h1, total, page }) {
  const r = useListingResults();
  const from = { total, page };
  // r keeps the last loaded result while the next one loads, so this never flashes back.
  const to = r ? { total: r.total, page: r.page } : from;
  const serverTitle = useRef(null);

  useEffect(() => {
    if (serverTitle.current === null) serverTitle.current = document.title;
    document.title = retext(serverTitle.current, from, to);
  }, [to.total, to.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // "2635+ Flats for Rent in Shela" -> the count in bold, the rest in regular weight.
  const text = retext(h1, from, to);
  const m = text.match(/^([\d,]+\+?)\s+(.*)$/s);
  return (
    <h1 className="text-[17px] md:text-2xl font-medium font-heading leading-snug text-gray-900">
      {m ? <><span className="font-extrabold">{m[1]}</span> {m[2]}</> : text}
    </h1>
  );
}

/** /search heading; follows ?q as filters change it. */
export function SearchHeading() {
  const q = useSearchParams().get('q') || '';
  return (
    <h1 className="text-2xl font-bold font-heading mb-2 text-gray-900">
      {q ? <>Search results for &quot;{q}&quot;</> : 'Search Properties'}
    </h1>
  );
}
