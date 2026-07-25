import Link from 'next/link';
import { fmtPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';
import { residenceSchema, faqPageSchema, breadcrumbSchema } from '@/lib/schema';

export default function SocietyDetailView({ citySlug, areaSlug, society, area, city, properties, similarSocieties }) {
  const propCount = properties.length;
  const minP = society.minPrice || 0;
  const maxP = society.maxPrice || 0;
  const priceRange = society.priceRange || (minP && maxP ? `${fmtPrice(minP)} - ${fmtPrice(maxP)}` : '');
  const overview = society.overview || society.description || `${society.name} is a well-known project in ${area?.name}, ${city?.name} offering ${propCount} verified listings on PRObroker.`;
  const amenities = society.amenities?.length ? society.amenities : ['24/7 Security', 'Power Backup', 'Water Supply', 'Parking', 'Garden', "Children's Play Area"];
  const faqs = society.faqs || [];
  const canonical = `${SITE_URL}/${citySlug}/${areaSlug}/${society.slug}/`;
  const jsonLd = residenceSchema(society, area, city, overview, canonical);
  const faqLd = faqPageSchema(faqs);
  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: city?.name || citySlug, url: `${SITE_URL}/${citySlug}/` },
    { name: area?.name || areaSlug, url: `${SITE_URL}/${citySlug}/${areaSlug}/` },
    { name: society.name, url: canonical },
  ]);

  return (
    <div className="container-px py-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <nav className="text-xs text-gray-500 mb-3 flex flex-wrap gap-1">
        <Link href={`/${city?.slug}/`} className="hover:text-primary">{city?.name}</Link>
        <span>/</span>
        <Link href={`/${city?.slug}/${area?.slug}/`} className="hover:text-primary">{area?.name}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{society.name}</span>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">{society.name}, {area?.name}</h1>
      {priceRange && <p className="text-primary font-bold text-lg mb-2 font-heading">{priceRange}</p>}
      <p className="text-gray-600 mb-6 max-w-3xl leading-relaxed">{overview}</p>

      <div className="mb-10 card p-5">
        <h2 className="text-lg font-bold font-heading mb-3 text-gray-900">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span key={a} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">{a}</span>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">{propCount} Properties in {society.name}</h2>
      {properties.length === 0 ? (
        <p className="text-gray-500 mb-8">No active listings in this society right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {properties.map((p) => (
            <PropertyCard key={p.propertyId || p.slug} p={p} />
          ))}
        </div>
      )}

      {similarSocieties?.filter((s) => s.slug !== society.slug).length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold font-heading mb-3 text-gray-900">Similar Societies in {area?.name}</h2>
          <div className="flex flex-wrap gap-2">
            {similarSocieties.filter((s) => s.slug !== society.slug).slice(0, 6).map((s) => (
              <Link key={s.slug} href={`/${city?.slug}/${area?.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-primary-100 hover:text-primary transition-colors">
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
                <div className="font-semibold text-gray-900">{f.question}</div>
                <div className="text-gray-600 mt-1">{f.answer}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
