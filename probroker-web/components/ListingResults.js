'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from './PropertyCard';
import PaginationLinks from './PaginationLinks';
import { useListingResults } from './ListingResultsProvider';

/**
 * Property list for a listing page, kept in sync with the URL by ListingResultsProvider.
 * empty: shown when nothing matches. prompt: shown on /search before anything is searched.
 */
export default function ListingResults({ layout = 'row', basePath, empty, prompt = null }) {
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

  const listClass = layout === 'grid'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8'
    : 'flex flex-col gap-4 mb-8';

  return (
    <div aria-busy={r.loading} className={`transition-opacity ${r.loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {r.properties.length === 0 ? (
        r.loading ? <div className="card p-10" /> : empty
      ) : (
        <div className={listClass}>
          {r.properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} variant={layout === 'row' ? 'row' : undefined} />
          ))}
        </div>
      )}
      {r.totalPages > 1 && <PaginationLinks basePath={basePath} page={r.page} totalPages={r.totalPages} />}
    </div>
  );
}

const PAGE_SUFFIX = (n) => (n > 1 ? ` – Page ${n}` : '');
const TITLE_TAIL = ' | PRObroker';

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

  return (
    <h1 className="text-xl md:text-2xl font-bold font-heading leading-snug text-gray-900">
      {retext(h1, from, to)}
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
