/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAFAF8',
          text: '#1C1C1A',
          accent: '#5B7B5E',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


