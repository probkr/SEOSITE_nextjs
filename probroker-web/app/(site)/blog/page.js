import Link from 'next/link';
import { getBlogPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { formatDate } from '@/lib/format';

export const revalidate = 900;

export async function generateMetadata() {
  return {
    title: 'Real Estate Blog — Tips, Guides & Market Insights | PRObroker',
    description: 'Read expert articles on real estate buying, selling, renting, investment tips, market trends, and property guides on PRObroker Blog.',
    alternates: { canonical: `${SITE_URL}/blog/` },
  };
}

function readTime(content) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogListPage({ searchParams }) {
  const allPosts = (await getBlogPosts({ revalidate: 900 })) || [];
  const activeCategory = searchParams?.category || '';

  const categories = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];
  const posts = activeCategory ? allPosts.filter((p) => p.category === activeCategory) : allPosts;
  const [featured, ...rest] = posts;

  return (
    <div>
      <section className="bg-brand-hero">
        <div className="container-px py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-white">PRObroker Blog</h1>
          <p className="mt-3 text-primary-100 max-w-xl mx-auto">Real estate guides, market insights, and tips for buyers, sellers &amp; tenants in Ahmedabad &amp; Gandhinagar.</p>
        </div>
      </section>

      <div className="container-px py-8">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/blog/"
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${!activeCategory ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/blog/?category=${encodeURIComponent(c)}`}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${activeCategory === c ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-gray-500">No blog posts published yet.</p>
        ) : (
          <>
            {/* Featured post */}
            <Link href={`/blog/${featured.slug}/`} className="group card overflow-hidden flex flex-col md:flex-row mb-8">
              <div className="md:w-1/2 aspect-[16/9] md:aspect-auto bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.featuredImage || '/placeholder-property.svg'}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                {featured.category && <span className="badge bg-primary-50 text-primary w-fit mb-3 capitalize">{featured.category}</span>}
                <h2 className="text-xl md:text-2xl font-bold font-heading text-gray-900 mb-2 group-hover:text-primary transition-colors">{featured.title}</h2>
                <p className="text-gray-600 line-clamp-3 mb-4">{featured.excerpt}</p>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{featured.author || 'PRObroker Team'}</span>
                  {featured.publishedAt && <><span>&middot;</span><span>{formatDate(featured.publishedAt)}</span></>}
                  <span>&middot;</span><span>{readTime(featured.content)} min read</span>
                </div>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rest.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}/`} className="group card overflow-hidden flex flex-col">
                    <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.featuredImage || '/placeholder-property.svg'}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      {p.category && <span className="badge bg-primary-50 text-primary w-fit mb-2 capitalize">{p.category}</span>}
                      <div className="font-semibold mb-1 text-gray-900 line-clamp-2">{p.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{p.excerpt}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 pt-2 border-t border-gray-100">
                        <span>{p.author || 'PRObroker Team'}</span>
                        <span>&middot;</span>
                        <span>{readTime(p.content)} min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
