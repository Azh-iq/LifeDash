// Framer Motion Animation Library
// Central export for all animation utilities, transitions, and variants

// Core animation utilities
export * from './transitions'
export * from './variants'
export * from './chart-animations'

// Re-export commonly used Framer Motion types for convenience
export type {
  Variants,
  Transition,
  MotionProps,
  AnimationControls,
  UseAnimationControlsType,
} from 'framer-motion'

// Animation library configuration
export const animationConfig = {
  // Global animation settings
  reducedMotion: false, // Can be set based on user preference

  // Default durations (in seconds)
  durations: {
    instant: 0,
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.75,
    slowest: 1.0,
  },

  // Default easing curves
  easings: {
    default: [0.25, 0.46, 0.45, 0.94],
    spring: [0.175, 0.885, 0.32, 1.275],
    bounce: [0.68, -0.55, 0.265, 1.55],
    sharp: [0.4, 0.0, 0.2, 1],
  },

  // Stagger settings
  stagger: {
    list: 0.1,
    grid: 0.05,
    hero: 0.2,
    cards: 0.08,
  },
} as const

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

/**
 * Quick access to commonly used animation combinations
 */
export const animationPresets = {
  // Page entrance
  pageEnter: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
      },
      exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 },
      },
    },
  },

  // Card hover
  cardHover: {
    whileHover: {
      y: -4,
      scale: 1.02,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 },
    },
    whileTap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },

  // Button interaction
  buttonPress: {
    whileHover: {
      scale: 1.05,
      transition: { duration: 0.15 },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  },

  // Modal appearance
  modalAppear: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: {
      hidden: {
        opacity: 0,
        scale: 0.8,
        y: 50,
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        y: 50,
        transition: { duration: 0.2 },
      },
    },
  },

  // List stagger
  listStagger: {
    initial: 'hidden',
    animate: 'visible',
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },
  },

  // List item
  listItem: {
    variants: {
      hidden: {
        opacity: 0,
        y: 20,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      },
    },
  },
} as const

// =============================================================================
// ANIMATION HOOKS AND UTILITIES
// =============================================================================

/**
 * Check if reduced motion is preferred
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(duration: number): number {
  return shouldReduceMotion() ? 0 : duration
}

/**
 * Create a responsive animation that adapts to screen size
 */
export function createResponsiveAnimation(desktop: any, mobile: any): any {
  if (typeof window === 'undefined') return desktop
  return window.innerWidth >= 768 ? desktop : mobile
}

/**
 * Create a performance-optimized animation variant
 */
export function createOptimizedVariant(
  baseVariant: any,
  optimizations: {
    willChange?: string
    transform3d?: boolean
  } = {}
): any {
  const optimized = { ...baseVariant }

  if (optimizations.willChange) {
    optimized.willChange = optimizations.willChange
  }

  if (optimizations.transform3d) {
    // Force GPU acceleration
    optimized.transform = optimized.transform || 'translateZ(0)'
  }

  return optimized
}

// =============================================================================
// FINANCIAL UI SPECIFIC ANIMATIONS
// =============================================================================

/**
 * Financial data update animation with flash effect
 */
export const financialAnimations = {
  priceUpdate: (isPositive: boolean) => ({
    animate: {
      backgroundColor: isPositive
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(239, 68, 68, 0.2)',
      transition: {
        duration: 0.3,
        repeat: 1,
        repeatType: 'reverse' as const,
      },
    },
  }),

  portfolioValueChange: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  },

  stockRowHighlight: {
    whileHover: {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      x: 5,
      transition: { duration: 0.2 },
    },
  },
} as const

// =============================================================================
// CHART SPECIFIC ANIMATIONS
// =============================================================================

/**
 * Chart-specific animation utilities
 */
export const chartAnimations = {
  drawLine: (duration: number = 2) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration, ease: 'easeInOut' },
        opacity: { duration: 0.5 },
      },
    },
  }),

  growBar: (delay: number = 0) => ({
    initial: { scaleY: 0, originY: 1 },
    animate: {
      scaleY: 1,
      transition: {
        delay,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }),

  fadeInPie: (delay: number = 0) => ({
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        delay,
        duration: 0.8,
        ease: 'backOut',
      },
    },
  }),
} as const

// =============================================================================
// THEME-AWARE ANIMATIONS
// =============================================================================

/**
 * Create animations that respect the current theme
 */
export const themeAnimations = {
  // Light theme optimized shadows
  lightTheme: {
    cardShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    hoverShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  },

  // Dark theme optimized shadows
  darkTheme: {
    cardShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    hoverShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  },
} as const

// =============================================================================
// ACCESSIBILITY FEATURES
// =============================================================================

/**
 * Accessibility-aware animation variants
 */
export const a11yAnimations = {
  respectMotionPreference: (animatedVariant: any, staticVariant: any) => {
    return shouldReduceMotion() ? staticVariant : animatedVariant
  },

  // Focus-visible animations
  focusVisible: {
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
    transition: { duration: 0.15 },
  },
} as const

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Animation performance utilities
 */
export const animationPerformance = {
  // Mark animation start for performance monitoring
  markAnimationStart: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`animation-${name}-start`)
    }
  },

  // Mark animation end and measure duration
  markAnimationEnd: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`animation-${name}-end`)
      performance.measure(
        `animation-${name}`,
        `animation-${name}-start`,
        `animation-${name}-end`
      )
    }
  },
} as const
