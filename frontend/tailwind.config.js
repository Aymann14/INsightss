/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#F9F6F0',
          200: '#EFEBE1',
        },
        ochre: {
          500: '#D4A373',
          600: '#C28E5C',
        },
        charcoal: {
          800: '#3A3633',
          900: '#2E2B2A',
        }
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
