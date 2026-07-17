import { getProperty, getProperties } from '@/lib/api';
import { fmtPrice, buildPropertyTitle, buildPropertySlug, fmtPropDesc } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import InquiryForm from '@/components/InquiryForm';
import { redirect, notFound } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

async function loadProperty(slug) {
  const prop = await getProperty(slug, { revalidate: 900 });
  return prop;
}

export async function generateMetadata({ params }) {
  const prop = await loadProperty(params.propertySlug);
  if (!prop) {
    return { title: 'Property Not Found | PRObroker', robots: { index: false, follow: false } };
  }
  const correctSlug = prop.slug || buildPropertySlug(prop);
  const canonical = `${SITE_URL}/property/${correctSlug}/`;
  const title = `${buildPropertyTitle(prop)} | PRObroker`;
  const desc = prop.aiDescription || fmtPropDesc(prop);
  const image = prop.photos?.[0];
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, images: image ? [image] : undefined },
  };
}

export default async function PropertyPage({ params }) {
  const prop = await loadProperty(params.propertySlug);
  if (!prop) notFound();

  const correctSlug = prop.slug || buildPropertySlug(prop);
  if (correctSlug && correctSlug !== params.propertySlug) {
    redirect(`/property/${correctSlug}/`);
  }

  const title = buildPropertyTitle(prop);
  const canonical = `${SITE_URL}/property/${correctSlug}/`;
  const desc = prop.aiDescription || fmtPropDesc(prop);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description: desc,
    url: canonical,
    image: prop.photos?.[0] || '',
    offers: { '@type': 'Offer', price: String(prop.price || ''), priceCurrency: 'INR' },
    address: { '@type': 'PostalAddress', addressLocality: prop.areaName, addressRegion: prop.cityName, addressCountry: 'IN' },
  };

  let similar = [];
  try {
    const similarResult = await getProperties(
      { status: 'active', isApproved: true, areaId: prop.areaId, bhk: prop.bhk, limit: 3 },
      { revalidate: 900 }
    );
    similar = (similarResult?.data || []).filter((p) => p.propertyId !== prop.propertyId);
  } catch {}

  return (
    <div className="container-px py-8">
      <JsonLd data={jsonLd} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {(prop.photos?.length ? prop.photos : ['/placeholder-property.jpg']).slice(0, 6).map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={photo} alt={`${title} photo ${i + 1}`} className="w-full h-40 object-cover rounded-md" />
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          <div className="text-2xl font-bold text-primary mb-4">{fmtPrice(prop.price)}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
            {prop.sqft && <div><div className="text-gray-500">Area</div><div className="font-semibold">{prop.sqft} sqft</div></div>}
            {prop.bhk ? <div><div className="text-gray-500">BHK</div><div className="font-semibold">{prop.bhk}</div></div> : null}
            {prop.furnishing && <div><div className="text-gray-500">Furnishing</div><div className="font-semibold capitalize">{prop.furnishing.replace('-', ' ')}</div></div>}
            {prop.floorNumber !== undefined && <div><div className="text-gray-500">Floor</div><div className="font-semibold">{prop.floorNumber}{prop.totalFloors ? `/${prop.totalFloors}` : ''}</div></div>}
          </div>
          <div className="prose max-w-none mb-8">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{prop.description || desc}</p>
          </div>
        </div>
        <div>
          <InquiryForm propertyId={prop.propertyId} propertyTitle={title} />
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similar.map((p) => (
              <PropertyCard key={p.propertyId || p.slug} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
