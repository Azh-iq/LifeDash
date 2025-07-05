// Framer Motion Transitions Library
// Reusable transition presets for consistent animations across the app

import { Transition, Variants } from 'framer-motion'

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

export const easings = {
  // Custom cubic-bezier easings
  smooth: [0.25, 0.46, 0.45, 0.94],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: [0.175, 0.885, 0.32, 1.275],
  sharp: [0.4, 0.0, 0.2, 1],
  gentle: [0.25, 0.1, 0.25, 1],
  
  // Physical-based easings
  elastic: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0.215, 0.61, 0.355, 1],
  backOut: [0.175, 0.885, 0.32, 1.275],
  circOut: [0, 0.55, 0.45, 1]
} as const

// =============================================================================
// DURATION PRESETS
// =============================================================================

export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.75,
  slowest: 1.0
} as const

// =============================================================================
// BASIC TRANSITIONS
// =============================================================================

export const transitions = {
  // Quick and snappy
  fast: {
    duration: durations.fast,
    ease: easings.sharp
  } as Transition,

  // Standard smooth transition
  smooth: {
    duration: durations.normal,
    ease: easings.smooth
  } as Transition,

  // Bouncy entrance
  bounce: {
    duration: durations.slow,
    ease: easings.bounce
  } as Transition,

  // Spring-based animation
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.5
  } as Transition,

  // Gentle spring
  gentleSpring: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    mass: 0.8
  } as Transition,

  // Strong spring for dramatic effects
  strongSpring: {
    type: 'spring',
    stiffness: 600,
    damping: 20,
    mass: 0.3
  } as Transition,

  // Elastic bounce
  elastic: {
    duration: durations.slower,
    ease: easings.elastic
  } as Transition,

  // Page transitions
  page: {
    duration: durations.slow,
    ease: easings.gentle
  } as Transition,

  // Modal/overlay transitions
  modal: {
    duration: durations.normal,
    ease: easings.smooth
  } as Transition,

  // Hover effects
  hover: {
    duration: durations.fast,
    ease: easings.smooth
  } as Transition,

  // Layout changes
  layout: {
    duration: durations.normal,
    ease: easings.smooth
  } as Transition
} as const

// =============================================================================
// STAGGER TRANSITIONS
// =============================================================================

export const staggerTransitions = {
  // Quick stagger for lists
  list: {
    staggerChildren: 0.1,
    delayChildren: 0.2
  },

  // Slow stagger for hero elements
  hero: {
    staggerChildren: 0.2,
    delayChildren: 0.3
  },

  // Card grid stagger
  grid: {
    staggerChildren: 0.05,
    delayChildren: 0.1
  },

  // Menu items
  menu: {
    staggerChildren: 0.03,
    delayChildren: 0.1
  },

  // Portfolio items
  portfolio: {
    staggerChildren: 0.08,
    delayChildren: 0.2
  }
} as const

// =============================================================================
// CHART TRANSITIONS
// =============================================================================

export const chartTransitions = {
  // Line chart draw animation
  lineDraw: {
    duration: 1.5,
    ease: easings.smooth
  } as Transition,

  // Bar chart grow animation
  barGrow: {
    duration: 0.8,
    ease: easings.backOut,
    delay: 0.1
  } as Transition,

  // Pie chart sector animation
  pieSlice: {
    duration: 1.0,
    ease: easings.backOut
  } as Transition,

  // Number counter animation
  counter: {
    duration: 1.2,
    ease: easings.smooth
  } as Transition,

  // Chart legend fade
  legend: {
    duration: 0.4,
    ease: easings.smooth
  } as Transition,

  // Tooltip appearance
  tooltip: {
    duration: 0.15,
    ease: easings.sharp
  } as Transition
} as const

// =============================================================================
// GESTURE TRANSITIONS
// =============================================================================

