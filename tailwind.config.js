/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#f5e6d3',
        'deep-purple': '#1a0b2e',
      },
      fontFamily: {
        serif: ['"Crimson Text"', 'serif'],
      },
    },
  },
  plugins: [],
}
