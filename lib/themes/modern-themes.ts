export type ThemeVariant = 'light' | 'dark' | 'dark-orange'

export interface ThemeConfig {
  name: string
  variant: ThemeVariant
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    border: string
    input: string
    ring: string
    muted: string
    mutedForeground: string
    popover: string
    popoverForeground: string
    success: string
    warning: string
    error: string
    info: string
  }
  gradients: {
    primary: string
    secondary: string
    accent: string
    surface: string
    glow: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    glow: string
  }
  investment: {
    stocks: {
      primary: string
      secondary: string
      gradient: string
      glow: string
    }
    crypto: {
      primary: string
      secondary: string
      gradient: string
      glow: string
    }
    art: {
      primary: string
      secondary: string
      gradient: string
      glow: string
    }
    other: {
      primary: string
      secondary: string
      gradient: string
      glow: string
    }
  }
}

// Original LifeDash Purple Theme (Light)
export const lightTheme: ThemeConfig = {
  name: 'LifeDash Light',
  variant: 'light',
  colors: {
    primary: '#6366f1', // Indigo
    secondary: '#a855f7', // Purple
    accent: '#ec4899', // Pink
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    border: '#e2e8f0',
    input: '#ffffff',
    ring: '#6366f1',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradients: {
    primary: 'from-indigo-500 via-purple-500 to-pink-500',
    secondary: 'from-purple-400 via-pink-400 to-rose-400',
    accent: 'from-pink-500 via-rose-500 to-red-500',
    surface: 'from-gray-50 via-white to-gray-50',
    glow: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(99 102 241 / 0.3)',
  },
  investment: {
    stocks: {
      primary: '#6366f1',
      secondary: '#a855f7',
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
      glow: 'shadow-indigo-500/30',
    },
    crypto: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      glow: 'shadow-amber-500/30',
    },
    art: {
      primary: '#ec4899',
      secondary: '#f472b6',
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      glow: 'shadow-pink-500/30',
    },
    other: {
      primary: '#10b981',
      secondary: '#34d399',
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      glow: 'shadow-emerald-500/30',
    },
  },
}

// Dark Theme with Purple Accents
export const darkTheme: ThemeConfig = {
  name: 'LifeDash Dark',
  variant: 'dark',
  colors: {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#ec4899',
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    border: '#334155',
    input: '#1e293b',
    ring: '#6366f1',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    popover: '#1e293b',
    popoverForeground: '#f8fafc',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradients: {
    primary: 'from-indigo-600 via-purple-600 to-pink-600',
    secondary: 'from-purple-500 via-pink-500 to-rose-500',
    accent: 'from-pink-600 via-rose-600 to-red-600',
    surface: 'from-slate-900 via-slate-800 to-slate-900',
    glow: 'from-indigo-600/20 via-purple-600/20 to-pink-600/20',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    glow: '0 0 30px rgb(99 102 241 / 0.5)',
  },
  investment: {
    stocks: {
      primary: '#6366f1',
      secondary: '#a855f7',
      gradient: 'from-indigo-600 via-purple-600 to-pink-600',
      glow: 'shadow-indigo-600/40',
    },
    crypto: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      gradient: 'from-amber-600 via-orange-600 to-yellow-600',
      glow: 'shadow-amber-600/40',
    },
    art: {
      primary: '#ec4899',
      secondary: '#f472b6',
      gradient: 'from-pink-600 via-rose-600 to-red-600',
      glow: 'shadow-pink-600/40',
    },
    other: {
      primary: '#10b981',
      secondary: '#34d399',
      gradient: 'from-emerald-600 via-green-600 to-teal-600',
      glow: 'shadow-emerald-600/40',
    },
  },
}

// Dark Theme with Orange Highlights (Your Suggestion!)
export const darkOrangeTheme: ThemeConfig = {
  name: 'LifeDash Dark Orange',
  variant: 'dark-orange',
  colors: {
    primary: '#ea580c', // Orange-600
    secondary: '#fb923c', // Orange-400
    accent: '#fed7aa', // Orange-200
    background: '#0c0a09', // Stone-950 (almost black)
    foreground: '#fafaf9', // Stone-50
    card: '#1c1917', // Stone-900
    cardForeground: '#fafaf9',
    border: '#44403c', // Stone-600
    input: '#1c1917',
    ring: '#ea580c',
    muted: '#292524', // Stone-800
    mutedForeground: '#a8a29e', // Stone-400
    popover: '#1c1917',
    popoverForeground: '#fafaf9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradients: {
    primary: 'from-orange-600 via-orange-500 to-amber-500',
    secondary: 'from-orange-400 via-amber-400 to-yellow-400',
    accent: 'from-orange-300 via-amber-300 to-yellow-300',
    surface: 'from-stone-950 via-stone-900 to-stone-950',
    glow: 'from-orange-600/30 via-orange-500/30 to-amber-500/30',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    glow: '0 0 40px rgb(234 88 12 / 0.6)',
  },
  investment: {
    stocks: {
      primary: '#ea580c', // Orange for primary investment category
      secondary: '#fb923c',
      gradient: 'from-orange-600 via-orange-500 to-amber-500',
      glow: 'shadow-orange-600/50',
    },
    crypto: {
      primary: '#f59e0b', // Gold/amber for crypto
      secondary: '#fbbf24',
      gradient: 'from-amber-600 via-yellow-500 to-orange-500',
      glow: 'shadow-amber-600/50',
    },
    art: {
      primary: '#dc2626', // Keep red for art (contrast with orange)
      secondary: '#ef4444',
      gradient: 'from-red-600 via-rose-500 to-pink-500',
      glow: 'shadow-red-600/50',
    },
    other: {
      primary: '#10b981', // Keep green for other investments
      secondary: '#34d399',
      gradient: 'from-emerald-600 via-green-500 to-teal-500',
      glow: 'shadow-emerald-600/50',
    },
  },
}

// Available themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  'dark-orange': darkOrangeTheme,
} as const

// Default theme
export const defaultTheme = lightTheme

// Theme utilities
export function getTheme(variant: ThemeVariant): ThemeConfig {
  return themes[variant] || defaultTheme
}

export function getInvestmentTheme(
  variant: ThemeVariant,
  category: keyof ThemeConfig['investment']
) {
  const theme = getTheme(variant)
  return theme.investment[category]
}

// CSS custom properties generator for theme switching
export function generateThemeCSS(theme: ThemeConfig): string {
  return `
    :root {
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      --card: ${theme.colors.card};
      --card-foreground: ${theme.colors.cardForeground};
      --border: ${theme.colors.border};
      --input: ${theme.colors.input};
      --ring: ${theme.colors.ring};
      --muted: ${theme.colors.muted};
      --muted-foreground: ${theme.colors.mutedForeground};
      --popover: ${theme.colors.popover};
      --popover-foreground: ${theme.colors.popoverForeground};
      --success: ${theme.colors.success};
      --warning: ${theme.colors.warning};
      --error: ${theme.colors.error};
      --info: ${theme.colors.info};
    }
  `
}
