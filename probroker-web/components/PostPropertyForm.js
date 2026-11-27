'use client';
import { brandShades } from '@/brand-color';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { postJson } from '@/lib/api';
import { API_URL, CITIES } from '@/lib/config';
import { useWebUser } from '@/lib/webUser';
import { OTP_LENGTH, phone10, validPhone } from './PhoneOtp';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
const TRANSACTIONS = [
  { value: 'buy', label: 'Sell', icon: 'tag' },
  { value: 'rent', label: 'Rent out', icon: 'key' },
];
const CATEGORIES = [
  { value: 'residential', label: 'Residential', icon: 'home' },
  { value: 'commercial', label: 'Commercial', icon: 'briefcase' },
];
const PROPERTY_TYPES = {
  residential: [
    { value: 'flat', label: 'Flat / Apartment', icon: 'building' },
    { value: 'bungalow', label: 'Bungalow / Villa', icon: 'home' },
    { value: 'tenement', label: 'Tenement / Row House', icon: 'rowhouse' },
    { value: 'penthouse', label: 'Penthouse', icon: 'penthouse' },
    { value: 'plot', label: 'Plot / Land', icon: 'plot' },
  ],
  commercial: [
    { value: 'office', label: 'Office Space', icon: 'briefcase' },
    { value: 'shop', label: 'Shop', icon: 'shop' },
    { value: 'showroom', label: 'Showroom', icon: 'showroom' },
    { value: 'warehouse', label: 'Warehouse / Godown', icon: 'warehouse' },
  ],
};
const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];
const FURNISHING = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-furnished' },
  { value: 'fully-furnished', label: 'Fully furnished' },
];
const HERO_POINTS = [
  'List for free — no fees, no commission',
  'Enquiries go straight to your phone',
  'Every listing is checked by our team',
  'Reach buyers across Ahmedabad & Gandhinagar',
];
const HOW_IT_WORKS = [
  { icon: 'pin', title: 'Tell us the basics', desc: 'Property type, location and your number. Takes under a minute.' },
  { icon: 'sliders', title: 'Add the details', desc: 'Price, size, furnishing — what buyers filter by.' },
  { icon: 'camera', title: 'Upload photos & go live', desc: 'Our team reviews it and your listing goes live, usually within hours.' },
];
const BENEFITS = [
  { icon: 'rupee', title: 'Zero listing fee', desc: 'Posting on AllFlats costs nothing — today and always.' },
  { icon: 'shield', title: 'Verified badge', desc: 'Approved listings carry a badge buyers trust and click first.' },
  { icon: 'bell', title: 'Direct enquiries', desc: 'Interested buyers and tenants reach you directly — no middleman.' },
  { icon: 'chart', title: 'Local reach', desc: 'Shown to people searching your society, area and city.' },
];
const FAQS = [
  { q: 'Is it really free to post my property?', a: 'Yes. Listing your property on AllFlats is completely free. There are no listing fees and no commission.' },
  { q: 'How long until my listing goes live?', a: 'Our team reviews every listing before publishing it. This usually takes a few hours on working days.' },
  { q: 'Can I edit my listing after posting?', a: 'Yes. Log in with the same mobile number and open My Properties to update details or photos.' },
  { q: 'Why do you verify my mobile number?', a: 'A verified number keeps fake listings out and makes sure genuine enquiries reach the real owner.' },
];

const STEPS = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'details', label: 'Property Details' },
  { key: 'photos', label: 'Photos & Submit' },
];

const MAX_PHOTO_MB = 10;
const RESEND_SECONDS = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const digits = (v, max = 12) => String(v || '').replace(/\D/g, '').slice(0, max);

function trimNum(n) {
  return Number(n.toFixed(2)).toString();
}

// 7800000 -> "₹78 Lakh", 12500000 -> "₹1.25 Crore"
function priceInWords(value) {
  const n = Number(value);
  if (!n) return '';
  if (n >= 1e7) return `₹${trimNum(n / 1e7)} Crore`;
  if (n >= 1e5) return `₹${trimNum(n / 1e5)} Lakh`;
  if (n >= 1e3) return `₹${trimNum(n / 1e3)} Thousand`;
  return `₹${n}`;
}

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;
const cityName = (slug) => CITIES.find((c) => c.slug === slug)?.name || slug;

// ---------------------------------------------------------------------------
// Icons (24x24 line icons, stroke = currentColor)
// ---------------------------------------------------------------------------
const ICONS = {
  tag: <><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10M10 20v-5h4v5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" /></>,
  building: <><path d="M5 21V5a2 2 0 012-2h7a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M3 21h18M9 7h3M9 11h3M9 15h3" /></>,
  rowhouse: <><path d="M2 11l5-4 5 4 5-4 5 4" /><path d="M4 10v10h16V10M7 20v-4M17 20v-4M12 11v9" /></>,
  penthouse: <><path d="M6 21V9h12v12M3 21h18M8 9V6l4-3 4 3v3M10 13h4M10 17h4" /></>,
  plot: <><path d="M3 17l4-10h10l4 10z" /><path d="M8 12h8M12 7v10" /></>,
  shop: <><path d="M4 9l1.5-5h13L20 9M4 9h16a2.7 2.7 0 01-5.3 0 2.7 2.7 0 01-5.4 0A2.7 2.7 0 014 9zM5 12v8h14v-8M10 20v-5h4v5" /></>,
  showroom: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 20v-6h8v6" /></>,
  warehouse: <><path d="M3 21V9l9-5 9 5v12" /><path d="M7 21v-8h10v8M7 17h10" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  rupee: <><path d="M7 4h10M7 8h10M13 4c3 0 3 8 0 8H8l7 8" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 20a2 2 0 004 0" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  check: <><path d="M5 13l4 4L19 7" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  back: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  star: <><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0012 3z" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>,
  chevron: <><path d="M6 9l6 6 6-6" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></>,
};

function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.8 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------
const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500';
const labelCls = 'block text-sm font-semibold text-gray-800 mb-2';
// Smaller label for the compact start card at the top of the page.
const labelClsCompact = 'block text-[13px] font-semibold text-gray-800 mb-1.5';

