'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useListingResults } from './ListingResultsProvider';

export default function PaginationLinks({ basePath, page, totalPages }) {
  const searchParams = useSearchParams();
  // On listing pages a page change loads JSON in place; the hrefs stay real for crawlers.
  const live = useListingResults();

  function hrefFor(n, path = basePath) {
    const params = new URLSearchParams(searchParams.toString());
    if (n > 1) params.set('page', String(n)); else params.delete('page');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  function onClick(e, n) {
    if (!live || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // The current path, not basePath: the server redirects basePath's trailing slash away.
    if (n !== page) live.navigate(hrefFor(n, window.location.pathname), { scrollTop: true });
  }

  // Show a compact window around the current page for large result sets.
  const pages = [];
  const windowSize = 2;
  for (let n = 1; n <= totalPages; n += 1) {
    if (n === 1 || n === totalPages || (n >= page - windowSize && n <= page + windowSize)) {
      pages.push(n);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap mb-10">
      {pages.map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            onClick={(e) => onClick(e, n)}
            prefetch={live ? false : undefined}
            aria-current={n === page ? 'page' : undefined}
            className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${n === page ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
          >
            {n}
          </Link>
        )
      )}
    </div>
  );
}
