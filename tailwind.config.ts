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

        // Modern Financial Dashboard Colors

        // Brand Colors (Blue theme)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main brand blue
          600: '#2563eb', // Hover states
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a', // Dark text
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

        // New Life Area Colors - Untitled UI + Financial Dashboard Theme
        // 🔵 Investeringer (Investments) - Deep Navy Theme
        investments: {
          50: '#dbeafe', // Light blue background
          100: '#bfdbfe',
          200: '#93c5fd',
          300: '#60a5fa',
          400: '#3b82f6',
          500: '#1e40af', // Deep Navy Blue - Primary color
          600: '#1d4ed8', // Darker hover state
          700: '#1e3a8a',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },

        // 🟣 Hobby Prosjekter (Hobby Projects) - Creative Purple Theme
        projects: {
          50: '#f3e8ff', // Light purple background
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#7c3aed', // Vibrant Purple - Primary color
          600: '#6d28d9', // Darker hover state
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#4c1d95',
        },

        // 🟢 Økonomi (Economy) - Financial Green Theme
        economy: {
          50: '#d1fae5', // Light green background
          100: '#a7f3d0',
          200: '#6ee7b7',
          300: '#34d399',
          400: '#10b981',
          500: '#059669', // Emerald Green - Primary color
          600: '#047857', // Darker hover state
          700: '#065f46',
          800: '#064e3b',
          900: '#064e3b',
        },

        // 🟠 Verktøy (Tools) - Utility Orange Theme
        tools: {
          50: '#fed7aa', // Light orange background
          100: '#fdba74',
          200: '#fb923c',
          300: '#f97316',
          400: '#ea580c',
          500: '#ea580c', // Warm Orange - Primary color
          600: '#c2410c', // Darker hover state
          700: '#9a3412',
          800: '#7c2d12',
          900: '#7c2d12',
        },

        // Semantic Colors (Aligned with new category colors)
        success: {
          50: '#d1fae5',
          100: '#a7f3d0',
          500: '#059669', // Matches Økonomi green
          600: '#047857',
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
          50: '#fed7aa',
          100: '#fdba74',
          500: '#ea580c', // Matches Verktøy orange
          600: '#c2410c',
          900: '#7c2d12',
        },

        info: {
          50: '#dbeafe',
          100: '#bfdbfe',
          500: '#1e40af', // Matches Investeringer navy
          600: '#1d4ed8',
          900: '#1e3a8a',
        },

        // Make sure brand colors are accessible
        'brand-50': '#eff6ff',
        'brand-100': '#dbeafe',
        'brand-500': '#3b82f6',
        'brand-600': '#2563eb',
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
