import Link from 'next/link';
import { getCity, getSocieties, getAreas } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) return { title: 'City Not Found | PRObroker', robots: { index: false, follow: false } };
  const name = city.name;
  const canonical = `${SITE_URL}/societies/${params.citySlug}/`;
  return {
    title: `Societies & Projects in ${name} | PRObroker`,
    description: `Browse all residential and commercial societies and projects in ${name} on PRObroker.`,
    alternates: { canonical },
  };
}

export default async function SocietiesCityPage({ params }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) notFound();
  const [societies, areas] = await Promise.all([
    getSocieties({ cityId: city.id || city._id }, { revalidate: 3600 }),
    getAreas({ cityId: city.id || city._id }, { revalidate: 3600 }),
  ]);
  const areaMap = Object.fromEntries((areas || []).map((a) => [a.id || a._id, a]));

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-gray-900">Societies &amp; Projects in {city.name}</h1>
      {(!societies || societies.length === 0) ? (
        <p className="text-gray-500">No societies listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {societies.map((s) => {
            const area = areaMap[s.areaId];
            return (
              <Link key={s.slug} href={`/${city.slug}/${area?.slug || ''}/${s.slug}/`} className="card p-4">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-gray-500">{area?.name}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
