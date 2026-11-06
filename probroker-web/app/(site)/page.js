import Link from 'next/link';
import Image from 'next/image';
import { getCities, getProperties, getAreas, getTopSocieties, getTopAreas } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import PropertyCard from '@/components/PropertyCard';
import JsonLd from '@/components/JsonLd';
import HomeSearchWidget from '@/components/HomeSearchWidget';
import { organizationSchema, websiteSchema } from '@/lib/schema';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'PRObroker | Buy, Sell & Rent Properties in Ahmedabad & Gandhinagar',
    description: 'Search verified residential and commercial properties for sale and rent in Ahmedabad and Gandhinagar. Post your property free on PRObroker.',
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: {
      title: 'PRObroker | Real Estate in Ahmedabad & Gandhinagar',
      description: 'Search verified residential and commercial properties for sale and rent.',
      url: `${SITE_URL}/`,
    },
  };
}

const HERO_POINTS = (total) => [
  total ? `${total.toLocaleString('en-IN')}+ Verified Properties` : 'Verified Properties',
  'Free to List',
  'Owners & Trusted Brokers',
  'Ahmedabad & Gandhinagar',
];

const TRUST_BADGES = [
  { label: 'Verified Listings', sub: 'Every property checked', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Free to List', sub: 'No listing fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-18v6m0 12v6m0-4c-1.11 0-2.08-.402-2.599-1' },
  { label: 'Quick Responses', sub: 'Hear back fast', icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zM12 14v7m-7-7 7 7 7-7M5 21h14' },
  { label: 'Ahmedabad & Gandhinagar', sub: 'Local expertise', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z' },
];

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=450&q=70`;

const PROPERTY_TYPES = [
  { label: 'Flats', sub: '1–4 BHK apartments', slug: 'flats', trans: 'sale', group: 'res', img: unsplash('1545324418-cc1a3fa10c00') },
  { label: 'Bungalows', sub: 'Independent homes', slug: 'bungalows', trans: 'sale', group: 'res', img: unsplash('1570129477492-45c003edd2be') },
  { label: 'Tenements', sub: 'Row houses', slug: 'tenements', trans: 'sale', group: 'res', img: unsplash('1628624747186-a941c476b7ef') },
  { label: 'Villas', sub: 'Premium gated homes', slug: 'villas', trans: 'sale', group: 'res', img: unsplash('1613490493576-7fde63acd811') },
  { label: 'Plots', sub: 'Residential land', slug: 'plots', trans: 'sale', group: 'res', img: unsplash('1500382017468-9049fed747ef') },
  { label: 'Offices', sub: 'Workspaces & IT parks', slug: 'offices', trans: 'sale', group: 'com', img: unsplash('1497366216548-37526070297c') },
  { label: 'Shops', sub: 'Retail & showrooms', slug: 'shops', trans: 'sale', group: 'com', img: unsplash('1441986300917-64674bd600d8') },
  { label: 'Warehouses', sub: 'Storage & godowns', slug: 'warehouses', trans: 'sale', group: 'com', img: unsplash('1553413077-190dd305871c') },
];

// Residential = brand purple, commercial = amber, so the two groups are distinguishable at a glance.
const GROUP_CHIP = {
  res: { label: 'Residential', cls: 'bg-primary text-white' },
  com: { label: 'Commercial', cls: 'bg-accent text-gray-900' },
};

const WHY_FEATURES = [
  {
    title: 'Verified Listings',
    text: 'Every property is checked for authenticity before it goes live.',
    icon: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  },
  {
    title: 'Local City Experts',
    text: 'Deep local knowledge across Ahmedabad & Gandhinagar.',
    icon: <><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></>,
  },
  {
    title: 'Fast Response',
    text: 'Get connected to interested buyers and tenants quickly.',
    icon: <path d="M13 3L4 14h7l-1 7 9-11h-7z" />,
  },
  {
    title: 'Trusted by Thousands',
    text: 'Buyers, tenants, and owners across the city trust PRObroker.',
    icon: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0" /><path d="M16 5.5a3 3 0 010 5M18 14a5 5 0 013 6" /></>,
  },
];

// Same testimonials as the live prbroker.in homepage.
const TESTIMONIALS = [
  { quote: 'Found our dream 3BHK within two weeks. The listings were genuine and the owner was easy to reach, no broker hassle at all.', name: 'Priya Shah', initials: 'PS', role: 'Homebuyer, Bopal' },
  { quote: 'Listed my flat for free and got serious inquiries within days. PROBroker made renting out my property effortless.', name: 'Ketan Patel', initials: 'KP', role: 'Property Owner, Gandhinagar' },
  { quote: 'Searching for a rental used to be so tedious. The verified listings saved us so much time and stress.', name: 'Ravi & Neha Joshi', initials: 'RJ', role: 'Tenants, Chandkheda' },
  { quote: 'Transparent pricing and real photos, exactly what we needed while comparing properties online.', name: 'Anjali Mehta', initials: 'AM', role: 'Homebuyer, Gandhinagar' },
];

const POST_STEPS = [
  { title: 'Post for Free', text: 'Add your property details in minutes' },
  { title: 'Get Verified', text: 'Our team reviews and approves your listing' },
  { title: 'Receive Inquiries', text: 'Connect directly with interested buyers & tenants' },
];

// The landmark each city is known for. Photos live in /public/images/cities and come from
// Wikimedia Commons; CC BY-SA ones must keep their credit visible on the card.
const CITY_LANDMARKS = {
  ahmedabad: { place: 'Atal Bridge, Sabarmati Riverfront', img: '/images/cities/ahmedabad.jpg' },
  gandhinagar: {
    place: 'Akshardham Temple',
    img: '/images/cities/gandhinagar.jpg',
    credit: { by: 'Harsh4101991', license: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Akshardham_Gandhinagar_Gujarat.jpg' },
  },
  pune: {
    place: 'Shaniwar Wada',
    img: '/images/cities/pune.jpg',
    credit: { by: 'Aakash.gautam', license: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:The_entrance_of_Shaniwar_Wada..JPG' },
  },
};

export default async function HomePage() {
  const [cities, latest, totalStats, allAreas, topSocietiesRaw, topAreasRaw] = await Promise.all([
    getCities({ revalidate: 3600 }),
    getProperties({ status: 'active', isApproved: true, hasPhotos: true, limit: 8, sort: '-createdAt' }, { revalidate: 300 }),
    getProperties({ status: 'active', isApproved: true, limit: 1 }, { revalidate: 300 }),
    getAreas({}, { revalidate: 3600 }),
    getTopSocieties({ limit: 8 }, { revalidate: 3600 }).catch(() => []),
    getTopAreas({ limit: 10 }, { revalidate: 3600 }).catch(() => []),
  ]);
  const topSocieties = Array.isArray(topSocietiesRaw) ? topSocietiesRaw : [];
  const topAreas = Array.isArray(topAreasRaw) ? topAreasRaw : [];
  const properties = latest?.data || [];
  const totalListings = totalStats?.total || 0;
  const cityNames = (cities || []).map((c) => c.name);
  const whyStats = [
    { value: totalListings ? `${totalListings.toLocaleString('en-IN')}+` : '2,000+', label: 'Verified Listings' },
    { value: '₹0', label: 'Free to List Your Property' },
    { value: String(cityNames.length || 2), label: `Cities: ${cityNames.length ? cityNames.join(', ') : 'Ahmedabad & Gandhinagar'}` },
  ];

  const orgLd = organizationSchema();
  const websiteLd = websiteSchema();

  return (
    <div>
      <JsonLd data={orgLd} />
      <JsonLd data={websiteLd} />

      {/* Hero */}
      {/* -mt-16 pulls the hero under the sticky h-16 header so its blur shows over the photo.
          No overflow-hidden here: the search widget's locality dropdown must hang below the hero. */}
      <section
        className="relative -mt-16 pt-16 bg-gray-900 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70')" }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/65" />
        <div className="container-px relative py-16 md:py-24 text-center">

          <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-white tracking-tight leading-[1.05]">
            Find your next home,<br className="hidden md:block" /> <span className="text-accent">faster than you&apos;d think.</span>
          </h1>
          <ul className="mt-5 flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-gray-100 text-base md:text-lg font-medium">
            {HERO_POINTS(totalListings).map((pt, i) => (
              <li key={pt} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="text-accent">&bull;</span>}
                {pt}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <HomeSearchWidget cities={cities} areas={allAreas || []} />
          </div>

          </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-gray-100 bg-white">
        <div className="container-px py-8 grid grid-cols-2 md:grid-cols-4 gap-5">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={b.icon} /></svg>
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{b.label}</div>
                <div className="text-xs text-gray-500">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by property type */}
      <section className="container-px section-py">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Browse by Property Type</h2>
            <p className="mt-1 text-sm text-gray-500">Homes, land and commercial spaces across Ahmedabad</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Residential</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Commercial</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 md:gap-3">
          {PROPERTY_TYPES.map((t) => {
            const chip = GROUP_CHIP[t.group];
            return (
              <Link
                key={t.slug}
                href={`/ahmedabad/${t.slug}-for-${t.trans}/`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-gray-200 shadow-card hover:shadow-float transition-shadow duration-300"
              >
                <Image
                  src={t.img}
                  alt={`${t.label} for sale in Ahmedabad`}
                  fill
                  sizes="(min-width: 1024px) 13vw, (min-width: 640px) 25vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <span className={`absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${chip.cls}`}>
                  {chip.label}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold font-heading text-white text-sm leading-tight">{t.label}</div>
                    <div className="mt-0.5 text-[11px] text-gray-200 truncate hidden sm:block">{t.sub}</div>
                  </div>
                  <span className="hidden w-8 h-8 shrink-0 rounded-full bg-white/20 backdrop-blur text-white items-center justify-center transition-colors group-hover:bg-white group-hover:text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Explore by city */}
      <section className="container-px section-py">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Explore by City</h2>
          <p className="mt-1 text-sm text-gray-500">Pick a city to see homes for sale and rent</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {(cities || []).map((c) => {
            const lm = CITY_LANDMARKS[c.slug];
            return (
              <div key={c.slug} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-float transition-shadow duration-300">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                  {lm ? (
                    <Image
                      src={lm.img}
                      alt={`${lm.place}, ${c.name}`}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold font-heading text-primary/20">
                      {c.name?.charAt(0)}
                    </span>
                  )}
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Link href={`/${c.slug}`} aria-label={`Properties in ${c.name}`} className="absolute inset-0" />
                  {lm && (
                    <span className="pointer-events-none absolute left-2.5 bottom-2 right-2.5 flex items-center gap-1 text-[11px] font-semibold text-white truncate">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {lm.place}
                    </span>
                  )}
                  {lm?.credit && (
                    <a
                      href={lm.credit.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="absolute right-2 top-1.5 text-[9px] text-white/80 hover:text-white drop-shadow"
                    >
                      Photo: {lm.credit.by} / {lm.credit.license}
                    </a>
                  )}
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base font-heading text-gray-900 leading-tight">
                      <Link href={`/${c.slug}`} className="hover:text-primary transition-colors">{c.name}</Link>
                    </h3>
                    <div className="text-xs text-gray-500">{c.state}</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
                    <Link href={`/${c.slug}/residential-property-for-sale/`} className="px-2 py-1 rounded-md text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors">Buy</Link>
                    <span aria-hidden="true" className="text-gray-300">|</span>
                    <Link href={`/${c.slug}/residential-property-for-rent/`} className="px-2 py-1 rounded-md text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors">Rent</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest properties */}
      <section className="container-px section-py">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Latest Properties</h2>
          <Link href="/ahmedabad/residential-property-for-sale/" className="text-primary font-semibold text-sm hover:underline">View all &rarr;</Link>
        </div>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties available right now. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.propertyId || p.slug} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Why PRObroker */}
      <section className="container-px section-py">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">
              Why Choose <span className="text-primary">PRObroker</span>
            </h2>
            <p className="mt-2 text-gray-500">Everything you need for a hassle-free property search</p>

            <dl className="mt-6 grid grid-cols-3 divide-x divide-gray-200 rounded-2xl bg-white border border-gray-100 shadow-card py-4">
              {whyStats.map((s) => (
                <div key={s.label} className="px-3 md:px-4 text-center">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-xl md:text-2xl font-extrabold font-heading text-primary">{s.value}</dd>
                  <dd className="mt-0.5 text-[11px] md:text-xs text-gray-500 leading-snug">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WHY_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-card hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">{f.icon}</svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] text-gray-900 leading-tight">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-snug">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Societies */}
      <section className="container-px section-py">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Top Societies</h2>
            <p className="mt-1 text-sm text-gray-500">Popular societies with the most active listings</p>
          </div>
          <Link href="/societies/" className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {topSocieties.length > 0 && (
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topSocieties.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.citySlug && s.areaSlug ? `/${s.citySlug}/${s.areaSlug}/${s.slug}` : '/societies/'}
                  className="group flex items-start gap-3 p-4 h-full bg-white rounded-2xl border border-gray-100 shadow-card hover:border-primary/30 hover:shadow-float transition-all duration-200"
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 21h18" /><path d="M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16" /><path d="M15 9h3a1 1 0 011 1v11" /><path d="M8.5 8h3M8.5 12h3M8.5 16h3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[15px] text-gray-900 leading-tight truncate group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {[s.areaName, s.cityName].filter(Boolean).join(', ')}
                    </p>
                    <span className="inline-block mt-2.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold">
                      {s.propertyCount} Properties
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Top areas */}
      {topAreas.length > 0 && (
        <section className="container-px section-py">
          <div className="rounded-3xl bg-primary-50/40 px-5 py-8 md:px-10 md:py-10">
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">Top Areas</h2>
            <p className="mt-1 text-gray-500">Localities with the most properties available right now</p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-6 md:gap-x-8">
              {topAreas.map((a) => (
                <li key={a.id}>
                  <Link href={`/${a.citySlug || 'ahmedabad'}/${a.slug}`} className="group flex flex-col items-center gap-2.5 w-20 md:w-24">
                    <span className="w-[72px] h-[72px] rounded-full bg-white border border-gray-100 shadow-card flex items-center justify-center text-lg font-extrabold font-heading text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                      {a.propertyCount}
                    </span>
                    <span className="text-sm text-gray-700 text-center leading-tight group-hover:text-primary transition-colors">{a.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="container-px section-py">
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">What Our Customers Say</h2>
        <p className="mt-1 text-gray-500">Hear from buyers, tenants, and owners who found what they were looking for</p>
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col p-6 bg-white rounded-2xl border border-gray-100 shadow-card">
              <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((n) => (
                  <svg key={n} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" /></svg>
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] text-gray-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="w-11 h-11 shrink-0 rounded-full bg-primary-50 text-primary font-bold text-sm flex items-center justify-center">
                  {t.initials}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-gray-900 leading-tight">{t.name}</span>
                  <span className="block mt-0.5 text-sm text-gray-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="container-px py-14 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">Have a Property to Sell or Rent?</h2>
          <p className="text-primary-100 mt-2">List it on PRObroker for free and reach thousands of verified buyers and tenants.</p>

          <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-3xl mx-auto">
            {POST_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm px-5 py-6">
                <span className="mx-auto w-10 h-10 rounded-full bg-white/20 text-white font-bold flex items-center justify-center">{i + 1}</span>
                <h3 className="mt-4 font-bold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm text-primary-100 leading-snug">{step.text}</p>
              </li>
            ))}
          </ol>

          <Link href="/post-property/" className="btn-accent inline-flex mt-10 !px-7">Post Property FREE</Link>
        </div>
      </section>
    </div>
  );
}
