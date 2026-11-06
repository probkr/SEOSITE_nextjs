import { getProperties } from '@/lib/api';
import { parseListingFilters } from '@/lib/listing';
import PropertyCard from '@/components/PropertyCard';
import ListingFilters from '@/components/ListingFilters';
import PaginationLinks from '@/components/PaginationLinks';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const q = searchParams?.q || '';
  return {
    title: q ? `Search results for "${q}" | PRObroker` : 'Search Properties | PRObroker',
    description: 'Search for verified properties across Ahmedabad and Gandhinagar.',
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/search/` },
  };
}

const SORT_MAP = { newest: '-createdAt', price_asc: 'price_asc', price_desc: 'price_desc' };

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q || '';
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const filters = parseListingFilters(searchParams);
  const perPage = 12;

  let properties = [];
  let total = 0;
  let totalPages = 1;

  if (q) {
    const result = await getProperties(
      {
        status: 'active',
        isApproved: true,
        search: q,
        city: searchParams?.city || undefined,
        bhk: filters.bhk || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        furnishing: filters.furnishing || undefined,
        parking: filters.parking || undefined,
        propertyType: filters.propertyType || undefined,
        minSqft: filters.minSqft || undefined,
        maxSqft: filters.maxSqft || undefined,
        postedBy: filters.postedBy || undefined,
        postedSince: filters.postedSince || undefined,
        familyOrBachelors: filters.familyOrBachelors || undefined,
        amenities: filters.amenities || undefined,
        hasPhotos: filters.hasPhotos || undefined,
        verified: filters.verified || undefined,
        sort: SORT_MAP[filters.sort] || '-createdAt',
        page,
        limit: perPage,
      },
      { cache: 'no-store' }
    );
    properties = result?.data || [];
    total = result?.total ?? properties.length;
    totalPages = result?.totalPages || Math.max(1, Math.ceil(total / perPage));
  }

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl font-bold font-heading mb-2 text-gray-900">
        {q ? <>Search results for &quot;{q}&quot;</> : 'Search Properties'}
      </h1>
      {!q ? (
        <p className="text-gray-500">Enter a locality, society, or city name above to find properties.</p>
      ) : (
        <>
          {/* Filters: full-width horizontal bar above the listing, matches city/category pages */}
          <div className="mb-5">
            <ListingFilters activeFilters={filters} resultCount={total} />
          </div>
          {properties.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-600 font-medium mb-1">No properties found for &quot;{q}&quot;</p>
              <p className="text-sm text-gray-500">Try a different locality, society name, or clear your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
              {properties.map((p) => (
                <PropertyCard key={p.propertyId || p.slug} p={p} />
              ))}
            </div>
          )}
          {totalPages > 1 && <PaginationLinks basePath="/search/" page={page} totalPages={totalPages} />}
        </>
      )}
    </div>
  );
}
