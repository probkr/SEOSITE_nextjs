import MySavedClient from '@/components/MySavedClient';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'My Saved | PRObroker',
    description: 'The properties you have saved on PRObroker.',
    alternates: { canonical: `${SITE_URL}/my-saved/` },
    robots: { index: false, follow: false },
  };
}

export default function MySavedPage() {
  return (
    <div className="container-px py-8 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Saved</h1>
        <p className="mt-1 text-sm text-gray-500">Properties you’ve saved with the heart button.</p>
      </div>
      <MySavedClient />
    </div>
  );
}
