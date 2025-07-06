// Chart-Specific Animations
// Specialized animations for financial charts and data visualizations

import { Variants, Transition } from 'framer-motion'
import { transitions, durations } from './transitions'

// =============================================================================
// CHART DRAWING ANIMATIONS
// =============================================================================

export const chartDrawingVariants = {
  // Line chart path drawing
  linePath: {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: 2,
          ease: 'easeInOut',
          delay: 0.2,
        },
        opacity: {
          duration: 0.5,
          delay: 0.2,
        },
      },
    },
  } as Variants,

  // Area chart fill animation
  areaFill: {
    hidden: {
      opacity: 0,
      scaleY: 0,
      originY: 1,
    },
    visible: {
      opacity: 0.6,
      scaleY: 1,
      transition: {
        scaleY: {
          duration: 1.5,
          ease: 'easeOut',
          delay: 0.5,
        },
        opacity: {
          duration: 0.8,
          delay: 0.5,
        },
      },
    },
  } as Variants,

  // Bar chart individual bars
  barChart: {
    hidden: {
      scaleY: 0,
      originY: 1,
      opacity: 0,
    },
    visible: (index: number) => ({
      scaleY: 1,
      opacity: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.8,
        ease: 'backOut',
      },
    }),
  } as Variants,

  // Candlestick chart
  candlestick: {
    hidden: {
      scaleY: 0,
      opacity: 0,
    },
    visible: (index: number) => ({
      scaleY: 1,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  } as Variants,

  // Pie chart sectors
  pieChart: {
    hidden: {
      scale: 0,
      rotate: -90,
      opacity: 0,
    },
    visible: (index: number) => ({
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        delay: index * 0.15,
        duration: 1,
        ease: 'backOut',
      },
    }),
  } as Variants,

  // Donut chart with center text
  donutChart: {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: 'backOut',
        delay: 0.3,
      },
    },
  } as Variants,
} as const

// =============================================================================
// DATA POINT ANIMATIONS
// =============================================================================

export const dataPointVariants = {
  // Scatter plot points
  scatterPoint: {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: (index: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: index * 0.03,
        duration: 0.5,
        ease: 'backOut',
      },
    }),
    hover: {
      scale: 1.5,
      transition: { duration: 0.2 },
    },
  } as Variants,

  // Line chart data points
  linePoint: {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: (index: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + index * 0.02, // Appear after line is drawn
        duration: 0.4,
        ease: 'backOut',
      },
    }),
    hover: {
      scale: 1.3,
      transition: { duration: 0.15 },
    },
  } as Variants,

  // Bubble chart bubbles
  bubble: {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: (index: number) => ({
      scale: 1,
      opacity: 0.8,
      transition: {
        delay: index * 0.08,
        duration: 0.8,
        ease: 'elasticOut',
      },
    }),
    hover: {
      scale: 1.1,
      opacity: 1,
      transition: { duration: 0.2 },
    },
  } as Variants,
} as const

// =============================================================================
// CHART INTERACTION ANIMATIONS
// =============================================================================

export const chartInteractionVariants = {
  // Tooltip appearance
  tooltip: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.1,
      },
    },
  } as Variants,

  // Chart legend
  legend: {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 1, // Appear after chart animation
        ease: 'easeOut',
      },
    },
  } as Variants,

  // Legend item
  legendItem: {
    hidden: {
      opacity: 0,
      x: -10,
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 1.2 + index * 0.05,
        duration: 0.3,
      },
    }),
    hover: {
      x: 5,
      transition: { duration: 0.2 },
    },
  } as Variants,

  // Chart axes
  axis: {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  } as Variants,

  // Chart grid lines
  gridLine: {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: (index: number) => ({
      pathLength: 1,
      opacity: 0.3,
      transition: {
        delay: index * 0.02,
        duration: 0.5,
      },
    }),
  } as Variants,
} as const

// =============================================================================
// FINANCIAL DATA ANIMATIONS
// =============================================================================

