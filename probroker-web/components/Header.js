'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import LogoMark from './LogoMark';
import HeaderSearch from './HeaderSearch';
import { useWebUser, logoutWebUser } from '@/lib/webUser';
import { CITIES, CITY_EVENT, CITY_STORAGE_KEY, CONTACT_CREDITS_ENABLED } from '@/lib/config';

const postBtnCls = (onDark) =>
  `hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-lg border-2 whitespace-nowrap shrink-0 text-sm font-bold transition-colors ${
    onDark ? 'border-white text-white hover:bg-white/10' : 'border-primary text-primary hover:bg-primary-50'
  }`;
const freeBadgeCls = 'text-[10px] font-extrabold uppercase tracking-wider bg-accent text-gray-900 px-1.5 py-0.5 rounded';

const chevron = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
);

// Close a popover on outside click or Escape.
function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) close();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close]);
}

const PROFILE_LINKS = [
  { href: '/my-properties/', label: 'My Properties', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '/my-requirements/', label: 'My Requirements', icon: 'M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z' },
  ...(CONTACT_CREDITS_ENABLED ? [{ href: '/my-contacts/', label: 'My Contacts', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' }] : []),
  { href: '/post-property/', label: 'Post Property', icon: 'M12 4v16m8-8H4' },
  { href: '/contact/', label: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const userIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

// Live contact-credit balance. Get Contact pushes the new number through useWebUser, so this
// drops as soon as a credit is spent, without a reload.
function CreditsBadge({ credits, onDark }) {
  const label = `${credits} free ${credits === 1 ? 'credit' : 'credits'} left`;
  const tone = credits === 0
    ? 'border-red-200 bg-red-50 text-red-600'
    : onDark ? 'border-white/30 bg-white/10 text-white' : 'border-primary-100 bg-primary-50 text-primary';
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-full border whitespace-nowrap shrink-0 text-sm font-bold ${tone}`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9M9.5 9.75c0-1 1.1-1.75 2.5-1.75s2.5.75 2.5 1.75-1.1 1.75-2.5 2.25-2.5 1.25-2.5 2.25S10.6 16 12 16s2.5-.75 2.5-1.75" /></svg>
      {credits}
      <span className="hidden sm:inline">{credits === 1 ? 'credit' : 'credits'}</span>
    </span>
  );
}

function ProfileMenu({ onDark }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const user = useWebUser();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(boxRef, open, close);

  // Navigating away should never leave the menu hanging open.
  useEffect(close, [pathname, close]);

  // Send people back to the page they were on after logging in.
  const nextQs = pathname && pathname !== '/' && !pathname.startsWith('/auth') ? `?next=${encodeURIComponent(pathname)}` : '';

  async function logout() {
    close();
    await logoutWebUser();
    router.refresh();
  }

  return (
    <div ref={boxRef} className="relative flex items-center gap-2">
      {CONTACT_CREDITS_ENABLED && user && user.freeCredits !== undefined && <CreditsBadge credits={user.freeCredits} onDark={onDark} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center gap-1 h-10 pl-1 pr-1 sm:pr-2 rounded-full border transition-colors ${
          onDark
            ? 'text-white border-white/30 bg-white/10 hover:bg-white/20'
            : 'text-gray-700 border-gray-200 bg-white/60 hover:border-primary hover:text-primary'
        }`}
      >
        {user ? (
          <span className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white text-xs font-bold">
            {initialsOf(user.name)}
          </span>
        ) : (
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${onDark ? 'bg-white/20' : 'bg-primary-50 text-primary'}`}>
            {userIcon}
          </span>
        )}
        <span className={`hidden sm:inline transition-transform ${open ? 'rotate-180' : ''}`}>{chevron}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-dropdown border border-gray-100 py-2 z-50">
          <div className="px-4 pt-2 pb-3 border-b border-gray-100">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {initialsOf(user.name)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">Hello, {user.name.split(' ')[0]}</div>
                  <div className="text-xs text-gray-500 truncate">+91 {user.phone}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">{userIcon}</span>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Hello, Guest</div>
                    <div className="text-xs text-gray-500">Manage your listings</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Link href={`/auth/login/${nextQs}`} role="menuitem" className="flex items-center justify-center h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors">
                    Log in
                  </Link>
                  <Link href={`/auth/signup/${nextQs}`} role="menuitem" className="flex items-center justify-center h-10 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary-50 transition-colors">
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
          <ul className="pt-1">
            {PROFILE_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={l.icon} /></svg>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {user && (
            <div className="mt-1 pt-1 border-t border-gray-100">
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CityPicker({ onDark }) {
  const [city, setCity] = useState(CITIES[0].slug);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(boxRef, open, close);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITY_STORAGE_KEY);
      if (saved && CITIES.some((c) => c.slug === saved)) setCity(saved);
    } catch {}
  }, []);

  function choose(slug) {
    setCity(slug);
    setOpen(false);
    try { localStorage.setItem(CITY_STORAGE_KEY, slug); } catch {}
    window.dispatchEvent(new CustomEvent(CITY_EVENT, { detail: slug }));
  }

  const current = CITIES.find((c) => c.slug === city) || CITIES[0];

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Selected city: ${current.name}. Change city`}
        className={`flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-semibold border transition-colors ${
          onDark
            ? 'text-white border-white/30 bg-white/10 hover:bg-white/20'
            : 'text-gray-700 border-gray-200 bg-white/60 hover:border-primary hover:text-primary'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {current.name}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>{chevron}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choose city"
          className="absolute left-0 top-full mt-2 min-w-[200px] bg-white rounded-xl shadow-dropdown border border-gray-100 py-2 z-50"
        >
          <li className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-400 font-bold">Select City</li>
          {CITIES.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                role="option"
                aria-selected={c.slug === city}
                onClick={() => choose(c.slug)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-primary-50 hover:text-primary ${
                  c.slug === city ? 'text-primary font-semibold' : 'text-gray-700'
                }`}
              >
                {c.name}
                {c.slug === city && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header({ settings } = {}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  // The homepage has its own hero search, and auth pages should stay free of distractions.
  const withSearch = !isHome && !pathname.startsWith('/auth');
  const logoUrl = settings && settings.logo_url;
  const logoWidth = (settings && settings.logo_width) || 140;
  const headerRef = useRef(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDismiss(headerRef, open, closeMenu);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On the homepage the header floats over the hero photo, so use light text until the user scrolls.
  const onDark = isHome && !scrolled && !open;
  const navHover = onDark ? 'hover:text-accent' : 'hover:text-primary';

  return (
    <header
      ref={headerRef}
      className={`site-header sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
        onDark ? 'bg-white/5 border-b border-white/10' : 'bg-white/70 border-b border-gray-200/60 shadow-sm'
      }`}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href="/"
            aria-label={`${(settings && settings.site_name) || 'PRObroker'} home`}
            className={`flex items-center gap-1 sm:gap-1.5 text-xl sm:text-2xl font-extrabold font-heading tracking-tight transition-colors ${
              onDark ? 'text-white' : 'text-primary'
            }`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={(settings && settings.site_name) || 'PRObroker'} style={{ width: `${logoWidth}px` }} className="h-auto max-h-10 max-w-[120px] sm:max-w-none object-contain" />
            ) : (
              <>PR<LogoMark className="w-5 h-5 sm:w-6 sm:h-6 inline-block align-[-0.2em] mx-0.5" />broker</>
            )}
          </Link>
          {/* No room beside the credits on a phone, so it moves into the mobile menu below sm. */}
          <div className="hidden sm:block"><CityPicker onDark={onDark} /></div>
        </div>

        {withSearch && (
          <div className="hidden lg:block flex-1 min-w-0 max-w-xl mx-4 xl:mx-6">
            <HeaderSearch />
          </div>
        )}

        {/* Pages with the search box keep these links in the menu instead, so the header stays clean. */}
        <nav className={`hidden ${withSearch ? '' : 'xl:flex'} items-center gap-7 text-sm font-semibold transition-colors ${onDark ? 'text-white' : 'text-gray-700'}`}>
          <div className="relative group">
            <button className={`py-2 flex items-center gap-1 transition-colors ${navHover}`}>
              Residential
              {chevron}
            </button>
            <div className="absolute hidden group-hover:block bg-white text-gray-700 shadow-dropdown rounded-xl p-4 min-w-[260px] top-full left-0 border border-gray-100">
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
            <button className={`py-2 flex items-center gap-1 transition-colors ${navHover}`}>
              Commercial
              {chevron}
            </button>
            <div className="absolute hidden group-hover:block bg-white text-gray-700 shadow-dropdown rounded-xl p-4 min-w-[260px] top-full left-0 border border-gray-100">
              {CITIES.map((c) => (
                <div key={c.slug} className="mb-2 last:mb-0">
                  <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">{c.name}</div>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-sale/`}>Buy Commercial</Link>
                  <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-rent/`}>Rent Commercial</Link>
                </div>
              ))}
            </div>
          </div>
          <Link href="/societies/" className={`transition-colors ${navHover}`}>Societies</Link>
          <Link href="/blog/" className={`transition-colors ${navHover}`}>Blog</Link>
          <Link href="/about/" className={`transition-colors ${navHover}`}>About</Link>
          <Link href="/contact/" className={`transition-colors ${navHover}`}>Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/post-property/" className={postBtnCls(onDark)}>
            Post Property <span className={freeBadgeCls}>Free</span>
          </Link>
          <ProfileMenu onDark={onDark} />
          <button
            className={`${withSearch ? '' : 'xl:hidden'} p-2 rounded-md ${onDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className={`w-6 h-6 ${onDark ? 'text-white' : 'text-gray-700'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {withSearch && (
        <div className="header-search-row lg:hidden px-4 pb-3">
          <HeaderSearch />
        </div>
      )}

      {open && (
        <div className={`${withSearch ? '' : 'xl:hidden'} border-t border-gray-100 bg-white px-4 py-4 space-y-3 text-sm font-semibold text-gray-700 lg:absolute lg:right-4 lg:top-full lg:mt-2 lg:w-[26rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:rounded-xl lg:border lg:shadow-dropdown`}>
          <div className="sm:hidden"><CityPicker onDark={false} /></div>
          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
            {CITIES.map((c) => (
              <div key={c.slug} className="pb-2 border-b border-gray-50">
                <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">{c.name}</div>
                <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-sale/`}>Residential Buy</Link>
                <Link className="block py-1 hover:text-primary" href={`/${c.slug}/residential-property-for-rent/`}>Residential Rent</Link>
                <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-sale/`}>Commercial Buy</Link>
                <Link className="block py-1 hover:text-primary" href={`/${c.slug}/commercial-property-for-rent/`}>Commercial Rent</Link>
              </div>
            ))}
          </div>
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
            <Link href="/societies/" className="block py-1 hover:text-primary">Societies</Link>
            <Link href="/blog/" className="block py-1 hover:text-primary">Blog</Link>
            <Link href="/about/" className="block py-1 hover:text-primary">About</Link>
            <Link href="/contact/" className="block py-1 hover:text-primary">Contact</Link>
          </div>
          {/* The header shows this button from md up, so the menu only needs it on phones. */}
          <Link href="/post-property/" className={`${postBtnCls(false)} !flex md:!hidden w-full justify-center mt-2`}>
            Post Property <span className={freeBadgeCls}>Free</span>
          </Link>
        </div>
      )}
    </header>
  );
}
