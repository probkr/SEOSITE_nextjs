'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetchJson } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import Badge from '@/components/admin/Badge';

const STATUS_BADGE = { active: 'green', pending: 'yellow', sold: 'gray', rented: 'gray' };
const SOURCE_BADGE = { import: 'blue', owner: 'yellow', probroker: 'purple' };

export default function ListingsTable({ listings }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  async function toggleStatus(p) {
    const newStatus = p.status === 'active' ? 'sold' : 'active';
    if (p.status === 'active' && !confirm('Mark as sold?')) return;
    setBusyId(p.propertyId);
    try {
      await clientFetchJson(`/admin/properties/${p.propertyId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteListing(p) {
    if (!confirm('Delete this property?')) return;
    setBusyId(p.propertyId);
    try {
      await clientFetchJson(`/admin/properties/${p.propertyId}`, { method: 'DELETE' });
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
        <tr>
          <th className="text-left px-3.5 py-2.5">Property</th>
          <th className="text-left px-3.5 py-2.5">Area</th>
          <th className="text-left px-3.5 py-2.5">Price</th>
          <th className="text-left px-3.5 py-2.5">Type</th>
          <th className="text-left px-3.5 py-2.5">Status</th>
          <th className="text-left px-3.5 py-2.5">Source</th>
          <th className="text-left px-3.5 py-2.5">Date</th>
          <th className="text-left px-3.5 py-2.5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {listings.map((p) => (
          <tr key={p.propertyId} className="border-t border-gray-100">
            <td className="px-3.5 py-2.5 max-w-[220px]">
              <div className="font-semibold text-gray-900 truncate">{p.bhk || ''} {p.propertyType} in {p.premiseName}</div>
              <div className="text-[11px] text-gray-400">{p.propertyId}</div>
            </td>
            <td className="px-3.5 py-2.5">
              <div>{p.areaName}</div>
              <div className="text-[11px] text-gray-400">{p.cityName}</div>
            </td>
            <td className="px-3.5 py-2.5 font-bold whitespace-nowrap">{formatPrice(p.price)}</td>
            <td className="px-3.5 py-2.5">
              <Badge color="purple">{p.category || 'residential'}</Badge>
              {p.bhk ? <Badge color="gray">{p.bhk}BHK</Badge> : null}
            </td>
            <td className="px-3.5 py-2.5"><Badge color={STATUS_BADGE[p.status] || 'gray'}>{p.status}</Badge></td>
            <td className="px-3.5 py-2.5"><Badge color={SOURCE_BADGE[p.source] || 'purple'}>{p.source || 'probroker'}</Badge></td>
            <td className="px-3.5 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
            <td className="px-3.5 py-2.5 whitespace-nowrap">
              <div className="flex gap-1">
                <a href={`/admin/listings/${p.propertyId}/edit`} className="bg-primary text-white text-xs rounded px-2.5 py-1.5">Edit</a>
                <a href={`/property/${p.slug || p.propertyId}`} target="_blank" rel="noreferrer" className="border border-gray-200 text-xs rounded px-2.5 py-1.5">View</a>
                <button disabled={busyId === p.propertyId} onClick={() => toggleStatus(p)} className="border border-gray-200 text-xs rounded px-2.5 py-1.5">
                  {p.status === 'active' ? 'Sold' : 'Activate'}
                </button>
                <button disabled={busyId === p.propertyId} onClick={() => deleteListing(p)} className="bg-red-500 text-white text-xs rounded px-2.5 py-1.5">✕</button>
              </div>
            </td>
          </tr>
        ))}
        {listings.length === 0 && (
          <tr><td colSpan={8} className="text-center py-10 text-gray-400">No properties found</td></tr>
        )}
      </tbody>
    </table>
  );
}
