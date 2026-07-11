/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        gemini: {
          bg: 'var(--gemini-bg)',
          surface: 'var(--gemini-surface)',
          header: 'var(--gemini-header)',
          sidebar: 'var(--gemini-sidebar)',
          border: 'var(--gemini-border)',
          text: 'var(--gemini-text)',
          dim: 'var(--gemini-dim)',
          accent: 'var(--gemini-accent)',
          warning: {
            bg: 'var(--gemini-warning-bg)',
            border: 'var(--gemini-warning-border)',
            text: 'var(--gemini-warning-text)',
          },
          danger: {
            bg: 'var(--gemini-danger-bg)',
            text: 'var(--gemini-danger-text)',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
