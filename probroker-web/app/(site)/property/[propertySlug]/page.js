import { getProperty, getProperties, getRedirect } from '@/lib/api';
import { fmtPrice, buildPropertyTitle, buildPropertySlug, fmtPropDesc } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import PropertyGallery from '@/components/PropertyGallery';
import JsonLd from '@/components/JsonLd';
import { realEstateListingSchema, breadcrumbSchema } from '@/lib/schema';
import InquiryForm from '@/components/InquiryForm';
import FeatureIcon from '@/components/FeatureIcon';
import PropertySectionTabs from '@/components/PropertySectionTabs';
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
const TYPE_LABELS = { flat: 'Flat / Apartment', apartment: 'Flat / Apartment', plot: 'Plot / Land', rowhouse: 'Row House' };
const TENANT_LABELS = { both: 'Family & Bachelors', family: 'Family only', bachelors: 'Bachelors only' };

// Household items go under "Furnishings"; everything else is a building/property amenity.
const FURNISHING_RE = /electric|fitting|light|\bfans?\b|\bac\b|air ?condition|wardrobe|cupboard|almirah|geyser|\bbeds?\b|mattress|sofa|dining|\btv\b|television|fridge|refrigerator|washing|microwave|oven|kitchen|chimney|stove|curtain|purifier|chair|table/i;

const titleCase = (v) => String(v || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

function ordinal(n) {
  const v = n % 100;
  const suf = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${suf}`;
}

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
  // floorNumber 0 is the import default for "unknown", not the ground floor, so it is not shown.
  const floor = Number(prop.floorNumber) || 0;
  const totalFloors = Number(prop.totalFloors) || 0;
  const tenantKey = String(prop.familyOrBachelors || '').toLowerCase();
  const facts = [
    prop.bhk ? { label: 'Configuration', icon: 'bed', value: `${parseInt(prop.bhk)} BHK` } : null,
    prop.sqft ? { label: 'Built-up Area', icon: 'area', value: `${Number(prop.sqft).toLocaleString('en-IN')} sq.ft` } : null,
    pricePerSqft ? { label: 'Price / sq.ft', icon: 'tag', value: `₹${pricePerSqft.toLocaleString('en-IN')}` } : null,
    prop.propertyType ? { label: 'Property Type', icon: 'building', value: TYPE_LABELS[prop.propertyType.toLowerCase()] || titleCase(prop.propertyType) } : null,
    prop.furnishing ? { label: 'Furnishing', icon: 'sofa', value: titleCase(prop.furnishing) } : null,
    floor > 0 ? { label: 'Floor', icon: 'stairs', value: totalFloors ? `${ordinal(floor)} of ${totalFloors}` : `${ordinal(floor)} floor` } : null,
    ageLabel(prop.ageOfProperty) ? { label: 'Age of Property', icon: 'calendar', value: ageLabel(prop.ageOfProperty) } : null,
    tenantKey ? { label: 'Preferred Tenant', icon: 'users', value: TENANT_LABELS[tenantKey] || titleCase(prop.familyOrBachelors) } : null,
    { label: 'Transaction', icon: 'key', value: trans },
    { label: 'Listed By', icon: 'user', value: prop.listingType === 'owner' ? 'Owner' : 'Broker' },
  ].filter(Boolean);

  const allFeatures = [...new Set((Array.isArray(prop.amenities) ? prop.amenities : []).map((a) => String(a).trim()).filter(Boolean))];
  if (prop.parking && !allFeatures.some((a) => /parking/i.test(a))) allFeatures.push('Parking');
  const furnishings = allFeatures.filter((a) => FURNISHING_RE.test(a));
  const amenities = allFeatures.filter((a) => !FURNISHING_RE.test(a));

  const nearbyList = (prop.nearby || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

  // In-page tabs: only for sections this listing actually has.
  const sectionTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'description', label: 'Description' },
    furnishings.length ? { id: 'furnishings', label: 'Furnishings' } : null,
    amenities.length ? { id: 'amenities', label: 'Amenities' } : null,
    nearbyList.length ? { id: 'neighbourhood', label: 'Neighbourhood' } : null,
    similar.length ? { id: 'similar', label: 'Similar Properties' } : null,
  ].filter(Boolean);

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
            <PropertyGallery photos={photos} title={title} category={prop.category} propertyType={prop.propertyType} seed={prop.propertyId} />

            <div className="flex flex-wrap items-center gap-2 mt-6 mb-3">
              <span className="badge bg-primary-50 text-primary">{trans}</span>
              {prop.listingType === 'owner' && <span className="badge bg-accent-50 text-accent-600">Owner Listing</span>}
              {prop.propertyType && <span className="badge bg-white border border-gray-200 text-gray-700 capitalize">{prop.propertyType}</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading leading-snug mb-2 text-gray-900">{title}</h1>
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

            <PropertySectionTabs sections={sectionTabs} />

            {/* Quick facts */}
            <div id="overview" className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5 mb-8 p-5 bg-white border border-gray-100 rounded-xl shadow-card">
              {facts.map((f) => (
                <div key={f.label} className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                    <FeatureIcon icon={f.icon} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-gray-500 text-[11px] uppercase tracking-wide">{f.label}</div>
                    <div className="font-semibold text-gray-900 mt-0.5 leading-snug">{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div id="description" className="mb-8">
              <h2 className="text-lg font-bold font-heading mb-2 text-gray-900">Description</h2>
              <div className="text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: prop.description || desc }} />
            </div>

            {/* Furnishings + Amenities, straight from the listing's amenities list */}
            {[
              { title: 'Furnishings', items: furnishings },
              { title: 'Amenities', items: amenities },
            ].filter((g) => g.items.length > 0).map((g) => (
              <div key={g.title} id={g.title.toLowerCase()} className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-3 text-gray-900">{g.title}</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {g.items.map((name) => (
                    <li key={name} className="flex items-center gap-2.5 text-sm text-gray-800 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                      <span className="w-8 h-8 shrink-0 rounded-md bg-primary-50 text-primary flex items-center justify-center">
                        <FeatureIcon name={name} className="w-[18px] h-[18px]" />
                      </span>
                      <span className="leading-tight">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Nearby landmarks */}
            {nearbyList.length > 0 && (
              <div id="neighbourhood" className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-3 text-gray-900">Nearby Landmarks</h2>
                <p className="text-gray-700">{nearbyList.join(', ')}</p>
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
                hasContact={prop.hasContact}
                listingType={prop.listingType}
              />
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div id="similar" className="mt-14">
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
