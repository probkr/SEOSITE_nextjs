import { permanentRedirect, notFound } from 'next/navigation';

const TRANS_MAP = { buy: 'sale', rent: 'rent' };

export default function NavAreaListingRedirect({ params }) {
  const { trans, citySlug, areaSlug } = params;
  if (!['buy', 'rent'].includes(trans)) notFound();
  permanentRedirect(`/${citySlug}/${areaSlug}/commercial-property-for-${TRANS_MAP[trans]}/`);
}
