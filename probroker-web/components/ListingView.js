import Link from 'next/link';
import PropertyCard from './PropertyCard';
import JsonLd from './JsonLd';
import { itemListSchema, breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/config';

export default function ListingView({ data, basePath }) {
  const { h1, properties, total, page, totalPages, popularAreas, societies, area, city } = data;

  const itemListLd = itemListSchema(properties, SITE_URL);
  const breadcrumbItems = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (city?.slug) breadcrumbItems.push({ name: city.name, url: `${SITE_URL}/${city.slug}/` });
  if (area?.slug && city?.slug) breadcrumbItems.push({ name: area.name, url: `${SITE_URL}/${city.slug}/${area.slug}/` });
  breadcrumbItems.push({ name: h1, url: `${SITE_URL}${basePath}` });
  const breadcrumbLd = breadcrumbSchema(breadcrumbItems);

  return (
    <div className="container-px py-8">
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

      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-gray-900">{h1}</h1>
      <p className="text-gray-500 mb-6">{total} propert{total === 1 ? 'y' : 'ies'} found</p>

      {area?.description && (
        <p className="text-gray-600 mb-6 max-w-3xl leading-relaxed">{area.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block space-y-6">
          {popularAreas?.length > 0 && (
            <div className="card p-4">
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
            <div className="card p-4">
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
          <div className="card p-4 bg-primary-50 border-primary-100">
            <div className="font-semibold text-gray-900 mb-1 text-sm">Have a property?<