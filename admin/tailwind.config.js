/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { 400: '#F5E17A', 500: '#D4AF37' },
        dark: { 50: '#1a1a1a', 100: '#141414', 200: '#111111', 300: '#0d0d0d', 400: '#0a0a0a' },
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
