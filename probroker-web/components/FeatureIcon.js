// Line icons for property facts, furnishings and amenities (24x24, stroke = currentColor).

const ICONS = {
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0012 3z" /></>,
  fan: <><circle cx="12" cy="12" r="1.5" /><path d="M12 10.5C12 6 13 3.5 15.5 4S17 9 12 10.5zM13.5 12c4.5 0 7 1 6.5 3.5S15 17 13.5 12zM12 13.5c0 4.5-1 7-3.5 6.5S7 15 12 13.5zM10.5 12C6 12 3.5 11 4 8.5S9 7 10.5 12z" /></>,
  ac: <><rect x="3" y="5" width="18" height="8" rx="2" /><path d="M7 10h10M8 16v2M12 16v4M16 16v2" /></>,
  wardrobe: <><rect x="5" y="3" width="14" height="17" rx="1.5" /><path d="M12 3v17M10 11v2M14 11v2M7 20v1.5M17 20v1.5" /></>,
  geyser: <><rect x="7" y="3" width="10" height="15" rx="3" /><path d="M10 18v3M14 18v3M10 7h4" /><circle cx="12" cy="12" r="1.5" /></>,
  bed: <><path d="M3 7v11M3 14h18v4M21 18v-4a3 3 0 00-3-3h-7v3" /><circle cx="7" cy="11" r="2" /></>,
  sofa: <><path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3" /><path d="M3 13a2 2 0 014 0v1h10v-1a2 2 0 014 0v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM6 18v2M18 18v2" /></>,
  dining: <><path d="M3 10h18M5 10v10M19 10v10M5 15h14" /><path d="M8 4v3M12 4v3M16 4v3" /></>,
  tv: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  fridge: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M6 10h12M9 5v2M9 13v3" /></>,
  washer: <><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="13" r="4.5" /><path d="M7.5 5.5h.01M10.5 5.5h.01" /></>,
  microwave: <><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="6" y="8" width="9" height="8" rx="1" /><path d="M18 9v.01M18 12v.01" /></>,
  kitchen: <><rect x="4" y="9" width="16" height="12" rx="1" /><path d="M4 14h16M8 4v3M12 3v4M16 4v3" /></>,
  curtain: <><path d="M3 4h18M6 4v16M18 4v16M6 4c0 6 4 9 4 16M18 4c0 6-4 9-4 16" /></>,
  purifier: <><path d="M12 3s5 5.5 5 9.5a5 5 0 01-10 0C7 8.5 12 3 12 3z" /><path d="M10 13a2 2 0 002 2" /></>,
  parking: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 17V7h4a3 3 0 010 6H9" /></>,
  lift: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 3v18M7.5 10l1.5-2 1.5 2M13.5 14l1.5 2 1.5-2" /></>,
  security: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  cctv: <><path d="M3 9l12-4 2 5-12 4z" /><path d="M15 10l5 1.5v3L14 13M7 13l1 4H4" /></>,
  gym: <><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" /></>,
  garden: <><path d="M12 22v-7M8 22h8" /><path d="M12 15a5 5 0 01-5-5 5 5 0 015-7 5 5 0 015 7 5 5 0 01-5 5z" /></>,
  play: <><circle cx="12" cy="5" r="2" /><path d="M12 7v6M8 21l4-8 4 8M8 10h8" /></>,
  reception: <><path d="M4 18h16M5 18a7 7 0 0114 0M12 8v3M10 8h4" /></>,
  signage: <><rect x="3" y="4" width="18" height="9" rx="1.5" /><path d="M8 13v7M16 13v7M7 8.5h10" /></>,
  shop: <><path d="M4 9l1.5-5h13L20 9M4 9h16a2.7 2.7 0 01-5.3 0 2.7 2.7 0 01-5.4 0A2.7 2.7 0 014 9zM5 12v8h14v-8M10 20v-5h4v5" /></>,
  power: <><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></>,
  water: <><path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" /></>,
  pool: <><path d="M3 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M8 15V6a2 2 0 014 0M16 15V6a2 2 0 00-4 0M8 10h8" /></>,
  club: <><path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-5h4v5" /></>,
  check: <><path d="M5 13l4 4L19 7" /></>,
  // Property facts
  area: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 9h3M4 14h3M9 4v3M14 4v3" /></>,
  tag: <><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  building: <><path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M3 21h18M8 7h4M8 11h4M8 15h4" /></>,
  stairs: <><path d="M4 20h4v-4h4v-4h4V8h4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0" /><path d="M16 5.5a3 3 0 010 5M18 14a5 5 0 013 6" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
};

// First match wins, so specific names come before generic ones.
const MATCHERS = [
  [/electric|fitting|light|bulb/i, 'bulb'],
  [/\bfans?\b|ceiling fan/i, 'fan'],
  [/\bac\b|air ?condition/i, 'ac'],
  [/wardrobe|cupboard|almirah/i, 'wardrobe'],
  [/geyser|water heater/i, 'geyser'],
  [/\bbeds?\b|mattress/i, 'bed'],
  [/sofa|couch/i, 'sofa'],
  [/dining/i, 'dining'],
  [/\btv\b|television/i, 'tv'],
  [/fridge|refrigerator/i, 'fridge'],
  [/washing/i, 'washer'],
  [/microwave|oven/i, 'microwave'],
  [/kitchen|chimney|stove/i, 'kitchen'],
  [/curtain/i, 'curtain'],
  [/purifier|\bro\b/i, 'purifier'],
  [/parking|garage/i, 'parking'],
  [/\blift\b|elevator/i, 'lift'],
  [/cctv|camera/i, 'cctv'],
  [/security|guard|gated/i, 'security'],
  [/gym|fitness/i, 'gym'],
  [/garden|park\b|landscap/i, 'garden'],
  [/play|kids|children/i, 'play'],
  [/reception|lobby/i, 'reception'],
  [/signage|hoarding/i, 'signage'],
  [/shop|frontage|store/i, 'shop'],
  [/power|backup|generator|inverter/i, 'power'],
  [/water|borewell/i, 'water'],
  [/pool|swim/i, 'pool'],
  [/club ?house|community hall/i, 'club'],
];

export function iconKeyFor(name) {
  const hit = MATCHERS.find(([re]) => re.test(name || ''));
  return hit ? hit[1] : 'check';
}

export default function FeatureIcon({ name, icon, className = 'w-5 h-5' }) {
  const key = icon || iconKeyFor(name);
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[key] || ICONS.check}
    </svg>
  );
}
