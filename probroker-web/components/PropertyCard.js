import Link from 'next/link';
import { fmtPrice, buildPropertyTitle, buildPropertySlug } from '@/lib/format';
import { firstImageUrl } from '@/lib/media';
import PropertyImagePlaceholder from './PropertyImagePlaceholder';
import PropertyMedia from './PropertyMedia';
import CardActions from './CardActions';
import ContactButton from './ContactButton';
import ContactActions from './ContactActions';

// Only My Contacts shows these: it keeps listings that have since left the site.
const INACTIVE_LABEL = { sold: 'Sold', rented: 'Rented', pending: 'Not live' };

const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

function ageLabel(years) {
  if (years === null || years === undefined || years === '') return null;
  const n = Number(years);
  if (Number.isNaN(n) || n < 0) return null;
  return n === 0 ? 'New' : `${n} yr${n === 1 ? '' : 's'} old`;
}

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
  const trans = INACTIVE_LABEL[p.status] || (p.transactionType === 'rent' ? 'For Rent' : 'For Sale');
  const societyName = p.premiseName || p.societyName || '';
  // Google Maps search text: society name, then "Area, City", e.g. "Arjun Elegance Naranpura, Ahmedabad".
  const mapQuery = [societyName, loc].filter(Boolean).join(' ');
  const ownerName = p.contactName || '';
  const isVerified = p.isVerified === true;
  const cardId = p.propertyId || p.slug || slug;
  const pricePerSqft = p.sqft && p.price ? Math.round(p.price / p.sqft) : null;

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

  const badges = (
    <>
      <span className="badge absolute top-2 left-2 bg-primary text-white shadow-card">{trans}</span>
      {p.bhk ? (
        <span className="badge absolute top-2 right-2 bg-white/95 text-gray-800 shadow-card">{parseInt(p.bhk)} BHK</span>
      ) : null}
    </>
  );

  const titleRow = (
    <div className="flex items-start gap-1.5">
      <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-1 flex-1">{title}</h3>
      {isVerified && (
        <span className="badge bg-green-50 text-green-700 border border-green-200 shrink-0 !py-0.5">
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414L8.5 12.086l6.79-6.796a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      )}
    </div>
  );

  const societyRow = societyName ? <div className="text-sm text-gray-600 line-clamp-1">{societyName}</div> : null;

  const locationRow = loc ? (
    <div className="text-sm text-gray-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.69 18.933a.75.75 0 00.62.058c.058-.026.128-.061.207-.108a17.5 17.5 0 001.907-1.311c.653-.51 1.32-1.144 1.94-1.9C16.104 13.727 17 11.9 17 9.75 17 5.856 13.866 2.75 10 2.75S3 5.856 3 9.75c0 2.146.895 3.977 2.646 6.144.62.756 1.287 1.39 1.94 1.9a17.5 17.5 0 002.114 1.4191.001.001zM10 11.75a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
      <span className="line-clamp-1">{loc}</span>
    </div>
  ) : null;

  const priceRow = (
    <div className="flex items-baseline gap-2 flex-wrap">
      <div className="text-xl font-bold text-primary font-heading">{fmtPrice(p.price)}</div>
      {pricePerSqft ? <div className="text-xs text-gray-400">&#8377;{pricePerSqft.toLocaleString('en-IN')}/sqft</div> : null}
    </div>
  );

  const factItems = [
    p.sqft ? { label: 'Area', value: `${p.sqft} sqft` } : null,
    p.propertyType ? { label: 'Type', value: p.propertyType, capitalize: true } : null,
    p.furnishing ? { label: 'Furnishing', value: p.furnishing, capitalize: true } : null,
    p.floorNumber ? { label: 'Floor', value: `${p.floorNumber}${p.totalFloors ? `/${p.totalFloors}` : ''}` } : null,
    p.listingType ? { label: 'Posted by', value: p.listingType, capitalize: true } : null,
  ].filter(Boolean);

  const factsRow = factItems.length > 0 ? (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-gray-100">
      {factItems.map((f) => (
        <div key={f.label} className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-gray-400">{f.label}</span>
          <span className={`text-xs font-medium text-gray-800 ${f.capitalize ? 'capitalize' : ''}`}>{f.value}</span>
        </div>
      ))}
    </div>
  ) : null;

  const ownerRow = ownerName ? (
    <div className="text-xs text-gray-500 truncate">
      Owner: <span className="text-gray-700 font-medium">{ownerName}</span>
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
    ) : null;
  };

  // The listing-page card: a short fixed-size photo with every detail packed beside it, so more
  // listings fit on a screen. Facts that a listing doesn't have are simply left out.
  if (variant === 'row') {
    const photoCount = hasPhoto ? p.photos.filter(Boolean).length : 0;
    const hasParking = p.parking === true || (Array.isArray(p.amenities) && p.amenities.includes('Parking'));
    const chips = [
      p.bhk ? `${parseInt(p.bhk)} BHK` : null,
      p.sqft ? `${p.sqft} sqft` : null,
      p.furnishing ? cap(p.furnishing) : null,
      p.floorNumber ? `Floor ${p.floorNumber}${p.totalFloors ? `/${p.totalFloors}` : ''}` : null,
      hasParking ? 'Parking' : null,
      ageLabel(p.ageOfProperty),
      p.transactionType === 'rent' && p.familyOrBachelors ? cap(p.familyOrBachelors) : null,
      p.listingType ? `By ${cap(p.listingType)}` : null,
    ].filter(Boolean);
    const posted = postedAgo(p.createdAt);
    const place = [societyName, loc].filter(Boolean).join(' · ');

    return (
      <div className="group card overflow-hidden flex flex-col sm:flex-row relative">
        <Link href={href} className="absolute inset-0 z-0" aria-label={title} />
        {/* The photo fills this box instead of sizing it, so a tall photo can't stretch the card. */}
        <div className="relative w-full sm:w-60 shrink-0 aspect-[16/9] sm:aspect-auto sm:min-h-[184px] overflow-hidden bg-gray-100 pointer-events-none">
          <div className="absolute inset-0">{imageInner}</div>
          <span className="badge absolute top-2 left-2 bg-primary text-white shadow-card">{trans}</span>
          {photoCount > 1 && (
            <span className="badge absolute bottom-2 right-2 bg-black/65 text-white">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M4 5a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              {photoCount}
            </span>
          )}
        </div>
        <div className="p-3.5 sm:px-4 flex-1 flex flex-col gap-2 min-w-0 relative pointer-events-none">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {titleRow}
              {place && <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">{place}</div>}
            </div>
            <CardActions id={cardId} title={title} path={href} mapQuery={mapQuery} />
          </div>
          {priceRow}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700">{c}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <div className="min-w-0 text-xs text-gray-500 truncate">
              {ownerName && <>Owner: <span className="text-gray-700 font-medium">{ownerName}</span></>}
              {ownerName && posted && ' · '}
              {posted}
            </div>
            {contactButton('shrink-0 !h-10')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group card overflow-hidden flex flex-col relative">
      <Link href={href} className="absolute inset-0 z-0" aria-label={title} />
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 pointer-events-none">
        {imageInner}
        {badges}
        <div className="absolute bottom-2 right-2 pointer-events-auto">
          <CardActions id={cardId} title={title} path={href} mapQuery={mapQuery} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1.5 pointer-events-none">
        {titleRow}
        {societyRow}
        {priceRow}
        {locationRow}
        <div className="mt-2">{factsRow}</div>
        {ownerRow}
        {contactButton('w-full mt-auto')}
      </div>
    </div>
  );
}
