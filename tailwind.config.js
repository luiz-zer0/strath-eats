/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a0f1e',
          2: '#0f1729',
          3: '#141d35',
          4: '#1a2540',
          5: '#1f2d4d',
        },
        gold: {
          DEFAULT: '#f0b429',
          2: '#f7c948',
          3: '#fef3c7',
        },
        bd: 'rgba(255,255,255,0.08)',
        bd2: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '12px',
        DEFAULT: '16px',
        lg: '20px',
      },
    },
  },
  plugins: [],
}
