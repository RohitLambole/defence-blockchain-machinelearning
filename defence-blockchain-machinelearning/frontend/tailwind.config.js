/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        military: {
          900: '#060b14',
          800: '#0a1120',
          700: '#0f1a2e',
          600: '#162240',
          500: '#1e3254',
        },
        accent: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#34d399',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
