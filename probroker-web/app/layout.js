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
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-lg focus:shadow-float"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
