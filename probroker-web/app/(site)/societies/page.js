import Link from 'next/link';
import { getCities, getSocietyCount, getTopSocieties } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { breadcrumbSchema, faqPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import CityPhoto from '@/components/CityPhoto';

export const revalidate = 3600;

const fmtCount = (n) => Number(n || 0).toLocaleString('en-IN');

export async function generateMetadata() {
  return {
    title: 'Societies & Projects in Ahmedabad & Gandhinagar | AllFlats',
    description:
      'Browse residential and commercial societies and projects in Ahmedabad and Gandhinagar. See flats for sale and rent in each society, with verified listings on AllFlats.',
    alternates: { canonical: `${SITE_URL}/societies/` },
    openGraph: {
      title: 'Societies & Projects in Ahmedabad & Gandhinagar | AllFlats',
      description: 'Find your society and see every flat for sale or rent in it.',
      url: `${SITE_URL}/societies/`,
    },
  };
}

export default async function SocietiesPage() {
  const cities = (await getCities({ revalidate: 3600 })) || [];
  // Per city: how many societies, and the ones with the most live listings (internal links).
  const withData = await Promise.all(
    cities.map(async (c) => {
      const cityId = c.id || c._id;
      const [count, top] = await Promise.all([
        getSocietyCount({ cityId }, { revalidate: 3600 }).catch(() => 0),
        getTopSocieties({ cityId, limit: 8 }, { revalidate: 3600 }).catch(() => []),
      ]);
      return { ...c, count, top: Array.isArray(top) ? top : [] };
    })
  );
  const total = withData.reduce((sum, c) => sum + (c.count || 0), 0);
  // "Ahmedabad, Gandhinagar & Pune"
  const names = withData.map((c) => c.name).filter(Boolean);
  const cityNames = names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names[0] || 'Ahmedabad & Gandhinagar';

  const faqs = [
    {
      question: `How many societies and projects are listed on AllFlats?`,
      answer: `AllFlats lists ${fmtCount(total)}+ residential and commercial societies and projects across ${cityNames}. Each society page shows the flats and offices currently for sale or rent in it.`,
    },
    {
      question: 'How do I find flats in a particular society?',
      answer: 'Pick your city below, then open the society. Its page lists every verified property for sale and rent there, with prices, area and photos.',
    },
    {
      question: 'Can I list my flat in a society for free?',
      answer: 'Yes. Posting a property on AllFlats is free. Choose your society while posting so buyers and tenants searching that society find it.',
    },
  ];

  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Societies & Projects', url: `${SITE_URL}/societies/` },
  ]);

  return (
    <div className="container-px py-6 md:py-10">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={faqPageSchema(faqs)} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span aria-hidden="true" className="text-gray-400">/</span>
        <span aria-current="page" className="text-gray-700 font-medium">Societies &amp; Projects</span>
      </nav>

      <header className="max-w-3xl mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold font-heading tracking-tight text-gray-900">
          Societies &amp; Projects in {cityNames}
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 leading-relaxed">
          Explore <strong className="text-gray-900">{fmtCount(total)}+ societies and projects</strong> across {cityNames}.
          Open a society to see every flat, bungalow and office for sale or rent in it.
        </p>
      </header>

      {/* One photo card per city */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {withData.map((c) => (
          <Link
            key={c.slug}
            href={`/societies/${c.slug}/`}
            className="group relative block aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-card hover:shadow-float transition-shadow duration-300"
          >
            <CityPhoto slug={c.slug} name={c.name} sizes="(min-width: 640px) 50vw, 100vw" priority />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 pb-8 md:pb-9">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{fmtCount(c.count)}+ societies</div>
              <h2 className="mt-0.5 text-2xl md:text-3xl font-extrabold font-heading text-white">Societies in {c.name}</h2>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 group-hover:text-white">
                Browse all
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5l5 5-5 5" /></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Most-listed societies per city: real internal links for buyers and search engines */}
      {withData.filter((c) => c.top.length > 0).map((c) => (
        <section key={c.slug} className="mt-10 md:mt-12">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-heading text-gray-900">Popular Societies in {c.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Societies with the most properties listed right now</p>
            </div>
            <Link href={`/societies/${c.slug}/`} className="shrink-0 text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {c.top.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.citySlug || c.slug}/${s.areaSlug ? `${s.areaSlug}/` : ''}${s.slug}/`}
                  className="group flex items-center gap-3 h-full p-3 rounded-xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-card transition-all"
                >
                  <span className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-gray-900 truncate group-hover:text-primary">{s.name}</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {[s.areaName, `${s.propertyCount} ${s.propertyCount === 1 ? 'property' : 'properties'}`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* FAQ (also sent as FAQPage structured data) */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl md:text-2xl font-bold font-heading text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {faqs.map((f) => (
            <details key={f.question} className="group p-4 md:p-5">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-semibold text-gray-900">
                {f.question}
                <svg className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
              </summary>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
