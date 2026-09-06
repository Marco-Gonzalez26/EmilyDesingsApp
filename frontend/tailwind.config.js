/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css,scss}'],
  theme: {
    extend: {
      colors: {
        'emily-white': 'rgb(254 254 250)',
        'emily-cream': 'rgb(245 237 227)',
        'emily-light': 'rgb(249 245 240)',
        'emily-rose': 'rgb(212 165 165)',
        'emily-gold': 'rgb(201 169 97)',
        'emily-sage': 'rgb(168 181 160)',
        'emily-taupe': 'rgb(139 127 118)',
        'emily-dark': 'rgb(62 53 47)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};