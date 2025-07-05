// Framer Motion Variants Library
// Predefined animation variants for consistent motion design

import { Variants } from 'framer-motion'
import { transitions, staggerTransitions } from './transitions'

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

export const entranceVariants = {
  // Fade in from transparent
  fadeIn: {
    hidden: { 
      opacity: 0 
    },
    visible: { 
      opacity: 1,
      transition: transitions.smooth
    },
    exit: { 
      opacity: 0,
      transition: transitions.fast
    }
  } as Variants,

  // Slide up from bottom
  slideUp: {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transitions.bounce
    },
    exit: { 
      opacity: 0, 
      y: -30,
      transition: transitions.fast
    }
  } as Variants,

  // Slide down from top
  slideDown: {
    hidden: { 
      opacity: 0, 
      y: -30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transitions.bounce
    },
    exit: { 
      opacity: 0, 
      y: 30,
      transition: transitions.fast
    }
  } as Variants,

  // Slide in from left
  slideLeft: {
    hidden: { 
      opacity: 0, 
      x: -30 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      x: -30,
      transition: transitions.fast
    }
  } as Variants,

  // Slide in from right
  slideRight: {
    hidden: { 
      opacity: 0, 
      x: 30 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      x: 30,
      transition: transitions.fast
    }
  } as Variants,

  // Scale in from small
  scaleIn: {
    hidden: { 
      opacity: 0, 
      scale: 0.8 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: transitions.bounce
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: transitions.fast
    }
  } as Variants,

  // Zoom in with rotation
  zoomRotate: {
    hidden: { 
      opacity: 0, 
      scale: 0.5, 
      rotate: -180 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: transitions.elastic
    },
    exit: { 
      opacity: 0, 
      scale: 0.5, 
      rotate: 180,
      transition: transitions.fast
    }
  } as Variants,

  // Flip in vertically
  flipIn: {
    hidden: { 
      opacity: 0, 
      rotateX: -90 
    },
    visible: { 
      opacity: 1, 
      rotateX: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      rotateX: 90,
      transition: transitions.fast
    }
  } as Variants
} as const

// =============================================================================
// CONTAINER ANIMATIONS (for staggered children)
// =============================================================================

export const containerVariants = {
  // Staggered list animation
  list: {
    hidden: {},
    visible: {
      transition: staggerTransitions.list
    },
    exit: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  } as Variants,

  // Grid container animation
  grid: {
    hidden: {},
    visible: {
      transition: staggerTransitions.grid
    },
    exit: {
      transition: { staggerChildren: 0.02, staggerDirection: -1 }
    }
  } as Variants,

  // Hero section animation
  hero: {
    hidden: {},
    visible: {
      transition: staggerTransitions.hero
    }
  } as Variants,

  // Menu container
  menu: {
    hidden: {},
    visible: {
      transition: staggerTransitions.menu
    },
    exit: {
      transition: { staggerChildren: 0.02, staggerDirection: -1 }
    }
  } as Variants,

  // Portfolio cards container
  portfolio: {
    hidden: {},
    visible: {
      transition: staggerTransitions.portfolio
    },
    exit: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  } as Variants
} as const

// =============================================================================
// INTERACTION ANIMATIONS
// =============================================================================

export const interactionVariants = {
  // Button hover and tap
  button: {
    rest: { 
      scale: 1 
    },
    hover: { 
      scale: 1.05,
      transition: transitions.hover
    },
    tap: { 
      scale: 0.95,
      transition: transitions.fast
    }
  } as Variants,

  // Card hover effect
  card: {
    rest: { 
      scale: 1, 
      y: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    hover: { 
      scale: 1.02, 
      y: -4,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: transitions.hover
    },
    tap: { 
      scale: 0.98,
      transition: transitions.fast
    }
  } as Variants,

  // Icon button interaction
  iconButton: {
    rest: { 
      scale: 1, 
      rotate: 0 
    },
    hover: { 
      scale: 1.1, 
      rotate: 5,
      transition: transitions.hover
    },
    tap: { 
      scale: 0.9, 
      rotate: -5,
      transition: transitions.fast
    }
  } as Variants,

  // Link hover effect
  link: {
    rest: { 
      scale: 1 
    },
    hover: { 
      scale: 1.02,
      transition: transitions.fast
    }
  } as Variants
} as const

// =============================================================================
// MODAL AND OVERLAY ANIMATIONS
// =============================================================================

export const modalVariants = {
  // Standard modal
  modal: {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: transitions.fast
    }
  } as Variants,

  // Modal backdrop
  backdrop: {
    hidden: { 
      opacity: 0 
    },
    visible: { 
      opacity: 1,
      transition: transitions.modal
    },
    exit: { 
      opacity: 0,
      transition: transitions.fast
    }
  } as Variants,

  // Slide up modal (mobile)
  slideUpModal: {
    hidden: { 
      opacity: 0, 
      y: '100%' 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      y: '100%',
      transition: transitions.fast
    }
  } as Variants,

  // Drawer from side
  drawer: {
    hidden: { 
      x: '-100%' 
    },
    visible: { 
      x: 0,
      transition: transitions.spring
    },
    exit: { 
      x: '-100%',
      transition: transitions.fast
    }
  } as Variants,

  // Dropdown menu
  dropdown: {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: transitions.bounce
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: transitions.fast
    }
  } as Variants
} as const

