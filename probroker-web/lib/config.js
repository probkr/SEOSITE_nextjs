export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://prbroker.in';

export const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
];
// Keeps the header city and every search box in sync.
export const CITY_STORAGE_KEY = 'pb_city';
export const CITY_EVENT = 'pb:city-change';

// Paid "Get Contact" with credits. Off by default: visitors use the inquiry form instead.
export const CONTACT_CREDITS_ENABLED = process.env.NEXT_PUBLIC_CONTACT_CREDITS === 'true';

// TODO: replace with PRObroker's real business contact details (update via env vars, no code change needed).
export const CONTACT_INFO = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 90000 00000',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@prbroker.in',
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || 'Ahmedabad, Gujarat, India',
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '',
};
