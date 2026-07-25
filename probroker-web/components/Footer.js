import Link from 'next/link';
import LogoMark from './LogoMark';

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
    ],
  },
];

export default function Footer({ settings } = {}) {
  const logoUrl = settings && settings.logo_url;
  const logoWidth = (settings && settings.logo_width) || 140;
  return (
    <footer className="bg-[#1a0c33] text-gray-300 mt-16">
      <div className="container-px py-14 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1 text-2xl font-extrabold font-heading text-white mb-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={(settings && settings.site_name) || 'PRObroker'} style={{ width: `${logoWidth}px` }} className="h-auto max-h-10 object-contain" />
            ) : (
              <>PR<LogoMark className="w-6 h-6 inline-block align-[-0.2em] mx-0.5" />broker</>
            )}
          </div>
          <p className="text-gray-400 leading-relaxed">
            Verified residential &amp; commercial property listings across Ahmedabad and Gandhinagar. Talk directly to owners &mdash; zero brokerage on owner listings.
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
        &copy; {new Date().getFullYear()} PRObroker &middot; Ahmedabad &amp; Gandhinagar Real Estate
      </div>
    </footer>
  );
}
