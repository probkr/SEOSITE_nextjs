import Link from 'next/link';
import { getCity, getSocietiesPage, getAreas } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';
import PaginationLinks from '@/components/PaginationLinks';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

// A city has 10k+ societies -- rendering them all on one page meant a multi-MB API call and HTML.
const PER_PAGE = 60;

const pageOf = (searchParams) => Math.max(parseInt(searchParams?.page, 10) || 1, 1);

export async function generateMetadata({ params, searchParams }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) return { title: 'City Not Found | PRObroker', robots: { index: false, follow: false } };
  const name = city.name;
  const page = pageOf(searchParams);
  const base = `${SITE_URL}/societies/${params.citySlug}/`;
  // Paginated pages self-canonicalise, matching the listing pages.
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  return {
    title: `Societies & Projects in ${name}${page > 1 ? ` \u2013 Page ${page}` : ''} | PRObroker`,
    description: `Browse all residential and commercial societies and projects in ${name} on PRObroker.`,
    alternates: { canonical },
  };
}

export default async function SocietiesCityPage({ params, searchParams }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) notFound();
  const page = pageOf(searchParams);
  const [result, areas] = await Promise.all([
    getSocietiesPage({ cityId: city.id || city._id, fields: 'name,slug,areaId', limit: PER_PAGE, page }, { revalidate: 3600 }),
    getAreas({ cityId: city.id || city._id }, { revalidate: 3600 }),
  ]);
  const societies = result.data || [];
  const areaMap = Object.fromEntries((areas || []).map((a) => [a.id || a._id, a]));
  if (page > 1 && societies.length === 0) notFound();

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">Societies &amp; Projects in {city.name}</h1>
      {result.total > 0 && (
        <p className="text-sm text-gray-500 mb-6">
          Showing {(page - 1) * PER_PAGE + 1}&ndash;{(page - 1) * PER_PAGE + societies.length} of {result.total.toLocaleString('en-IN')}
        </p>
      )}
      {societies.length === 0 ? (
        <p className="text-gray-500">No societies listed yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
          {result.pages > 1 && <PaginationLinks basePath={`/societies/${city.slug}/`} page={page} totalPages={result.pages} />}
        </>
      )}
    </div>
  );
}
