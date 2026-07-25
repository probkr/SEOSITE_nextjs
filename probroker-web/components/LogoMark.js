export default function LogoMark({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="18" cy="20" r="14" fill="#f5f3ff" stroke="#4d3c9a" strokeWidth="2.2" />
      <polyline points="9,26 14,19 18,23 23,15" fill="none" stroke="#4d3c9a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="26" r="1.6" fill="#2d0b59" />
      <circle cx="14" cy="19" r="1.6" fill="#2d0b59" />
      <circle cx="18" cy="23" r="1.6" fill="#2d0b59" />
      <circle cx="23" cy="15" r="1.6" fill="#2d0b59" />
      <line x1="23" y1="15" x2="36" y2="3" stroke="#4d3c9a" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="36,3 33.6,8.2 30.9,5.3" fill="#4d3c9a" />
    </svg>
  );
}
