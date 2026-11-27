import Link from 'next/link';

const COLS = [
  {
    title: 'Buy in Ahmedabad',
    links: [
      ['Flats for Sale', '/ahmedabad/flats-for-sale/'],
      ['Bungalows for Sale', '/ahmedabad/bungalows-for-sale/'],
      ['Shops for Sale', '/ahmedabad/shops-for-sale/'],
      ['2 BHK Flats', '/ahmedabad/2-bhk-flats-for-sale/'],
      ['3 BHK Flats', '/ahmedabad/3-bhk-flats-for-sale/'],
      ['Residential Property', '/ahmedabad/residential-property-for-sale/'],
      ['Commercial Property', '/ahmedabad/commercial-property-for-sale/'],
    ],
  },
  {
    title: 'Rent in Ahmedabad',
    links: [
      ['Flats for Rent', '/ahmedabad/flats-for-rent/'],
      ['Offices for Rent', '/ahmedabad/offices-for-rent/'],
      ['Shops for Rent', '/ahmedabad/shops-for-rent/'],
      ['1 BHK for Rent', '/ahmedabad/1-bhk-flats-for-rent/'],
      ['2 BHK for Rent', '/ahmedabad/2-bhk-flats-for-rent/'],
      ['Residential Property', '/ahmedabad/residential-property-for-rent/'],
      ['Commercial Property', '/ahmedabad/commercial-property-for-rent/'],
    ],
  },
  {
    title: 'Gandhinagar',
    links: [
      ['Residential for Sale', '/gandhinagar/residential-property-for-sale/'],
      ['Residential for Rent', '/gandhinagar/residential-property-for-rent/'],
      ['Commercial for Sale', '/gandhinagar/commercial-property-for-sale/'],
      ['Commercial for Rent', '/gandhinagar/commercial-property-for-rent/'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about/'],
      ['Contact Us', '/contact/'],
      ['Blog', '/blog/'],
      ['Societies Directory', '/societies/'],
      ['Post Property FREE', '/post-property/'],
      ['Submit Requirement', '/submit-requirement/'],
      ['Privacy Policy', '/privacy-policy/'],
      ['Terms & Conditions', '/terms/'],
      ['Sitemap', '/sitemap/'],
    ],
  },
];

export default function Footer({ settings } = {}) {
  return (
    <footer className="bg-primary-900 text-gray-300 mt-16">
      <div className="container-px py-14 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1 text-2xl font-extrabold font-heading text-white mb-3">
            {/* White-text version of the AllFlats logo for the navy footer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/allflats-logo-light.png" alt="AllFlats" width={495} height={128} loading="lazy" className="h-10 w-auto" />
          </div>
          <p className="text-gray-400 leading-relaxed">
            Verified residential &amp; commercial property listings across Ahmedabad, Gandhinagar and India&apos;s Tier 1 cities. Connect with owners and trusted brokers in one place.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {['Facebook', 'Instagram', 'YouTube'].map((s) => (
              <span key={s} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-primary transition-colors cursor-pointer">
                {s[0]}
              </span>
            ))}
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <div className="text-white font-semibold mb-3">{col.title}</div>
            {col.links.map(([label, href]) => (
              <Link key={href} className="block py-1 hover:text-accent transition-colors" href={href}>{label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} AllFlats &middot; Ahmedabad &amp; Gandhinagar Real Estate
        <div className="mt-1">A product of Vocal Connect PVT LTD</div>
      </div>
    </footer>
  );
}
