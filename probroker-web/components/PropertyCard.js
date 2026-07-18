import Link from 'next/link';
import { fmtPrice, buildPropertyTitle, buildPropertySlug } from '@/lib/format';

export default function PropertyCard({ p }) {
  const title = buildPropertyTitle(p);
  const slug = p.slug || buildPropertySlug(p);
  const photo = (p.photos && p.photos[0]) || '/placeholder-property.svg';
  const area = p.areaName || p.area || '';
  const city = p.cityName || '';
  const loc = [area, city].filter(Boolean).join(', ');
  const trans = p.transactionType === 'rent' ? 'For Rent' : 'For Sale';

  return (
    <Link href={`/property/${slug}/`} className="group card overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="badge absolute top-2 left-2 bg-primary text-white shadow-card">{trans}</span>
        {p.bhk ? (
          <span className="badge absolute top-2 right-2 bg-white/95 text-gray-800 shadow-card">{parseInt(p.bhk)} BHK</span>
        ) : null}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <div className="text-xl font-bold text-primary font-heading">{fmtPrice(p.price)}</div>
        <div className="text-[15px] font-semibold text-gray-900 line-clamp-1">{title}</div>
        {loc ? (
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.69 18.933a.75.75 0 00.62 0c.058-.026.128-.061.207-.108a17.5 17.5 0 001.907-1.311c.653-.51 1.32-1.144 1.94-1.9C16.104 13.727 17 11.9 17 9.75 17 5.856 13.866 2.75 10 2.75S3 5.856 3 9.75c0 2.15.896 3.977 2.646 6.144.62.756 1.287 1.39 1.94 1.9a17.5 17.5 0 002.114 1.419l.001.001zM10 11.75a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            <span className="line-clamp-1">{loc}</span>
          </div>
        ) : null}
        <div className="flex gap-3 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
          {p.sqft ? <span>{p.sqft} sqft</span> : null}
          {p.furnishing ? <span>&middot; {p.furnishing}</span> : null}
          {p.propertyType ? <span className="capitalize">&middot; {p.propertyType}</span> : null}
        </div>
      </div>
    </Link>
  );
}
