/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function({ addBase }) {
      addBase({
        'input:disabled, select:disabled, textarea:disabled': {
          '@apply bg-gray-200 text-gray-500 cursor-not-allowed': {},
        },
      });
    },
  ],
};
