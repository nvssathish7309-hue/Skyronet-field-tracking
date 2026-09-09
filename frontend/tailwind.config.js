/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bae0fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        tealbrand: {
          50: '#e0f7f6',
          100: '#b2ebe9',
          400: '#26bab6',
          500: '#00ada8',
          600: '#009e99'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

