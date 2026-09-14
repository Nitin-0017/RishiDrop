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
          DEFAULT: '#A6192E',
          50: '#FFF6F7',   // Very light red (Hover state)
          100: '#FBEAEC',  // Light red (Active / Selected state)
          200: '#F5C6CB',
          300: '#EE9FA8',
          400: '#DF5467',
          500: '#C82338',
          600: '#A6192E',  // Primary Rishihood Red
          700: '#8F1628',  // Deep Red (Button hover state)
          800: '#751221',
          900: '#5C0E1A',
          950: '#3A0910',
        },
        rishi: {
          red: '#A6192E',
          deepRed: '#8F1628',
          lightRed: '#FBEAEC',
          veryLightRed: '#FFF6F7',
          darkText: '#172033',
          secondaryText: '#667085',
          border: '#E6E8EC',
          bg: '#FFFFFF',
          pageBg: '#FAFAFA',
          success: '#16865B',
          warning: '#C77700',
          warningBg: '#FFF4DD',
          warningText: '#8A5A00',
        },
        accent: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#16865B',
          600: '#16865B',
          700: '#116545',
        },
        whatsapp: {
          500: '#25D366',
          600: '#128C7E',
          700: '#075E54',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
}
