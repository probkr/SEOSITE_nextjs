'use client';

import { useEffect, useState } from 'react';

// Phones have room for one hero point at a time, so they take turns sliding in.
// Screen readers get the full list once instead of a changing line.
export default function HeroPointsTicker({ points = [], interval = 2600, className = '' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (points.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % points.length), interval);
    return () => clearInterval(id);
  }, [points.length, interval]);

  if (!points.length) return null;

  return (
    <div className={className}>
      <ul className="sr-only">
        {points.map((pt) => <li key={pt}>{pt}</li>)}
      </ul>

      <div aria-hidden="true" className="flex flex-col items-center gap-2">
        <div className="h-7 overflow-hidden">
          <p
            key={index}
            className="flex items-center justify-center gap-2 h-7 text-sm font-semibold text-gray-700 motion-safe:animate-ticker-in"
          >
            <svg className="w-4 h-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {points[index]}
          </p>
        </div>

        {/* Progress dots: the current point's dot stretches into a bar. */}
        <div className="flex items-center gap-1.5">
          {points.map((pt, i) => (
            <span
              key={pt}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-accent' : 'w-1.5 bg-primary-200'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
