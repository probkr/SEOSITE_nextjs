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
        sidebar: '#1a0c33',
        primary: {
          DEFAULT: '#4d3c9a',
          50: '#f5f3ff',
          100: '#ede8ff',
          200: '#dcd3ff',
          300: '#c0b0ff',
          400: '#9d84f5',
          500: '#4d3c9a',
          600: '#42327f',
          700: '#2d0b59',
          800: '#241146',
          900: '#1a0c33',
        },
        accent: {
          DEFAULT: '#f5a623',
          50: '#fff8ec',
          500: '#f5a623',
          600: '#d98a0e',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2d0b59 0%, #4d3c9a 100%)',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        dropdown: '0 4px 20px rgba(0,0,0,0.12)',
        float: '0 8px 30px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
