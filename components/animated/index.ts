// Animated Components Library
// Export all enhanced animated components with Framer Motion
import { useState, useEffect } from 'react'

// Import components first
import AnimatedCard, { PortfolioCard, MetricCard, InteractiveCard } from './animated-card'
import NumberCounter, { CurrencyCounter, PercentageCounter, StockPriceCounter, PortfolioValueCounter } from './number-counter'
import ProgressRing, { AllocationRing, PerformanceRing, GoalProgressRing, MultiRingProgress } from './progress-ring'

// Core animated components
export { default as AnimatedCard, PortfolioCard, MetricCard, InteractiveCard } from './animated-card'
export type { AnimatedCardProps } from './animated-card'

export { 
  default as NumberCounter, 
  CurrencyCounter, 
  PercentageCounter, 
  StockPriceCounter,
  PortfolioValueCounter 
} from './number-counter'
export type { NumberCounterProps } from './number-counter'

export { 
  default as ProgressRing,
  AllocationRing,
  PerformanceRing,
  GoalProgressRing,
  MultiRingProgress
} from './progress-ring'
export type { ProgressRingProps } from './progress-ring'

// Animation library re-exports for convenience
export {
  entranceVariants,
  interactionVariants,
  containerVariants,
  modalVariants,
  chartVariants,
  financialVariants,
  notificationVariants,
  pageVariants,
  animationPresets,
  shouldReduceMotion,
  getAnimationDuration,
  createResponsiveAnimation
} from '@/lib/animations'

// =============================================================================
// COMPONENT COLLECTIONS
// =============================================================================

/**
 * Financial UI component collection
 */
export const FinancialComponents = {
  Card: AnimatedCard,
  PortfolioCard,
  MetricCard,
  InteractiveCard,
  NumberCounter,
  CurrencyCounter,
  PercentageCounter,
  StockPriceCounter,
  PortfolioValueCounter,
  ProgressRing,
  AllocationRing,
  PerformanceRing,
  GoalProgressRing,
  MultiRingProgress
} as const

/**
 * Animation preset configurations for common use cases
 */
export const AnimationPresets = {
  // Page transitions
  pageTransition: {
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    }
  },
  
  // Portfolio grid animation
  portfolioGrid: {
    initial: "hidden",
    animate: "visible",
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    }
  },
  
  // Financial metrics stagger
  metricsStagger: {
    initial: "hidden",
    animate: "visible",
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.15,
          delayChildren: 0.3
        }
      }
    }
  },
  
  // Chart reveal animation
  chartReveal: {
    initial: "hidden",
    animate: "visible",
    variants: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: 0.6,
          ease: "easeOut",
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    }
  }
} as const

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for managing animation states
 */
export function useAnimationState() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationQueue, setAnimationQueue] = useState<string[]>([])
  
  const startAnimation = (id: string) => {
    setIsAnimating(true)
    setAnimationQueue(prev => [...prev, id])
  }
  
  const endAnimation = (id: string) => {
    setAnimationQueue(prev => prev.filter(item => item !== id))
  }
  
  useEffect(() => {
    setIsAnimating(animationQueue.length > 0)
  }, [animationQueue])
  
  return {
    isAnimating,
    startAnimation,
    endAnimation,
    activeAnimations: animationQueue
  }
}

/**
 * Hook for responsive animation configurations
 */
export function useResponsiveAnimation() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const getAnimation = (desktop: any, mobile: any) => {
    return isMobile ? mobile : desktop
  }
  
  const getDuration = (desktop: number, mobile: number = desktop * 0.7) => {
    return isMobile ? mobile : desktop
  }
  
  return {
    isMobile,
    getAnimation,
    getDuration
  }
}

/**
 * Hook for performance-aware animations
 */
export function usePerformanceAnimation() {
  const [canAnimate, setCanAnimate] = useState(true)
  
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setCanAnimate(!mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setCanAnimate(!e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  const getProps = (animatedProps: any, staticProps: any = {}) => {
    return canAnimate ? animatedProps : staticProps
  }
  
  return {
    canAnimate,
    getProps
  }
}

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

/**
 * Create a staggered animation for lists
 */
export function createListAnimation(
  itemCount: number,
  staggerDelay: number = 0.1,
  baseDelay: number = 0.2
) {
  return {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: baseDelay
        }
      }
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 }
      }
    }
  }
}

/**
 * Create a portfolio value update animation
 */
export function createValueUpdateAnimation(
  isPositive: boolean,
  magnitude: number = 1
) {
  const intensity = Math.min(magnitude, 3) // Cap intensity
  
  return {
    scale: [1, 1 + (intensity * 0.02), 1],
    backgroundColor: [
      'transparent',
      isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      'transparent'
    ],
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
}

/**
 * Create a chart animation sequence
 */
export function createChartSequence() {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          when: "beforeChildren",
          staggerChildren: 0.2,
          delayChildren: 0.1
        }
      }
    },
    axis: {
      hidden: { pathLength: 0, opacity: 0 },
      visible: { 
        pathLength: 1, 
        opacity: 1,
        transition: { duration: 0.8 }
      }
    },
    data: {
      hidden: { pathLength: 0, opacity: 0 },
      visible: { 
        pathLength: 1, 
        opacity: 1,
        transition: { duration: 1.5, ease: "easeInOut" }
      }
    },
    points: {
      hidden: { scale: 0, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { duration: 0.4, delay: 1.2 }
      }
    }
  }
}

// =============================================================================
// THEME INTEGRATION
// =============================================================================

/**
 * Animation configurations that adapt to theme
 */
export const ThemeAnimations = {
  light: {
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    hoverShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glowColor: 'rgba(59, 130, 246, 0.1)'
  },
  dark: {
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    hoverShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    glowColor: 'rgba(59, 130, 246, 0.2)'
  }
} as const

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Performance monitoring for animations
 */
export const AnimationMetrics = {
  startTiming: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`animation-${name}-start`)
    }
  },
  
  endTiming: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`animation-${name}-end`)
      performance.measure(
        `animation-${name}`,
        `animation-${name}-start`,
        `animation-${name}-end`
      )
    }
  },
  
  getMetrics: (name: string) => {
    if (typeof performance !== 'undefined') {
      const measures = performance.getEntriesByName(`animation-${name}`)
      return measures.length > 0 ? measures[measures.length - 1] : null
    }
    return null
  }
} as const

// Re-export commonly used React hooks
export { useState, useEffect, useCallback, useMemo } from 'react'

// Re-export Framer Motion components for convenience
export { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion'