'use client';

import { useEffect, useRef, useState } from 'react';

// Space taken by the sticky site header (64px) + this tab bar; sections land just below it.
const OFFSET = 128;

/**
 * Sticky in-page section tabs for the property detail page (Housing.com style).
 * Clicking a tab scrolls to its section; scrolling highlights the section in view.
 */
export default function PropertySectionTabs({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);
  const barRef = useRef(null);
  // While a click-scroll is animating, don't let the scroll-spy flicker through other tabs.
  const lockUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= OFFSET + 8) current = s.id;
      }
      // At the very bottom the last short section may never reach the top; select it anyway.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections[sections.length - 1]?.id;
      }
      setActive(current);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  // Keep the active tab visible when the bar scrolls sideways on mobile.
  useEffect(() => {
    const btn = barRef.current?.querySelector(`[data-tab="${active}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  function go(id) {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    lockUntil.current = Date.now() + 700;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET + 4, behavior: 'smooth' });
  }

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Property sections"
      className="sticky top-16 z-20 -mx-4 md:mx-0 mb-6 bg-white border-y md:border md:rounded-xl border-gray-100 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.15)]"
    >
      <div ref={barRef} className="flex gap-6 px-4 md:px-5 overflow-x-auto no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            data-tab={s.id}
            onClick={() => go(s.id)}
            aria-current={active === s.id ? 'true' : undefined}
            className={`relative shrink-0 py-3.5 text-[13px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
              active === s.id ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s.label}
            <span
              aria-hidden="true"
              className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-primary transition-opacity ${active === s.id ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
