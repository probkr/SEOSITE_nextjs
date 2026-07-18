import Link from 'next/link';
import { fmtPrice, buildPropertyTitle, buildPropertySlug } from '@/lib/format';

export default function PropertyCard({ p }) {
  const title = buildPropertyTitle(p);
  const slug = p.slug || buildPropertySlug(p);
  const photo = (p.photos && p.photos[0]) || '/placeholder-property.jpg';
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
        <span className="badge absolute top-2 left