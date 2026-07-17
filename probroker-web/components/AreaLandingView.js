import Link from 'next/link';
import { getProperties, getSocieties } from '@/lib/api';
import { fmtPrice } from '@/lib/format';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';

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

  const faqLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  return (
    <div className="container-px py-8">
      <JsonLd data={faqLd} />
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Properties in {area.name}, {city?.name}</h1>
      <p className="text-gray-600 mb-6 max-w-3xl">{overview}</p>

      {properties.length === 0 ? (
        <p className="text-gray-500 mb-8">No properties available in this area yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}

      {societies?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">Societies in {area.name}</h2>
          <div className="flex flex-wrap gap-2">
            {societies.map((s) => (
              <Link key={s.slug} href={`/${city?.slug}/${area.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-10">
        <Link href={`/${city?.slug}/${area.slug}/residential-property-for-sale/`} className="btn-primary">Buy Residential</Link>
        <Link href={`/${city?.slug}/${area.slug}/residential-property-for-rent/`} className="btn-primary bg-accent hover:bg-accent/90">Rent Residential</Link>
        <Link href={`/${city?.slug}/${area.slug}/commercial-property-for-sale/`} className="btn-primary bg-gray-700 hover:bg-gray-800">Buy Commercial</Link>
        <Link href={`/${city?.slug}/${area.slug}/commercial-property-for-rent/`} className="btn-primary bg-gray-700 hover:bg-gray-800">Rent Commercial</Link>
      </div>

      {faqs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i}>
                <div className="font-semibold">{f.question}</div>
                <div className="text-gray-600">{f.answer}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
