import Image from 'next/image';
import { CITY_LANDMARKS } from '@/lib/cityLandmarks';

const PinIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/**
 * A city's landmark photo filling its (relative, sized) parent, darkened toward the bottom so
 * text on top stays readable. CC BY-SA photos keep their credit visible, as their licence asks.
 * Cities without a photo get a brand-tinted panel with the city's initial.
 * showPlace: the landmark's name at the bottom left. priority: for the photo at the top of a page.
 */
export default function CityPhoto({ slug, name, sizes = '100vw', showPlace = true, priority = false, className = '' }) {
  const lm = CITY_LANDMARKS[slug];
  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-primary-700 to-primary ${className}`}>
      {lm ? (
        <Image
          src={lm.img}
          alt={`${lm.place}, ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-7xl font-extrabold font-heading text-white/15">
          {name?.charAt(0)}
        </span>
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
      {lm && showPlace && (
        <span className="pointer-events-none absolute left-3 bottom-2.5 right-3 flex items-center justify-end gap-1 min-w-0 text-[11px] font-semibold text-white/85">
          <PinIcon />
          <span className="truncate">{lm.place}</span>
        </span>
      )}
      {lm?.credit && (
        <a
          href={lm.credit.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={`Photo: ${lm.credit.by} / ${lm.credit.license}`}
          className="absolute right-1.5 top-1.5 z-10 max-w-[calc(100%-0.75rem)] truncate rounded bg-black/30 px-1 text-[9px] leading-4 text-white/85 hover:text-white"
        >
          Photo: {lm.credit.by} / {lm.credit.license}
        </a>
      )}
    </div>
  );
}
