/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976D2',
        secondary: '#03A9F4',
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336',
        light: '#F5F5F5',
        dark: '#212121',
      },
    },
  },
  plugins: [],
}