import MyPropertiesClient from '@/components/MyPropertiesClient';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'My Properties | PRObroker',
    description: 'Manage your property listings on PRObroker.',
    alternates: { canonical: `${SITE_URL}/my-properties/` },
    robots: { index: false, follow: false },
  };
}

export default function MyPropertiesPage() {
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl font-bold font-heading mb-6 text-gray-900">My Properties</h1>
      <MyPropertiesClient />
    </div>
  );
}
