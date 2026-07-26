import { getProperty, getProperties, getRedirect } from '@/lib/api';
import { fmtPrice, buildPropertyTitle, buildPropertySlug, fmtPropDesc } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import PropertyGallery from '@/components/PropertyGallery';
import JsonLd from '@/components/JsonLd';
import { realEstateListingSchema, breadcrumbSchema } from '@/lib/schema';
import InquiryForm from '@/components/InquiryForm';
import Link from 'next/link';
import { redirect, notFound, permanentRedirect } from 'next/navigation';

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
  const rawTitle = buildPropertyTitle(prop);
  const shortTitle = rawTitle.length > 47 ? `${rawTitle.slice(0, 47).replace(/[\s,\-]+$/, '')}…` : rawTitle;
  const title = `${shortTitle} | PRObroker`;
  const desc = prop.aiDescription || fmtPropDesc(prop);
  const image = prop.photos?.[0];
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, images: image ? [image] : undefined },
  };
}

const AGE_LABELS = { 0: 'New / Under Construction', 1: 'Less than a year', 5: '1-5 years', 10: '5-10 years' };
function ageLabel(age) {
  if (age === null || age === undefined) return null;
  return AGE_LABELS[age] || `${age}+ years`;
}

export default async function PropertyPage({ params }) {
  const prop = await loadProperty(params.propertySlug);
  if (!prop) {
    const path = `/property/${params.propertySlug}/`;
    const hit = await getRedirect(path, { cache: 'no-store' }).catch(() => null);
    if (hit?.destination) permanentRedirect(hit.destination);
    notFound();
  }

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
  if (prop.citySlug && prop.category && prop.transactionType) {
    const bTrans = prop.transactionType === 'buy' ? 'sale' : 'rent';
    const bCat = prop.category === 'commercial' ? 'Commercial' : 'Residential';
    breadcrumbItems.push({
      name: `${bCat} for ${bTrans === 'sale' ? 'Sale' : 'Rent'}`,
      url: `${SITE_URL}/${prop.citySlug}/${prop.category}-property-for-${bTrans}/`,
    });
  }
  breadcrumbItems.push({ name: title, url: canonical });
  const breadcrumbLd = breadcrumbSchema(breadcrumbItems);

  let similar = [];
  try {
    const similarResult = await getProperties(
      { status: 'active', isApproved: true, areaId: prop.areaId, bhk: prop.bhk, limit: 4 },
      { revalidate: 900 }
    );
    similar = (similarResult?.data || []).filter((p) => p.propertyId !== prop.propertyId);
  } catch {}

  const photos = prop.photos || [];
  const pricePerSqft = prop.price && prop.sqft ? Math.round(prop.price / prop.sqft) : null;
  const trans = prop.transactionType === 'rent' ? 'For Rent' : 'For Sale';
  const facts = [
    prop.bhk ? { label: 'Configuration', value: `${parseInt(prop.bhk)} BHK` } : null,
    prop.sqft ? { label: 'Built-up Area', value: `${prop.sqft} sqft` } : null,
    pricePerSqft ? { label: 'Price / sqft', value: `₹${pricePerSqft.toLocaleString('en-IN')}` } : null,
    prop.propertyType ? { label: 'Property Type', value: prop.propertyType } : null,
    prop.furnishing ? { label: 'Furnishing', value: prop.furnishing.replace(/-/g, ' ') } : null,
    prop.floorNumber !== undefined && prop.floorNumber !== null
      ? { label: 'Floor', value: `${prop.floorNumber}${prop.totalFloors ? ` of ${prop.totalFloors}` : ''}` }
      : null,
    ageLabel(prop.ageOfProperty) ? { label: 'Age of Property', value: ageLabel(prop.ageOfProperty) } : null,
    prop.familyOrBachelors ? { label: 'Preferred Tenant', value: prop.familyOrBachelors } : null,
    { label: 'Transaction', value: trans },
    { label: 'Listed By', value: prop.listingType === 'owner' ? 'Owner' : 'Dealer' },
  ].filter(Boolean);

  const amenities = [
    { label: 'Car Parking', active: !!prop.parking },
    { label: 'Furnished', active: prop.furnishing && !['unfurnished', ''].includes((prop.furnishing || '').toLowerCase()) },
    { label: 'Lift', active: (prop.totalFloors || 0) > 1 },
    { label: 'Power Backup', active: false },
    { label: 'Security', active: false },
    { label: 'Water Supply 24x7', active: false },
  ];

  const nearbyList = (prop.nearby || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

  const backHref = breadcrumbItems.length > 2 ? breadcrumbItems[breadcrumbItems.length - 2].url.replace(SITE_URL, '') : '/';

  return (
    <div className="bg-primary-50/30">
      <div className="container-px py-6 md:py-8">
        <JsonLd data={jsonLd} />
        <JsonLd data={breadcrumbLd} />

        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <nav className="text-xs text-gray-500 flex flex-wrap gap-1">
            {breadcrumbItems.map((b, i) => (
              <span key={b.url} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbItems.length - 1 ? 'text-gray-700 font-medium line-clamp-1' : ''}>{b.name}</span>
              </span>
            ))}
          </nav>
          <Link href={backHref} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to results
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PropertyGallery photos={photos} title={title} />

            <div className="flex flex-wrap items-center gap-2 mt-6 mb-3">
              <span className="badge bg-primary-50 text-primary">{trans}</span>
              {prop.listingType === 'owner' && <span className="badge bg-accent-50 text-accent-600">Owner Listing</span>}
              {prop.propertyType && <span className="badge bg-white border border-gray-200 text-gray-700 capitalize">{prop.propertyType}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">{title}</h1>
            {(prop.areaName || prop.cityName) && (
              <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.69 18.933a.75.75 0 00.62.062l.058-.026.128-.061.207-.108a17.5 17.5 0 001.907-1.311c.653-.51 1.32-1.144 1.94-1.9C16.104 13.727 17 11.9 17 9.75 17 5.856 13.866 2.75 10 2.75S3 5.856 3 9.75c0 2.146.896 3.977 2.646 6.144.62.756 1.287 1.39 1.94 1.9a17.5 17.5 0 002.114 1.419l.001.001zM10 11.75a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span>{[prop.premiseName, prop.areaName, prop.cityName].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <div className="flex items-end gap-3 mb-6">
              <div className="text-3xl md:text-4xl font-bold text-primary font-heading">{fmtPrice(prop.price)}</div>
              {pricePerSqft && <div className="text-sm text-gray-500 pb-1">(₹{pricePerSqft.toLocaleString('en-IN')}/sqft)</div>}
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 mb-8 p-5 card bg-primary-50 border-primary-100">
              {facts.map((f) => (
                <div key={f.label}>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">{f.label}</div>
                  <div className="font-semibold text-gray-900 capitalize mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold font-heading mb-2 text-gray-900">Description</h2>
              <div className="text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: prop.description || desc }} />
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-lg font-bold font-heading mb-3 text-gray-900">Amenities &amp; Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((a) => (
                  <div key={a.label} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 border ${a.active ? 'border-primary-100 bg-primary-50 text-gray-800' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    {a.active ? (
                      <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    {a.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby landmarks */}
            {nearbyList.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-3 text-gray-900">Nearby Landmarks</h2>
                <div className="flex flex-wrap gap-2">
                  {nearbyList.map((n) => (
                    <span key={n} className="inline-flex items-center gap-1.5 text-sm bg-primary-50 text-gray-700 rounded-full px-3.5 py-1.5">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.69 18.933a.75.75 0 00.62.062l.058-.026.128-.061.207-.108a17.5 17.5 0 001.907-1.311c.653-.51 1.32-1.144 1.94-1.9C16.104 13.727 17 11.9 17 9.75 17 5.856 13.866 2.75 10 2.75S3 5.856 3 9.75c0 2.146.896 3.977 2.646 6.144.62.756 1.287 1.39 1.94 1.9a17.5 17.5 0 002.114 1.419l.001.001z" clipRule="evenodd" /></svg>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional details */}
            {prop.additionalDetails && (
              <div className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-2 text-gray-900">Additional Details</h2>
                <div className="text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: prop.additionalDetails }} />
              </div>
            )}
          </div>

          <div>
            <div className="lg:sticky lg:top-24">
              <InquiryForm
                propertyId={prop.propertyId}
                propertyTitle={title}
                contactName={prop.contactName}
                contactPhone={prop.contactPhone}
                listingType={prop.listingType}
              />
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold font-heading text-gray-900">Similar Properties</h2>
              {prop.citySlug && (
                <Link href={`/${prop.citySlug}/residential-property-for-${prop.transactionType === 'rent' ? 'rent' : 'sale'}/`} className="text-primary font-semibold text-sm hover:underline shrink-0">
                  View all &rarr;
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {similar.slice(0, 4).map((p) => (
                <PropertyCard key={p.propertyId || p.slug} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
