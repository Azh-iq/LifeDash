// LifeDash Design System - Design Tokens
// Following established design principles for financial applications

export type ThemeMode = 'light' | 'dark-orange'

// Base design tokens
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px  
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
  '6xl': '4rem',    // 64px
} as const

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  glow: '0 0 20px rgb(0 0 0 / 0.1)',
} as const

// Theme-specific color palettes
export const colorTokens = {
  light: {
    // Surface colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
    },
    // Text colors
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8',
    },
    // Border colors
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focused: '#6366f1',
      error: '#ef4444',
      success: '#10b981',
    },
    // Brand colors
    brand: {
      primary: '#6366f1',
      secondary: '#a855f7',
      tertiary: '#ec4899',
    },
    // Status colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    // Interactive states
    interactive: {
      hover: '#f8fafc',
      pressed: '#f1f5f9',
      disabled: '#f8fafc',
    },
  },
  'dark-orange': {
    // Surface colors - Deep blacks with subtle warmth
    background: {
      primary: '#0c0a09',      // stone-950
      secondary: '#1c1917',    // stone-900
      tertiary: '#292524',     // stone-800
      elevated: '#1c1917',     // stone-900
    },
    // Text colors - Warm whites and grays
    text: {
      primary: '#fafaf9',      // stone-50
      secondary: '#e7e5e4',    // stone-200
      tertiary: '#a8a29e',     // stone-400
      inverse: '#0c0a09',      // stone-950
      disabled: '#78716c',     // stone-500
    },
    // Border colors with orange accents
    border: {
      primary: '#44403c',      // stone-600
      secondary: '#57534e',    // stone-500
      focused: '#ea580c',      // orange-600
      error: '#dc2626',        // red-600
      success: '#16a34a',      // green-600
    },
    // Brand colors - Orange-focused palette
    brand: {
      primary: '#ea580c',      // orange-600
      secondary: '#fb923c',    // orange-400
      tertiary: '#fed7aa',     // orange-200
    },
    // Status colors adapted for dark theme
    status: {
      success: '#16a34a',      // green-600
      warning: '#eab308',      // yellow-500
      error: '#dc2626',        // red-600
      info: '#2563eb',         // blue-600
    },
    // Interactive states
    interactive: {
      hover: '#292524',        // stone-800
      pressed: '#44403c',      // stone-600
      disabled: '#1c1917',     // stone-900
    },
  },
} as const

// Component-specific design tokens
export const components = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
      xl: '3.5rem',    // 56px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.25rem',
      xl: '1.25rem 1.5rem',
    },
    fontSize: {
      sm: fontSize.sm,
      md: fontSize.base,
      lg: fontSize.lg,
      xl: fontSize.xl,
    },
  },
  input: {
    height: {
      sm: '2.25rem',   // 36px
      md: '2.75rem',   // 44px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.25rem',
    },
  },
  card: {
    padding: {
      sm: spacing.lg,
      md: spacing.xl,
      lg: spacing['2xl'],
      xl: spacing['3xl'],
    },
    borderRadius: {
      sm: borderRadius.lg,
      md: borderRadius.xl,
      lg: borderRadius['2xl'],
    },
  },
} as const

// Animation tokens
export const animation = {
  duration: {
    fast: '150ms',
    medium: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const

// Grid and layout tokens
export const layout = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '7xl': '80rem',    // 1280px (for content areas)
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  containerPadding: {
    mobile: spacing.lg,
    tablet: spacing['2xl'],
    desktop: spacing['3xl'],
  },
} as const

// Button hierarchy system
export const buttonHierarchy = {
  primary: {
    background: 'brand.primary',
    text: 'text.inverse',
    border: 'brand.primary',
    shadow: boxShadow.md,
  },
  secondary: {
    background: 'background.primary',
    text: 'brand.primary',
    border: 'brand.primary',
    shadow: boxShadow.sm,
  },
  tertiary: {
    background: 'transparent',
    text: 'brand.primary',
    border: 'transparent',
    shadow: 'none',
  },
  destructive: {
    background: 'status.error',
    text: 'text.inverse',
    border: 'status.error',
    shadow: boxShadow.md,
  },
  ghost: {
    background: 'transparent',
    text: 'text.secondary',
    border: 'transparent',
    shadow: 'none',
  },
} as const

// Financial app specific tokens
export const financial = {
  // Investment category colors
  categories: {
    stocks: {
      light: '#6366f1',
      dark: '#ea580c',
    },
    crypto: {
      light: '#f59e0b',
      dark: '#eab308',
    },
    art: {
      light: '#ec4899',
      dark: '#dc2626',
    },
    other: {
      light: '#10b981',
      dark: '#16a34a',
    },
  },
  // Status indicators for P&L
  performance: {
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#6b7280',
  },
  // Chart colors
  charts: {
    primary: ['#ea580c', '#fb923c', '#fdba74'],
    secondary: ['#1f2937', '#374151', '#4b5563'],
    accent: ['#dc2626', '#16a34a', '#2563eb'],
  },
} as const

// Utility function to get theme tokens
export function getThemeTokens(mode: ThemeMode) {
  return colorTokens[mode]
}

// Utility function to get component tokens
export function getComponentTokens(component: keyof typeof components) {
  return components[component]
}

export default {
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  boxShadow,
  colorTokens,
  components,
  animation,
  layout,
  buttonHierarchy,
  financial,
  getThemeTokens,
  getComponentTokens,
}