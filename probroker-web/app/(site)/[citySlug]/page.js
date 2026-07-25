import { getCity, getRedirect } from '@/lib/api';
import CityLandingView from '@/components/CityLandingView';
import { SITE_URL } from '@/lib/config';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) return { robots: { index: false, follow: false } };

  const canonical = `${SITE_URL}/${params.citySlug}/`;
  const title = `Properties in ${city.name} — Flats, Bungalows, Plots for Sale & Rent | PRObroker`;
  const desc = `Browse verified residential and commercial properties in ${city.name}. Flats, bungalows, plots, offices for sale & rent. Contact owners directly on PRObroker.`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical },
  };
}

export default async function CitySlugPage({ params }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });

  if (!city) {
    const path = `/${params.citySlug}/`;
    const hit = await getRedirect(path, { cache: 'no-store' }).catch(() => null);
    if (hit?.destination) permanentRedirect(hit.destination);
    notFound();
  }

  return <CityLandingView city={city} />;
}
