/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F4EFE3',
          soft: '#FBF8F1',
          line: '#E4DCC8',
        },
        teal: {
          950: '#0F3A3D',
          900: '#154548',
          800: '#1B5E63',
          700: '#237078',
          600: '#2E8A8F',
        },
        clay: {
          600: '#C97A3A',
          500: '#D98F4E',
          400: '#E4A968',
          100: '#F7E6D2',
        },
        moss: {
          600: '#8A8A3C',
          500: '#A9A23E',
          200: '#E4E2C0',
        },
        ink: '#28312E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.75rem',
      },
      boxShadow: {
        soft: '0 12px 32px -16px rgba(21, 69, 72, 0.35)',
      },
    },
  },
  plugins: [],
};
