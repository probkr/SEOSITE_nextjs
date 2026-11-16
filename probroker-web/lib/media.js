// A listing's "photos" can hold videos too (the CRM uploads .mp4 files next to the pictures).
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export const isVideoUrl = (url) => typeof url === 'string' && VIDEO_RE.test(url);

// The first picture, for places that need a still image (card covers, share previews, search engines).
export const firstImageUrl = (photos) => (Array.isArray(photos) ? photos.find((u) => u && !isVideoUrl(u)) : undefined);
