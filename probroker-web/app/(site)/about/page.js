import Link from 'next/link';
import { getPage, getProperties, getCities, getSocietyCount } from '@/lib/api';
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

const WHAT_WE_OFFER = [
  { title: 'Verified Property Data', desc: 'We provide brokers with access to an extensive database of verified property listings.' },
  { title: 'AI-Driven Platform', desc: 'Leveraging technology, we ensure accurate, up-to-date property information.' },
  { title: 'No Middlemen', desc: 'We eliminate unnecessary brokerage and ensure direct connections between property owners and brokers.' },
  { title: 'Custom Solutions', desc: 'Designed to cater to both individual brokers and agencies.' },
];

const WHY_US = [
  { title: 'Reliable Data', desc: 'All property details are verified by our dedicated team.' },
  { title: 'User-Friendly Platform', desc: 'Easy-to-navigate interface designed for efficiency.' },
  { title: 'Transparency', desc: 'Clear and honest practices to ensure trust and credibility.' },
];

// Contact block shown on the About page, exactly as the business supplied it.
const ABOUT_CONTACT = {
  email: 'contact@allflats.in',
  phone: '+91 8141817353',
  address: 'University Road, Opp Ld college, Navrangpura 380009',
};

export default async function AboutPage() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};

  const [propResult, cities, societyCount] = await Promise.all([
    getProperties({ status: 'active', isApproved: true, limit: 1 }, { revalidate: 3600 }),
    getCities({ revalidate: 3600 }),
    getSocietyCount({}, { revalidate: 3600 }),
  ]);

  const stats = [
    { label: 'Property Listings', value: `${propResult?.total || 0}+` },
    { label: 'Societies & Projects', value: `${societyCount}+` },
    { label: 'Cities Covered', value: `${(cities || []).length}` },
    { label: 'Listing Fees', value: '₹0' },
  ];

  return (
    <div>
      <JsonLd data={page.customSchema} />

      <section className="bg-brand-hero">
        <div className="container-px py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-white">About Us</h1>
          <p className="mt-4 text-primary-100 max-w-3xl mx-auto text-lg leading-relaxed">
            Welcome to AllFlats, a product of Vocal Connect Pvt. Ltd. We are a technology-driven platform
            dedicated to simplifying property transactions by bridging the gap between property owners and
            brokers in Ahmedabad and Gandhinagar.
          </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-gray-900">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to empower brokers with reliable, verified property data while providing property
              owners with a trusted medium to connect with professionals. We aim to revolutionize the real
              estate industry by fostering transparency, efficiency, and ease of access to property information.
            </p>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-gray-900">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed">
              Vocal Connect Pvt. Ltd., the parent company of AllFlats, is committed to creating innovative
              solutions that address real-world problems. AllFlats was conceptualized to tackle the challenges
              brokers face in finding genuine property leads while ensuring property owners have a seamless way
              to list their properties.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="container-px section-py">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-8 text-gray-900 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {WHAT_WE_OFFER.map((w) => (
              <div key={w.title} className="card p-5">
                <div className="font-bold font-heading text-gray-900 mb-2">{w.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-px section-py">
        <h2 className="text-2xl md:text-3xl font-bold font-heading mb-8 text-gray-900 text-center">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {WHY_US.map((w) => (
            <div key={w.title} className="card p-5 bg-primary-50 border-primary-100">
              <div className="font-bold font-heading text-gray-900 mb-2">{w.title}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="container-px section-py text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-gray-900">Our Vision</h2>
          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
            To become the leading platform for brokers and property owners in India, enabling seamless property
            transactions and fostering growth in the real estate sector.
          </p>
          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4">
            For more information, feel free to reach out to us via our{' '}
            <Link href="/contact/" className="text-primary font-semibold hover:underline">Contact Us</Link> page.
          </p>
        </div>
      </section>

      <section className="container-px section-py">
        <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3 text-gray-900 text-center">Contact Us</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto text-center mb-8">
          We&apos;re here to help! For any inquiries, support, or feedback, feel free to reach out to us. Our team
          is dedicated to assisting you promptly and effectively.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="card p-5 text-center">
            <div className="font-semibold text-gray-900 mb-1">Email</div>
            <a href={`mailto:${ABOUT_CONTACT.email}`} className="text-sm text-gray-600 hover:text-primary break-all">{ABOUT_CONTACT.email}</a>
          </div>
          <div className="card p-5 text-center">
            <div className="font-semibold text-gray-900 mb-1">Phone</div>
            <a href={`tel:${ABOUT_CONTACT.phone.replace(/\s/g, '')}`} className="text-sm text-gray-600 hover:text-primary">{ABOUT_CONTACT.phone}</a>
          </div>
          <div className="card p-5 text-center">
            <div className="font-semibold text-gray-900 mb-1">Address</div>
            <div className="text-sm text-gray-600">{ABOUT_CONTACT.address}</div>
          </div>
        </div>
      </section>

      <section className="bg-brand-hero">
        <div className="container-px py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">Ready to find your next property?</h2>
          <p className="text-primary-100 mt-2">Browse verified listings or post yours for free in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/ahmedabad/residential-property-for-sale/" className="btn-accent">Browse Properties</Link>
            <Link href="/post-property/" className="btn-outline !bg-transparent !border-white !text-white hover:!bg-white/10">Post Property FREE</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
