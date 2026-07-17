import Link from 'next/link';
import PropertyCard from './PropertyCard';

export default function ListingView({ data, basePath }) {
  const { h1, properties, total, page, totalPages, popularAreas, societies, area, city } = data;
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{h1}</h1>
      <p className="text-gray-500 mb-6">{total} properties found</p>

      {area?.description && (
        <p className="text-gray-600 mb-6 max-w-3xl">{area.description}</p>
      )}

      {properties.length === 0 ? (
        <p className="text-gray-500">No properties found matching this criteria yet. Check back soon or browse other categories.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mb-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${basePath}${n > 1 ? `?page=${n}` : ''}`}
              className={`px-3 py-1.5 rounded border text-sm ${n === page ? 'bg-primary text-white border-primary' : 'border-gray-300'}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}

      {societies?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">Societies in {area?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {societies.map((s) => (
              <Link key={s.slug} href={`/${city?.slug}/${area?.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {popularAreas?.length > 0 && !area && (
        <div>
          <h2 className="text-xl font-bold mb-3">Popular Areas in {city?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {popularAreas.map((a) => (
              <Link key={a.slug} href={`/${city?.slug}/${a.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