function chipCls(active, compact = false) {
  const size = compact ? 'gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px]' : 'gap-2 rounded-xl px-3.5 py-2.5 text-sm';
  return `inline-flex items-center ${size} border font-semibold transition-all duration-200 active:scale-95 ${
    active
      ? 'border-primary bg-primary-50 text-primary shadow-[0_0_0_3px_theme(colors.primary.500/10%)]'
      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/50'
  }`;
}

// Two-option toggle with a thumb that slides between them. compact: shorter, for the start card.
function Segmented({ options, value, onChange, label, compact = false }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-label={label} className="relative grid grid-cols-2 rounded-xl bg-gray-100 p-1">
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-card transition-transform duration-300 ease-out ${idx === 1 ? 'translate-x-full' : ''}`}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${compact ? 'py-1.5 text-[13px]' : 'py-2.5 text-sm'} ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Icon name={o.icon} className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipGroup({ options, value, onChange, label, withIcons = false, compact = false }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`${chipCls(value === o.value, compact)} motion-safe:animate-pop-in`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {withIcons && o.icon && <Icon name={o.icon} className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, hint, error, children, htmlFor, compact = false }) {
  return (
    <div>
      {label && <label htmlFor={htmlFor} className={compact ? labelClsCompact : labelCls}>{label}</label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

// Input with an icon or text glued to its left/right edge.
function AddonInput({ prefix, suffix, icon, className = '', ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon name={icon} className="w-[18px] h-[18px]" />
        </span>
      )}
      {prefix && (
        <span className="pointer-events-none absolute left-0 inset-y-0 flex items-center pl-4 pr-3 text-[15px] font-semibold text-gray-500 border-r border-gray-200 my-2">
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`${inputCls} ${icon ? 'pl-11' : ''} ${prefix ? 'pl-[4.25rem]' : ''} ${suffix ? 'pr-20' : ''} ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">{suffix}</span>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${checked ? 'border-primary bg-primary-50/60' : 'border-gray-200 bg-white hover:border-primary-300'}`}
    >
      <span>
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {desc && <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// One box per OTP digit. Typing moves forward, Backspace moves back, pasting fills all boxes.
function OtpBoxes({ value, onChange, onComplete, disabled }) {
  const refs = useRef([]);

  // Focus the first box on open and again after a wrong code clears the boxes.
  useEffect(() => {
    if (!value && !disabled) refs.current[0]?.focus();
  }, [value, disabled]);

  function update(next) {
    onChange(next);
    if (next.length === OTP_LENGTH) onComplete(next);
  }

  function handleChange(i, e) {
    const typed = digits(e.target.value, OTP_LENGTH);
    if (!typed) return;
    const next = (value.slice(0, i) + typed).slice(0, OTP_LENGTH);
    update(next);
    refs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    const cut = value[i] ? i : Math.max(0, i - 1);
    onChange(value.slice(0, cut));
    refs.current[cut]?.focus();
  }

  // Always type into the first empty box, so the code never has gaps.
  function handleFocus(i) {
    if (i > value.length) refs.current[value.length]?.focus();
  }

  return (
    <div className="flex gap-2.5 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => handleFocus(i)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`OTP digit ${i + 1}`}
          disabled={disabled}
          className={`h-14 w-12 sm:w-14 rounded-xl border-2 text-center text-2xl font-bold text-gray-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60 ${value[i] ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200 bg-white'}`}
        />
      ))}
    </div>
  );
}

// Best matches first: names starting with the text, then a word starting with it, then
// anywhere inside. "nik" -> Nikol before "Vastral Nikol Road" before "Sanikunj".
function rankAreas(areas, query) {
  const q = query.trim().toLowerCase();
  if (!q) return areas;
  const scored = [];
  for (const a of areas) {
    const name = a.name.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.split(/[\s,/-]+/).some((w) => w.startsWith(q))) score = 1;
    else if (name.includes(q)) score = 2;
    if (score >= 0) scored.push({ a, score });
  }
  return scored.sort((x, y) => x.score - y.score || x.a.name.localeCompare(y.a.name)).map((x) => x.a);
}

