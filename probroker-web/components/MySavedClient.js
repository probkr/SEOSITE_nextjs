'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientFetchJson } from '@/lib/api';
import PropertyCard from './PropertyCard';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

// The heart button (CardActions) keeps saved ids in this browser, so the list is read from here
// and only the listing details come from the API.
function readSavedIds() {
  try {
    const ids = JSON.parse(localStorage.getItem('pb_saved_properties') || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export default function MySavedClient() {
  const [state, setState] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let alive = true;
    const ids = readSavedIds();
    if (!ids.length) {
      setState({ status: 'ready', items: [] });
      return undefined;
    }
    clientFetchJson('/properties/saved', { method: 'POST', body: { ids }, cache: 'no-store' })
      .then((res) => { if (alive) setState({ status: 'ready', items: res.properties || [] }); })
      .catch(() => { if (alive) setState({ status: 'error', items: [] }); });
    return () => { alive = false; };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className={GRID} aria-hidden="true">
        {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="bg-white border border-gray-200/80 rounded-2xl p-8 text-center">
        <p className="text-gray-700 font-semibold">We couldn’t load your saved properties.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-outline mt-4 !py-2">Try again</button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
        <h2 className="text-lg font-bold">No saved properties yet</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          Tap the heart on any property to save it. Your saved properties will show up here.
        </p>
        <Link href="/ahmedabad/residential-property-for-sale/" className="btn-primary mt-5 !py-2.5">Browse properties</Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {state.items.length} saved {state.items.length === 1 ? 'property' : 'properties'}
      </p>
      <div className={GRID}>
        {state.items.map((p) => <PropertyCard key={p.propertyId} p={p} />)}
      </div>
    </>
  );
}
