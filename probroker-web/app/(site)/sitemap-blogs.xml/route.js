import { getBlogPosts } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const result = await getBlogPosts({ revalidate: 3600 });
  const posts = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
  const urls = posts.map((p) => [`${SITE_URL}/blog/${p.slug}/`, p.updatedAt || p.createdAt || '']);
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
