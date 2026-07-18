export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://prbroker.in';

// TODO: replace with PRObroker's real business contact details (update via env vars, no code change needed).
export const CONTACT_INFO = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 90000 00000',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@prbroker.in',
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || 'Ahmedabad, Gujarat, India',
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '',
};
