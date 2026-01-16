/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      zIndex: {
        '60': '60',
        '100': '100',
        '101': '101',
        '102': '102',
        '200': '200',
        '99999': '99999',
      },
      maxWidth: {
        '252': '63rem',
      },
    },
  },
  plugins: [],
}
