/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
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
      },
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '12px',
        DEFAULT: '16px',
        lg: '20px',
      },
      boxShadow: {
        gold: '0 8px 28px rgba(240,180,41,0.3)',
        'gold-lg': '0 12px 40px rgba(240,180,41,0.4)',
        dark: '0 8px 32px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(160deg, rgba(8,13,26,0.92) 0%, rgba(8,13,26,0.6) 45%, rgba(8,13,26,0.85) 100%)',
      },
    },
  },
  plugins: [],
}