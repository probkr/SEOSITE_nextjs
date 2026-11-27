import MyContactsClient from '@/components/MyContactsClient';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'My Contacts | AllFlats',
    description: 'The properties you have taken the contact number of on AllFlats.',
    alternates: { canonical: `${SITE_URL}/my-contacts/` },
    robots: { index: false, follow: false },
  };
}

export default function MyContactsPage() {
  return (
    <div className="container-px py-8 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Contacts</h1>
        <p className="mt-1 text-sm text-gray-500">Properties you’ve taken the contact of, with their numbers.</p>
      </div>
      <MyContactsClient />
    </div>
  );
}
