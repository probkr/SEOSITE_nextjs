import { adminFetchJson } from '@/lib/api';
import BlogEditForm from '@/components/admin/BlogEditForm';

export const dynamic = 'force-dynamic';

export default async function BlogEditPage({ params }) {
  let post;
  try {
    post = await adminFetchJson(`/admin/blog/edit/${params.id}`);
  } catch (e) {
    return <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">Failed to load post: {e.message}</div>;
  }
  return <BlogEditForm post={post} isNew={false} />;
}
