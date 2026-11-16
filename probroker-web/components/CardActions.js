'use client';
import { useEffect, useState } from 'react';

// mapQuery is optional: when given, a third button opens that search in Google Maps.
export default function CardActions({ id, title, path, mapQuery }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    try {
      const ids = JSON.parse(localStorage.getItem('pb_saved_properties') || '[]');
      setSaved(ids.includes(id));
    } catch {}
  }, [id]);

  function toggleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      const ids = JSON.parse(localStorage.getItem('pb_saved_properties') || '[]');
      const next = saved ? ids.filter((x) => x !== id) : [...ids, id];
      localStorage.setItem('pb_saved_properties', JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  }

  async function share(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  }

  return (
    <div className="flex items-center gap-1.5 pointer-events-auto">
      <button
        type="button"
        onClick={toggleSave}
        aria-label={saved ? 'Remove from saved' : 'Save property'}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-card transition-colors ${
          saved ? 'bg-primary text-white' : 'bg-white/95 text-gray-500 hover:text-primary'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
          <path d="M10 17.25l-.61-.55C4.77 12.36 2 9.86 2 6.9 2 4.5 3.9 2.6 6.3 2.6c1.36 0 2.67.63 3.7 1.72A5.02 5.02 0 0113.7 2.6C16.1 2.6 18 4.5 18 6.9c0 2.96-2.77 5.46-7.39 9.8l-.61.55z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={share}
        aria-label="Share property"
        className="w-11 h-11 rounded-full bg-white/95 text-gray-500 hover:text-primary shadow-card flex items-center justify-center"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="15" cy="4.5" r="2.2" />
          <circle cx="15" cy="15.5" r="2.2" />
          <circle cx="5" cy="10" r="2.2" />
          <line x1="6.9" y1="8.8" x2="13.1" y2="5.7" />
          <line x1="6.9" y1="11.2" x2="13.1" y2="14.3" />
        </svg>
      </button>
      {mapQuery && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="View on Google Maps"
          title="View on Google Maps"
          className="w-11 h-11 rounded-full bg-white/95 text-gray-500 hover:text-primary shadow-card flex items-center justify-center"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M10 18s5.5-4.9 5.5-9.3A5.5 5.5 0 0010 3.2a5.5 5.5 0 00-5.5 5.5C4.5 13.1 10 18 10 18z" />
            <circle cx="10" cy="8.7" r="2" />
          </svg>
        </a>
      )}
    </div>
  );
}
