export const dynamic = 'force-static';

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my-properties/
Disallow: /search/

Sitemap: https://prbroker.in/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
