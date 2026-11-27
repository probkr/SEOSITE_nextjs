import Link from 'next/link';
import { getCities, getAreas, getTopSocieties } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export const metadata = {
  title: 'Sitemap | AllFlats',
  description: 'All AllFlats pages in one place: property for sale and rent by city, type, BHK and budget, every locality, top societies and company pages.',
  alternates: { canonical: `${SITE_URL}/sitemap/` },
};

// Human-readable sitemap. Search engines get the XML sitemaps (/sitemap.xml); this page is for
// visitors, and it also gives crawlers one plain link to every locality and listing page.
// Kept deliberately plain: headings and text links in columns.

const COMPANY = [
  ['Home', '/'],
  ['About Us', '/about/'],
  ['Contact Us', '/contact/'],
  ['Blog', '/blog/'],
  ['Societies Directory', '/societies/'],
  ['Post Property FREE', '/post-property/'],
  ['Submit Requirement', '/submit-requirement/'],
  ['Privacy Policy', '/privacy-policy/'],
  ['Terms & Conditions', '/terms/'],
];

// Slugs served by the [citySlug]/[...seg] router (see lib/citySegments.js PT_MAP).
const TYPES = [
  ['flats', 'Flats'], ['bungalows', 'Bungalows'], ['tenements', 'Tenements'], ['villas', 'Villas'],
  ['penthouses', 'Penthouses'], ['plots', 'Plots'], ['offices', 'Offices'], ['shops', 'Shops'],
  ['showrooms', 'Showrooms'], ['warehouses', 'Warehouses'],
];
const BHKS = [1, 2, 3, 4];
const BUDGETS = [
  ['flats-under-20-lakhs', '20 Lakhs'], ['flats-under-30-lakhs', '30 Lakhs'], ['flats-under-40-lakhs', '40 Lakhs'],
  ['flats-under-50-lakhs', '50 Lakhs'], ['flats-under-75-lakhs', '75 Lakhs'], ['flats-under-1-crore', '1 Crore'],
  ['flats-under-2-crore', '2 Crore'], ['flats-under-3-crore', '3 Crore'],
];

const linkCls = 'text-sm text-gray-600 hover:text-primary hover:underline underline-offset-2';

function transLinks(city, trans, word) {
  return [
    [`Residential Property for ${word}`, `/${city}/residential-property-for-${trans}/`],
    [`Commercial Property for ${word}`, `/${city}/commercial-property-for-${trans}/`],
    ...TYPES.map(([slug, label]) => [`${label} for ${word}`, `/${city}/${slug}-for-${trans}/`]),
    ...BHKS.map((n) => [`${n} BHK Flats for ${word}`, `/${city}/${n}-bhk-flats-for-${trans}/`]),
  ];
}

function Column({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className={linkCls}>{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="py-8 border-t border-gray-200 scroll-mt-[calc(var(--header-h)+1rem)]">
      <h2 className="text-xl font-bold font-heading text-gray-900 mb-6">{title}</h2>
      {children}
    </section>
  );
}

export default async function SitemapPage() {
  const cities = (await getCities({ revalidate: 3600 })) || [];
  const [areasByCity, topSocietiesRaw] = await Promise.all([
    Promise.all(cities.map((c) => getAreas({ cityId: c.id || c._id }, { revalidate: 3600 }).catch(() => []))),
    getTopSocieties({ limit: 24 }, { revalidate: 3600 }).catch(() => []),
  ]);
  // Duplicate area rows (same slug) open the same page; list each once.
  const cityAreas = cities.map((c, i) => (areasByCity[i] || []).filter((a, idx, all) => a.slug && all.findIndex((b) => b.slug === a.slug) === idx));
  const topSocieties = (Array.isArray(topSocietiesRaw) ? topSocietiesRaw : []).filter((s) => s.slug && s.citySlug && s.areaSlug);

  const jumps = [
    ['company', 'Company'],
    ...cities.map((c) => [`city-${c.slug}`, c.name]),
    ...(topSocieties.length ? [['societies', 'Top Societies']] : []),
  ];

  return (
    <div className="container-px py-10 max-w-6xl">
      <nav className="text-xs text-gray-500 mb-2">
        <Link href="/" className="hover:text-primary">Home</Link> / <span className="text-gray-700">Sitemap</span>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Sitemap</h1>
      <p className="mt-1 text-gray-500">All pages on AllFlats.</p>

      <nav aria-label="Sitemap sections" className="mt-5 mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {jumps.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="font-medium text-primary hover:underline underline-offset-2">{label}</a>
        ))}
      </nav>

      <Section id="company" title="Company">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
          {COMPANY.map(([label, href]) => (
            <li key={href}><Link href={href} className={linkCls}>{label}</Link></li>
          ))}
        </ul>
      </Section>

      {cities.map((c, i) => {
        const areas = cityAreas[i];
        return (
          <Section key={c.slug} id={`city-${c.slug}`} title={`Property in ${c.name}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Column title={`Buy in ${c.name}`} links={transLinks(c.slug, 'sale', 'Sale')} />
              <Column title={`Rent in ${c.name}`} links={transLinks(c.slug, 'rent', 'Rent')} />
              <Column title="Flats by Budget" links={BUDGETS.map(([slug, label]) => [`Flats under ₹${label}`, `/${c.slug}/${slug}/`])} />
              <Column title="Societies" links={[[`All Societies in ${c.name}`, `/societies/${c.slug}/`]]} />
            </div>

            {areas.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Localities in {c.name}</h3>
                <ul className="columns-2 sm:columns-3 lg:columns-5 gap-6">
                  {areas.map((a) => (
                    <li key={a.slug} className="break-inside-avoid py-1">
                      <Link href={`/${c.slug}/${a.slug}/`} className={linkCls}>{a.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        );
      })}

      {topSocieties.length > 0 && (
        <Section id="societies" title="Top Societies">
          <ul className="columns-1 sm:columns-2 lg:columns-4 gap-6">
            {topSocieties.map((s) => (
              <li key={s.id || s.slug} className="break-inside-avoid py-1">
                <Link href={`/${s.citySlug}/${s.areaSlug}/${s.slug}/`} className={linkCls}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
