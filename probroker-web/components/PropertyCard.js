import { useId } from 'react';
import Link from 'next/link';
import { fmtPrice, buildPropertyTitle, buildPropertySlug } from '@/lib/format';
import { firstImageUrl, isVideoUrl } from '@/lib/media';
import PropertyImagePlaceholder from './PropertyImagePlaceholder';
import PropertyMedia from './PropertyMedia';
import CardActions from './CardActions';
import ContactButton, { EnquiryButton } from './ContactButton';
import ContactActions from './ContactActions';
import FeatureIcon from './FeatureIcon';

// Only My Contacts shows these: it keeps listings that have since left the site.
const INACTIVE_LABEL = { sold: 'Sold', rented: 'Rented', pending: 'Not live' };

const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

// "Posted today", "Posted 3 days ago", "Posted 2 months ago". Empty when the date is missing.
// Imported listings carry the date as { $date: '...' } instead of a plain string.
function postedAgo(createdAt) {
  const raw = createdAt && typeof createdAt === 'object' ? createdAt.$date : createdAt;
  const then = new Date(raw).getTime();
  if (!raw || Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Posted ${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.max(1, Math.floor(days / 365));
  return `Posted ${years} year${years === 1 ? '' : 's'} ago`;
}

const PIN_PATH = 'M12 1.5c-4.14 0-7.5 3.36-7.5 7.5 0 5.62 7.5 13.5 7.5 13.5s7.5-7.88 7.5-13.5c0-4.14-3.36-7.5-7.5-7.5z';

// Four-colour map pin in Google Maps' colours: red top-left, blue top-right, yellow band,
// green stem, white centre. Bands are polygons clipped to the pin outline. useId keeps the
// clipPath id unique when a page renders many cards.
function MapsPin({ className = 'w-[18px] h-[18px]' }) {
  const clip = `pin-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={clip}><path d={PIN_PATH} /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="24" height="24" fill="#34A853" />
        <polygon points="0,0 21,0 0,21" fill="#FBBC04" />
        <polygon points="0,0 16.5,0 0,16.5" fill="#EA4335" />
        <polygon points="9.5,0 24,0 24,21 12,9" fill="#4285F4" />
      </g>
      <circle cx="12" cy="9" r="2.6" fill="#fff" />
    </svg>
  );
}

// Outline icons (24x24, stroke) for the listing facts.
const ICONS = {
  bed: 'M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2m18-2v2M6 10V7.5A1.5 1.5 0 017.5 6h3A1.5 1.5 0 0112 7.5V10m0 0V7.5A1.5 1.5 0 0113.5 6h3A1.5 1.5 0 0118 7.5V10',
  area: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9 9l-5-5m11 5l5-5M9 15l-5 5m11-5l5 5',
  rate: 'M7 4h10M7 8.5h10M7 4c3.5 0 6 1.4 6 4.5S10.5 13 7 13l7 7',
  price: 'M3 12.5V4a1 1 0 011-1h8.5L21 11.5 12.5 20 3 12.5zM7.5 7.5h.01',
  sofa: 'M5 11V8a3 3 0 013-3h8a3 3 0 013 3v3M3 12.5a2 2 0 014 0V15h10v-2.5a2 2 0 014 0V18a1 1 0 01-1 1H4a1 1 0 01-1-1v-5.5zM6 19v2m12-2v2',
  floor: 'M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16m0-12h4a1 1 0 011 1v11M3 21h18M8 8h3m-3 4h3m-3 4h3',
  car: 'M5 13l1.6-4.6A2 2 0 018.5 7h7a2 2 0 011.9 1.4L19 13M5 13h14v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-4zm2.5 2h.01m9 0h.01',
  age: 'M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  tenant: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0m1-14.5a3 3 0 010 5.5m2 3a5 5 0 013 6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0',
  type: 'M3 10.5L12 4l9 6.5M5 9v11h14V9M10 20v-5h4v5',
};

function FactIcon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function PropertyCard({ p, variant = 'grid' }) {
  const title = buildPropertyTitle(p);
  const slug = p.slug || buildPropertySlug(p);
  const href = `/property/${slug}/`;
  const hasPhoto = Array.isArray(p.photos) && p.photos.length > 0 && !!p.photos[0];
  // A picture makes the cover when there is one, so a page of cards isn't a page of playing
  // videos. A listing that only has videos shows its first video instead.
  const photo = hasPhoto ? firstImageUrl(p.photos) || p.photos[0] : null;
  const area = p.areaName || p.area || '';
  const city = p.cityName || '';
  const loc = [area, city].filter(Boolean).join(', ');
  const isRent = p.transactionType === 'rent';
  const trans = INACTIVE_LABEL[p.status] || (isRent ? 'For Rent' : 'For Sale');
  // Sale = brand purple, rent = green, inactive (My Contacts only) = grey.
  const transCls = INACTIVE_LABEL[p.status] ? 'bg-gray-700 text-white' : isRent ? 'bg-emerald-600 text-white' : 'bg-primary text-white';
  const posted = postedAgo(p.listedDate || p.createdAt);
  const societyName = p.premiseName || p.societyName || '';
  // Google Maps search text: society name, then "Area, City", e.g. "Arjun Elegance Naranpura, Ahmedabad".
  const mapQuery = [societyName, loc].filter(Boolean).join(' ');
  const ownerName = p.contactName || '';
  const isVerified = p.isVerified === true;
  const cardId = p.propertyId || p.slug || slug;
  // Price per square foot = price / sqft (for rentals: monthly rent per sqft). Shown as its own
  // detail on every card that has both numbers.
  const pricePerSqft = Number(p.sqft) > 0 && Number(p.price) > 0 ? Math.round(Number(p.price) / Number(p.sqft)) : null;
  const rateText = pricePerSqft ? `₹${pricePerSqft.toLocaleString('en-IN')}/sqft` : '';

  const imageInner = hasPhoto ? (
    <PropertyMedia
      src={photo}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      lazy
    />
  ) : (
    <PropertyImagePlaceholder category={p.category} propertyType={p.propertyType} seed={cardId} />
  );

  const checkIcon = (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414L8.5 12.086l6.79-6.796a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  // Grid card: status + verified sit on the photo so the title gets the full width below.
  // Compact badges, matching the listing-page card.
  const badgeSize = '!text-[10px] sm:!text-[11px] !px-2 !py-0.5';
  const badges = (
    <>
      <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
        <span className={`badge shadow-card ${badgeSize} ${transCls}`}>{trans}</span>
        {isVerified && (
          <span className={`badge bg-white/95 text-green-700 shadow-card ${badgeSize}`}>
            {checkIcon}
            Verified
          </span>
        )}
      </div>
      {p.bhk ? (
        <span className={`badge absolute top-2 right-2 bg-white/95 text-gray-800 shadow-card ${badgeSize}`}>{parseInt(p.bhk)} BHK</span>
      ) : null}
    </>
  );

  // Row card: the Verified mark is the green corner tag, so the title gets the full width.
  const titleRow = (
    <h3 className="text-[13px] sm:text-[19px] font-bold text-gray-900 line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
  );

  // Row card: a green shield on the photo's top-right for listings the AllFlats team has
  // verified. Icon only; the word stays for screen readers and as the hover tooltip.
  const verifiedTag = isVerified ? (
    // 30% smaller than the standard .badge (12px text, 10px / 4px padding).
    <span className="badge absolute top-2 right-2 !text-[8.5px] !px-[7px] !py-[3px] bg-green-600 text-white shadow-card">Verified</span>
  ) : null;

  const place = [societyName, loc].filter(Boolean).join(' · ');

  // Address line with a Google-Maps-style red pin. Pin and text open the place in Google Maps.
  // It sits above the card-wide link (z-10, pointer-events-auto), so it doesn't open the listing.
  // textCls: the grid card uses 15px, the row card ~10% larger to match its bigger title.
  // wrap: let the address run onto a second line instead of cutting it with "...".
  const placeLink = (textCls = 'text-[15px]', wrap = false, pinCls) => place ? (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
      target="_blank"
      rel="noopener noreferrer"
      title="View on Google Maps"
      className={`group/map relative z-10 pointer-events-auto inline-flex items-center gap-1 max-w-full min-w-0 ${textCls} text-gray-500 hover:text-primary transition-colors`}
    >
      <MapsPin className={pinCls} />

      <span className={`${wrap ? 'line-clamp-2 sm:truncate' : 'truncate'} group-hover/map:underline underline-offset-2`}>{place}</span>
      <span className="sr-only">(opens Google Maps)</span>
    </a>
  ) : null;
  const placeRow = placeLink('text-xs sm:text-[12px]', false, 'w-3.5 h-3.5 sm:w-4 sm:h-4');

  const priceRow = (
    <div className="text-xl sm:text-base font-bold text-gray-900 font-heading leading-tight">
      {fmtPrice(p.price)}
      {isRent && <span className="text-xs sm:text-sm font-medium text-gray-500">/month</span>}
    </div>
  );

  // Grid card: Area and Furnishing only, side by side on one line (icon + label + value).
  const gridFacts = [
    p.sqft ? { icon: 'area', label: 'Area', value: `${p.sqft} sqft` } : null,
    p.furnishing ? { icon: 'sofa', label: 'Furnishing', value: p.furnishing, capitalize: true } : null,
  ].filter(Boolean);

  // Plain small icons and compact text, the same as the listing-page card.
  const factsRow = gridFacts.length > 0 ? (
    <div className="py-2 border-y border-gray-100">
      <div className="grid grid-cols-2 gap-x-3">
        {gridFacts.map((f) => (
          <div key={f.label} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-gray-400 flex items-center justify-center shrink-0">
              <FactIcon name={f.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-[9px] sm:text-[8px] uppercase tracking-wide text-gray-400">{f.label}</span>
              <span title={f.value} className={`text-[11px] sm:text-[13px] font-normal text-gray-800 truncate ${f.capitalize ? 'capitalize' : ''}`}>{f.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  // Highlights: the listing's furnishings first (furnishingItems), then its amenities. The card
  // shows six in one line that scrolls sideways (swipe / trackpad); the rest are a link to the
  // property page, which lists them all. The line takes pointer events so a finger can drag it,
  // and fades out on the right as a hint that there is more.
  const HIGHLIGHT_LIMIT = 6;
  const highlights = [...new Set(
    [...(Array.isArray(p.furnishingItems) ? p.furnishingItems : []), ...(Array.isArray(p.amenities) ? p.amenities : [])]
      .map((a) => String(a).trim())
      .filter(Boolean),
  )];
  const moreHighlights = highlights.length - HIGHLIGHT_LIMIT;
  // What the chips are: furnishings, amenities, or both ("Highlights").
  const hasFurnishingItems = Array.isArray(p.furnishingItems) && p.furnishingItems.length > 0;
  const hasAmenities = Array.isArray(p.amenities) && p.amenities.length > 0;
  const highlightsLabel = hasFurnishingItems && hasAmenities ? 'Highlights' : hasFurnishingItems ? 'Furnishings' : 'Amenities';
  // bleed: pulls the scrolling line out to the card edges; it must match the card's side padding.
  // label: 'above' puts the name on its own line; 'inline' puts it at the start of the chip row.
  const highlightsBlock = (bleed = '-mx-4 px-4 scroll-px-4', label = 'above') => highlights.length > 0 ? (
    <div className={label === 'inline' ? 'flex items-center gap-2 min-w-0' : ''}>
      <div className={`shrink-0 text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${label === 'inline' ? '' : 'mb-1 sm:mb-1.5'}`}>
        {highlightsLabel}
      </div>
      <div className={`${label === 'inline' ? 'flex-1 min-w-0 ' : ''}${bleed} flex gap-1.5 overflow-x-auto no-scrollbar snap-x pointer-events-auto [mask-image:linear-gradient(to_right,black_85%,transparent)]`}>
        {highlights.slice(0, HIGHLIGHT_LIMIT).map((name) => (
          <span key={name} className="snap-start shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs text-gray-700">
            <span className="text-primary"><FeatureIcon name={name} className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></span>
            {name}
          </span>
        ))}
        {moreHighlights > 0 && (
          <Link
            href={href}
            className="snap-start shrink-0 whitespace-nowrap relative z-10 inline-flex items-center rounded-md px-2 py-1 pr-6 text-xs font-semibold text-primary hover:underline"
          >
            View more (+{moreHighlights})
          </Link>
        )}
      </div>
    </div>
  ) : null;

  const footerRow = ownerName || posted ? (
    <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[13px] text-gray-500">
      <span className="truncate">{ownerName && <>Owner: <span className="text-gray-700 font-medium">{ownerName}</span></>}</span>
      {posted && <span className="shrink-0">{posted}</span>}
    </div>
  ) : null;

  // contactPhone only reaches a card from My Contacts, where the number is already unlocked.
  const contactButton = (className) => {
    if (p.contactPhone) {
      return (
        <div className={`relative z-10 pointer-events-auto ${className}`}>
          <ContactActions phone={p.contactPhone} propertyTitle={title} />
        </div>
      );
    }
    return p.hasContact ? (
      <ContactButton
        propertyId={p.propertyId}
        propertyTitle={title}
        contactName={ownerName}
        listingType={p.listingType}
        href={href}
        className={className}
      />
    ) : (
      <EnquiryButton
        propertyId={p.propertyId}
        propertyTitle={title}
        contactName={ownerName}
        listingType={p.listingType}
        className={className}
      />
    );
  };

  // The listing-page card: a short fixed-size photo with every detail packed beside it, so more
  // listings fit on a screen. Facts that a listing doesn't have are simply left out.
  if (variant === 'row') {
    const photoCount = hasPhoto ? p.photos.filter(Boolean).length : 0;
    const hasParking = p.parking === true || !!p.parkingType || (Array.isArray(p.amenities) && p.amenities.includes('Parking'));
    // Each fact: icon + its name + value, all in the same style; the price is simply the first one.
    // Floor and age are left to the property page; the card keeps the deciding facts.
    // The main four: Price | Area | Price/sqft | Furnishing.
    const mainFacts = [
      p.price ? { icon: 'price', label: isRent ? 'Rent' : 'Price', value: `${fmtPrice(p.price)}${isRent ? '/month' : ''}` } : null,
      p.sqft ? { icon: 'area', label: 'Area', value: `${p.sqft} sqft` } : null,
      rateText ? { icon: 'rate', label: isRent ? 'Rent/sqft' : 'Price/sqft', value: rateText } : null,
      p.furnishing ? { icon: 'sofa', label: 'Furnishing', value: cap(p.furnishing) } : null,
    ].filter(Boolean);
    // Bedrooms is a stand-in: the title already says "3 BHK Flat ...", so it only fills in when one
    // of the main four is missing (e.g. no Price/sqft), right after the price.
    if (mainFacts.length < 4 && p.bhk) {
      mainFacts.splice(mainFacts[0]?.icon === 'price' ? 1 : 0, 0, { icon: 'bed', label: 'Bedrooms', value: `${parseInt(p.bhk)} BHK` });
    }
    const facts = [
      ...mainFacts,
      hasParking ? { icon: 'car', label: 'Parking', value: 'Available' } : null,
      isRent && p.familyOrBachelors ? { icon: 'tenant', label: 'Tenants', value: cap(p.familyOrBachelors) } : null,
    ].filter(Boolean).slice(0, 8);
    // Who posted it and when, for the contact row: "Posted by Broker, 7 days ago".
    const postedBy = p.listingType ? cap(p.listingType) : '';
    const postedWhen = posted.replace(/^Posted /, '');
    // Phones: up to 8 pictures in a sideways strip (videos only when there is no picture, so a
    // page of cards doesn't start dozens of videos). A last tile links to the rest.
    const STRIP_MAX = 8;
    const allMedia = hasPhoto ? p.photos.filter(Boolean) : [];
    const pictures = allMedia.filter((u) => !isVideoUrl(u));
    const stripMedia = (pictures.length ? pictures : allMedia.slice(0, 1)).slice(0, STRIP_MAX);
    const hiddenMedia = allMedia.length - stripMedia.length;

    return (
      <div className="group card overflow-hidden flex flex-col sm:flex-row relative w-full min-w-0">
        <Link href={href} className="absolute inset-0 z-0" aria-label={title} />
        {/* Phones: a short photo strip that scrolls left / right, one swipe per photo, with a
            "2/9" counter. Each photo is a link to the listing, so a tap still opens it. */}
        {stripMedia.length > 0 && (
          <div className="sm:hidden relative z-10 flex gap-1.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-2 px-2 pt-2">
            {stripMedia.map((url, i) => (
              <Link key={`${url}-${i}`} href={href} aria-label={i === 0 ? title : `${title} - photo ${i + 1}`} className={`relative snap-start shrink-0 ${stripMedia.length === 1 && hiddenMedia <= 0 ? 'w-full' : 'w-[78%]'} h-44 rounded-lg overflow-hidden bg-gray-100`}>
                <PropertyMedia src={url} alt={i === 0 ? title : `${title} - photo ${i + 1}`} className="w-full h-full object-cover" lazy={i > 0} />
                {i === 0 && (
                  <>
                    <span className={`badge absolute top-2 left-2 shadow-card ${transCls}`}>{trans}</span>
                    {verifiedTag}
                  </>
                )}
                {allMedia.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {i + 1}/{allMedia.length}
                  </span>
                )}
              </Link>
            ))}
            {hiddenMedia > 0 && (
              <Link href={href} className="snap-start shrink-0 w-28 h-44 rounded-lg bg-primary-50 text-primary flex flex-col items-center justify-center text-center text-xs font-semibold">
                <span className="text-lg font-bold">+{hiddenMedia}</span>
                more photos
              </Link>
            )}
          </div>
        )}
        {/* The photo fills this box instead of sizing it, so a tall photo can't stretch the card.
            Phones with photos use the strip above instead. */}
        <div className={`${stripMedia.length > 0 ? 'hidden sm:block' : ''} relative w-full sm:w-72 shrink-0 h-44 sm:h-auto sm:min-h-[220px] overflow-hidden bg-gray-100 pointer-events-none`}>
          <div className="absolute inset-0">{imageInner}</div>
          <span className={`badge absolute top-2 left-2 shadow-card ${transCls}`}>{trans}</span>
          {verifiedTag}
          {photoCount > 1 && (
            <span className="badge absolute bottom-2 right-2 bg-black/65 text-white">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M4 5a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              {photoCount}
            </span>
          )}
        </div>
        <div className="p-4 sm:px-5 flex-1 flex flex-col gap-2 sm:gap-2.5 min-w-0 relative pointer-events-none">
          {/* Title + address on the left, save / share on the right (smaller buttons on phones). */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {titleRow}
              <div className="mt-0.5 flex min-w-0">
                {placeLink('text-[11.5px] sm:text-[13px]', true, 'w-3.5 h-3.5')}
              </div>
            </div>
            <div className="shrink-0">
              <div className="sm:hidden"><CardActions id={cardId} title={title} path={href} bordered small /></div>
              <div className="hidden sm:block"><CardActions id={cardId} title={title} path={href} bordered /></div>
            </div>
          </div>
          {/* Every fact, the price first, in one style, split by thin lines: Price | Bedrooms | Area.
              2 per row on phones and 4 per row from lg; the first item of each row has no line. */}
          {facts.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 content-center lg:min-h-[4.75rem] gap-y-2 sm:gap-y-3 py-2.5 sm:py-3 border-y border-gray-100">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-1.5 sm:gap-2 min-w-0 px-3 sm:px-4 border-l border-gray-200 max-lg:[&:nth-child(2n+1)]:border-l-0 max-lg:[&:nth-child(2n+1)]:pl-0 lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(4n+1)]:pl-0"
                >
                  <span className="flex items-center justify-center shrink-0 text-gray-400">
                    <FactIcon name={f.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <span className="flex flex-col leading-tight min-w-0">
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-wide text-gray-400">{f.label}</span>
                    <span title={f.value} className="text-[11px] sm:text-sm font-semibold truncate text-gray-800">{f.value}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Amenities / furnishings line, with a divider under it. Shown only when the listing has
              some (no description text here). Phones skip this line; the taller photo strip above
              uses that space instead. */}
          {highlights.length > 0 && (
            <div className="hidden sm:block pb-2.5 border-b border-gray-100">
              <div className="h-7">{highlightsBlock('-mr-4 pr-4 sm:-mr-5 sm:pr-5', 'inline')}</div>
            </div>
          )}
          {/* Two equal halves around the line, so the line sits in the exact middle of the row. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 mt-auto">
            {/* "Posted by Owner, 7 days ago" on the left, a thin line in the middle of the row,
                and in the right corner "Owner: Name" right up against Contact. */}
            <div className="min-w-0 truncate text-[11px] sm:text-[13px] leading-snug text-gray-500">
              {postedBy ? (
                <>Posted by <span className="text-gray-700 font-medium">{postedBy}</span>{postedWhen && `, ${postedWhen}`}</>
              ) : posted}
            </div>
            <span aria-hidden="true" className="h-8 w-px bg-gray-200" />
            <div className="min-w-0 flex items-center justify-end gap-2 sm:gap-2.5">
              {ownerName && (
                <div title={ownerName} className="min-w-0 truncate text-[11px] sm:text-[13px] text-gray-500">
                  Owner: <span className="font-semibold text-gray-800">{ownerName}</span>
                </div>
              )}
              {contactButton('shrink-0 !h-9 !px-4 !text-[13px] sm:!h-10 sm:!px-5 sm:!text-sm')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group card overflow-hidden flex flex-col relative h-full hover:shadow-float transition-shadow duration-300">
      <Link href={href} className="absolute inset-0 z-0" aria-label={title} />
      {/* Phones: a 2:1 photo so one card and half of the next fit on the screen. sm up: 5:3.
          Plus a fixed strip of extra height: the space the furnishings chip row (h-7 + gap) used
          to take, so dropping that row made the photo taller, not the card shorter. */}
      <div className="relative w-full overflow-hidden bg-gray-100 pointer-events-none">
        <div aria-hidden="true" className="aspect-[2/1] sm:aspect-[5/3]" />
        <div aria-hidden="true" className="h-[34px] sm:h-9" />
        <div className="absolute inset-0">{imageInner}</div>
        {badges}
      </div>
      <div className="p-3 sm:px-4 sm:pt-2 sm:pb-3 flex-1 flex flex-col gap-1.5 sm:gap-2 pointer-events-none">
        {/* Price on the left, save / share on the right of the same line. */}
        <div className="flex items-center justify-between gap-3">
          {priceRow}
          <CardActions id={cardId} title={title} path={href} bordered small />
        </div>
        <div className="min-w-0 sm:-mt-1">
          <h3 className="text-sm sm:text-[13px] font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
          {placeRow && <div className="mt-0.5 flex min-w-0">{placeRow}</div>}
        </div>
        {factsRow}
        {/* No furnishings chips on this card (the photo got their space). The footer below sits
            at the card's bottom (mt-auto), so cards side by side still line up. */}
        {p.contactPhone ? (
          // My Contacts: the number is unlocked, so Call + WhatsApp need the full width.
          <div className="mt-auto flex flex-col gap-2.5">
            {footerRow}
            {contactButton('w-full')}
          </div>
        ) : (
          // Owner name and posted date on the left, a half-width Contact button on the right.
          <div className="mt-auto flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 text-[11px] leading-snug text-gray-500">
              {ownerName && (
                <div className="truncate sm:text-[10px]">Owner: <span className="text-gray-700 font-medium">{ownerName}</span></div>
              )}
              {posted && <div className="truncate sm:text-[9px]">{posted}</div>}
            </div>
            {/* A compact button sized to its text, so the owner line keeps its room. */}
            {/* sm up: 11px text and a 12px phone icon in a 26px-high button. */}
            {contactButton('shrink-0 !h-9 sm:!h-[26px] !px-4 sm:!px-3 !text-[13px] sm:!text-[11px] sm:!gap-1 sm:[&_svg]:w-3 sm:[&_svg]:h-3')}
          </div>
        )}
      </div>
    </div>
  );
}
