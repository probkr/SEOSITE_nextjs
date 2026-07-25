import Link from 'next/link';
import { getCities, getProperties, getAreas } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import HomeSearchWidget from '@/components/HomeSearchWidget';
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

const TRUST_BADGES = [
  { label: 'Verified Listings', sub: 'Every property checked', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Zero Brokerage', sub: 'On owner listings', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-18v6m0 12v6m0-4c-1.11 0-2.08-.402-2.599-1' },
  { label: 'Direct Owner Contact', sub: 'No middlemen', icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zM12 14v7m-7-7 7 7 7-7M5 21h14' },
  { label: 'Ahmedabad & Gandhinagar', sub: 'Local expertise', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z' },
];

const PROPERTY_TYPES = [
  { label: 'Flats', slug: 'flats', trans: 'sale', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 13h.01M9 17h.01M13 13h.01' },
  { label: 'Bungalows', slug: 'bungalows', trans: 'sale', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { label: 'Tenements', slug: 'tenements', trans: 'sale', icon: 'M4 21h16M4 21V8l8-4 8 4v13M9 21v-6h6v6' },
  { label: 'Villas', slug: 'villas', trans: 'sale', icon: 'M3 21h18M21 11l-9-6-9 6M8 14v7M16 14v7' },
  { label: 'Plots', slug: 'plots', trans: 'sale', icon: 'M4 4h16v16H4zM4 12h16M12 4v16' },
  { label: 'Offices', slug: 'offices', trans: 'sale', icon: 'M3 21h18M6 21V6a1 1 0 011-1h10a1 1 0 011 1v15M9 9h1M14 9h1M9 13h1M14 13h1' },
  { label: 'Shops', slug: 'shops', trans: 'sale', icon: 'M3 9l1-5h16l1 5M3 9v11h18V9M9 21v-6h6v6' },
  { label: 'Warehouses', slug: 'warehouses', trans: 'sale', icon: 'M3 10l9-6 9 6v11H3z M9 21v-7h6v7' },
];

export default async function HomePage() {
  const [cities, latest, allAreas] = await Promise.all([
    getCities({ revalidate: 3600 }),
    getProperties({ status: 'active', isApproved: true, limit: 8, sort: '-createdAt' }, { revalidate: 300 }),
    getAreas({}, { revalidate: 3600 }),
  ]);
  const properties = latest?.data || [];
  const totalListings = latest?.total || 0;

  const orgLd = organizationSchema();
  const websiteLd = websiteSchema();

  return (
    <div>
      <JsonLd data={orgLd} />
      <JsonLd data={websiteLd} />

      {/* Hero */}
      <section
        className="relative overflow-hidden bg-primary-900 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/85 via-primary-900/65 to-primary-900/90" />
        <div className="container-px relative py-14 md:py-20 text-center">

          <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-white tracking-tight leading-[1.05]">
            Find your next home,<br className="hidden md:block" /> talk to the owner <span className="text-accent">directly.</span>
          </h1>
          <p className="mt-5 text-gray-200 text-lg max-w-2xl mx-auto">
            Search {totalListings ? `${totalListings}+` : ''} verified residential &amp; commercial properties across Ahmedabad and Gandhinagar &mdash; zero brokerage, direct owner contact.
          </p>

          <div className="mt-9">
            <HomeSearchWidget cities={cities} areas={allAreas || []} />
          </div>

          </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-gray-100 bg-white">
        <div className="container-px py-8 grid grid-cols-2 md:grid-cols-4 gap-5">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={b.icon} /></svg>
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{b.label}</div>
                <div className="text-xs text-gray-500">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by property type */}
      <section className="container-px section-py">
        <h2 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-gray-900">Browse by Property Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PROPERTY_TYPES.map((t) => (
            <Link
              key={t.slug}
              href={`/ahmedabad/${t.slug}-for-${t.trans}/`}
              className="card p-5 flex flex-col items-center text-center gap-2 hover:border-primary hover:shadow-float transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
              </div>
              <span className="font-semibold text-gray-800 text-sm">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore by city */}
      <section className="container-px section-py bg-primary-50/40 rounded-3xl">
        <h2 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-gray-900">Explore by City</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(cities || []).map((c) => (
            <div key={c.slug} className="card p-6 flex items-center justify-between bg-white">
              <div>
                <div className="font-bold text-xl font-heading text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500">{c.state}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/${c.slug}/residential-property-for-sale/`} className="btn-outline !px-4 !py-2 text-sm">Buy</Link>
                <Link href={`/${c.slug}/residential-property-for-rent/`} className="btn-primary !px-4 !py-2 text-sm">Rent</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest properties */}
      <section className="container-px section-py">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Latest Properties</h2>
          <Link href="/ahmedabad/residential-property-for-sale/" className="text-primary font-semibold text-sm hover:underline">View all &rarr;</Link>
        </div>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties available right now. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.propertyId || p.slug} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Why PRObroker */}
      <section className="container-px section-py">
        <div className="card p-8 md:p-10 bg-primary-50 border-primary-100">
          <h2 className="text-xl md:text-2xl font-bold font-heading text-gray-900 mb-6">Why Buyers &amp; Tenants Choose PRObroker</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-primary font-heading mb-1">{totalListings ? `${totalListings}+` : '2000+'}</div>
              <div className="text-sm text-gray-600">Verified Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary font-heading mb-1">&#8377;0</div>
              <div className="text-sm text-gray-600">Brokerage on Owner Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary font-heading mb-1">2</div>
              <div className="text-sm text-gray-600">Cities: Ahmedabad &amp; Gandhinagar</div>
            </div>
          </div>
        </div>
      </section>

      {/* Societies */}
      <section className="container-px section-py">
        <div className="card p-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-primary-50 border-primary-100">
          <div>
            <h2 className="text-xl font-bold font-heading text-gray-900">Browse Societies &amp; Projects</h2>
            <p className="text-gray-600 mt-1">Explore our directory of residential and commercial societies across Ahmedabad and Gandhinagar.</p>
          </div>
          <Link className="btn-primary shrink-0" href="/societies/">View All Societies</Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="container-px py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">Have a Property to Sell or Rent?</h2>
          <p className="text-primary-100 mt-2">List it on PRObroker for free and reach thousands of verified buyers and tenants.</p>
          <Link href="/post-property/" className="btn-accent inline-flex mt-6">Post Property FREE</Link>
        </div>
      </section>
    </div>
  );
}
