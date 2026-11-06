'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

// App Router gives no visual cue between a click and the next page's server render, so a
// click on a slow route looks ignored. This bar starts on the click itself and finishes when
// the URL actually changes.
const START_EVENT = 'pb:nav-start';
const GIVE_UP_MS = 20000;

// For router.push()/replace() callers, which don't go through an <a> click.
export function startNavigationProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return false;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page (or only the #hash differs): nothing will load.
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(null); // null = hidden, 0-100 otherwise
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current.forEach(clearInterval);
    timers.current = [];
  };

  function start() {
    clearTimers();
    setProgress(8);
    // Ease towards 90% so the bar keeps moving however long the server takes.
    timers.current.push(setInterval(() => setProgress((p) => (p === null || p >= 90 ? p : p + (90 - p) * 0.12)), 200));
    timers.current.push(setTimeout(done, GIVE_UP_MS));
  }

  function done() {
    clearTimers();
    setProgress((p) => (p === null ? null : 100));
    timers.current.push(setTimeout(() => setProgress(null), 250));
  }

  useEffect(() => {
    const onClick = (e) => { if (isInternalNavigation(e)) start(); };
    document.addEventListener('click', onClick);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The new URL has committed -- the page is on screen (or its loading skeleton is).
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (progress === null) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] pointer-events-none" role="progressbar" aria-label="Loading page" aria-valuenow={Math.round(progress)}>
      <div
        className="h-full bg-accent shadow-[0_0_8px_rgba(245,166,35,0.7)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  // useSearchParams needs a Suspense boundary or it opts every page out of static rendering.
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
