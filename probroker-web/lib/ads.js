// In-feed ads: one ad card after every AD_EVERY property cards (admin: /admin/ads).

export const AD_EVERY = 4;

// PRObroker's shared upload service. Takes multipart field "images", answers
// { success, files: [{ url }] }. The admin browser calls it directly (it allows CORS).
export const IMAGE_UPLOAD_URL = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL
  || 'https://api.probroker.in/cjidnvij/ceksfbuebijn/user/uploadImages';

// Kinds of page an ad can be placed on. Must match PLACEMENTS in probroker-api adsController.js.
export const AD_PLACEMENTS = [
  { value: 'listing', label: 'Listing & search pages', hint: 'City / area / BHK / budget listings and /search' },
  { value: 'landing', label: 'City & area pages', hint: '/ahmedabad/, /ahmedabad/bopal/' },
  { value: 'society', label: 'Society pages', hint: 'A society’s own page' },
];

/**
 * Slot number of the ad that goes after the card at `index`, or -1 for none. No ad after the
 * last card, so a short list never ends on an ad.
 */
export function adSlotAfter(index, count) {
  const shown = index + 1;
  if (shown % AD_EVERY !== 0 || shown >= count) return -1;
  return shown / AD_EVERY - 1;
}
