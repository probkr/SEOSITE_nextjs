import Link from 'next/link';
import { fmtPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';

export default function SocietyDetailView({ citySlug, areaSlug, society, area, city, properties, similarSocieties }) {
  const propCount = properties.length;
  const minP = society.minPrice || 0;
  const maxP = society.maxPrice || 0;
  const priceRange = society.priceRange || (minP && maxP ? `${fmtPrice(minP)} - ${fmtPrice(maxP)}` : '');
  const overview = society.overview || society.description || `${society.name} is a well-known project in ${area?.name}, ${city?.name} offering ${propCount} verified listings on PRObroker.`;
  const amenities = society.amenities?.length ? society.amenities : ['24/7 Security', 'Power Backup', 'Water Supply', 'Parking', 'Garden', "Children's Play Area"];
  const faqs = society.faqs || [];
  const canonical = `${SITE_URL}/${citySlug}/${areaSlug}/${society.slug}/`;
  const schemaType = society.projectType === 'commercial' ? 'Place' : 'Residence';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: society.name,
    description: overview,
    url: canonical,
    address: { '@type': 'PostalAddress', addressLocality: area?.name, addressRegion: city?.name, addressCountry: 'IN' },
  };
  const faqLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }
    : null;

  return (
    <div className="container-px py-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqLd} />
      <div className="text-sm text-gray-500 mb-2">
        <Link href={`/${city?.slug}/`}>{city?.name}</Link> / <Link href={`/${city?.slug}/${area?.slug}/`}>{area?.name}</Link> / {society.name}
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{society.name}, {area?.name}</h1>
      {priceRange && <p className="text-primary font-semibold mb-2">{priceRange}</p>}
      <p className="text-gray-600 mb-6 max-w-3xl">{overview}</p>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span key={a} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{a}</span>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-3">{propCount} Properties in {society.name}</h2>
      {properties.length === 0 ? (
        <p className="text-gray-500 mb-8">No active listings in this society right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}

      {similarSocieties?.filter((s) => s.slug !== society.slug).length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">Similar Societies in {area?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {similarSocieties.filter((s) => s.slug !== society.slug).slice(0, 6).map((s) => (
              <Link key={s.slug} href={`/${city?.slug}/${area?.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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
