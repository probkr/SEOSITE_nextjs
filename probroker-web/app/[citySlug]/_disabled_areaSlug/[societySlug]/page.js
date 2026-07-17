import { getCity, getArea, getSociety, getProperties, getSocieties } from '@/lib/api';
import { fetchListingData } from '@/lib/listing';
import { fmtPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import ListingView from '@/components/ListingView';
import JsonLd from '@/components/JsonLd';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

// {citySlug}/{areaSlug}/{seg3}/ is a single Next.js dynamic segment covering
// two old FastAPI patterns: the area-level category listing
// (residential|commercial-property-for-sale|rent) and the society detail
// page. Next.js does not allow sibling dynamic folders with different param
// names at the same level, so both are resolved here in JS, mirroring the
// priority order of the old `three_segment_page` route handler (category
// listing pattern checked first, then society lookup).
async function resolve(params, page) {
  const { citySlug, areaSlug, societySlug } = params;

  const mCat = societySlug.match(/^(residential|commercial)-property-for-(sale|rent)$/);
  if (mCat) {
    const data = await fetchListingData({ citySlug, category: mCat[1], trans: mCat[2], areaSlug, page });
    return { type: 'area-listing', data };
  }

  const [city, area, society] = await Promise.all([
    getCity(citySlug, { revalidate: 3600 }),
    getArea(areaSlug, { revalidate: 900 }),
    getSociety(societySlug, { revalidate: 900 }),
  ]);
  if (!society) return { type: 'notfound' };
  return { type: 'society', city, area, society };
}

export async function generateMetadata({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const result = await resolve(params, page);
  if (result.type === 'notfound') return { robots: { index: false, follow: false } };
  if (result.type === 'area-listing') {
    const { data } = result;
    return {
      title: data.title,
      description: data.metaDescription,
      alternates: { canonical: data.canonical },
      openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
    };
  }
  const { society, area, city } = result;
  const canonical = `${SITE_URL}/${params.citySlug}/${params.areaSlug}/${society.slug}/`;
  const typeLabel = society.projectType === 'commercial' ? 'Commercial Properties' : 'Properties';
  const title = society.metaTitle || `${typeLabel} in ${society.name}, ${area?.name || ''} — Price, Amenities, Reviews | PRObroker`;
  const desc = society.metaDescription || `Find verified ${typeLabel.toLowerCase()} in ${society.name}, ${area?.name}, ${city?.name}. Amenities, reviews, floor plans. Contact owners directly on PRObroker.`;
  return {
    title, description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical },
  };
}

function SocietyView({ params, society, area, city, properties, similarSocieties }) {
  const propCount = properties.length;
  const minP = society.minPrice || 0;
  const maxP = society.maxPrice || 0;
  const priceRange = society.priceRange || (minP && maxP ? `${fmtPrice(minP)} - ${fmtPrice(maxP)}` : '');
  const overview = society.overview || society.description || `${society.name} is a well-known project in ${area?.name}, ${city?.name} offering ${propCount} verified listings on PRObroker.`;
  const amenities = society.amenities?.length ? society.amenities : ['24/7 Security', 'Power Backup', 'Water Supply', 'Parking', 'Garden', "Children's Play Area"];
  const faqs = society.faqs || [];
  const canonical = `${SITE_URL}/${params.citySlug}/${params.areaSlug}/${society.slug}/`;
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

export default async function ThirdSegmentPage({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const result = await resolve(params, page);
  if (result.type === 'notfound') notFound();

  if (result.type === 'area-listing') {
    return <ListingView data={result.data} basePath={`/${params.citySlug}/${params.areaSlug}/${params.societySlug}/`} />;
  }

  const { society, area, city } = result;
  const societyId = society.id || society._id;
  const [propResult, similarSocieties] = await Promise.all([
    getProperties({ societyId, status: 'active', isApproved: true, sort: '-createdAt', limit: 50 }, { revalidate: 900 }),
    getSocieties({ areaId: area?.id || area?._id }, { revalidate: 900 }),
  ]);
  const properties = propResult?.data || [];

  return (
    <SocietyView
      params={params}
      society={society}
      area={area}
      city={city}
      properties={properties}
      similarSocieties={similarSocieties}
    />
  );
}
