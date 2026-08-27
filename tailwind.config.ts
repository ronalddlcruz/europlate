import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { page: '#f0f4f9', border: '#dde4ef', ink: '#1a2236', muted: '#8a99b5', brand: '#2563eb' },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], mono: ['Space Mono', 'monospace'] },
      boxShadow: { card: '0 1px 6px rgba(30,50,100,.08)', panel: '0 4px 20px rgba(30,50,100,.12)' },
    },
  },
  plugins: [],
} satisfies Config