// =============================================================================
// CHART ANIMATIONS
// =============================================================================

export const chartVariants = {
  // Line path drawing
  linePath: {
    hidden: { 
      pathLength: 0,
      opacity: 0
    },
    visible: { 
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }
    }
  } as Variants,

  // Bar chart bars
  bar: {
    hidden: { 
      scaleY: 0,
      originY: 1
    },
    visible: (i: number) => ({
      scaleY: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  } as Variants,

  // Pie chart sectors
  pieSlice: {
    hidden: { 
      scale: 0,
      opacity: 0
    },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: "backOut"
      }
    })
  } as Variants,

  // Number counter
  counter: {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: transitions.smooth
    }
  } as Variants,

  // Chart legend items
  legendItem: {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  } as Variants
} as const

// =============================================================================
// FINANCIAL UI ANIMATIONS
// =============================================================================

export const financialVariants = {
  // Price change flash effect
  priceFlash: {
    rest: { 
      backgroundColor: 'transparent' 
    },
    positive: { 
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      transition: { duration: 0.3, repeat: 1, repeatType: 'reverse' as const }
    },
    negative: { 
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      transition: { duration: 0.3, repeat: 1, repeatType: 'reverse' as const }
    }
  } as Variants,

  // Portfolio card
  portfolioCard: {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: transitions.spring
    },
    hover: { 
      y: -8,
      scale: 1.02,
      transition: transitions.hover
    }
  } as Variants,

  // Stock row
  stockRow: {
    hidden: { 
      opacity: 0, 
      x: -20 
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    }),
    hover: { 
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      transition: transitions.fast
    }
  } as Variants,

  // Metric card
  metricCard: {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateX: -90
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateX: 0,
      transition: transitions.bounce
    },
    hover: { 
      scale: 1.05,
      rotateX: 5,
      transition: transitions.hover
    }
  } as Variants,

  // Loading skeleton
  skeleton: {
    loading: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  } as Variants
} as const

// =============================================================================
// NOTIFICATION ANIMATIONS
// =============================================================================

export const notificationVariants = {
  // Toast notification
  toast: {
    hidden: { 
      opacity: 0, 
      y: -50,
      scale: 0.3
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: transitions.bounce
    },
    exit: { 
      opacity: 0, 
      y: -50,
      scale: 0.3,
      transition: transitions.fast
    }
  } as Variants,

  // Success checkmark
  successCheck: {
    hidden: { 
      pathLength: 0,
      opacity: 0
    },
    visible: { 
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.5, ease: "easeOut" },
        opacity: { duration: 0.2 }
      }
    }
  } as Variants,

  // Error shake
  errorShake: {
    rest: { x: 0 },
    shake: {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  } as Variants,

  // Alert pulse
  alertPulse: {
    rest: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  } as Variants
} as const

// =============================================================================
// PAGE TRANSITION ANIMATIONS
// =============================================================================

export const pageVariants = {
  // Standard page transition
  page: {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: transitions.page
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: transitions.fast
    }
  } as Variants,

  // Slide page transition
  slidePage: {
    hidden: { 
      opacity: 0, 
      x: 300 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: transitions.spring
    },
    exit: { 
      opacity: 0, 
      x: -300,
      transition: transitions.fast
    }
  } as Variants,

  // Fade page transition
  fadePage: {
    hidden: { 
      opacity: 0 
    },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  } as Variants
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a custom variant with base properties
 */
export function createVariant(
  hidden: any,
  visible: any,
  exit?: any,
  transition?: any
): Variants {
  return {
    hidden,
    visible: {
      ...visible,
      transition: transition || transitions.smooth
    },
    ...(exit && { exit })
  }
}

/**
 * Create a staggered container variant
 */
export function createStaggerContainer(
  staggerChildren: number = 0.1,
  delayChildren: number = 0
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren
      }
    },
    exit: {
      transition: {
        staggerChildren: staggerChildren / 2,
        staggerDirection: -1
      }
    }
  }
}

/**
 * Create an indexed variant for staggered animations
 */
export function createIndexedVariant(
  baseVariant: Variants,
  delayMultiplier: number = 0.1
): Variants {
  return {
    ...baseVariant,
    visible: (i: number) => ({
      ...baseVariant.visible,
      transition: {
        ...baseVariant.visible.transition,
        delay: i * delayMultiplier
      }
    })
  }
}