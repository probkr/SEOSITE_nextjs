const COMMERCIAL_TYPES = ['office', 'shop', 'showroom', 'warehouse'];

// Real stock photography keyed by property type, so the placeholder actually looks like
// the kind of property being listed instead of a generic icon. Falls back to a plain
// gradient (via the wrapping div's background classes) if the image URL ever fails to load.
const PHOTO_BY_TYPE = {
  flat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg/500px-A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg',
  apartment: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg/500px-A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg',
  tenement: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Residential_Building%2C_Hyderabad%2C_20022015.jpg/500px-Residential_Building%2C_Hyderabad%2C_20022015.jpg',
  penthouse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg/500px-A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg',
  bungalow: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Traditional_Houses_in_Kerala.jpg/500px-Traditional_Houses_in_Kerala.jpg',
  villa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Chettinad_palatial_house.jpg/500px-Chettinad_palatial_house.jpg',
  plot: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Hyderabad_view_Plots.jpg/500px-Hyderabad_view_Plots.jpg',
  office: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Modern_office_towers_with_retail_promenade_in_Hyderabad%2C_Telangana%2C_India.jpg/500px-Modern_office_towers_with_retail_promenade_in_Hyderabad%2C_Telangana%2C_India.jpg',
  shop: 'https://images.unsplash.com/photo-1728325444513-f6f7bdd0950a',
  showroom: 'https://images.unsplash.com/photo-1728325444513-f6f7bdd0950a',
  warehouse: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/CWC_Godown%2C_Bamanheri_operated_by_Food_Corporation_of_India_for_stocking_foodgrains.jpg/500px-CWC_Godown%2C_Bamanheri_operated_by_Food_Corporation_of_India_for_stocking_foodgrains.jpg',
};
const RESIDENTIAL_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg/500px-A_residential_apartment_in_Hitec_City%2C_Hyderabad.jpg';
const COMMERCIAL_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Modern_office_towers_with_retail_promenade_in_Hyderabad%2C_Telangana%2C_India.jpg/500px-Modern_office_towers_with_retail_promenade_in_Hyderabad%2C_Telangana%2C_India.jpg';

const RESIDENTIAL_INTERIOR_TYPES = ['flat', 'apartment', 'tenement', 'penthouse', 'bungalow', 'villa'];
const RESIDENTIAL_INTERIOR_PHOTOS = [
  'https://images.unsplash.com/photo-1771327811795-6197403af846',
  'https://images.unsplash.com/photo-1780777683071-a622896a1bdd',
  'https://images.unsplash.com/photo-1631048835473-73c7aaf86096',
  'https://images.unsplash.com/photo-1784653549472-d04445c406c3',
];
function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getPlaceholderPhotoUrl({ category, propertyType, seed } = {}) {
  const type = (propertyType || '').toLowerCase();
  const isCommercial = category === 'commercial' || COMMERCIAL_TYPES.includes(type);
  if (RESIDENTIAL_INTERIOR_TYPES.includes(type) && !isCommercial) {
    return RESIDENTIAL_INTERIOR_PHOTOS[hashSeed(String(seed || type)) % RESIDENTIAL_INTERIOR_PHOTOS.length];
  }
  return PHOTO_BY_TYPE[type] || (isCommercial ? COMMERCIAL_FALLBACK : RESIDENTIAL_FALLBACK);
}

export default function PropertyImagePlaceholder({ category, propertyType, seed, className = '' }) {
  const type = (propertyType || '').toLowerCase();
  const isCommercial = category === 'commercial' || COMMERCIAL_TYPES.includes(type);
  const label = propertyType
    ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
    : isCommercial
    ? 'Commercial'
    : 'Residential';

  const photoUrl = (RESIDENTIAL_INTERIOR_TYPES.includes(type) && !isCommercial) ? RESIDENTIAL_INTERIOR_PHOTOS[hashSeed(String(seed || type)) % RESIDENTIAL_INTERIOR_PHOTOS.length] : (PHOTO_BY_TYPE[type] || (isCommercial ? COMMERCIAL_FALLBACK : RESIDENTIAL_FALLBACK));

  return (
    <div className={`relative w-full h-full overflow-hidden flex items-end ${className}`}>
      <div
        className={`absolute inset-0 ${
          isCommercial
            ? 'bg-gradient-to-br from-primary-300 via-primary-200 to-primary-100'
            : 'bg-gradient-to-br from-primary-200 via-primary-100 to-primary-50'
        }`}
        style={{
          backgroundImage: `url(${photoUrl}?auto=format&fit=crop&w=640&q=65)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.15)',
        }}
      />
      <div className="relative w-full bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-10 pb-3 px-3 flex flex-col items-center gap-1.5">
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
