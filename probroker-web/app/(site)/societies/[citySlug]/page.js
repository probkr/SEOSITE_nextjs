import Link from 'next/link';
import { getCity, getSocietiesPage, getAreas } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';
import PaginationLinks from '@/components/PaginationLinks';
import JsonLd from '@/components/JsonLd';
import CityPhoto from '@/components/CityPhoto';
import { breadcrumbSchema } from '@/lib/schema';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

// A city has 10k+ societies -- rendering them all on one page meant a multi-MB API call and HTML.
const PER_PAGE = 60;

const pageOf = (searchParams) => Math.max(parseInt(searchParams?.page, 10) || 1, 1);

export async function generateMetadata({ params, searchParams }) {
  const city = await getCity(params.citySlug, { revalidate: 3600 });
  if (!city) return { title: 'City Not Found | AllFlats', robots: { index: false, follow: false } };
  const name = city.name;
  const page = pageOf(searchParams);
  const base = `${SITE_URL}/societies/${params.citySlug}/`;
  // Paginated pages self-canonicalise, matching the listing pages.
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  return {
    title: `Societies & Projects in ${name}${page > 1 ? ` \u2013 Page ${page}` : ''} | AllFlats`,
    description: `Browse residential and commercial societies and projects in ${name}. See flats for sale and rent in each society, with verified listings on AllFlats.`,
    alternates: { canonical },
    openGraph: { title: `Societies & Projects in ${name} | AllFlats`, url: canonical },
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

  const total = result.total || 0;
  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Societies & Projects', url: `${SITE_URL}/societies/` },
    { name: city.name, url: `${SITE_URL}/societies/${city.slug}/` },
  ]);

  return (
    <div className="container-px py-6 md:py-8">
      <JsonLd data={breadcrumbLd} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span aria-hidden="true" className="text-gray-400">/</span>
        <Link href="/societies/" className="hover:text-primary">Societies &amp; Projects</Link>
        <span aria-hidden="true" className="text-gray-400">/</span>
        <span aria-current="page" className="text-gray-700 font-medium">{city.name}</span>
      </nav>

      {/* City photo banner with the heading on it */}
      <header className="relative h-44 md:h-60 rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-card">
        <CityPhoto slug={city.slug} name={city.name} sizes="(min-width: 1280px) 1200px, 100vw" priority />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 pb-8 md:pb-9">
          {total > 0 && (
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{total.toLocaleString('en-IN')}+ societies</div>
          )}
          <h1 className="mt-0.5 text-2xl md:text-4xl font-extrabold font-heading tracking-tight text-white">
            Societies &amp; Projects in {city.name}
          </h1>
          <p className="hidden sm:block mt-1 text-sm text-white/85 max-w-2xl">
            Find your society and see every flat, bungalow and office for sale or rent in it.
          </p>
        </div>
      </header>

      {total > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {(page - 1) * PER_PAGE + 1}&ndash;{(page - 1) * PER_PAGE + societies.length} of {total.toLocaleString('en-IN')}
        </p>
      )}
      {societies.length === 0 ? (
        <p className="text-gray-500">No societies listed yet.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
            {societies.map((s) => {
              const area = areaMap[s.areaId];
              return (
                <li key={s.slug}>
                  <Link
                    href={`/${city.slug}/${area?.slug ? `${area.slug}/` : ''}${s.slug}/`}
                    className="group flex items-center gap-3 h-full p-3 rounded-xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-card transition-all"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900 truncate group-hover:text-primary">{s.name}</span>
                      {area?.name && <span className="block text-xs text-gray-500 truncate">{area.name}, {city.name}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {result.pages > 1 && <PaginationLinks basePath={`/societies/${city.slug}/`} page={page} totalPages={result.pages} />}
        </>
      )}
    </div>
  );
}
