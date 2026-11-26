import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-static';

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my-properties/
Disallow: /my-contacts/
Disallow: /search/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
