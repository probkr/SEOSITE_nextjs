const { brandShades, buttonShades, DARK_COLOR } = require('./brand-color');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin panel sidebar background -- AdminShell.js uses bg-sidebar,
        // but no such color was ever defined, so the sidebar rendered with no
        // background at all (white/transparent, same purple text-on-white bug).
        sidebar: brandShades[900],
        // Main color is set in brand-color.js -- change it there, not here.
        primary: brandShades,
        // Button color is also set in brand-color.js.
        btn: buttonShades,
        // Light peach-amber from the AllFlats logo.
        accent: {
          DEFAULT: '#F5A84A',
          50: '#FFF6EA',
          500: '#F5A84A',
          600: '#DD8A26',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': `linear-gradient(135deg, ${DARK_COLOR} 0%, ${brandShades[700]} 55%, ${brandShades.DEFAULT} 100%)`,
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        dropdown: '0 4px 20px rgba(0,0,0,0.12)',
        float: '0 8px 30px rgba(0,0,0,0.12)',
      },
      keyframes: {
        // Hero points ticker on phones: each point slides up into place.
        'ticker-in': {
          '0%': { opacity: '0', transform: 'translateY(70%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Post Property page.
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -18px) scale(1.06)' },
          '66%': { transform: 'translate(-18px, 14px) scale(0.96)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(320%) skewX(-20deg)' },
        },
        'draw-check': {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
        'ring-out': {
          '0%': { opacity: '0.6', transform: 'scale(0.8)' },
          '100%': { opacity: '0', transform: 'scale(1.8)' },
        },
      },
      animation: {
        'ticker-in': 'ticker-in 0.45s ease-out',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        blob: 'blob 14s ease-in-out infinite',
        shine: 'shine 3.2s ease-in-out 1.2s infinite',
        'draw-check': 'draw-check 0.5s ease-out 0.25s both',
        'ring-out': 'ring-out 1.4s ease-out 0.2s infinite',
      },
    },
  },
  plugins: [],
};
