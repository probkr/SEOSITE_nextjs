import { permanentRedirect, notFound } from 'next/navigation';

const TRANS_MAP = { buy: 'sale', rent: 'rent' };

export default function NavCityListingRedirect({ params }) {
  const { trans, citySlug } = params;
  if (!['buy', 'rent'].includes(trans)) notFound();
  permanentRedirect(`/${citySlug}/residential-property-for-${TRANS_MAP[trans]}/`);
}
