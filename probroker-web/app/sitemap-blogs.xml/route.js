import { getBlogPosts } from '@/lib/api';
import { buildUrlset } from '@/lib/sitemap';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export async function GET() {
  const posts = (await getBlogPosts({ revalidate: 3600 })) || [];
  const urls = posts.map((p) => [`${SITE_URL}/blog/${p.slug}/`, p.updatedAt || p.createdAt || '']);
  return new Response(buildUrlset(urls), { headers: { 'Content-Type': 'application/xml' } });
}
