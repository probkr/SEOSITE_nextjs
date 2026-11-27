export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allflats.in';

export const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
  { slug: 'pune', name: 'Pune' }, // city id ccc3cebd-7bdc-4947-bde4-58bed55bb2e1
];
// Keeps the header city and every search box in sync.
export const CITY_STORAGE_KEY = 'pb_city';
export const CITY_EVENT = 'pb:city-change';


// TODO: replace with AllFlats' real business contact details (update via env vars, no code change needed).
export const CONTACT_INFO = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 81418 17353',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@allflats.in',
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || 'Ahmedabad, Gujarat, India',
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '',
};
