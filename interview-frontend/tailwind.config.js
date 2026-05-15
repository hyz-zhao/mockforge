/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#faf8f5',
          100: '#f5f0ea',
          200: '#ebe3da',
          300: '#ddd3c5',
          400: '#c9bba8',
          500: '#b8a48a',
        },
        terracotta: {
          50: '#fdf5f3',
          100: '#fbeae5',
          200: '#f5cfc3',
          300: '#edaf9c',
          400: '#e28a70',
          500: '#d4694a',
          600: '#c45d3a',
          700: '#a34a2f',
          800: '#853d2b',
          900: '#6c3427',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#3d3d3d',
          900: '#2d2d2d',
        },
        gold: {
          400: '#e5be6a',
          500: '#d4a853',
          600: '#c49543',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px rgba(45, 45, 45, 0.08)',
        'warm-lg': '0 8px 40px rgba(45, 45, 45, 0.12)',
        'card': '0 2px 8px rgba(45, 45, 45, 0.04), 0 8px 24px rgba(45, 45, 45, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
