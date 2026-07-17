export default function Pagination({ page, totalPages, baseHref, extraQuery = '' }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  for (let pn = 1; pn <= totalPages; pn++) {
    if (pn <= 3 || pn > totalPages - 2 || (pn >= page - 1 && pn <= page + 1)) {
      pages.push(pn);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  const href = (pn) => `${baseHref}?page=${pn}${extraQuery}`;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-xs">
      <div className="text-gray-500">Page {page} of {totalPages}</div>
      <div className="flex gap-1">
        {page > 1 && <a href={href(page - 1)} className="border border-gray-200 rounded px-2.5 py-1.5 hover:border-primary hover:text-primary">« Prev</a>}
        {pages.map((pn, i) =>
          pn === '…' ? (
            <span key={`gap-${i}`} className="px-1.5 py-1.5 text-gray-400">…</span>
          ) : (
            <a
              key={pn}
              href={href(pn)}
              className={`border rounded px-2.5 py-1.5 ${pn === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}
            >
              {pn}
            </a>
          )
        )}
        {page < totalPages && <a href={href(page + 1)} className="border border-gray-200 rounded px-2.5 py-1.5 hover:border-primary hover:text-primary">Next »</a>}
      </div>
    </div>
  );
}