// Bolds the part of `text` that matches `query`.
function Highlight({ text, query }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-extrabold text-primary">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

// Locality picker: type to filter, arrows + Enter to choose. Free text is still allowed for
// localities we don't list yet.
function AreaCombobox({ id, areas, value, onChange, cityLabel }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const listId = `${id}-list`;
  const matches = rankAreas(areas, value);
  const exact = areas.some((a) => a.name.toLowerCase() === value.trim().toLowerCase());

  useEffect(() => { setActive(0); }, [value]);

  // Keep the highlighted option in view while moving with the arrow keys.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(a) {
    onChange(a.name);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  }

  const showList = open && areas.length > 0 && !(exact && matches.length === 1);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon name="pin" className="w-[18px] h-[18px]" />
      </span>
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="e.g. Bopal, Satellite"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`${inputCls} pl-11 pr-10`}
      />
      <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${showList ? 'rotate-180' : ''}`}>
        <Icon name="chevron" className="w-4 h-4" strokeWidth={2.2} />
      </span>

      {showList && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-dropdown motion-safe:animate-pop-in">
          <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span>{value.trim() ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : `Localities in ${cityLabel}`}</span>
            <span className="hidden normal-case tracking-normal font-medium sm:inline">↑↓ to move · Enter to pick</span>
          </div>
          {matches.length ? (
            <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1.5">
              {matches.map((a, i) => (
                <li
                  key={a.slug}
                  id={`${listId}-${i}`}
                  data-idx={i}
                  role="option"
                  aria-selected={i === active}
                  // mousedown (not click) so the input doesn't blur and close the list first
                  onMouseDown={(e) => { e.preventDefault(); choose(a); }}
                  onMouseEnter={() => setActive(i)}
                  className={`mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${i === active ? 'bg-primary-50 text-gray-900' : 'text-gray-700'}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${i === active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon name="pin" className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate"><Highlight text={a.name} query={value} /></span>
                  <span className="shrink-0 text-xs text-gray-400">{cityLabel}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div id={listId} role="listbox" className="px-4 py-4 text-sm text-gray-500">
              No locality matches &ldquo;<span className="font-semibold text-gray-800">{value.trim()}</span>&rdquo;.
              <div className="mt-0.5 text-xs">That&apos;s fine — we&apos;ll save it as you typed it.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fades a block in when it scrolls into view. Content stays visible without JS and for
// people who prefer reduced motion: it is only hidden once we know it is off-screen.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [state, setState] = useState('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    setState('hidden');
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setState('shown');
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = state === 'hidden' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0';
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${cls} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Decorative mock listing on the landing hero: shows what a finished listing looks like.
function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-10 h-[270px] w-full max-w-md select-none">
      <div className="absolute left-6 right-10 top-4 rounded-2xl border border-white bg-white p-3 shadow-float motion-safe:animate-float">
        <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-primary-200 via-primary-100 to-accent-50">
          <svg viewBox="0 0 200 100" className="absolute inset-x-0 bottom-0 w-full text-primary/80">
            <path d="M0 100V70l30-18 30 18V50l40-28 40 28v20l30-16 30 16v30z" fill="currentColor" opacity="0.18" />
            <path d="M70 100V52l40-28 40 28v48z" fill="currentColor" opacity="0.35" />
            <rect x="96" y="66" width="28" height="34" rx="2" fill="#fff" opacity="0.8" />
            <rect x="80" y="56" width="10" height="10" rx="1" fill="#fff" opacity="0.8" />
            <rect x="130" y="56" width="10" height="10" rx="1" fill="#fff" opacity="0.8" />
          </svg>
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-green-700">
            <Icon name="shield" className="w-3 h-3" strokeWidth={2.4} /> Verified
          </span>
          <span className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">Owner</span>
        </div>
        <div className="px-1 pt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">3 BHK Flat · Your Society</div>
            <div className="text-sm font-extrabold text-primary">₹78 L</div>
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-gray-500">
            <span>1,450 sq.ft</span><span>·</span><span>Semi-furnished</span><span>·</span><span>Parking</span>
          </div>
        </div>
      </div>

      <div className="absolute -right-1 top-0 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-float motion-safe:animate-float-slow">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-accent-600">
          <Icon name="bell" className="w-4 h-4" strokeWidth={2.2} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </span>
        <div>
          <div className="text-[11px] font-bold text-gray-900">New enquiry</div>
          <div className="text-[10px] text-gray-500">Buyer wants a site visit</div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 flex items-end gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-float motion-safe:animate-float-slow" style={{ animationDelay: '2s' }}>
        <div className="flex h-8 items-end gap-1">
          {[40, 65, 50, 85, 100].map((h, i) => (
            <span key={i} className="w-1.5 rounded-sm bg-primary-300" style={{ height: `${h}%`, opacity: 0.5 + i * 0.12 }} />
          ))}
        </div>
        <div>
          <div className="text-[11px] font-bold text-gray-900">Views growing</div>
          <div className="text-[10px] text-gray-500">Shown in local searches</div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ stage }) {
  const idx = STEPS.findIndex((s) => s.key === stage);
  return (
    <ol className="mb-6 grid grid-cols-3 gap-2">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.key} className="min-w-0">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className={`h-full rounded-full bg-primary transition-all duration-700 ease-out ${done || active ? 'w-full' : 'w-0'} ${active ? 'opacity-70' : ''}`} />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${done ? 'bg-primary text-white' : active ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Icon name="check" className="w-3 h-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`truncate text-xs font-semibold sm:text-sm ${active ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StrengthRing({ percent }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = percent >= 80 ? '#16a34a' : percent >= 50 ? brandShades.DEFAULT : '#f5a623';
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke={brandShades[100]} strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-gray-900">{percent}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PostPropertyForm({ stats, areasByCity = {} }) {
  const user = useWebUser();
  const loggedIn = Boolean(user?.phone);

  const [stage, setStage] = useState('start'); // start -> basic -> details -> photos -> done
  const [otpStep, setOtpStep] = useState('enter'); // enter -> sent -> verified
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState({});
  const [draftId, setDraftId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [photos, setPhotos] = useState([]); // uploaded URLs, first one is the cover
  const [pending, setPending] = useState([]); // [{ id, preview }] uploads in progress
  const [photoError, setPhotoError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const startCardRef = useRef(null);
  const firstRender = useRef(true);

  const [form, setForm] = useState({
    category: 'residential', transactionType: 'buy', propertyType: 'flat',
    contactName: '', contactPhone: '',
    city: 'ahmedabad', area: '', premiseName: '',
    bhk: '', sqft: '', price: '', furnishing: 'unfurnished',
    floorNumber: '', totalFloors: '', ageOfProperty: '', parking: false, description: '', nearby: '',
    videoUrl: '',
  });

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: '' } : e));
  };

  // Logged-in users already proved their number: prefill it and skip the OTP.
  useEffect(() => {
    if (!user?.phone) return;
    setForm((f) => ({
      ...f,
      contactPhone: f.contactPhone || phone10(user.phone),
      contactName: f.contactName || (user.name && user.name !== 'User' ? user.name : ''),
    }));
  }, [user]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  const isPlot = form.propertyType === 'plot';
  const needsBhk = form.category === 'residential' && !isPlot;
  const phoneVerified = loggedIn && phone10(user.phone) === phone10(form.contactPhone) ? true : otpStep === 'verified';
  const cityAreas = areasByCity[form.city] || [];

  // Send the API an area slug it recognises when the typed name matches a known locality.
  function areaValue() {
    const typed = form.area.trim();
    const hit = cityAreas.find((a) => a.name.toLowerCase() === typed.toLowerCase() || a.slug === typed.toLowerCase());
    return hit ? hit.slug : typed;
  }

  function draftPayload(extra = {}) {
    return {
      draftId: draftId || undefined,
      contactPhone: phone10(form.contactPhone),
      contactName: form.contactName.trim(),
      category: form.category,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      city: form.city,
      area: areaValue(),
      premiseName: form.premiseName.trim(),
      ...extra,
    };
  }

  // ---------------- Start card ----------------
  function chooseCategory(cat) {
    setForm((f) => ({ ...f, category: cat, propertyType: PROPERTY_TYPES[cat][0].value }));
  }

  function startPosting(e) {
    e.preventDefault();
    if (!loggedIn && !validPhone(form.contactPhone)) {
      setErrors({ startPhone: 'Enter a valid 10-digit mobile number.' });
      return;
    }
    setErrors({});
    setStage('basic');
  }

  function backToStart() {
    setStage('start');
    setTimeout(() => startCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  // ---------------- Basic details ----------------
  function validateBasic() {
    const e = {};
    if (!form.area.trim()) e.area = 'Tell buyers where the property is.';
    if (!form.contactName.trim()) e.contactName = 'Please enter your name.';
    if (!validPhone(form.contactPhone)) e.contactPhone = 'Enter a valid 10-digit mobile number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function sendOtp() {
    if (!validateBasic()) return;
    setOtpError('');
    setOtpBusy(true);
    const res = await postJson('/otp/send', { phone: phone10(form.contactPhone), name: form.contactName.trim(), purpose: 'post-property' });
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(res.data?.error || 'Could not send the OTP. Please try again.');
      return;
    }
    setDevOtp(res.data?.dev_otp || '');
    setOtp('');
    setOtpStep('sent');
    setResendIn(RESEND_SECONDS);
  }

  async function saveDraftAndContinue() {
    setSaving(true);
    const draftRes = await postJson('/save-partial-property', draftPayload({ completionPercent: 33 }));
    setSaving(false);
    if (draftRes.ok && draftRes.data?.draftId) setDraftId(draftRes.data.draftId);
    setStage('details');
  }

  async function verifyOtp(code = otp) {
    if (otpBusy || code.length !== OTP_LENGTH) return;
    setOtpError('');
    setOtpBusy(true);
    const res = await postJson('/otp/verify', { phone: phone10(form.contactPhone), otp: code, purpose: 'post-property' });
    setOtpBusy(false);
    if (!res.ok) {
      setOtpError(res.data?.error || 'Incorrect OTP. Please try again.');
      setOtp('');
      return;
    }
    setOtpStep('verified');
    await saveDraftAndContinue();
  }

  function changeNumber() {
    setOtpStep('enter');
    setOtp('');
    setOtpError('');
  }

  function continueFromBasic(e) {
    e.preventDefault();
    if (phoneVerified) {
      if (validateBasic()) saveDraftAndContinue();
    } else if (otpStep === 'sent') {
      verifyOtp();
    } else {
      sendOtp();
    }
  }

  // ---------------- Property details ----------------
  async function saveDetailsAndContinue(e) {
    e.preventDefault();
    const errs = {};
    if (!Number(form.price)) errs.price = form.transactionType === 'rent' ? 'Enter the monthly rent.' : 'Enter the expected price.';
    if (needsBhk && !form.bhk) errs.bhk = 'Select the number of bedrooms.';
    if (form.floorNumber && form.totalFloors && Number(form.floorNumber) > Number(form.totalFloors)) {
      errs.floorNumber = 'Floor number cannot be more than total floors.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    await postJson('/save-partial-property', draftPayload({
      bhk: needsBhk ? form.bhk : undefined,
      sqft: form.sqft,
      price: form.price,
      furnishing: isPlot ? '' : form.furnishing,
      completionPercent: 66,
    }));
    setSaving(false);
    setStage('photos');
  }

  // ---------------- Photos ----------------
  async function uploadFiles(fileList) {
    const all = Array.from(fileList || []);
    const files = all.filter((f) => f.type.startsWith('image/') && f.size <= MAX_PHOTO_MB * 1024 * 1024);
    setPhotoError(files.length < all.length ? `Some files were skipped — only images up to ${MAX_PHOTO_MB} MB are allowed.` : '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length) return;

    const queued = files.map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, preview: URL.createObjectURL(file), file }));
    setPending((p) => [...p, ...queued.map(({ id, preview }) => ({ id, preview }))]);

    let failed = 0;
    for (const item of queued) {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('folder', 'properties');
      try {
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (data?.url) setPhotos((p) => [...p, data.url]);
        else failed += 1;
      } catch {
        failed += 1;
      }
      setPending((p) => p.filter((x) => x.id !== item.id));
      URL.revokeObjectURL(item.preview);
    }
    if (failed) setPhotoError(`${failed} photo${failed > 1 ? 's' : ''} could not be uploaded. Please try again.`);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  const removePhoto = (url) => setPhotos((p) => p.filter((u) => u !== url));
  const makeCover = (url) => setPhotos((p) => [url, ...p.filter((u) => u !== url)]);
  const uploading = pending.length > 0;

  async function submitListing(e) {
    e.preventDefault();
    setSubmitError(null);
    setSaving(true);
    const res = await postJson('/post-property', {
      draftId,
      category: form.category,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      city: form.city,
      area: areaValue(),
      premiseName: form.premiseName.trim(),
      bhk: needsBhk ? form.bhk || undefined : undefined,
      sqft: form.sqft || undefined,
      price: form.price,
      furnishing: isPlot ? undefined : form.furnishing,
      floorNumber: isPlot ? undefined : form.floorNumber || undefined,
      totalFloors: isPlot ? undefined : form.totalFloors || undefined,
      ageOfProperty: isPlot ? undefined : form.ageOfProperty || undefined,
      parking: form.parking,
      description: form.description.trim(),
      nearby: form.nearby.trim(),
      additionalDetails: form.videoUrl.trim() ? `Video: ${form.videoUrl.trim()}` : '',
      contactName: form.contactName.trim(),
      contactPhone: phone10(form.contactPhone),
      listingType: 'owner',
      source: 'owner',
      status: 'pending',
      photoUrls: photos,
    });
    setSaving(false);
    if (res.ok) {
      setListingId(res.data?.propertyId);
      setStage('done');
    } else {
      setSubmitError(res.data?.message || res.data?.error || 'Something went wrong. Please try again.');
    }
  }

  // ---------------- Listing strength (sidebar) ----------------
  const checks = [
    Boolean(form.premiseName.trim()),
    Boolean(form.area.trim()),
    Boolean(form.contactName.trim()),
    phoneVerified,
    Boolean(Number(form.price)),
    Boolean(Number(form.sqft)),
    needsBhk ? Boolean(form.bhk) : true,
    form.description.trim().length >= 40,
    photos.length >= 1,
    photos.length >= 4,
  ];
  const strength = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const typeLabel = labelOf(PROPERTY_TYPES[form.category], form.propertyType);
  const previewTitle = `${needsBhk && form.bhk ? `${labelOf(BHK_OPTIONS, form.bhk)} ` : ''}${typeLabel}`;
  const previewPlace = [form.premiseName.trim(), form.area.trim(), cityName(form.city)].filter(Boolean).join(', ');

  // =======================================================================
  // START (landing)
  // =======================================================================
  if (stage === 'start') {
    const types = PROPERTY_TYPES[form.category];
    return (
      <div>
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-gray-50">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl motion-safe:animate-blob" />
            <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-accent/20 blur-3xl motion-safe:animate-blob" style={{ animationDelay: '-5s' }} />
            <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(theme(colors.primary.300)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
          </div>

          <div className="container-px relative grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
            {/* Left: pitch */}
            <div className="motion-safe:animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                100% free for owners
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.85rem]">
                List your property.{' '}
                <span className="bg-gradient-to-r from-primary-700 via-primary to-primary-400 bg-clip-text text-transparent">Meet serious buyers</span>{' '}
                without paying a rupee.
              </h1>
              <p className="mt-4 max-w-xl text-base text-gray-600 sm:text-lg">
                Post your flat, bungalow, shop or office in Ahmedabad or Gandhinagar in about two minutes.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {HERO_POINTS.map((pt, i) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm font-medium text-gray-700 motion-safe:animate-fade-up" style={{ animationDelay: `${150 + i * 90}ms` }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="hidden lg:block">
                <HeroVisual />
              </div>
            </div>

            {/* Right: start card */}
            <div ref={startCardRef} className="motion-safe:animate-fade-up" style={{ animationDelay: '120ms' }}>
              {/* Compact card: smaller padding, toggles, chips and button, so it fits on one screen. */}
              <form onSubmit={startPosting} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_20px_60px_-15px_theme(colors.primary.700/25%)] sm:p-5">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-700 via-primary-400 to-accent" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold sm:text-xl">Start posting — it&apos;s free</h2>
                    <p className="mt-0.5 text-xs text-gray-500">3 quick steps · about 2 minutes</p>
                  </div>
                  <span className="hidden shrink-0 rounded-md bg-accent-50 px-2 py-0.5 text-[11px] font-extrabold text-accent-600 sm:inline-block">₹0 FEE</span>
                </div>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <div className={labelClsCompact}>I want to</div>
                    <Segmented compact label="I want to" options={TRANSACTIONS} value={form.transactionType} onChange={(v) => set('transactionType', v)} />
                  </div>

                  <div>
                    <div className={labelClsCompact}>Property is</div>
                    <Segmented compact label="Property category" options={CATEGORIES} value={form.category} onChange={chooseCategory} />
                  </div>

                  <div>
                    <div className={labelClsCompact}>Property type</div>
                    {/* key re-mounts the chips so they animate in when the category changes */}
                    <ChipGroup compact key={form.category} label="Property type" options={types} value={form.propertyType} onChange={(v) => set('propertyType', v)} withIcons />
                  </div>

                  <div>
                    <div className={labelClsCompact}>City</div>
                    <ChipGroup compact label="City" options={CITIES.map((c) => ({ value: c.slug, label: c.name, icon: 'pin' }))} value={form.city} onChange={(v) => set('city', v)} withIcons />
                  </div>

                  {loggedIn ? (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {(user.name || 'U').trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 text-sm">
                        <div className="font-semibold text-gray-900 truncate">Posting as {user.name && user.name !== 'User' ? user.name : `+91 ${phone10(user.phone)}`}</div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                          <Icon name="shield" className="w-3.5 h-3.5" strokeWidth={2.2} /> +91 {phone10(user.phone)} verified
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Field compact label="Your mobile number" htmlFor="pp-start-phone" error={errors.startPhone} hint="We'll send a one-time code to verify it.">
                      <AddonInput
                        id="pp-start-phone"
                        prefix="+91"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="10-digit mobile number"
                        className="!py-2.5 !text-sm"
                        value={form.contactPhone}
                        onChange={(e) => { set('contactPhone', digits(e.target.value, 10)); setErrors({}); }}
                      />
                    </Field>
                  )}
                </div>

                <button type="submit" className="btn-primary group relative mt-4 w-full overflow-hidden !rounded-xl !py-2.5 text-[15px]">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shine" />
                  <span className="relative flex items-center gap-2">
                    Start now
                    <Icon name="arrow" className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
                  </span>
                </button>
                <p className="mt-2 text-center text-xs text-gray-500">
                  By continuing you agree to our <Link href="/terms/" className="font-semibold text-primary hover:underline">Terms</Link>.
                  {loggedIn && <> Already listed? <Link href="/my-properties/" className="font-semibold text-primary hover:underline">My Properties</Link></>}
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="border-y border-gray-100 bg-white">
          <div className="container-px grid grid-cols-3 divide-x divide-gray-100 py-6">
            {[
              { value: `${stats?.listings ? stats.listings.toLocaleString('en-IN') : '2,800'}+`, label: 'Live listings' },
              { value: `${stats?.societies ? stats.societies.toLocaleString('en-IN') : '1,000'}+`, label: 'Societies covered' },
              { value: '₹0', label: 'Listing fee' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100} className="px-2 text-center">
                <div className="text-xl font-extrabold text-primary sm:text-3xl font-heading">{s.value}</div>
                <div className="mt-1 text-xs text-gray-500 sm:text-sm">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container-px section-py">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">How it works</span>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Live in three simple steps</h2>
          </Reveal>
          <div className="relative mt-10 grid gap-6 md:grid-cols-3">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-primary-200 md:block" />
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.title} delay={i * 140} className="relative text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-float ring-1 ring-primary-100">
                  <Icon name={s.icon} className="w-7 h-7" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white ring-4 ring-gray-50">{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-gray-600">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white border-y border-gray-100">
          <div className="container-px section-py">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Why AllFlats</span>
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Built for owners who want results</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 100}>
                  <div className="group h-full rounded-2xl border border-gray-100 bg-gray-50/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:bg-white hover:shadow-float">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <Icon name={b.icon} className="w-6 h-6" />
                    </div>
                    <h3 className="mt-4 font-bold">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container-px section-py">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-extrabold md:text-3xl">Questions owners ask</h2>
            </Reveal>
            <div className="mt-8 space-y-3">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delay={i * 80}>
                  <details className="group rounded-xl border border-gray-200 bg-white px-5 py-4 open:border-primary-200 open:shadow-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <Icon name="chevron" className="w-5 h-5 shrink-0 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="container-px pb-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-brand-hero px-6 py-10 text-center sm:px-12">
              <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl motion-safe:animate-blob" />
              <h2 className="relative text-2xl font-extrabold text-white md:text-3xl">Ready to find a buyer or tenant?</h2>
              <p className="relative mx-auto mt-2 max-w-xl text-primary-100">Your listing could be live today. It&apos;s free, and it takes about two minutes.</p>
              <button type="button" onClick={backToStart} className="btn-accent relative mt-6 !rounded-xl !px-8 !py-3.5 text-base">
                Post your property free
              </button>
            </div>
          </Reveal>
        </section>
      </div>
    );
  }

  // =======================================================================
  // DONE
  // =======================================================================
  if (stage === 'done') {
    const next = [
      { title: 'Review', desc: 'Our team checks your listing — usually within a few hours.' },
      { title: 'Goes live', desc: 'Your property appears in search with an owner tag.' },
      { title: 'Enquiries', desc: `Buyers and tenants contact you on +91 ${phone10(form.contactPhone)}.` },
    ];
    return (
      <div className="container-px py-12 md:py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-float motion-safe:animate-fade-up">
          <div className="relative mx-auto h-20 w-20">
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-green-400 opacity-0 motion-safe:animate-ring-out" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg motion-safe:animate-pop-in">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 12.5l4 4 8-9" strokeDasharray="48" className="motion-safe:animate-draw-check" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-extrabold">Property submitted!</h2>
          <p className="mt-2 text-gray-600">
            Thank you{form.contactName ? `, ${form.contactName.trim()}` : ''}. Your listing {listingId ? <span className="font-semibold text-gray-900">#{listingId} </span> : ''}is now pending review.
          </p>

          <ol className="mt-7 space-y-4 text-left">
            {next.map((s, i) => (
              <li key={s.title} className="flex gap-3 motion-safe:animate-fade-up" style={{ animationDelay: `${300 + i * 120}ms` }}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-primary-50 text-primary'}`}>{i + 1}</span>
                <div>
                  <div className="text-sm font-bold text-gray-900">{s.title}</div>
                  <div className="text-sm text-gray-500">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/my-properties/" className="btn-primary !rounded-xl">View My Properties</Link>
            <Link href="/" className="btn-outline !rounded-xl">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // WIZARD (basic / details / photos)
  // =======================================================================
  const tips = {
    basic: ['Use the society name buyers search for.', 'Pick your locality from the list so you show up in area searches.'],
    details: ['Listings with a clear price get far more calls.', 'Mention what makes it special in the description.'],
    photos: ['Add 4+ bright photos: living room, kitchen, bedrooms, view.', 'Your first photo is the cover — make it your best one.'],
  }[stage];

  return (
    <div className="bg-gradient-to-b from-primary-50/70 to-gray-50">
      <div className="container-px max-w-6xl py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div className="min-w-0">
            <Stepper stage={stage} />

            {/* Mobile listing strength */}
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-2.5 lg:hidden">
              <span className="text-xs font-semibold text-gray-500">Listing strength</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-100">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${strength}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-900">{strength}%</span>
            </div>

            <div key={stage} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-8 motion-safe:animate-fade-up">
              {/* ---------------- BASIC ---------------- */}
              {stage === 'basic' && (
                <form onSubmit={continueFromBasic} noValidate>
                  <h2 className="text-xl font-extrabold sm:text-2xl">Basic details</h2>
                  <p className="mt-1 text-sm text-gray-500">Where is the property, and how can buyers reach you?</p>

                  <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                    {[labelOf(TRANSACTIONS, form.transactionType), labelOf(CATEGORIES, form.category), typeLabel, cityName(form.city)].map((t) => (
                      <span key={t} className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">{t}</span>
                    ))}
                    <button type="button" onClick={backToStart} className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      <Icon name="edit" className="w-3.5 h-3.5" /> Change
                    </button>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Society / Building name" htmlFor="pp-premise" hint="Optional, but buyers search by it.">
                      <AddonInput id="pp-premise" icon="building" placeholder="e.g. Shyamal Row House" value={form.premiseName} onChange={(e) => set('premiseName', e.target.value)} />
                    </Field>
                    <Field label="Area / Locality" htmlFor="pp-area" error={errors.area}>
                      <AreaCombobox id="pp-area" areas={cityAreas} value={form.area} onChange={(v) => set('area', v)} cityLabel={cityName(form.city)} />
                    </Field>
                    <Field label="Your name" htmlFor="pp-name" error={errors.contactName}>
                      <AddonInput id="pp-name" icon="user" placeholder="Full name" autoComplete="name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} disabled={otpStep === 'sent' && !phoneVerified} />
                    </Field>
                    <Field label="Mobile number" htmlFor="pp-phone" error={errors.contactPhone}>
                      <AddonInput id="pp-phone" prefix="+91" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number"
                        value={form.contactPhone} onChange={(e) => set('contactPhone', digits(e.target.value, 10))}
                        disabled={phoneVerified || otpStep === 'sent'} />
                    </Field>
                  </div>

                  {/* Verification */}
                  <div className="mt-6">
                    {phoneVerified ? (
                      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 motion-safe:animate-pop-in">
                        <Icon name="shield" className="w-5 h-5" strokeWidth={2.2} />
                        +91 {phone10(form.contactPhone)} is verified
                      </div>
                    ) : otpStep === 'sent' ? (
                      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 sm:p-5 motion-safe:animate-fade-up">
                        <div className="text-sm text-gray-700">
                          Enter the {OTP_LENGTH}-digit code sent to <span className="font-bold text-gray-900">+91 {phone10(form.contactPhone)}</span>{' '}
                          <button type="button" onClick={changeNumber} className="font-bold text-primary hover:underline">Change</button>
                        </div>
                        <div className="mt-4">
                          <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} onComplete={verifyOtp} disabled={otpBusy || saving} />
                        </div>
                        {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
                        {devOtp && (
                          <p className="mt-2 text-xs text-gray-500">SMS isn&apos;t configured on this server. Test code: <span className="font-mono font-bold text-gray-800">{devOtp}</span></p>
                        )}
                        <div className="mt-3 text-xs text-gray-500">
                          Didn&apos;t get it?{' '}
                          {resendIn > 0 ? (
                            <span>Resend in {resendIn}s</span>
                          ) : (
                            <button type="button" onClick={sendOtp} disabled={otpBusy} className="font-bold text-primary hover:underline">Resend OTP</button>
                          )}
                        </div>
                      </div>
                    ) : (
                      otpError && <p className="text-sm text-red-600">{otpError}</p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={backToStart} className="btn-ghost !rounded-xl justify-center gap-1.5">
                      <Icon name="back" className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" className="btn-primary !rounded-xl gap-2 sm:min-w-[200px] disabled:opacity-60"
                      disabled={otpBusy || saving || (otpStep === 'sent' && !phoneVerified && otp.length !== OTP_LENGTH)}>
                      {(otpBusy || saving) && <Spinner />}
                      {saving ? 'Saving...' : phoneVerified ? 'Continue' : otpStep === 'sent' ? (otpBusy ? 'Verifying...' : 'Verify & Continue') : (otpBusy ? 'Sending...' : 'Send OTP')}
                      {!otpBusy && !saving && <Icon name="arrow" className="w-4 h-4" strokeWidth={2.2} />}
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- DETAILS ---------------- */}
              {stage === 'details' && (
                <form onSubmit={saveDetailsAndContinue} noValidate>
                  <h2 className="text-xl font-extrabold sm:text-2xl">Property details</h2>
                  <p className="mt-1 text-sm text-gray-500">The specifics buyers and tenants filter by.</p>

                  <div className="mt-6 space-y-6">
                    {needsBhk && (
                      <Field label="Bedrooms" error={errors.bhk}>
                        <ChipGroup label="Bedrooms" options={BHK_OPTIONS} value={form.bhk} onChange={(v) => set('bhk', v)} />
                      </Field>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={form.transactionType === 'rent' ? 'Monthly rent' : 'Expected price'} htmlFor="pp-price" error={errors.price} hint={priceInWords(form.price) || undefined}>
                        <AddonInput id="pp-price" prefix="₹" inputMode="numeric" placeholder={form.transactionType === 'rent' ? 'e.g. 25000' : 'e.g. 7500000'}
                          suffix={form.transactionType === 'rent' ? '/month' : undefined}
                          value={form.price} onChange={(e) => set('price', digits(e.target.value, 11))} />
                      </Field>
                      <Field label={isPlot ? 'Plot area' : 'Built-up area'} htmlFor="pp-sqft">
                        <AddonInput id="pp-sqft" icon="plot" inputMode="numeric" placeholder="e.g. 1450" suffix="sq.ft"
                          value={form.sqft} onChange={(e) => set('sqft', digits(e.target.value, 7))} />
                      </Field>
                    </div>

                    {!isPlot && (
                      <>
                        <Field label="Furnishing">
                          <ChipGroup label="Furnishing" options={FURNISHING} value={form.furnishing} onChange={(v) => set('furnishing', v)} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          <Field label="Floor no." htmlFor="pp-floor" error={errors.floorNumber}>
                            <input id="pp-floor" className={inputCls} inputMode="numeric" placeholder="e.g. 4" value={form.floorNumber} onChange={(e) => set('floorNumber', digits(e.target.value, 3))} />
                          </Field>
                          <Field label="Total floors" htmlFor="pp-total">
                            <input id="pp-total" className={inputCls} inputMode="numeric" placeholder="e.g. 12" value={form.totalFloors} onChange={(e) => set('totalFloors', digits(e.target.value, 3))} />
                          </Field>
                          <Field label="Age (years)" htmlFor="pp-age">
                            <input id="pp-age" className={inputCls} inputMode="numeric" placeholder="e.g. 5" value={form.ageOfProperty} onChange={(e) => set('ageOfProperty', digits(e.target.value, 3))} />
                          </Field>
                        </div>
                      </>
                    )}

                    <Toggle checked={form.parking} onChange={(v) => set('parking', v)} label="Parking available" desc="Covered or open parking for this property" />

                    <Field label="Nearby landmarks" htmlFor="pp-nearby">
                      <AddonInput id="pp-nearby" icon="pin" placeholder="e.g. Near SG Highway, 5 min from metro" value={form.nearby} onChange={(e) => set('nearby', e.target.value)} />
                    </Field>

                    <Field label="Description" htmlFor="pp-desc">
                      <textarea id="pp-desc" rows={4} maxLength={2000} placeholder="What makes your property stand out? Light, view, society amenities, recent renovation..."
                        className={`${inputCls} resize-y`} value={form.description} onChange={(e) => set('description', e.target.value)} />
                      <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                        <span>{form.description.trim().length < 40 ? 'A few lines help buyers decide faster.' : 'Looks good!'}</span>
                        <span>{form.description.length}/2000</span>
                      </div>
                    </Field>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStage('basic')} className="btn-ghost !rounded-xl justify-center gap-1.5">
                      <Icon name="back" className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" className="btn-primary !rounded-xl gap-2 sm:min-w-[200px] disabled:opacity-60" disabled={saving}>
                      {saving ? <><Spinner /> Saving...</> : <>Continue <Icon name="arrow" className="w-4 h-4" strokeWidth={2.2} /></>}
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- PHOTOS ---------------- */}
              {stage === 'photos' && (
                <form onSubmit={submitListing} noValidate>
                  <h2 className="text-xl font-extrabold sm:text-2xl">Photos &amp; final review</h2>
                  <p className="mt-1 text-sm text-gray-500">Listings with photos get many more enquiries.</p>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload property photos"
                    className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${dragging ? 'scale-[1.01] border-primary bg-primary-50' : 'border-gray-300 bg-gray-50/70 hover:border-primary-300 hover:bg-primary-50/40'}`}
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-card transition-transform duration-300 ${dragging ? '-translate-y-1' : ''}`}>
                      <Icon name="upload" className="w-7 h-7" />
                    </span>
                    <div className="mt-4 font-bold text-gray-900">Drag photos here or <span className="text-primary">browse</span></div>
                    <div className="mt-1 text-xs text-gray-500">JPG or PNG, up to {MAX_PHOTO_MB} MB each</div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
                  </div>
                  {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}

                  {(photos.length > 0 || pending.length > 0) && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {photos.map((url, i) => (
                        <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 motion-safe:animate-pop-in">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Property photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          {i === 0 ? (
                            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                              <Icon name="star" className="w-3 h-3" strokeWidth={2.4} /> COVER
                            </span>
                          ) : (
                            <button type="button" onClick={() => makeCover(url)}
                              className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/60 py-1 text-[11px] font-semibold text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                              Make cover
                            </button>
                          )}
                          <button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo"
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                            <Icon name="x" className="w-3.5 h-3.5" strokeWidth={2.6} />
                          </button>
                        </div>
                      ))}
                      {pending.map((p) => (
                        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.preview} alt="" className="h-full w-full object-cover opacity-50 blur-[1px]" />
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-primary">
                            <Spinner className="w-6 h-6" />
                            <span className="text-[11px] font-semibold">Uploading</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6">
                    <Field label="Video link (optional)" htmlFor="pp-video">
                      <AddonInput id="pp-video" icon="video" placeholder="YouTube video URL" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
                    </Field>
                  </div>

                  {/* Review */}
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
                    <div className="mb-3 text-sm font-extrabold text-gray-900">Review your listing</div>
                    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      {[
                        ['Listing', `${previewTitle} for ${form.transactionType === 'rent' ? 'rent' : 'sale'}`, 'basic'],
                        ['Location', previewPlace, 'basic'],
                        ['Price', priceInWords(form.price) ? `${priceInWords(form.price)}${form.transactionType === 'rent' ? ' / month' : ''}` : '—', 'details'],
                        ['Size', form.sqft ? `${Number(form.sqft).toLocaleString('en-IN')} sq.ft` : '—', 'details'],
                        ['Furnishing', isPlot ? '—' : labelOf(FURNISHING, form.furnishing), 'details'],
                        ['Contact', `${form.contactName.trim()} · +91 ${phone10(form.contactPhone)}`, 'basic'],
                      ].map(([k, v, target]) => (
                        <div key={k} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                          <div className="min-w-0">
                            <dt className="text-xs text-gray-500">{k}</dt>
                            <dd className="font-semibold text-gray-900 break-words">{v}</dd>
                          </div>
                          <button type="button" onClick={() => setStage(target)} className="shrink-0 text-xs font-bold text-primary hover:underline">Edit</button>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {submitError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStage('details')} className="btn-ghost !rounded-xl justify-center gap-1.5">
                      <Icon name="back" className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" className="btn-primary group relative overflow-hidden !rounded-xl gap-2 sm:min-w-[220px] disabled:opacity-60" disabled={saving || uploading}>
                      {saving ? <><Spinner /> Submitting...</> : uploading ? <><Spinner /> Uploading photos...</> : <><Icon name="sparkle" className="w-4 h-4" strokeWidth={2.2} /> Submit for review</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar: live preview + strength */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                <div className="relative h-36 bg-gradient-to-br from-primary-200 via-primary-100 to-accent-50">
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[0]} alt="" className="h-full w-full object-cover motion-safe:animate-pop-in" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/40">
                      <Icon name={PROPERTY_TYPES[form.category].find((t) => t.value === form.propertyType)?.icon || 'home'} className="w-14 h-14" strokeWidth={1.2} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    For {form.transactionType === 'rent' ? 'Rent' : 'Sale'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Live preview</div>
                  <div className="mt-1 font-bold text-gray-900">{previewTitle}</div>
                  <div className="mt-0.5 flex items-start gap-1 text-sm text-gray-500">
                    <Icon name="pin" className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-2">{previewPlace}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="text-lg font-extrabold text-primary">
                      {priceInWords(form.price) || <span className="text-sm font-semibold text-gray-300">Price</span>}
                      {form.price && form.transactionType === 'rent' && <span className="text-xs font-semibold text-gray-400"> /mo</span>}
                    </div>
                    {form.sqft && <div className="text-xs font-semibold text-gray-500">{Number(form.sqft).toLocaleString('en-IN')} sq.ft</div>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                <div className="flex items-center gap-4">
                  <StrengthRing percent={strength} />
                  <div>
                    <div className="font-bold text-gray-900">Listing strength</div>
                    <div className="text-xs text-gray-500">
                      {strength >= 80 ? 'Excellent — buyers will love it.' : strength >= 50 ? 'Good. Add more to stand out.' : 'Keep going, add more details.'}
                    </div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2 text-xs text-gray-600">
                      <Icon name="bulb" className="w-4 h-4 shrink-0 text-accent-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
