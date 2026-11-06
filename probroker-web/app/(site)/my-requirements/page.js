import Link from 'next/link';
import MyRequirementsClient from '@/components/MyRequirementsClient';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'My Requirements | PRObroker',
    description: 'View the property requirements you have posted on PRObroker.',
    alternates: { canonical: `${SITE_URL}/my-requirements/` },
    robots: { index: false, follow: false },
  };
}

export default function MyRequirementsPage() {
  return (
    <div className="container-px py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Requirements</h1>
          <p className="mt-1 text-sm text-gray-500">What you’re looking for, and where each request stands.</p>
        </div>
        <Link href="/submit-requirement/" className="btn-primary !py-2.5 !px-5 text-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
          New requirement
        </Link>
      </div>
      <MyRequirementsClient />
    </div>
  );
}
