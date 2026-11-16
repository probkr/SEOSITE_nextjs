'use client';

import { useEffect, useRef } from 'react';
import { isVideoUrl } from '@/lib/media';

// One entry of a listing's photos: an <img>, or a <video> when the URL is a video file, which an
// <img> can't show. Videos start on their own. Browsers only allow that while muted, so they are
// muted unless the caller turns that off (the full-screen viewer does: it opens on a click).
// `controls` gives the viewer the play / sound / full-screen buttons.
export default function PropertyMedia({ src, alt, className, controls = false, muted = true, autoPlay = true, onClick, lazy = false }) {
  const videoRef = useRef(null);
  const video = isVideoUrl(src);

  // The muted attribute doesn't survive server rendering, and without it the browser refuses to
  // autoplay. Setting it here and starting playback by hand makes autoplay work on first load.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !autoPlay) return;
    el.muted = muted;
    el.play().catch(() => {}); // refused (e.g. data saver): the play button is still there
  }, [src, autoPlay, muted]);

  if (video) {
    return (
      <video
        key={src}
        ref={videoRef}
        src={src}
        aria-label={alt}
        className={className}
        autoPlay={autoPlay}
        muted={muted}
        loop
        playsInline
        controls={controls}
        preload="metadata"
        onClick={onClick}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading={lazy ? 'lazy' : undefined} onClick={onClick} />;
}
