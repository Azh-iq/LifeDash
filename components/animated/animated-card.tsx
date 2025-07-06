'use client'

// Animated Card Component
// Enhanced card with Framer Motion animations and interaction states

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardProps } from '@/components/ui/card'
import {
  entranceVariants,
  interactionVariants,
  shouldReduceMotion,
} from '@/lib/animations'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AnimatedCardProps extends Omit<CardProps, 'children'> {
  children: ReactNode

  // Animation configuration
  animation?:
    | 'fadeIn'
    | 'slideUp'
    | 'slideDown'
    | 'slideLeft'
    | 'slideRight'
    | 'scaleIn'
    | 'none'
  delay?: number
  index?: number // For staggered animations

  // Interaction animations
  hover?: boolean
  tap?: boolean
  hoverScale?: number
  hoverY?: number
  tapScale?: number

  // Visual enhancements
  gradient?: boolean
  glow?: boolean
  depth?: 'flat' | 'shallow' | 'medium' | 'deep'

  // Layout and positioning
  layout?: boolean // Enable layout animations
  layoutId?: string

  // Custom motion props
  motionProps?: MotionProps

  // Event handlers
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const cardDepthStyles = {
  flat: 'shadow-none',
  shallow: 'shadow-sm hover:shadow-md',
  medium: 'shadow-md hover:shadow-lg',
  deep: 'shadow-lg hover:shadow-xl',
} as const

const createHoverVariant = (scale: number = 1.02, y: number = -4) => ({
  scale,
  y,
  boxShadow:
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transition: {
    duration: 0.2,
    ease: [0.25, 0.46, 0.45, 0.94],
  },
})

const createTapVariant = (scale: number = 0.98) => ({
  scale,
  transition: {
    duration: 0.1,
    ease: [0.25, 0.46, 0.45, 0.94],
  },
})

// =============================================================================
// ANIMATED CARD COMPONENT
// =============================================================================

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      className,
      animation = 'fadeIn',
      delay = 0,
      index = 0,
      hover = true,
      tap = true,
      hoverScale = 1.02,
      hoverY = -4,
      tapScale = 0.98,
      gradient = false,
      glow = false,
      depth = 'medium',
      layout = false,
      layoutId,
      motionProps = {},
      onAnimationStart,
      onAnimationComplete,
      ...props
    },
    ref
  ) => {
    // Calculate staggered delay
    const animationDelay = delay + index * 0.1

    // Respect reduced motion preference
    const reducedMotion = shouldReduceMotion()
    const finalAnimation = reducedMotion ? 'none' : animation

    // Build motion props
    const defaultMotionProps: MotionProps = {
      layout: layout,
      layoutId: layoutId,
      initial: finalAnimation !== 'none' ? 'hidden' : undefined,
      animate: finalAnimation !== 'none' ? 'visible' : undefined,
      variants:
        finalAnimation !== 'none'
          ? entranceVariants[finalAnimation]
          : undefined,
      transition:
        finalAnimation !== 'none'
          ? {
              ...entranceVariants[finalAnimation]?.visible?.transition,
              delay: animationDelay,
            }
          : undefined,
      whileHover:
        hover && !reducedMotion
          ? createHoverVariant(hoverScale, hoverY)
          : undefined,
      whileTap: tap && !reducedMotion ? createTapVariant(tapScale) : undefined,
      onAnimationStart,
      onAnimationComplete,
      ...motionProps,
    }

    // Build CSS classes
    const cardClasses = cn(
      'relative overflow-hidden transition-all duration-200',
      cardDepthStyles[depth],
      {
        // Gradient overlay
        'bg-gradient-to-br from-white via-white to-blue-50': gradient && !glow,
        'dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20':
          gradient && !glow,

        // Glow effect
        'bg-gradient-to-br from-blue-50 via-white to-purple-50': glow,
        'dark:from-blue-900/20 dark:via-gray-900 dark:to-purple-900/20': glow,
        'ring-1 ring-blue-200/50 dark:ring-blue-700/50': glow,

        // Hover cursor
        'cursor-pointer': hover || tap,
      },
      className
    )

    return (
      <motion.div ref={ref} className={cardClasses} {...defaultMotionProps}>
        <Card {...props} className="h-full border-0 bg-transparent shadow-none">
          {children}
        </Card>

        {/* Glow overlay */}
        {glow && (
          <motion.div
            className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

// =============================================================================
// SPECIALIZED CARD VARIANTS
// =============================================================================

/**
 * Portfolio Card - Specialized for investment portfolio display
 */
export const PortfolioCard = forwardRef<
  HTMLDivElement,
  AnimatedCardProps & {
    trend?: 'positive' | 'negative' | 'neutral'
    value?: number
    change?: number
  }
>(
  (
    { trend = 'neutral', value, change, className, children, ...props },
    ref
  ) => {
    const trendColors = {
      positive: 'ring-green-200/50 dark:ring-green-700/50',
      negative: 'ring-red-200/50 dark:ring-red-700/50',
      neutral: 'ring-blue-200/50 dark:ring-blue-700/50',
    }

    return (
      <AnimatedCard
        ref={ref}
        className={cn('ring-1', trendColors[trend], className)}
        gradient
        depth="medium"
        {...props}
      >
        {children}

        {/* Performance indicator overlay */}
        <motion.div
          className={cn('absolute right-0 top-0 h-full w-1', {
            'bg-green-500': trend === 'positive',
            'bg-red-500': trend === 'negative',
            'bg-blue-500': trend === 'neutral',
          })}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </AnimatedCard>
    )
  }
)

PortfolioCard.displayName = 'PortfolioCard'

/**
 * Metric Card - For displaying financial metrics with emphasis
 */
export const MetricCard = forwardRef<
  HTMLDivElement,
  AnimatedCardProps & {
    highlight?: boolean
    urgent?: boolean
  }
>(
  (
    { highlight = false, urgent = false, className, children, ...props },
    ref
  ) => {
    return (
      <AnimatedCard
        ref={ref}
        className={cn(
          {
            'bg-blue-50/50 ring-2 ring-blue-500/20': highlight,
            'bg-red-50/50 ring-2 ring-red-500/20': urgent,
            'dark:bg-blue-900/20': highlight,
            'dark:bg-red-900/20': urgent,
          },
          className
        )}
        hoverScale={highlight || urgent ? 1.05 : 1.02}
        glow={highlight}
        {...props}
      >
        {children}

        {/* Urgent pulse animation */}
        {urgent && (
          <motion.div
            className="absolute inset-0 rounded-lg ring-2 ring-red-400/50"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatedCard>
    )
  }
)

MetricCard.displayName = 'MetricCard'

/**
 * Interactive Card - Enhanced interactions for clickable content
 */
export const InteractiveCard = forwardRef<
  HTMLDivElement,
  AnimatedCardProps & {
    onClick?: () => void
    selected?: boolean
    disabled?: boolean
  }
>(
  (
    {
      onClick,
      selected = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <AnimatedCard
        ref={ref}
        className={cn(
          'transition-all duration-200',
          {
            'bg-blue-50/50 ring-2 ring-blue-500 dark:bg-blue-900/20': selected,
            'cursor-not-allowed opacity-50': disabled,
            'cursor-pointer': !disabled && onClick,
          },
          className
        )}
        hover={!disabled}
        tap={!disabled}
        onClick={disabled ? undefined : onClick}
        motionProps={{
          whileHover: disabled
            ? undefined
            : {
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 },
              },
          whileTap: disabled
            ? undefined
            : {
                scale: 0.98,
                transition: { duration: 0.1 },
              },
        }}
        {...props}
      >
        {children}
      </AnimatedCard>
    )
  }
)

InteractiveCard.displayName = 'InteractiveCard'

// =============================================================================
// EXPORTS
// =============================================================================

export default AnimatedCard
