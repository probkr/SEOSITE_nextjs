import { getPage } from '@/lib/api';
import { STATIC_PAGE_DEFAULTS } from '@/lib/staticPages';
import { SITE_URL, CONTACT_INFO } from '@/lib/config';
import JsonLd from '@/components/JsonLd';
import ContactForm from '@/components/ContactForm';

export const revalidate = 3600;

const SLUG = 'contact';

export async function generateMetadata() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const canonical = `${SITE_URL}/contact/`;
  return {
    title: page.metaTitle || d.metaTitle,
    description: page.metaDescription || d.metaDescription,
    alternates: { canonical },
  };
}

export default async function ContactPage() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const content = page.content || d.content;

  return (
    <div>
      <JsonLd data={page.customSchema} />

      <section className="bg-brand-hero">
        <div className="container-px py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-white">Contact Us</h1>
          <p className="mt-3 text-primary-100 max-w-xl mx-auto">{content}</p>
        </div>
      </section>

      <section className="container-px section-py">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Call Us</div>
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-sm text-gray-600 hover:text-primary">{CONTACT_INFO.phone}</a>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Email Us</div>
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-sm text-gray-600 hover:text-primary">{CONTACT_INFO.email}</a>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Office</div>
                <div className="text-sm text-gray-600">{CONTACT_INFO.address}</div>
              </div>
            </div>
            <div className="card p-5 bg-primary-50 border-primary-100">
              <div className="font-semibold text-gray-900 mb-1">Business Hours</div>
              <div className="text-sm text-gray-600">Mon &ndash; Sat: 10:00 AM &ndash; 7:00 PM</div>
              <div className="text-sm text-gray-600">Sunday: Closed</div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
