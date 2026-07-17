import { fetchListingData } from '@/lib/listing';
import ListingView from '@/components/ListingView';
import { SITE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { citySlug, category, trans } = params;
  if (!['residential', 'commercial'].includes(category) || !['sale', 'rent'].includes(trans)) {
    return { robots: { index: false, follow: false } };
  }
  const data = await fetchListingData({ citySlug, category, trans });
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: { canonical: data.canonical },
    openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
  };
}

export default async function CityListingPage({ params, searchParams }) {
  const { citySlug, category, trans } = params;
  if (!['residential', 'commercial'].includes(category) || !['sale', 'rent'].includes(trans)) {
    notFound();
  }
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const data = await fetchListingData({ citySlug, category, trans, page });
  return <ListingView data={data} basePath={`/${citySlug}/${category}-property-for-${trans}/`} />;
}
