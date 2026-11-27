import EditPropertyClient from '@/components/EditPropertyClient';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  return {
    title: 'Edit Property | AllFlats',
    description: 'Edit your property listing on AllFlats.',
    alternates: { canonical: `${SITE_URL}/edit-property/${params.propertyId}/` },
    robots: { index: false, follow: false },
  };
}

export default function EditPropertyPage({ params }) {
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl font-bold font-heading mb-6 text-gray-900">Edit Property</h1>
      <EditPropertyClient propertyId={params.propertyId} />
    </div>
  );
}
