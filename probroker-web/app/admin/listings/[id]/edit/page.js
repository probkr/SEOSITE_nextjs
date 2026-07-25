import { adminFetchJson } from '@/lib/api';
import PropertyEditForm from '@/components/admin/PropertyEditForm';

export const dynamic = 'force-dynamic';

export default async function PropertyEditPage({ params }) {
  const { id } = params;
  let property, cities, areas, societies;
  try {
    [property, cities, areas, societies] = await Promise.all([
      adminFetchJson(`/admin/listings/${id}/edit`),
      adminFetchJson('/admin/cities?all=1'),
      adminFetchJson('/admin/areas?all=1'),
      adminFetchJson('/admin/societies?all=1')
    ]);
  } catch (e) {
    return <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">Failed to load property: {e.message}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <a href="/admin/listings" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">← Back to Listings</a>
        <a href={`/property/${property.slug || property.propertyId}`} target="_blank" rel="noreferrer" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">View Live ↗</a>
      </div>
      <PropertyEditForm
        property={property.property || property}
        cities={cities.cities || cities || []}
        areas={areas.areas || areas || []}
        societies={societies.societies || societies || []}
      />
    </div>
  );
}
