'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SESSION_ENDED_EVENT } from '@/lib/webUser';

const TITLES = {
  SESSION_REPLACED: 'Signed in on another device',
  SESSION_EXPIRED: 'Session expired',
  BLOCKED: 'Account disabled',
};

// Explains why the user was just logged out (useWebUser fires the event).
export default function SessionEndedNotice() {
  const [notice, setNotice] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const onEnded = (e) => setNotice(e.detail);
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
  }, []);

  if (!notice) return null;

  const onAuthPage = pathname.startsWith('/auth/');
  const loginHref = `/auth/login/${onAuthPage ? '' : `?next=${encodeURIComponent(pathname)}`}`;

  return (
    <div
      role="alert"
      className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] bg-white rounded-2xl border border-gray-200 shadow-[0_20px_40px_-12px_rgba(17,12,46,0.3)] p-4"
    >
      <div className="flex gap-3">
        <span className="w-10 h-10 shrink-0 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path strokeLinecap="round" d="M11 18h2" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{TITLES[notice.code] || 'You were logged out'}</p>
          <p className="mt-0.5 text-[13px] text-gray-600 leading-snug">{notice.message}</p>
          {notice.code !== 'BLOCKED' && !onAuthPage && (
            <Link
              href={loginHref}
              onClick={() => setNotice(null)}
              className="inline-flex items-center mt-3 h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600"
            >
              Log in again
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setNotice(null)}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
