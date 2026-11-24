// Icons and text helpers shared by the place search boxes (home hero, header).

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

// Pin standing on a folded map: a locality.
export const LocalityIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} {...iconProps}>
    <path d="M12 14.5s-4.5-3.9-4.5-7.3a4.5 4.5 0 019 0c0 3.4-4.5 7.3-4.5 7.3z" />
    <circle cx="12" cy="7.2" r="1.6" />
    <path d="M8 14.2l-4.5 1.6v5.4l5.5-1.9 6 1.9 5.5-1.9v-5.4L16 14.2" />
  </svg>
);

// Apartment block: a project / society.
export const ProjectIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} {...iconProps}>
    <path d="M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16M15 9h3a1 1 0 011 1v11M3 21h18" />
    <path d="M8 7.5h1.5M11 7.5h1M8 11h1.5M11 11h1M8 14.5h1.5M11 14.5h1M9 21v-3h3v3" />
  </svg>
);

// Flag on a pole: a landmark or free-text keyword.
export const LandmarkIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} {...iconProps}>
    <path d="M6 21V4M6 4h10l-2 3.5L16 11H6" />
    <path d="M3.5 21h6" />
  </svg>
);

export const TrendIcon = ({ className = 'w-4 h-4 text-accent' }) => (
  <svg className={className} {...iconProps} strokeWidth={2.2}>
    <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
  </svg>
);

// The typed part of a name in bold: "Chan" -> **Chan**dkheda.
export function Highlight({ text, term }) {
  const t = String(term || '').trim().toLowerCase();
  const i = t ? text.toLowerCase().indexOf(t) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-bold text-gray-900">{text.slice(i, i + t.length)}</span>
      {text.slice(i + t.length)}
    </>
  );
}