export const financialDataVariants = {
  // Number counter with currency
  currencyCounter: {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'backOut',
      },
    },
  } as Variants,

  // Percentage change indicator
  percentageChange: {
    positive: {
      color: '#22c55e',
      scale: 1.05,
      transition: { duration: 0.3 },
    },
    negative: {
      color: '#ef4444',
      scale: 1.05,
      transition: { duration: 0.3 },
    },
    neutral: {
      color: '#6b7280',
      scale: 1,
      transition: { duration: 0.3 },
    },
  } as Variants,

  // Price flash animation
  priceFlash: {
    rest: {
      backgroundColor: 'transparent',
    },
    flash: (type: 'positive' | 'negative') => ({
      backgroundColor: type === 'positive' ? '#22c55e20' : '#ef444420',
      transition: {
        duration: 0.3,
        repeat: 1,
        repeatType: 'reverse' as const,
      },
    }),
  } as Variants,

  // Portfolio allocation bar
  allocationBar: {
    hidden: {
      scaleX: 0,
      originX: 0,
    },
    visible: {
      scaleX: 1,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
        delay: 0.5,
      },
    },
  } as Variants,

  // Stock price trend arrow
  trendArrow: {
    up: {
      rotate: 0,
      color: '#22c55e',
      y: 0,
      transition: { duration: 0.3 },
    },
    down: {
      rotate: 180,
      color: '#ef4444',
      y: 0,
      transition: { duration: 0.3 },
    },
    flat: {
      rotate: 90,
      color: '#6b7280',
      y: 0,
      transition: { duration: 0.3 },
    },
  } as Variants,
} as const

// =============================================================================
// CHART LOADING ANIMATIONS
// =============================================================================

export const chartLoadingVariants = {
  // Skeleton chart lines
  skeletonLine: {
    loading: {
      opacity: [0.3, 0.8, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,

  // Loading spinner for charts
  chartSpinner: {
    loading: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  } as Variants,

  // Pulse animation for loading states
  chartPulse: {
    loading: {
      scale: [1, 1.05, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,

  // Shimmer effect for chart skeleton
  chartShimmer: {
    loading: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  } as Variants,
} as const

// =============================================================================
// PORTFOLIO PERFORMANCE ANIMATIONS
// =============================================================================

export const portfolioAnimationVariants = {
  // Portfolio card entrance
  portfolioCard: {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
      rotateX: -15,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.8,
        ease: 'backOut',
      },
    }),
    hover: {
      y: -10,
      scale: 1.02,
      rotateX: 5,
      transition: { duration: 0.3 },
    },
  } as Variants,

  // Holdings table row
  holdingRow: {
    hidden: {
      opacity: 0,
      x: -30,
      backgroundColor: 'transparent',
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.4,
      },
    }),
    hover: {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      x: 5,
      transition: { duration: 0.2 },
    },
    updated: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      transition: {
        duration: 0.5,
        repeat: 1,
        repeatType: 'reverse' as const,
      },
    },
  } as Variants,

  // Performance metric card
  metricCard: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 30,
    },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: index * 0.15,
        duration: 0.6,
        ease: 'backOut',
      },
    }),
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,
} as const

// =============================================================================
// CHART CONTAINER ANIMATIONS
// =============================================================================

export const chartContainerVariants = {
  // Main chart container
  chartContainer: {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as Variants,

  // Chart controls panel
  controlsPanel: {
    hidden: {
      opacity: 0,
      y: -20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.8, // Appear after chart
      },
    },
  } as Variants,

  // Time range selector
  timeSelector: {
    hidden: {
      opacity: 0,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: 1, // Appear last
      },
    },
  } as Variants,
} as const

// =============================================================================
// UTILITY FUNCTIONS FOR CHART ANIMATIONS
// =============================================================================

/**
 * Create a sequential chart animation that builds element by element
 */
export function createSequentialChartAnimation(
  elements: string[],
  baseDelay: number = 0.2,
  stagger: number = 0.3
): Record<string, Variants> {
  const animations: Record<string, Variants> = {}

  elements.forEach((element, index) => {
    animations[element] = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delay: baseDelay + index * stagger,
          duration: 0.5,
        },
      },
    }
  })

  return animations
}

/**
 * Create a data-driven animation based on chart data length
 */
export function createDataDrivenAnimation(
  dataLength: number,
  maxDelay: number = 2
): Variants {
  const delayPerItem = Math.min(maxDelay / dataLength, 0.1)

  return {
    hidden: { opacity: 0, scale: 0 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * delayPerItem,
        duration: 0.5,
        ease: 'backOut',
      },
    }),
  }
}

/**
 * Create a chart update animation that smoothly transitions between data states
 */
export function createChartUpdateAnimation(duration: number = 0.8): Transition {
  return {
    duration,
    ease: 'easeInOut',
  }
}
