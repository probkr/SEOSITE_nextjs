'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';

// Ads load in the browser, after the page: the server HTML search engines index has only
// property cards, and every visitor gets their own order of ads.

// One request per placement + city for the whole visit, shared by every slot on the page.
const loaded = new Map();

// Higher priority first; ads with the same priority in a random order for this visitor.
function shuffleByPriority(ads) {
  const groups = new Map();
  for (const ad of ads) {
    const p = Number(ad.priority) || 0;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(ad);
  }
  return [...groups.keys()].sort((a, b) => b - a).flatMap((p) => {
    const g = groups.get(p);
    for (let i = g.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [g[i], g[j]] = [g[j], g[i]];
    }
    return g;
  });
}

function loadAds(placement, city) {
  const key = `${placement}|${city || ''}`;
  if (!loaded.has(key)) {
    const qs = new URLSearchParams({ placement });
    if (city) qs.set('city', city);
    const request = fetch(`${API_URL}/ads?${qs}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((r) => shuffleByPriority(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {
        loaded.delete(key); // try again on the next page
        return [];
      });
    loaded.set(key, request);
  }
  return loaded.get(key);
}

function countClick(id) {
  try {
    const url = `${API_URL}/ads/${encodeURIComponent(id)}/click`;
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  } catch (e) { /* never block the click */ }
}

/**
 * One ad card in a list of property cards. Renders nothing when no ad is live.
 * slot: the ad's position in the list (0, 1, 2 ...); each slot shows the next ad in turn.
 * variant: 'row' next to row property cards, otherwise the grid card.
 */
export default function AdSlot({ placement = 'listing', city, slot = 0, variant = 'grid' }) {
  const [ads, setAds] = useState(null);

  useEffect(() => {
    let alive = true;
    loadAds(placement, city).then((list) => { if (alive) setAds(list); });
    return () => { alive = false; };
  }, [placement, city]);

  if (!ads || ads.length === 0) return null;
  const ad = ads[slot % ads.length];
  return <AdCard ad={ad} variant={variant} />;
}

// "builder-site.com" for a link to another site; nothing for a page on this site.
function linkHost(url) {
  try {
    return /^https?:\/\//i.test(url) ? new URL(url).hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

function ArrowIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12m-5-5l5 5-5 5" />
    </svg>
  );
}

/**
 * The ad card. Same outer size as the property card next to it, but set apart by a "Sponsored"
 * strip, a soft brand tint and an inset rounded picture, so it never passes for a listing.
 */
export function AdCard({ ad, variant = 'grid' }) {
  const host = linkHost(ad.link_url);
  const linkProps = host
    ? { target: '_blank', rel: 'sponsored nofollow noopener noreferrer' }
    : { rel: 'sponsored' };
  const cta = ad.cta_text || 'Know More';
  const row = variant === 'row';

  return (
    <a
      href={ad.link_url}
      {...linkProps}
      onClick={() => countClick(ad.id)}
      aria-label={`Sponsored: ${ad.title}`}
      className={`group relative block w-full min-w-0 overflow-hidden rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white shadow-card hover:shadow-float hover:border-primary-200 transition-all duration-300 ${row ? '' : 'h-full flex flex-col'}`}
    >
      {/* Sponsored strip: what this is, and where the link goes. */}
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 pt-3 pb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-500">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
          Sponsored
        </span>
        {host && (
          <span className="inline-flex items-center gap-1 min-w-0 text-[11px] text-gray-400">
            <span className="truncate">{host}</span>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4h5v5M16 4l-7 7M14 12v3a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h3" />
            </svg>
          </span>
        )}
      </div>

      <div className={`px-3 pb-3 sm:px-4 sm:pb-4 ${row ? 'flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-6' : 'flex-1 flex flex-col gap-3.5'}`}>
        {/* 5:3 picture, the size the admin is asked to upload (1200 x 720). */}
        <div className={`relative aspect-[5/3] overflow-hidden rounded-lg bg-primary-50 ring-1 ring-black/5 ${row ? 'w-full sm:w-72 shrink-0' : 'w-full'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.image_url}
            alt={ad.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        </div>

        <div className={`min-w-0 flex flex-col gap-1.5 ${row ? 'flex-1' : 'flex-1'}`}>
          <h3 className={`font-heading font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors ${row ? 'text-[17px] sm:text-xl' : 'text-[17px]'}`}>
            {ad.title}
          </h3>
          {ad.subtitle && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{ad.subtitle}</p>
          )}
          <span
            className={`mt-2.5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card group-hover:bg-primary-600 transition-colors ${row ? 'w-full sm:w-auto sm:self-start' : 'w-full mt-auto'}`}
          >
            {cta}
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </a>
  );
}
