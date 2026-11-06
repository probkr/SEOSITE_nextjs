'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/api';
import { fmtPrice } from '@/lib/format';

const LOGIN_HREF = '/auth/login/?next=%2Fmy-requirements%2F';

const TYPE_CHIP = {
  buy: { label: 'Buy', cls: 'bg-primary-50 text-primary' },
  rent: { label: 'Rent', cls: 'bg-accent-50 text-accent-600' },
};

const STATUS_CHIP = {
  new: { label: 'Received', cls: 'bg-blue-50 text-blue-700' },
  contacted: { label: 'Contacted', cls: 'bg-amber-50 text-amber-700' },
  matched: { label: 'Matched', cls: 'bg-green-50 text-green-700' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-600' },
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function titleOf(r) {
  const what = [r.bhk && `${r.bhk} BHK`, cap(r.property_type) || 'Property'].filter(Boolean).join(' ');
  const where = [r.area, cap(r.city)].filter(Boolean).join(', ');
  return where ? `${what} in ${where}` : what;
}

function budgetOf(r) {
  const min = Number(r.budget_min) || 0;
  const max = Number(r.budget_max) || 0;
  const suffix = r.type === 'rent' ? '/mo' : '';
  if (min && max) return `${fmtPrice(min)} – ${fmtPrice(max)}${suffix}`;
  if (max) return `Up to ${fmtPrice(max)}${suffix}`;
  if (min) return `From ${fmtPrice(min)}${suffix}`;
  return 'Budget not specified';
}

function dateOf(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RequirementCard({ r }) {
  const type = TYPE_CHIP[r.type] || { label: cap(r.type) || 'Requirement', cls: 'bg-gray-100 text-gray-700' };
  const status = STATUS_CHIP[r.status] || { label: cap(r.status) || 'Received', cls: 'bg-gray-100 text-gray-600' };
  return (
    <li className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`badge ${type.cls}`}>{type.label}</span>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>
      <h2 className="text-base font-bold text-gray-900 leading-snug">{titleOf(r)}</h2>
      <p className="mt-1 text-[15px] font-semibold text-primary">{budgetOf(r)}</p>
      {r.notes && <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{r.notes}</p>}
      {dateOf(r.createdAt) && (
        <p className="mt-auto pt-4 text-xs text-gray-400">Posted on {dateOf(r.createdAt)}</p>
      )}
    </li>
  );
}

function Skeleton() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between"><div className="h-6 w-14 bg-gray-100 rounded-full animate-pulse" /><div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" /></div>
          <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

export default function MyRequirementsClient() {
  const router = useRouter();
  const [state, setState] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await clientFetch('/my-requirements', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace(LOGIN_HREF);
          return;
        }
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) throw new Error();
        if (alive) setState({ status: 'ready', items: body.requirements || [] });
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
        <p className="text-gray-700 font-semibold">We couldn’t load your requirements.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-outline mt-4 !py-2">Try again</button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
        <span className="mx-auto w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </span>
        <h2 className="mt-4 text-lg font-bold">No requirements yet</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          Tell us what you’re looking for and we’ll match you with the right properties. Requirements posted with your registered mobile number show up here.
        </p>
        <Link href="/submit-requirement/" className="btn-primary mt-5 !py-2.5">Post a requirement</Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {state.items.length} requirement{state.items.length === 1 ? '' : 's'} posted with your mobile number
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.items.map((r) => <RequirementCard key={r.id} r={r} />)}
      </ul>
    </>
  );
}
