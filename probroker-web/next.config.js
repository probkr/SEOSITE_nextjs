/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // The server build prerenders sitemaps and pages against the live API. The full society and
  // property lists can take over the default 60s while the VPS is busy building, and Next then
  // fails the whole build after 3 attempts.
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/property-for-sale/',
        destination: '/ahmedabad/residential-property-for-sale/',
        permanent: true,
      },
      {
        source: '/property-for-rent/',
        destination: '/ahmedabad/residential-property-for-rent/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
