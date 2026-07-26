'use client';

import Link from 'next/link';
import { useState } from 'react';
import LogoMark from './LogoMark';

const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
];

export default function Header({ settings } = {}) {
  const [open, setOpen] = useState(false);
  const logoUrl = settings && settings.logo_url;
  const logoWidth = (settings && settings.logo_width) || 140;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="container-px flex items-center justify-between h-16">
        <Link
          href="/"
          aria-label={`${(settings && settings.site_name) || 'PRObroker'} home`}
          className="flex items-center gap-1.5 text-2xl font-extrabold font-heading text-primary tracking-tight"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={(settings && settings.site_name) || 'PRObroker'} style={{ width: `${logoWidth}px` }} className="h-auto max-h-10 object-contain" />
          ) : (
            <>PR<LogoMark className="w-6 h-6 inline-block align-[-0.2em] mx-0.5" />broker</>
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-gray-700">
          <div className="relative group">
            <button className="py-2 flex items-center gap-1 hover:text-primary transition-colors">
              Residential
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-dropdown rounded-xl p-4 min-w-[260px] top-full left-0 border border-gray-100">
              {CITIES.map((c) => (
                <div key={c.slug} className="mb-2 last:mb-0">
                  <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">{c.name}</div>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-sale/`}>Buy Residential</Link>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-rent/`}>Rent Residential</Link>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group">
            <button className="py-2 flex items-center gap-1 hover:text-primary transition-colors">
              Commercial
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-dropdown rounded-xl p-4 min-w-[260px] top-full left-0 border border-gray-100">
              {CITIES.map((c) => (
                <div key={c.slug} className="mb-2 last:mb-0">
                  <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">{c.name}</div>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-sale/`}>Buy Commercial</Link>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-rent/`}>Rent Commercial</Link>
                </div>
              ))}
            </div>
          </div>
          <Link href="/societies/" className="hover:text-primary transition-colors">Societies</Link>
          <Link href="/blog/" className="hover:text-primary transition-colors">Blog</Link>
          <Link href="/about/" className="hover:text-primary transition-colors">About</Link>
          <Link href="/contact/" className="hover:text-primary transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/post-property/" className="btn-primary text-sm !px-4 !py-2.5 hidden sm:inline-flex">Post Property FREE</Link>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 text-sm font-semibold text-gray-700">
          {CITIES.map((c) => (
            <div key={c.slug} className="pb-2 border-b border-gray-50">
              <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">{c.name}</div>
              <Link className="block py-1" href={`/${c.slug}/residential-property-for-sale/`}>Residential Buy</Link>
              <Link className="block py-1" href={`/${c.slug}/residential-property-for-rent/`}>Residential Rent</Link>
              <Link className="block py-1" href={`/${c.slug}/commercial-property-for-sale/`}>Commercial Buy</Link>
              <Link className="block py-1" href={`/${c.slug}/commercial-property-for-rent/`}>Commercial Rent</Link>
            </div>
          ))}
          <Link href="/societies/" className="block py-1">Societies</Link>
          <Link href="/blog/" className="block py-1">Blog</Link>
          <Link href="/about/" className="block py-1">About</Link>
          <Link href="/contact/" className="block py-1">Contact</Link>
          <Link href="/post-property/" className="btn-primary w-full mt-2">Post Property FREE</Link>
        </div>
      )}
    </header>
  );
}
