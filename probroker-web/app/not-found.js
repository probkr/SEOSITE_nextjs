import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found | PRObroker',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-px py-20 text-center">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="btn-primary">Go to Homepage</Link>
    </div>
  );
}
