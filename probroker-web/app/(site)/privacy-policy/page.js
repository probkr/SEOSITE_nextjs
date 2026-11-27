import { getPage } from '@/lib/api';
import { STATIC_PAGE_DEFAULTS } from '@/lib/staticPages';
import { SITE_URL } from '@/lib/config';
import JsonLd from '@/components/JsonLd';
import LegalDocument from '@/components/LegalDocument';
import { PRIVACY_POLICY } from '@/lib/legal/privacyPolicy';

export const revalidate = 3600;

const SLUG = 'privacy-policy';

export async function generateMetadata() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const canonical = `${SITE_URL}/privacy-policy/`;
  return {
    title: page.metaTitle || d.metaTitle,
    description: page.metaDescription || d.metaDescription,
    alternates: { canonical },
  };
}

export default async function StaticPage() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const title = page.pageTitle || d.pageTitle;
  return (
    <div className="container-px py-10 max-w-3xl">
      <JsonLd data={page.customSchema} />
      <h1 className="text-3xl font-bold font-heading mb-2 text-gray-900">{title}</h1>
      <LegalDocument doc={PRIVACY_POLICY} />
    </div>
  );
}
