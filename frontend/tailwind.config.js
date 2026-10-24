/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          DEFAULT: '#10b981',
          600: '#059669',
          700: '#047857',
          neon: '#00f59b',
          lime: '#84cc16'
        },
        dark: {
          950: '#080b0f',
          900: '#0d1117',
          850: '#131822',
          800: '#1a202c',
          700: '#2d3748',
          600: '#4a5568'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 245, 155, 0.25)',
        'neon-strong': '0 0 35px rgba(0, 245, 155, 0.45)',
      }
    },
  },
  plugins: [],
}
