/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-2': '#1a1a1a',
        border: '#2a2a2a',
        accent: '#fafaf9',
        'accent-muted': '#a8a29e',
        'accent-dim': '#44403c',
        'sql-primary':   '#00FF41',
        'sql-secondary': '#00E5FF',
        'sql-tertiary':  '#FF00E5',
        'sql-dim':       '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

