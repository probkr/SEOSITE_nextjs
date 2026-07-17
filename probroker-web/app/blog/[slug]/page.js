import { getBlogPost, getBlogPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import JsonLd from '@/components/JsonLd';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const post = await getBlogPost(params.slug, { revalidate: 900 });
  if (!post) return { title: 'Post Not Found | PRObroker', robots: { index: false, follow: false } };
  const canonical = `${SITE_URL}/blog/${params.slug}/`;
  const title = post.metaTitle || `${post.title} | PRObroker Blog`;
  const desc = post.metaDescription || (post.excerpt || '').slice(0, 160);
  return {
    title, description: desc,
    alternates: { canonical },
    openGraph: { title, description: desc, url: canonical, images: post.featuredImage ? [post.featuredImage] : undefined },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getBlogPost(params.slug, { revalidate: 900 });
  if (!post) notFound();

  const canonical = `${SITE_URL}/blog/${params.slug}/`;
  const desc = post.metaDescription || (post.excerpt || '').slice(0, 160);
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: desc,
    url: canonical,
    author: { '@type': 'Person', name: post.author || 'Admin' },
    publisher: { '@type': 'Organization', name: 'PRObroker' },
    datePublished: post.publishedAt || '',
    dateModified: post.updatedAt || '',
  };
  if (post.featuredImage) articleLd.image = post.featuredImage;

  const allPosts = (await getBlogPosts({ revalidate: 900 })) || [];
  const related = allPosts.filter((p) => p.slug !== params.slug).slice(0, 3);

  return (
    <div className="container-px py-8 max-w-3xl">
      <JsonLd data={articleLd} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.featuredImage} alt={post.title} className="w-full h-64 object-cover rounded-md mb-6" />
      )}
      <div className="prose max-w-none text-gray-700 whitespace-pre-line mb-10">{post.content}</div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">Related Posts</h2>
          <div className="flex flex-col gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}/`} className="text-primary hover:underline">{r.title}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
