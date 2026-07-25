import Link from 'next/link';
import { getAreas, getProperties } from '@/lib/api';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/config';

const BHK_VALUES = [1, 2, 3, 4];
const BUDGET_LAKHS = [20, 30, 40, 50, 75];
const BUDGET_CRORE = [1, 2, 3];
const pill = 'px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-primary-100 hover:text-primary transition-colors';

export default async function CityLandingView({ city }) {
  const cityId = city.id || city._id;
  const [areas, propResult] = await Promise.all([
    getAreas({ cityId }, { revalidate: 3600 }),
    getProperties({ cityId, status: 'active', isApproved: true, limit: 12, sort: '-createdAt' }, { revalidate: 900 }),
  ]);
  const properties = propResult?.data || [];
  const total = propResult?.total ?? properties.length;
  const areaCount = (areas || []).length;

  const overview = `${city.name} offers a wide range of residential and commercial properties for sale and rent. Explore ${total}+ listings across ${areaCount} localities in ${city.name} on PRObroker.`;

  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: city.name, url: `${SITE_URL}/${city.slug}/` },
  ]);

  return (
    <div className="container-px py-8">
      <JsonLd data={breadcrumbLd} />
      <div className="badge bg-primary-50 text-primary mb-3">{city.name}</div>
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">Properties in {city.name}</h1>
      <p className="text-gray-600 mb-6 max-w-3xl leading-relaxed">{overview}</p>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link href={`/${city.slug}/residential-property-for-sale/`} className="btn-primary">Buy Residential</Link>
        <Link href={`/${city.slug}/residential-property-for-rent/`} className="btn-accent">Rent Residential</Link>
        <Link href={`/${city.slug}/commercial-property-for-sale/`} className="btn-outline">Buy Commercial</Link>
        <Link href={`/${city.slug}/commercial-property-for-rent/`} className="btn-outline">Rent Commercial</Link>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Flats by BHK in {city.name}</h2>
        <div className="flex flex-wrap gap-2">
          {BHK_VALUES.map((bhk) => (
            <Link key={`s${bhk}`} href={`/${city.slug}/${bhk}-bhk-flats-for-sale/`} className={pill}>{bhk} BHK for Sale</Link>
          ))}
          {BHK_VALUES.map((bhk) => (
            <Link key={`r${bhk}`} href={`/${city.slug}/${bhk}-bhk-flats-for-rent/`} className={pill}>{bhk} BHK for Rent</Link>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Flats by Budget in {city.name}</h2>
        <div className="flex flex-wrap gap-2">
          {BUDGET_LAKHS.map((v) => (
            <Link key={`l${v}`} href={`/${city.slug}/flats-under-${v}-lakhs/`} className={pill}>Under &#8377;{v} Lakhs</Link>
          ))}
          {BUDGET_CRORE.map((v) => (
            <Link key={`c${v}`} href={`/${city.slug}/flats-under-${v}-crore/`} className={pill}>Under &#8377;{v} Crore</Link>
          ))}
        </div>
      </div>

      {areaCount > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Popular Areas in {city.name}</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Link key={a.id || a._id} href={`/${city.slug}/${a.slug}/`} className={pill}>{a.name}</Link>
            ))}
          </div>
        </div>
      )}

      {properties.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Featured Properties in {city.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            {properties.map((p) => (
              <PropertyCard key={p.propertyId || p.slug} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