export const gestureTransitions = {
  // Tap feedback
  tap: {
    duration: 0.1,
    ease: easings.sharp
  } as Transition,

  // Drag feedback
  drag: {
    duration: 0.2,
    ease: easings.smooth
  } as Transition,

  // Swipe animations
  swipe: {
    duration: 0.4,
    ease: easings.smooth
  } as Transition,

  // Pull to refresh
  pullRefresh: {
    type: 'spring',
    stiffness: 300,
    damping: 30
  } as Transition
} as const

// =============================================================================
// LOADING TRANSITIONS
// =============================================================================

export const loadingTransitions = {
  // Spinner rotation
  spinner: {
    duration: 1,
    ease: 'linear',
    repeat: Infinity
  } as Transition,

  // Pulse animation
  pulse: {
    duration: 1.5,
    ease: easings.smooth,
    repeat: Infinity,
    repeatType: 'reverse' as const
  } as Transition,

  // Skeleton shimmer
  shimmer: {
    duration: 1.5,
    ease: 'linear',
    repeat: Infinity
  } as Transition,

  // Progress bar
  progress: {
    duration: 0.5,
    ease: easings.smooth
  } as Transition,

  // Dots bouncing
  dots: {
    duration: 0.6,
    ease: easings.smooth,
    repeat: Infinity,
    repeatType: 'reverse' as const
  } as Transition
} as const

// =============================================================================
// NOTIFICATION TRANSITIONS
// =============================================================================

export const notificationTransitions = {
  // Toast slide in
  toast: {
    duration: 0.3,
    ease: easings.backOut
  } as Transition,

  // Success notification
  success: {
    duration: 0.4,
    ease: easings.bounce
  } as Transition,

  // Error shake
  errorShake: {
    duration: 0.5,
    ease: easings.smooth
  } as Transition,

  // Warning pulse
  warning: {
    duration: 0.8,
    ease: easings.smooth,
    repeat: 2,
    repeatType: 'reverse' as const
  } as Transition
} as const

// =============================================================================
// FINANCIAL UI TRANSITIONS
// =============================================================================

export const financialTransitions = {
  // Price change flash
  priceFlash: {
    duration: 0.3,
    ease: easings.smooth
  } as Transition,

  // Portfolio value update
  valueUpdate: {
    duration: 0.6,
    ease: easings.backOut
  } as Transition,

  // Stock card hover
  stockHover: {
    duration: 0.2,
    ease: easings.smooth
  } as Transition,

  // Portfolio card entrance
  portfolioCard: {
    duration: 0.5,
    ease: easings.backOut
  } as Transition,

  // Metric card flip
  metricFlip: {
    duration: 0.4,
    ease: easings.smooth
  } as Transition
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a custom transition with override parameters
 */
export function createTransition(
  base: Transition,
  overrides?: Partial<Transition>
): Transition {
  return { ...base, ...overrides }
}

/**
 * Create a staggered transition for container animations
 */
export function createStagger(
  staggerChildren: number = 0.1,
  delayChildren: number = 0
): Transition {
  return {
    staggerChildren,
    delayChildren
  }
}

/**
 * Create a spring transition with custom parameters
 */
export function createSpring(
  stiffness: number = 400,
  damping: number = 25,
  mass: number = 0.5
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass
  }
}

/**
 * Create a delayed transition
 */
export function withDelay(
  transition: Transition,
  delay: number
): Transition {
  return { ...transition, delay }
}

/**
 * Create a repeating transition
 */
export function withRepeat(
  transition: Transition,
  repeat: number = Infinity,
  repeatType: 'loop' | 'reverse' | 'mirror' = 'loop'
): Transition {
  return { ...transition, repeat, repeatType }
}

/**
 * Get transition duration for timing calculations
 */
export function getTransitionDuration(transition: Transition): number {
  if (typeof transition.duration === 'number') {
    return transition.duration
  }
  if (transition.type === 'spring') {
    // Estimate spring duration based on stiffness and damping
    const stiffness = transition.stiffness || 100
    const damping = transition.damping || 10
    return Math.sqrt(4 * Math.PI * Math.PI / stiffness) * damping / 100
  }
  return durations.normal // Default fallback
}