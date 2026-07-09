/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pos: {
          canvas: '#18181b',
          sidebar: '#1e293b',
          card: '#18181b',
          border: '#27272a',
          'text-primary': '#f4f4f5',
          'text-muted': '#a1a1aa',
          'text-secondary': '#e4e4e7',
        },
      },
      boxShadow: {
        pos: '0 4px 6px -1px rgba(0,0,0,.3), 0 2px 4px -2px rgba(0,0,0,.2)',
        'pos-lg': '0 10px 15px -3px rgba(0,0,0,.4), 0 4px 6px -4px rgba(0,0,0,.3)',
        'pos-inner': 'inset 0 2px 4px 0 rgba(0,0,0,.3)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-out': 'slideOut 0.2s ease-in',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'flash-green': 'flashGreen 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flashGreen: {
          '0%': { backgroundColor: 'rgba(5, 150, 105, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};