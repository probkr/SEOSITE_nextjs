'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/api';
import { PhoneIcon } from './ContactActions';
import PropertyCard from './PropertyCard';

const LOGIN_HREF = '/auth/login/?next=%2Fmy-contacts%2F';
const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

function Skeleton() {
  return (
    <div className={GRID} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyContactsClient() {
  const router = useRouter();
  const [state, setState] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await clientFetch('/my-contacts', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace(LOGIN_HREF);
          return;
        }
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) throw new Error();
        if (alive) setState({ status: 'ready', items: body.properties || [] });
      } catch {
        if (alive) setState({ status: 'error', items: [] });
      }
    })();
    return () => { alive = false; };
  }, [router]);

  if (state.status === 'loading') return <Skeleton />;

  if (state.status === 'error') {
    return (
      <div className="bg-white border border-gray-200/80 rounded-2xl p-8 text-center">
        <p className="text-gray-700 font-semibold">We couldn’t load your contacts.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-outline mt-4 !py-2">Try again</button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
        <span className="mx-auto w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center">
          <PhoneIcon />
        </span>
        <h2 className="mt-4 text-lg font-bold">No contacts yet</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          When you tap Contact on a property, it’s saved here with the number so you can call back any time.
        </p>
        <Link href="/ahmedabad/residential-property-for-sale/" className="btn-primary mt-5 !py-2.5">Browse properties</Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {state.items.length} {state.items.length === 1 ? 'property' : 'properties'} contacted
      </p>
      <div className={GRID}>
        {state.items.map((p) => <PropertyCard key={p.propertyId} p={p} />)}
      </div>
    </>
  );
}
