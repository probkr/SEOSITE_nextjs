'use client';
import { useState, useCallback, useEffect } from 'react';
import { getPlaceholderPhotoUrl } from './PropertyImagePlaceholder';
import PropertyMedia from './PropertyMedia';
import { isVideoUrl } from '@/lib/media';

export default function PropertyGallery({ photos, title, category, propertyType, seed }) {
  const hasPhotos = photos && photos.length > 0;
  const imgs = hasPhotos ? photos : [getPlaceholderPhotoUrl({ category, propertyType, seed }) + '?auto=format&fit=crop&w=1200&q=60'];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const activeIsVideo = isVideoUrl(imgs[active]);

  const next = useCallback(() => setActive((i) => (i + 1) % imgs.length), [imgs.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + imgs.length) % imgs.length), [imgs.length]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, next, prev]);

  return (
    <div>
      {/* Main image */}
      <div className={`relative rounded-2xl overflow-hidden bg-primary-50 aspect-[16/10] group shadow-float ${hasPhotos ? 'cursor-zoom-in' : ''}`} onClick={hasPhotos ? () => setLightbox(true) : undefined}>
        {/* A click on a playing video is for its own buttons, so it doesn't open the full-screen viewer. */}
        <PropertyMedia
          src={imgs[active]}
          alt={`${title} photo ${active + 1}`}
          className={`w-full h-full object-cover ${hasPhotos ? '' : 'blur-md scale-110'}`}
          controls
          onClick={activeIsVideo ? (e) => e.stopPropagation() : undefined}
        />
        {!activeIsVideo && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />}
        {hasPhotos ? (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-gray-900 text-sm font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-card">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            +{imgs.length} Photos
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 pointer-events-none">
            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur text-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-card">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Request Photos
            </span>
            <span className="text-white text-xs font-medium drop-shadow bg-black/30 px-2.5 py-1 rounded-full">Photos coming soon from the owner</span>
          </div>
        )}
        {imgs.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-card text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-card text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-2">
          {imgs.slice(0, 12).map((photo, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-lg overflow-hidden ring-2 transition-all ${i === active ? 'ring-primary' : 'ring-transparent opacity-80 hover:opacity-100'}`}
            >
              <PropertyMedia src={photo} alt={`${title} thumbnail ${i + 1}`} className="w-full h-full object-cover" autoPlay={false} />
              {isVideoUrl(photo) && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white" aria-hidden="true">
                  <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 3.8a1 1 0 00-1.5.9v10.6a1 1 0 001.5.9l9-5.3a1 1 0 000-1.800l-9-5.3z" /></svg>
                </span>
              )}
              {i === 11 && imgs.length > 12 && (
                <span className="absolute inset-0 bg-black/60 text-white text-xs font-semibold flex items-center justify-center">
                  +{imgs.length - 12}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="absolute top-4 left-4 text-white text-sm font-medium">{active + 1} / {imgs.length}</div>
          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <PropertyMedia
            src={imgs[active]}
            alt={`${title} full size photo ${active + 1}`}
            className="max-w-[92vw] max-h-[88vh] object-contain"
            controls
            muted={false}
            onClick={(e) => e.stopPropagation()}
          />
          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
