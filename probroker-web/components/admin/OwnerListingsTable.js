'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function OwnerListingsTable({ listings }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  async function approve(id) {
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/owner-listings/${id}/approve`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    if (!confirm('Reject?')) return;
    setBusyId(id);
    try {
      await clientFetchJson(`/admin/owner-listings/${id}/reject`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
        <tr><th className="text-left px-3.5 py-2.5">Property</th><th className="text-left px-3.5 py-2.5">Area</th><th className="text-left px-3.5 py-2.5">Price</th><th className="text-left px-3.5 py-2.5">Owner</th><th className="text-left px-3.5 py-2.5">Submitted</th><th className="text-left px-3.5 py-2.5">Actions</th></tr>
      </thead>
      <tbody>
        {listings.map((p) => (
          <tr key={p.id} className="border-t border-gray-100">
            <td className="px-3.5 py-2.5 max-w-[200px]">
              <div className="font-semibold text-gray-900">{p.bhk || ''} {p.propertyType} in {p.premiseName}</div>
              <div className="text-[11px] text-gray-400">{p.category} · {p.transactionType}</div>
            </td>
            <td className="px-3.5 py-2.5">{p.areaName}, {p.cityName}</td>
            <td className="px-3.5 py-2.5 font-bold">{formatPrice(p.price)}</td>
            <td className="px-3.5 py-2.5">
              <div>{p.contactName || 'N/A'}</div>
              <div className="text-[11px] text-gray-400">{p.contactPhone || ''}</div>
            </td>
            <td className="px-3.5 py-2.5 text-xs text-gray-400">{p.submittedAt ? String(p.submittedAt).slice(0, 10) : '-'}</td>
            <td className="px-3.5 py-2.5 whitespace-nowrap">
              <div className="flex gap-1">
                <button disabled={busyId === p.id} onClick={() => approve(p.id)} className="bg-emerald-500 text-white text-xs rounded px-2.5 py-1.5">✓ Approve</button>
                <button disabled={busyId === p.id} onClick={() => reject(p.id)} className="bg-red-500 text-white text-xs rounded px-2.5 py-1.5">✕ Reject</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
