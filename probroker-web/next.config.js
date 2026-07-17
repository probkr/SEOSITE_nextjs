/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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

modul