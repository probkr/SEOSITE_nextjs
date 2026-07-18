'use client';

import Link from 'next/link';
import { useState } from 'react';

const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="container-px flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-1.5 text-2xl font-extrabold font-heading text-primary tracking-tight">
          PR<span className="text-accent">O</span>broker
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
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 0