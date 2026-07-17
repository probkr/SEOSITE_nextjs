import Link from 'next/link';

const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
];

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container-px flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-primary">PRObroker</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <div className="relative group">
            <button className="py-2">Residential</button>
            <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-3 min-w-[240px] top-full left-0">
              {CITIES.map((c) => (
                <div key={c.slug}>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-sale/`}>Residential Sale in {c.name}</Link>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-rent/`}>Residential Rent in {c.name}</Link>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group">
            <button className="py-2">Commercial</button>
            <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-md p-3 min-w-[240px] top-full left-0">
              {CITIES.map((c) => (
                <div key={c.slug}>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-sale/`}>Commercial Sale in {c.name}</Link>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-rent/`}>Commercial Rent in {c.name}</Link>
                </div>
              ))}
            </div>
          </div>
          <Link href="/societies/" className="hover:text-primary">Societies</Link>
          <Link href="/blog/" className="hover:text-primary">Blog</Link>
          <Link href="/about/" className="hover:text-primary">About</Link>
          <Link href="/contact/" className="hover:text-primary">Contact</Link>
        </nav>
        <Link href="/post-property/" className="btn-primary text-sm">Post Property FREE</Link>
      </div>
    </header>
  );
}
