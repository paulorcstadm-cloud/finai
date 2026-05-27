import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: { xs: '480px' },
      colors: {
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        bg: {
          base:    '#09090F',
          surface: '#111119',
          card:    '#16161E',
          elevated:'#1E1E2A',
          hover:   '#242430',
        },
        border: {
          DEFAULT: 'rgba(99,102,241,0.15)',
          hover:   'rgba(99,102,241,0.30)',
          subtle:  'rgba(255,255,255,0.06)',
        },
        emerald: { 400:'#34d399', 500:'#10b981', 600:'#059669' },
        rose:    { 400:'#fb7185', 500:'#f43f5e', 600:'#e11d48' },
        amber:   { 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706' },
        sky:     { 400:'#38bdf8', 500:'#0ea5e9' },
        violet:  { 400:'#a78bfa', 500:'#8b5cf6' },
        // bank colors
        sicoob:  '#1a5f3a',
        sicredi: '#006b3f',
        nubank:  '#8a05be',
        itau:    '#ec7000',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
        'glow-primary':     'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(99,102,241,0.25)',
        'glow':     '0 0 24px rgba(99,102,241,0.30)',
        'glow-lg':  '0 0 48px rgba(99,102,241,0.20)',
        'card':     '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.12)',
        'fab':      '0 8px 28px rgba(99,102,241,0.45)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { from:{ opacity:'0' }, to:{ opacity:'1' } },
        slideUp:   { from:{ opacity:'0', transform:'translateY(12px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideDown: { from:{ opacity:'0', transform:'translateY(-12px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        scaleIn:   { from:{ opacity:'0', transform:'scale(0.95)' }, to:{ opacity:'1', transform:'scale(1)' } },
        shimmer:   { from:{ backgroundPosition:'200% 0' }, to:{ backgroundPosition:'-200% 0' } },
      },
      borderRadius: { '2xl':'1rem', '3xl':'1.5rem' },
    },
  },
  plugins: [animate],
}

export default config
