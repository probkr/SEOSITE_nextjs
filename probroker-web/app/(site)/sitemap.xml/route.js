import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const name of ['pages', 'properties', 'societies', 'areas', 'blogs', 'listings']) {
    xml += `  <sitemap><loc>${SITE_URL}/sitemap-${name}.xml</loc><lastmod>${today}</lastmod></sitemap>\n`;
  }
  xml += '</sitemapindex>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
