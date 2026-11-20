import { getProperties } from '@/lib/api';
import { parseListingFilters, buildPropertyQuery, normalizePropertyResult, readPage } from '@/lib/listingQuery';
import ListingFilters from '@/components/ListingFilters';
import { ListingResultsProvider } from '@/components/ListingResultsProvider';
import ListingResults, { SearchHeading } from '@/components/ListingResults';
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

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q || '';
  const filters = parseListingFilters(searchParams);

  let initial = { properties: [], total: 0, totalPages: 1 };
  if (q) {
    // Same query the browser builds in ListingResultsProvider (mode="search") for later changes.
    const scope = { fixed: { city: searchParams?.city || undefined }, omit: ['area'] };
    const result = await getProperties(buildPropertyQuery(scope, filters, readPage(searchParams)), { cache: 'no-store' });
    initial = normalizePropertyResult(result);
  }

  return (
    <ListingResultsProvider mode="search" initial={initial}>
      <div className="container-px py-8">
        <SearchHeading />
        {!q ? (
          <p className="text-gray-500">Enter a locality, society, or city name above to find properties.</p>
        ) : (
          <>
            {/* Filters: full-width horizontal bar above the listing, matches city/category pages */}
            <div className="mb-5">
              <ListingFilters activeFilters={filters} resultCount={initial.total} />
            </div>
            <ListingResults
              layout="grid"
              basePath="/search/"
              empty={
                <div className="card p-10 text-center">
                  <p className="text-gray-600 font-medium mb-1">No properties found for &quot;{q}&quot;</p>
                  <p className="text-sm text-gray-500">Try a different locality, society name, or clear your filters.</p>
                </div>
              }
              prompt={<p className="text-gray-500">Enter a locality, society, or city name above to find properties.</p>}
            />
          </>
        )}
      </div>
    </ListingResultsProvider>
  );
}
