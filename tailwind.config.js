/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.tsx",
    "./types.ts",
    "./supabase.ts",
    "./api.ts",
    "./config.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fcc514',
        secondary: '#f7a600',
        positive: '#00c087',
        negative: '#ff4d4f',
        darkBg: '#06070d',
        gold: {
          DEFAULT: '#d4af37',
          light: '#f1d592',
          dark: '#aa8c2e',
          metallic: '#b8860b',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f1d592 0%, #d4af37 50%, #aa8c2e 100%)',
      },
      animation: {
        ticker: 'ticker 35s linear infinite',
        marquee: 'marquee 20s linear infinite',
        bounce: 'bounce 2s infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-100%, 0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
