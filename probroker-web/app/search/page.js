import { searchApi } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Search Properties | PRObroker',
    description: 'Search for properties across Ahmedabad and Gandhinagar.',
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/search/` },
  };
}

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q || '';
  const results = q ? (await searchApi(q, { cache: 'no-store' })) || [] : [];

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl font-bold mb-6">Search Properties</h1>
      <form className="mb-8 flex gap-2 max-w-xl" action="/search/" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by area, society, or city..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="btn-primary" type="submit">Search</button>
      </form>
      {q && (
        <p className="text-gray-500 mb-4">{results.length} results for &quot;{q}&quot;</p>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
