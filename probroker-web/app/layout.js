import './globals.css';
import { SITE_URL } from '@/lib/config';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'PRObroker | Real Estate in Ahmedabad & Gandhinagar',
  description:
    'Find verified residential and commercial properties for sale and rent in Ahmedabad and Gandhinagar. Post property free on PRObroker.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
