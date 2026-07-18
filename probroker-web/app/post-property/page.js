import PostPropertyForm from '@/components/PostPropertyForm';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Post Property FREE | PRObroker',
    description: 'List your property for free on PRObroker and reach genuine buyers and tenants in Ahmedabad and Gandhinagar.',
    alternates: { canonical: `${SITE_URL}/post-property/` },
  };
}

export default function PostPropertyPage() {
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-gray-900">Post Your Property FREE</h1>
      <PostPropertyForm />
    </div>
  );
}
