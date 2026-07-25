const COMMERCIAL_TYPES = ['office', 'shop', 'showroom', 'warehouse'];

// Real stock photography keyed by property type, so the placeholder actually looks like
// the kind of property being listed instead of a generic icon. Falls back to a plain
// gradient (via the wrapping div's background classes) if the image URL ever fails to load.
const PHOTO_BY_TYPE = {
  flat: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
  tenement: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
  penthouse: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
  bungalow: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
  villa: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  plot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
  office: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
  showroom: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
  warehouse: 'https://images.unsplash.com/photo-1553413077-190083ec01ff',
};
const RESIDENTIAL_FALLBACK = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00';
const COMMERCIAL_FALLBACK = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab';

export default function PropertyImagePlaceholder({ category, propertyType, className = '' }) {
  const type = (propertyType || '').toLowerCase();
  const isCommercial = category === 'commercial' || COMMERCIAL_TYPES.includes(type);
  const label = propertyType
    ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
    : isCommercial
    ? 'Commercial'
    : 'Residential';

  const photoUrl = PHOTO_BY_TYPE[type] || (isCommercial ? COMMERCIAL_FALLBACK : RESIDENTIAL_FALLBACK);

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-end ${
        isCommercial
          ? 'bg-gradient-to-br from-primary-300 via-primary-200 to-primary-100'
          : 'bg-gradient-to-br from-primary-200 via-primary-100 to-primary-50'
      } ${className}`}
      style={{
        backgroundImage: `url(${photoUrl}?auto=format&fit=crop&w=640&q=65)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-10 pb-3 px-3 flex flex-col items-center gap-1.5">
        <span className="badge bg-white/95 text-gray-800 shadow-card">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 5a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4z" />
            <circle cx="10" cy="11" r="3" fill="white" />
          </svg>
          Request Image
        </span>
        <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wide drop-shadow">{label}</span>
      </div>
    </div>
  );
}
