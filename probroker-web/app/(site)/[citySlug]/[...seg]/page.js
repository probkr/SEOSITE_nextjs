import { resolveCitySegments } from '@/lib/citySegments';
import { getRedirect } from '@/lib/api';
import { parseListingFilters } from '@/lib/listing';
import ListingView from '@/components/ListingView';
import AreaLandingView from '@/components/AreaLandingView';
import SocietyDetailView from '@/components/SocietyDetailView';
import { SITE_URL } from '@/lib/config';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const result = await resolveCitySegments(params.citySlug, params.seg, page);

  if (result.type === 'notfound') return { robots: { index: false, follow: false } };

  if (result.type === 'category-listing' || result.type === 'catchall-listing' || result.type === 'area-listing') {
    const { data } = result;
    return {
      title: data.title,
      description: data.metaDescription,
      alternates: { canonical: data.canonical },
      openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
    };
  }

  if (result.type === 'area-landing') {
    const { area, city } = result;
    const canonical = `${SITE_URL}/${params.citySlug}/${params.seg.join('/')}/`;
    const title = area.metaTitle || `Properties in ${area.name}, ${city?.name} — Flats, Bungalows, Plots for Sale & Rent | PRObroker`;
    const desc = area.metaDescription || `Browse verified properties in ${area.name}, ${city?.name}. Flats, bungalows, plots, offices for sale & rent. Contact owners directly on PRObroker.`;
    return { title, description: desc, alternates: { canonical }, openGraph: { title, description: desc, url: canonical } };
  }

  // society
  const { society, area, city } = result;
  const canonical = `${SITE_URL}/${params.citySlug}/${params.seg.join('/')}/`;
  const typeLabel = society.projectType === 'commercial' ? 'Commercial Properties' : 'Properties';
  const title = society.metaTitle || `${typeLabel} in ${society.name}, ${area?.name || ''} — Price, Amenities, Reviews | PRObroker`;
  const desc = society.metaDescription || `Find verified ${typeLabel.toLowerCase()} in ${society.name}, ${area?.name}, ${city?.name}. Amenities, reviews, floor plans. Contact owners directly on PRObroker.`;
  return { title, description: desc, alternates: { canonical }, openGraph: { title, description: desc, url: canonical } };
}

export default async function CitySegmentsPage({ params, searchParams }) {
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const filters = parseListingFilters(searchParams);
  const result = await resolveCitySegments(params.citySlug, params.seg, page, filters);

  if (result.type === 'notfound') {
    const path = `/${params.citySlug}/${params.seg.join('/')}/`;
    const hit = await getRedirect(path, { cache: 'no-store' }).catch(() => null);
    if (hit?.destination) permanentRedirect(hit.destination);
    notFound();
  }

  if (result.type === 'category-listing' || result.type === 'catchall-listing' || result.type === 'area-listing') {
    return <ListingView data={result.data} basePath={`/${params.citySlug}/${params.seg.join('/')}/`} />;
  }

  if (result.type === 'area-landing') {
    return <AreaLandingView area={result.area} city={result.city} />;
  }

  // society
  return (
    <SocietyDetailView
      citySlug={params.citySlug}
      areaSlug={params.seg[0]}
      society={result.society}
      area={result.area}
      city={result.city}
      properties={result.properties}
      similarSocieties={result.similarSocieties}
    />
  );
}
