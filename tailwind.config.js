/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        // CSS variable-based colors for theme support
        primary: {
          bg: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          sidebar: 'var(--bg-sidebar)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
        },
        brand: {
          navy: '#00007f',
          purple: '#8b3cff',
          'purple-hover': '#7a2de6',
          gray1: '#aaaaaa',
          gray2: '#bbbbbb',
          gray3: '#cccccc',
        },
        // Zenible Dashboard Design System Colors from Figma
        zenible: {
          primary: '#8e51ff',
          'primary-text': '#09090b',
          'sub-text': '#71717a',
          'body-sub-text': '#a1a1aa',
          'tab-bg': '#f5f3ff',
          'card-bg': '#ffffff',
          stroke: '#e5e5e5',
          // Dark mode colors
          'dark-bg': '#0a0a0a',
          'dark-sidebar': '#111111',
          'dark-card': '#1a1a1a',
          'dark-border': '#2a2a2a',
          'dark-text': '#ffffff',
          'dark-text-secondary': '#a1a1aa',
          'dark-tab-bg': '#1f1f1f',
        },
        // New design system colors
        design: {
          'page-bg': '#f8f9fa',
          'card-bg': '#f0f4ff',
          'input-bg': '#ffffff',
          'border-light': '#e0e0e0',
          'border-input': '#aaaaaa',
          'text-primary': '#000000',
          'text-secondary': '#404040',
          'text-muted': '#808080',
          'text-placeholder': '#6b7280',
          bg: '#f8f9fa',
        },
        grey: {
          soft: 'var(--grey-soft)',
          neutral: 'var(--grey-neutral)',
        },
      },
      backgroundColor: {
        'theme-primary': 'var(--bg-primary)',
        'theme-secondary': 'var(--bg-secondary)',
        'theme-tertiary': 'var(--bg-tertiary)',
        'theme-card': 'var(--bg-card)',
        'theme-sidebar': 'var(--bg-sidebar)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-tertiary': 'var(--text-tertiary)',
      },
      borderColor: {
        'theme-primary': 'var(--border-primary)',
        'theme-secondary': 'var(--border-secondary)',
      },
      zIndex: {
        'dropdown': '9000',
        'modal-backdrop': '9500',
        'modal': '9600',
        'tooltip': '9999',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}