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

const QUICK_LINKS = [
  { label: 'Residential Buy', href: '/ahmedabad/residential-property-for-sale/' },
  { label: 'Residential Rent', href: '/ahmedabad/residential-property-for-rent/' },
  { label: 'Commercial Buy', href: '/ahmedabad/commercial-property-for-sale/' },
  { label: 'Commercial Rent', href: '/ahmedabad/commercial-property-for-rent/' },
];

const TRUST_BADGES = [
  { label: 'Verified Listings', sub: 'Every property checked' },
  { label: 'Zero Brokerage', sub: 'On owner listings' },
  { label: 'Direct Owner Contact', sub: 'No middlemen' },
  { label: 'Ahmedabad & Gandhinagar', sub: 'Local expertise' },
];

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

      {/* Hero */}
      <section className="relative bg-brand-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
        <div className="container-px relative py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight">
            Find Your Dream Property in <span className="text-accent-500">Ahmedabad</span>
          </h1>
          <p className="mt-4 text-primary-100 text-lg max-w-2xl mx-auto">
            Search 1000s of verified residential &amp; commercial properties across Ahmedabad and Gandhinagar
          </p>

          <form action="/search/" method="get" className="mt-8 max-w-2xl mx-auto bg-white rounded-xl shadow-float p-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search by locality, society, or landmark..."
              className="flex-1 h-12 px-4 rounded-lg border-2 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base text-gray-800"
            />
            <button type="submit" className="btn-primary h-12 px-8">Search</button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {QUICK_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-gray-100 bg-white">
        <div className="container-px py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="text-center">
              <div className="font-bold text-gray-900 text-sm 