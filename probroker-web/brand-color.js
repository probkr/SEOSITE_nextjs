// ============================================================
//  SITE KA MAIN COLOR -- sirf neeche wali ek line badlo.
//  Buttons, links, logo, footer, admin sidebar, gradients --
//  sab isi se banenge. Light/dark/hover shades apne aap bante hain.
// ============================================================
const BRAND_COLOR = '#4B6FFF';

//  BUTTONS KA COLOR -- saare buttons (Search, Post Property, Submit...) isse banenge.
const BUTTON_COLOR = '#233376';

// ---- Neeche kuch badalne ki zaroorat nahi ----

function toRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mixes the brand color with white (amount > 0) or black (amount < 0).
function mix(hex, amount) {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return (
    '#' +
    toRgb(hex)
      .map((c) => Math.round(c + (target - c) * t).toString(16).padStart(2, '0'))
      .join('')
  );
}

const brandShades = {
  DEFAULT: BRAND_COLOR,
  50: mix(BRAND_COLOR, 0.92),
  100: mix(BRAND_COLOR, 0.82),
  200: mix(BRAND_COLOR, 0.65),
  300: mix(BRAND_COLOR, 0.45),
  400: mix(BRAND_COLOR, 0.22),
  500: BRAND_COLOR,
  600: mix(BRAND_COLOR, -0.22),
  700: mix(BRAND_COLOR, -0.42),
  800: mix(BRAND_COLOR, -0.55),
  900: mix(BRAND_COLOR, -0.65),
};

// For inline styles that need see-through brand color, e.g. brandRgba(0.07).
function brandRgba(alpha, shade = 'DEFAULT') {
  return `rgba(${toRgb(brandShades[shade]).join(',')},${alpha})`;
}

// Hover goes lighter on a dark button and darker on a light one, so it always shows.
const [br, bg, bb] = toRgb(BUTTON_COLOR);
const buttonIsDark = 0.299 * br + 0.587 * bg + 0.114 * bb < 140;
const buttonShades = {
  DEFAULT: BUTTON_COLOR,
  hover: mix(BUTTON_COLOR, buttonIsDark ? 0.2 : -0.15),
};

module.exports = { BRAND_COLOR, brandShades, brandRgba, BUTTON_COLOR, buttonShades };
