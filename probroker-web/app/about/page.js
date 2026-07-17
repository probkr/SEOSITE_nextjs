import { getPage } from '@/lib/api';
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

export default async function StaticPage() {
  const page = (await getPage(SLUG, { revalidate: 3600 })) || {};
  const d = STATIC_PAGE_DEFAULTS[SLUG];
  const title = page.pageTitle || d.pageTitle;
  const content = page.content || d.content;
  return (
    <div className="container-px py-10 max-w-3xl">
      <JsonLd data={page.customSchema} />
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose max-w-none text-gray-700 whitespace-pre-line">{content}</div>
    </div>
  );
}
