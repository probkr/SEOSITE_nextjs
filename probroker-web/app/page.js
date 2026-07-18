import Link from 'next/link';
import { getCities, getProperties } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'PRObroker | Buy, Sell & Rent Properties in Ahmedabad & Gandhinagar',
    description: 'Search verified residential and commercial properties for sale and rent in Ahmedabad and Gandhinagar. Post your property free on PRObroker.',
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: {
      title: 'PRObroker | Real Estate in Ahmedabad & Gandhinagar',
      description: 'Search verified residential and commercial properties for sale and rent.',
      url: `${SITE_URL}/`,
    },
  };
}

export default async function HomePage() {
  const [cities, latest] = await Promise.all([
    getCities({ revalidate: 3600 }),
    getProperties({ status: 'active', isApproved: true, limit: 8, sort: '-createdAt' }, { revalidate: 300 }),
  ]);

  const properties = latest?.data || [];

  const orgLd = organizationSchema();
  const websiteLd = websiteSchema();

  return (
    <div>
      <JsonLd data={orgLd} />
      <JsonLd data={websiteLd} />
      <section className="bg-primary/5 py-14">
        <div className="container-px text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Find Your Next Property in Ahmedabad &amp; Gandhinagar</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Verified residential and commercial properties for sale and rent. Talk directly to owners on PRObroker.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/ahmedabad/residential-property-for-sale/" className="btn-primary">Buy in Ahmedabad</Link>
            <Link href="/ahmedabad/residential-property-for-rent/" className="btn-primary bg-accent hover:bg-accent/90">Rent in Ahmedabad</Link>
            <Link href="/post-property/" className="btn-primary bg-gray-800 hover:bg-gray-900">Post Property FREE</Link>
          </div>
        </div>
      </section>

      <section className="container-px py-10">
        <h2 className="text-2xl font-bold mb-4">Explore by City</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(cities || []).map((c) => (
            <div key={c.slug} className="card p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-gray-500">{c.state}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/${c.slug}/residential-property-for-sale/`} className="text-sm text-primary font-medium">Buy</Link>
                <Link href={`/${c.slug}/residential-property-for-rent/`} className="text-sm text-primary font-medium">Rent</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px py-10">
        <h2 className="text-2xl font-bold mb-4">Latest Properties</h2>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties available right now. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {properties.map((p) => (
              <PropertyCard key={p.propertyId || p.slug} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="container-px py-10">
        <h2 className="text-2xl font-bold mb-4">Societies</h2>
        <p className="text-gray-600">Browse our directory of societies and residential/commercial projects. <Link className="text-primary font-medium" href="/societies/">View all societies</Link></p>
      </section>
    </div>
  );
}
