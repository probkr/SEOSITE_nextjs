import Link from 'next/link';
import { fmtPrice, buildPropertyTitle, buildPropertySlug } from '@/lib/format';

export default function PropertyCard({ p }) {
  const title = buildPropertyTitle(p);
  const slug = p.slug || buildPropertySlug(p);
  const photo = (p.photos && p.photos[0]) || '/placeholder-property.jpg';
  return (
    <Link href={`/property/${slug}/`} className="card overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="font-semibold text-primary text-lg">{fmtPrice(p.price)}</div>
        <div className="text-sm text-gray-700 line-clamp-2">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{p.sqft ? `${p.sqft} sqft` : ''} {p.furnishing ? `· ${p.furnishing}` : ''}</div>
      </div>
    </Link>
  );
}
