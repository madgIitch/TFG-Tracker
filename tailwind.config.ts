import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: '#0f1117',
        surface: '#1a1f2e',
        muted: '#252b3b',
        border: '#2e3650',
        'text-primary': '#e2e8f0',
        'text-muted': '#94a3b8',
      },
    },
  },
  plugins: [],
} satisfies Config
