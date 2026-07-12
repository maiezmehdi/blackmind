import tailwindcssAnimate from 'tailwindcss-animate';

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
        // color-mix keeps CSS-variable theming AND makes Tailwind opacity
        // modifiers work (bg-gemini-surface/50, border-gemini-accent/20, …).
        // With no modifier <alpha-value> is 1 → the plain token color.
        gemini: {
          bg: 'color-mix(in srgb, var(--gemini-bg) calc(<alpha-value> * 100%), transparent)',
          surface: 'color-mix(in srgb, var(--gemini-surface) calc(<alpha-value> * 100%), transparent)',
          header: 'color-mix(in srgb, var(--gemini-header) calc(<alpha-value> * 100%), transparent)',
          sidebar: 'color-mix(in srgb, var(--gemini-sidebar) calc(<alpha-value> * 100%), transparent)',
          border: 'color-mix(in srgb, var(--gemini-border) calc(<alpha-value> * 100%), transparent)',
          text: 'color-mix(in srgb, var(--gemini-text) calc(<alpha-value> * 100%), transparent)',
          dim: 'color-mix(in srgb, var(--gemini-dim) calc(<alpha-value> * 100%), transparent)',
          accent: 'color-mix(in srgb, var(--gemini-accent) calc(<alpha-value> * 100%), transparent)',
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
  plugins: [tailwindcssAnimate],
};
