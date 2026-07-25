import Link from 'next/link';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';
import ListingFilters from './ListingFilters';
import LeadCaptureCard from './LeadCaptureCard';
import PaginationLinks from './PaginationLinks';
import { itemListSchema, breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/config';

export default function ListingView({ data, basePath }) {
  const { h1, properties, total, page, totalPages, popularAreas, societies, area, city, activeFilters } = data;

  const itemListLd = itemListSchema(properties, SITE_URL);
  const breadcrumbItems = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (city?.slug) breadcrumbItems.push({ name: city.name, url: `${SITE_URL}/${city.slug}/` });
  if (area?.slug && city?.slug) breadcrumbItems.push({ name: area.name, url: `${SITE_URL}/${city.slug}/${area.slug}/` });
  breadcrumbItems.push({ name: h1, url: `${SITE_URL}${basePath}` });
  const breadcrumbLd = breadcrumbSchema(breadcrumbItems);

  return (
    <div className="container-px py-5">
      <JsonLd data={itemListLd} />
      <JsonLd data={breadcrumbLd} />

      <nav className="text-xs text-gray-500 mb-3 flex flex-wrap gap-1">
        {breadcrumbItems.map((b, i) => (
          <span key={b.url} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            <span className={i === breadcrumbItems.length - 1 ? 'text-gray-700 font-medium' : ''}>{b.name}</span>
          </span>
        ))}
      </nav>

      <h1 className="text-xl md:text-2xl font-bold font-heading mb-2 text-gray-900">{h1}</h1>

      {area?.description && (
        <p className="text-gray-600 mb-6 max-w-3xl leading-relaxed">{area.description}</p>
      )}

      {/* Filters: full-width horizontal bar above the listing, Housing.com-style */}
      <div className="mb-5">
        <ListingFilters
            activeFilters={activeFilters}
            resultCount={total}
            areas={popularAreas || []}
            showAreaFilter={!area}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main column: property cards */}
        <div>
          {properties.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082M9.75 3.104a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">No properties match these filters yet</p>
              <p className="text-sm text-gray-500">Try clearing a filter or check back soon — new listings are added daily.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mb-8">
              {properties.map((p) => (
                <PropertyCard key={p.propertyId || p.slug} p={p} variant="row" />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <PaginationLinks basePath={basePath} page={page} totalPages={totalPages} />
          )}

          {/* Societies / Popular areas — mobile only here; shown in the sidebar on desktop instead */}
          <div className="lg:hidden space-y-6 mt-8">
            {societies?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold font-heading mb-3">Societies{area?.name ? ` in ${area.name}` : ''}</h2>
                <div className="flex flex-wrap gap-2">
                  {societies.map((s) => (
                    <Link key={s.slug} href={`/${city?.slug}/${area?.slug}/${s.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-primary-100 hover:text-primary">
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {popularAreas?.length > 0 && !area && (
              <div>
                <h2 className="text-lg font-bold font-heading mb-3">Popular Areas in {city?.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {popularAreas.map((a) => (
                    <Link key={a.slug} href={`/${city?.slug}/${a.slug}/`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-primary-100 hover:text-primary">
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: lead capture, promotional CTA, quick links — Housing.com-style */}
        <aside className="space-y-6">
          <div className="lg:sticky lg:top-20 space-y-6">
            <LeadCaptureCard context={h1} />

            <div className="card p-4 bg-primary-50 border-primary-100">
              <div className="font-semibold text-gray-900 mb-1 text-sm">Have a property?</div>
              <p className="text-xs text-gray-600 mb-3">List it free and reach verified buyers.</p>
              <Link href="/post-property/" className="btn-primary w-full text-sm !py-2">Post Property FREE</Link>
            </div>

            {popularAreas?.length > 0 && (
              <div className="hidden lg:block card p-4">
                <div className="font-semibold text-gray-900 mb-2 text-sm">Popular Areas{city?.name ? ` in ${city.name}` : ''}</div>
                <div className="flex flex-col gap-1">
                  {popularAreas.slice(0, 12).map((a) => (
                    <Link key={a.slug} href={`/${city?.slug}/${a.slug}/`} className="text-sm text-gray-600 hover:text-primary py-0.5">
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {societies?.length > 0 && (
              <div className="hidden lg:block card p-4">
                <div className="font-semibold text-gray-900 mb-2 text-sm">Societies{area?.name ? ` in ${area.name}` : ''}</div>
                <div className="flex flex-col gap-1">
                  {societies.slice(0, 12).map((s) => (
                    <Link key={s.slug} href={`/${city?.slug}/${area?.slug}/${s.slug}/`} className="text-sm text-gray-600 hover:text-primary py-0.5">
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
