import Link from 'next/link';
import { getProperties, getSocieties } from '@/lib/api';
import { fmtPrice } from '@/lib/format';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';
import { faqPageSchema, breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/config';

export default async function AreaLandingView({ area, city }) {
  const areaId = area.id || area._id;
  const [propResult, societies] = await Promise.all([
    getProperties({ areaId, status: 'active', isApproved: true, limit: 12, sort: '-createdAt' }, { revalidate: 900 }),
    getSocieties({ areaId }, { revalidate: 900 }),
  ]);
  const properties = propResult?.data || [];
  const total = propResult?.total ?? properties.length;

  const overview = area.overview || `${area.name} is a well-connected locality in ${city?.name}, offering a range of residential and commercial properties for sale and rent. Explore ${total}+ listings and ${(societies || []).length} societies in the area on PRObroker.`;
  const faqs = area.faqs || [];

  const faqLd = faqPageSchema(faqs);
  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: city?.name || '', url: `${SITE_URL}/${city?.slug}/` },
    { name: area.name, url: `${SITE_URL}/${city?.slug}/${area.slug}/` },
  ]);

  return (
    <div className="container-px py-8">
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="badge bg-primary-50 text-primary mb-3">{city?.name}</div>
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">Properties in {area.name}, {city?.name}</h1>
      <p className="text-gray-600 mb-6 max-w-3xl leading-relaxed">{overview}</p>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link href={`/${city?.slug}/${area.slug}/residential-property-for-sale/`} className="btn-primary">Buy Residential</Link>
        <Link href={`/${city?.slug}/${area.slug}/residential-property-for-rent/`} className="btn-accent">Rent Residential</Link>
        <Link href={`/${city?.slug}/${area.slug}/commercial-property-for-sale/`} className="btn-outline">Buy Commercial</Link>
        <Link href={`/${city?.slug}/${area.slug}/commercial-property-for-rent/`} className="btn-outline">Rent Commercial</Link>
      </div>

      {properties.length === 0 ? (
        <p className="text-gray-500 mb-8">No properties available in this area yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}

      {societies?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold font-heading mb-3 text-gray-900">Societies in {area.name}</h2>
          <div className="flex flex-wrap gap-2">
            {societies.map((s) => (
              <Link key={s.slug} href={`/${city?.slug}/${area.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-primary-100 hover:text-primary transition-colors">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl">
            {faqs.map((f, i) => (
              <div key={i} className="card p-4">
                <div className="font-semibold text-gray-900">{f.ques