import { getBlogPost, getBlogPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { formatDate } from '@/lib/format';
import JsonLd from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
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

function readTime(content) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({ params }) {
  const post = await getBlogPost(params.slug, { revalidate: 900 });
  if (!post) notFound();

  const canonical = `${SITE_URL}/blog/${params.slug}/`;
  const desc = post.metaDescription || (post.excerpt || '').slice(0, 160);
  const articleLd = articleSchema(post, canonical);
  const breadcrumbLd = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Blog', url: `${SITE_URL}/blog/` },
    { name: post.title, url: canonical },
  ]);

  const allPosts = (await getBlogPosts({ revalidate: 900 })) || [];
  const related = allPosts
    .filter((p) => p.slug !== params.slug && (!post.category || p.category === post.category))
    .slice(0, 3);
  const relatedFallback = related.length > 0 ? related : allPosts.filter((p) => p.slug !== params.slug).slice(0, 3);

  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(canonical);

  return (
    <div>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />

      <div className="container-px py-8 max-w-3xl">
        <nav className="text-xs text-gray-500 mb-4 flex flex-wrap gap-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/blog/" className="hover:text-primary">Blog</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1">{post.title}</span>
        </nav>

        {post.category && <span className="badge bg-primary-50 text-primary mb-3 capitalize">{post.category}</span>}
        <h1 className="text-2xl md:text-4xl font-bold font-heading mb-4 text-gray-900 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary font-bold flex items-center justify-center text-sm shrink-0">
            {(post.author || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-800">{post.author || 'PRObroker Team'}</div>
            <div className="flex items-center gap-1.5 text-xs">
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              {post.publishedAt && <span>&middot;</span>}
              <span>{readTime(post.content)} min read</span>
            </div>
          </div>
        </div>

        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featuredImage} alt={post.title} className="w-full h-64 md:h-96 object-cover rounded-xl mb-8 shadow-card" />
        )}

        <div className="prose max-w-none text-gray-700 mb-8 leading-relaxed text-[15px] md:text-base" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">#{t}</span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-2 mb-10 pb-8 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600 mr-1">Share:</span>
          <a
            href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
            aria-label="Share on WhatsApp"
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2z" /></svg>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
            aria-label="Share on Twitter"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 4.5a9 9 0 01-2.6.7 4.5 4.5 0 001.98-2.5 9 9 0 01-2.86 1.1 4.5 4.5 0 00-7.66 4.1A12.8 12.8 0 013 3.9a4.5 4.5 0 001.4 6 4.4 4.4 0 01-2-.56v.06a4.5 4.5 0 003.6 4.4 4.5 4.5 0 01-2 .08 4.5 4.5 0 004.2 3.1A9 9 0 012 19a12.7 12.7 0 006.9 2c8.3 0 12.8-6.9 12.8-12.8v-.6A9 9 0 0023 4.5z" /></svg>
          </a>
          <a
            href={`mailto:?subject=${shareText}&body=${shareUrl}`}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Share via Email"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </a>
        </div>

        {relatedFallback.length > 0 && (
          <div>
            <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Related Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedFallback.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}/`} className="group card overflow-hidden">
                  <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.featuredImage || '/placeholder-property.svg'} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">{r.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
