import Link from 'next/link';
import { getPage, getProperties, getCities, getSocieties } from '@/lib/api';
import { STATIC_PAGE_DEFAULTS } from '@/lib/staticPages';
import { SITE_URL } from '@/lib/config';
import JsonLd from '@/components/JsonLd';

export const revalidate = 3600;

const SLUG = 'about';

export async function generateMetadata() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const canonical = `${SITE_URL}/about/`;
  return {
    title: page.metaTitle || d.metaTitle,
    description: page.metaDescription || d.metaDescription,
    alternates: { canonical },
  };
}

const WHY_US = [
  { title: 'Zero Brokerage', desc: 'List and browse owner properties directly — no middlemen, no hidden commission.' },
  { title: 'Verified Listings', desc: 'Every property is reviewed by our team before it goes live, so you deal with genuine listings.' },
  { title: 'Local Expertise', desc: 'We focus only on Ahmedabad and Gandhinagar, so our data on localities and pricing runs deep.' },
  { title: 'Direct Owner Contact', desc: 'Talk straight to the property owner — faster answers, no games.' },
];

export default async function AboutPage() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const content = page.content || d.content;

  const [propResult, cities, societies] = await Promise.all([
    getProperties({ status: 'active', isApproved: true, limit: 1 }, { revalidate: 3600 }),
    getCities({ revalidate: 3600 }),
    getSocieties({}, { revalidate: 3600 }),
  ]);

  const stats = [
    { label: 'Property Listings', value: `${propResult?.total || 0}+` },
    { label: 'Societies & Projects', value: `${(societies || []).length}+` },
    { label: 'Cities Covered', value: `${(cities || []).length}` },
    { label: 'Brokerage Charged', value: '₹0' },
  ];

  return (
    <div>
      <JsonLd data={page.customSchema} />

      <section className="bg-brand-hero">
        <div className="container-px py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-white">About PRObroker</h1>
          <p className="mt-4 text-primary-100 max-w-2xl mx-auto text-lg leading-relaxed">{content}</p>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="container-px py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold font-heading text-primary">{s.value}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px section-py">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-gray-900">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              PRObroker was built to make finding and listing property in Ahmedabad and Gandhinagar simple,
              transparent, and free of unnecessary brokerage. We connect owners directly with genuine buyers
              and tenants, backed by a team that manually verifies every listing before it goes live.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Whether you&apos;re searching for your first flat, upgrading to a bigger home, or renting out a
              commercial space, our goal is the same: get you accurate information and a direct line to the
              other side of the deal — fast.
            </p>
          </div>
          <div className="card p-8 bg-primary-50 border-primary-100">
            <h3 className="font-bold font-heading text-lg text-gray-900 mb-3">What we cover</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"/> Residential &amp; commercial sale</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"/> Residential &amp; commercial rent</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"/> Society &amp; project directory</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"/> Owner &amp; broker listings</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="container-px section-py">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-8 text-gray-900 text-center">Why Choose PRObroker</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {WHY_US.map((w) => (
              <div key={w.title} className="card p-5">
                <div className="font-bold font-heading text-gray-900 mb-2">{w.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-hero">
        <div className="container-px py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">Ready to find your next property?</h2>
          <p className="text-primary-100 mt-2">Browse verified listings or post yours for free in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/ahmedabad/residential-property-for-sale/" className="btn-accent">Browse Properties</Link>
            <Link href="/post-property/" className="btn-outline !border-white !text-white hover:!bg-white/10">Post Property FREE</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
