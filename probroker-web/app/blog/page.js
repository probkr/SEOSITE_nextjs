import Link from 'next/link';
import { getBlogPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

export const revalidate = 900;

export async function generateMetadata() {
  return {
    title: 'Real Estate Blog — Tips, Guides & Market Insights | PRObroker',
    description: 'Read expert articles on real estate buying, selling, renting, investment tips, market trends, and property guides on PRObroker Blog.',
    alternates: { canonical: `${SITE_URL}/blog/` },
  };
}

export default async function BlogListPage() {
  const posts = (await getBlogPosts({ revalidate: 900 })) || [];
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">PRObroker Blog</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No blog posts published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}/`} className="card overflow-hidden">
              {p.featuredImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.featuredImage} alt={p.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="font-semibold mb-1">{p.title}</div>
                <div className="text-sm text-gray-500 line-clamp-2">{p.excerpt}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
