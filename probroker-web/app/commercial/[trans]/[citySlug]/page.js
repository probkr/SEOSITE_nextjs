import { fetchListingData } from '@/lib/listing';
import ListingView from '@/components/ListingView';
import { notFound } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';
const CATEGORY = 'commercial';
const TRANS_MAP = { buy: 'sale', rent: 'rent' };

export async function generateMetadata({ params }) {
  const { trans, citySlug } = params;
  if (!['buy', 'rent'].includes(trans)) return { robots: { index: false, follow: false } };
  const data = await fetchListingData({ citySlug, category: CATEGORY, trans: TRANS_MAP[trans] });
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: { canonical: data.canonical },
    openGraph: { title: data.title, description: data.metaDescription, url: data.canonical },
  };
}

export default async function NavCityListingPage({ params, searchParams }) {
  const { trans, citySlug } = params;
  if (!['buy', 'rent'].includes(trans)) notFound();
  const page = parseInt(searchParams?.page || '1', 10) || 1;
  const data = await fetchListingData({ citySlug, category: CATEGORY, trans: TRANS_MAP[trans], page });
  return <ListingView data={data} basePath={`/${CATEGORY}/${trans}/${citySlug}/`} />;
}
