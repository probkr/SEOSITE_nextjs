import Link from 'next/link';
import { getCities, getSocieties } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: 'Societies & Projects in Ahmedabad & Gandhinagar | PRObroker',
    description: 'Browse all residential and commercial societies and projects in Ahmedabad and Gandhinagar on PRObroker.',
    alternates: { canonical: `${SITE_URL}/societies/` },
  };
}

export default async function SocietiesPage() {
  const cities = (await getCities({ revalidate: 3600 })) || [];
  const withCounts = await Promise.all(
    cities.map(async (c) => {
      const socs = (await getSocieties({ cityId: c.id || c._id }, { revalidate: 3600 })) || [];
      return { ...c, count: socs.length };
    })
  );

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-gray-900">Societies &amp; Projects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {withCounts.map((c) => (
          <Link key={c.slug} href={`/societies/${c.slug}/`} className="card p-5 flex items-center justify-between">
            <div className="font-semibold text-lg">{c.name}</div>
            <div className="text-sm text-gray-500">{c.count} societies</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
