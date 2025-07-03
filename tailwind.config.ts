import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LifeDash Design System Colors
        primary: {
          dark: '#1A1D29',
          light: '#FFFFFF',
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#80868B',
          700: '#5F6368',
          800: '#3C4043',
          900: '#202124',
        },
        secondary: {
          blue: '#4169E1',
          gray: '#8B91A7',
          50: '#F8F9FF',
          100: '#F1F3FF',
          200: '#E8EBFF',
          300: '#D4D9FF',
          400: '#A8B1FF',
          500: '#7C85FF',
          600: '#4169E1',
          700: '#2952CC',
          800: '#1A3BA8',
          900: '#0F2B85',
        },
        accent: {
          green: '#00C853',
          red: '#F44336',
          amber: '#FFA726',
          purple: '#7C4DFF',
        },
        functional: {
          success: '#00C853',
          error: '#F44336',
          warning: '#FFA726',
          info: '#2196F3',
        },
        background: {
          primary: '#0F1115',
          secondary: '#1A1D29',
          tertiary: '#242837',
          light: '#F8F9FA',
        },
        // Light mode variants
        light: {
          primary: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#E9ECEF',
          text: {
            primary: '#1A1D29',
            secondary: '#495057',
          },
        },
        // Neutral colors for UI components
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Display sizes
        'display-lg': [
          '48px',
          { lineHeight: '56px', letterSpacing: '-0.5px', fontWeight: '700' },
        ],
        'display-md': [
          '36px',
          { lineHeight: '44px', letterSpacing: '-0.3px', fontWeight: '700' },
        ],
        // Headings
        h1: [
          '32px',
          { lineHeight: '40px', letterSpacing: '-0.3px', fontWeight: '700' },
        ],
        h2: [
          '24px',
          { lineHeight: '32px', letterSpacing: '-0.2px', fontWeight: '600' },
        ],
        h3: [
          '20px',
          { lineHeight: '28px', letterSpacing: '-0.1px', fontWeight: '600' },
        ],
        // Body text
        'body-lg': [
          '16px',
          { lineHeight: '24px', letterSpacing: '0px', fontWeight: '400' },
        ],
        body: [
          '14px',
          { lineHeight: '20px', letterSpacing: '0px', fontWeight: '400' },
        ],
        'body-sm': [
          '12px',
          { lineHeight: '16px', letterSpacing: '0.1px', fontWeight: '400' },
        ],
        // Data text (monospace)
        'data-lg': [
          '24px',
          { lineHeight: '28px', letterSpacing: '0px', fontWeight: '500' },
        ],
        'data-md': [
          '18px',
          { lineHeight: '24px', letterSpacing: '0px', fontWeight: '400' },
        ],
        'data-sm': [
          '14px',
          { lineHeight: '18px', letterSpacing: '0px', fontWeight: '400' },
        ],
        // Special text
        label: [
          '12px',
          { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' },
        ],
        button: [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.2px', fontWeight: '500' },
        ],
        caption: [
          '11px',
          { lineHeight: '14px', letterSpacing: '0.2px', fontWeight: '400' },
        ],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        responsive: 'cubic-bezier(0.2, 0, 0, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '350': '350ms',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.2, 0, 0, 1)',
        'bounce-in': 'bounceIn 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'count-up': 'countUp 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
        'draw-line': 'drawLine 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
        shake: 'shake 150ms ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        countUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        elevated: '0 4px 12px rgba(0, 0, 0, 0.15)',
        focus: '0 0 0 2px rgba(65, 105, 225, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
