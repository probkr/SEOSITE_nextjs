'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaginationLinks({ basePath, page, totalPages }) {
  const searchParams = useSearchParams();

  function hrefFor(n) {
    const params = new URLSearchParams(searchParams.toString());
    if (n > 1) params.set('page', String(n)); else params.delete('page');
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
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
            className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${n === page ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
          >
            {n}
          </Link>
        )
      )}
    </div>
  );
}
