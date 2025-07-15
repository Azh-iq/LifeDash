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
        // shadcn/ui colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // Modern Universal Portfolio App Colors

        // Primary Brand (Deep Blue)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Main brand blue (updated)
          600: '#1d4ed8', // Hover states
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },

        // Dark theme backgrounds (like FINEbank)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          700: '#334155',
          800: '#1e293b', // Dark sidebar bg
          900: '#0f172a', // Darker background
          950: '#020617', // Darkest
        },

        // Gray/Neutral Scale
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6', // Card backgrounds
          200: '#e5e7eb', // Borders
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280', // Secondary text
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827', // Primary text
          950: '#030712',
        },

        // Universal Portfolio App - Asset Class Colors
        // 📈 Stocks - Deep Blue Theme
        stocks: {
          50: '#eff6ff', // Light blue background
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Deep Blue - Primary color
          600: '#1d4ed8', // Darker hover state
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },

        // ₿ Crypto - Amber Theme
        crypto: {
          50: '#fffbeb', // Light amber background
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amber - Primary color
          600: '#d97706', // Darker hover state
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // 🎨 Alternatives - Purple Theme
        alternatives: {
          50: '#f5f3ff', // Light purple background
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Purple - Primary color
          600: '#7c3aed', // Darker hover state
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },

        // 💰 Cash - Green Theme
        cash: {
          50: '#ecfdf5', // Light green background
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Green - Primary color
          600: '#059669', // Darker hover state
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },

        // Semantic Colors (Aligned with new asset class colors)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981', // Matches Cash green
          600: '#059669',
          900: '#064e3b',
        },

        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          900: '#7f1d1d',
        },

        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b', // Matches Crypto amber
          600: '#d97706',
          900: '#78350f',
        },

        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb', // Matches Stocks blue
          600: '#1d4ed8',
          900: '#1e3a8a',
        },

        // Universal Portfolio App - Quick Access Colors
        'brand-50': '#eff6ff',
        'brand-100': '#dbeafe',
        'brand-500': '#2563eb', // Updated primary blue
        'brand-600': '#1d4ed8', // Updated hover blue
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: '8px',
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
  plugins: [require('tailwindcss-animate')],
}
export default config
