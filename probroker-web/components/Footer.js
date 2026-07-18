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
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a0c33] text-gray-300 mt-16">
      <div className="container-px py-14 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1 text-2xl font-extrabold font-heading text-white mb-3">
            PR<span className="text-accent">O</span>broker
          </div>
          <p className="text-gray-400 leading-relaxed">
            Verified residential &amp; commercial property listings across Ahmedabad and Gandhinagar. Talk directly to owners &mdash; zero brokerage on owner listings.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {['Facebook', 'Instagram', 'YouTube'].map((s) => (
              <span key={s} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-primary transition