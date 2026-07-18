import { getProperty, getProperties } from '@/lib/api';
import { fmtPrice, buildPropertyTitle, buildPropertySlug, fmtPropDesc } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import { realEstateListingSchema, breadcrumbSchema } from '@/lib/schema';
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

  const jsonLd = realEstateListingSchema(prop, desc, canonical);

  const breadcrumbItems = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (prop.cityName && prop.citySlug) {
    breadcrumbItems.push({ name: prop.cityName, url: `${SITE_URL}/${prop.citySlug}/` });
  }
  if (prop.areaName && prop.citySlug && prop.areaSlug) {
    breadcrumbItems.push({ name: prop.areaName, url: `${SITE_URL}/${prop.citySlug}/${prop.areaSlug}/` });
  }
  breadcrumbItems.push({ name: title, url: canonical });
  const breadcrumbLd = breadcrumbSchema(breadcrumbItems);

  let similar = [];
  try {
    const similarResult = await getProperties(
      { status: 'active', isApproved: true, areaId: prop.areaId, bhk: prop.bhk, limit: 3 },
      { revalidate: 900 }
    );
    similar = (similarResult?.data || []).filter((p) => p.propertyId !== prop.propertyId);
  } catch {}

  const photos = prop.photos?.length ? prop.photos : ['/placeholder-property.jpg'];
  const facts = [
    prop.sqft ? { label: 'Area', value: `${prop.sqft} sqft` } : null,
    prop.bhk ? { label: 'BHK', value: prop.bhk } : null,
    prop.furnishing ? { label: 'Furnishing', value: prop.furnishing.replace('-', ' ') } : null,
    prop.floorNumber !== undefined ? { label: 'Floor', value: `${prop.floorNumber}${prop.totalFloors ? `/${prop.totalFloors}` : ''}` } : null,
    prop.propertyType ? { label: 'Type', value: prop.propertyType } : null,
    prop.transactionType ? { label: 'Transaction', value: prop.transactionType === 'rent' ? 'For Rent' : 'For Sale' } : null,
  ].filter(Boolean);

  return (
    <div className="container-px py-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />

      <nav className="text-xs text-gray-500 mb-4 flex flex-wrap gap-1">
        {breadcrumbItems.map((b, i) => (
          <span key={b.url} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            <span className={i === breadcrumbItems.length - 1 ? 'text-gray-700 font-medium line-clamp-1' : ''}>{b.name}</span>
          </span>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden mb-2 bg-gray-100 aspect-[16/10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt={`${title} photo 1`} className="w-full h-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
              {photos.slice(1, 6).map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={photo} alt={`${title} photo ${i + 2}`} className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>
          )}

          <div className="badge bg-primary-50 text-primary mb-3">{prop.transactionType === 'rent' ? 'For Rent' : 'For Sale'}</div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">{title}</h1>
          <div className="text-3xl font-bold text-primary font-hea