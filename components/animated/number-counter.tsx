'use client'

// Animated Number Counter Component
// Smooth counting animations for financial figures and metrics

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { shouldReduceMotion } from '@/lib/animations'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface NumberCounterProps {
  // Core value properties
  value: number
  previousValue?: number

  // Formatting options
  currency?: string
  locale?: string
  decimals?: number
  prefix?: string
  suffix?: string

  // Animation configuration
  duration?: number
  delay?: number
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'circOut' | 'backOut'

  // Visual styling
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  color?: 'default' | 'positive' | 'negative' | 'neutral' | 'muted'

  // Behavior options
  showChangeIndicator?: boolean
  highlightChange?: boolean
  enableFlash?: boolean
  startFromZero?: boolean

  // Event handlers
  onComplete?: () => void
  onUpdate?: (current: number) => void
}

// =============================================================================
// STYLING CONFIGURATIONS
// =============================================================================

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
} as const

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const

const colorClasses = {
  default: 'text-gray-900 dark:text-gray-100',
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-blue-600 dark:text-blue-400',
  muted: 'text-gray-600 dark:text-gray-400',
} as const

const flashColors = {
  positive: 'rgba(34, 197, 94, 0.2)', // green
  negative: 'rgba(239, 68, 68, 0.2)', // red
  neutral: 'rgba(59, 130, 246, 0.2)', // blue
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format number with currency, locale, and decimal options
 */
function formatNumber(
  value: number,
  options: {
    currency?: string
    locale?: string
    decimals?: number
    prefix?: string
    suffix?: string
  }
): string {
  const {
    currency,
    locale = 'nb-NO',
    decimals,
    prefix = '',
    suffix = '',
  } = options

  let formatted: string

  if (currency) {
    formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ?? (currency === 'NOK' ? 0 : 2),
      maximumFractionDigits: decimals ?? (currency === 'NOK' ? 0 : 2),
    }).format(value)
  } else {
    formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? 2,
    }).format(value)
  }

  return `${prefix}${formatted}${suffix}`
}

/**
 * Determine change type for styling
 */
function getChangeType(
  current: number,
  previous?: number
): 'positive' | 'negative' | 'neutral' {
  if (previous === undefined) return 'neutral'
  if (current > previous) return 'positive'
  if (current < previous) return 'negative'
  return 'neutral'
}

/**
 * Calculate percentage change
 */
function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// =============================================================================
// ANIMATED NUMBER COUNTER COMPONENT
// =============================================================================

export const NumberCounter = forwardRef<HTMLSpanElement, NumberCounterProps>(
  (
    {
      value,
      previousValue,
      currency,
      locale = 'nb-NO',
      decimals,
      prefix,
      suffix,
      duration = 1.2,
      delay = 0,
      ease = 'easeOut',
      className,
      size = 'md',
      weight = 'semibold',
      color = 'default',
      showChangeIndicator = false,
      highlightChange = false,
      enableFlash = false,
      startFromZero = false,
      onComplete,
      onUpdate,
    },
    ref
  ) => {
    // Animation state
    const motionValue = useMotionValue(startFromZero ? 0 : value)
    const [displayValue, setDisplayValue] = useState(startFromZero ? 0 : value)
    const [isAnimating, setIsAnimating] = useState(false)
    const [flashBg, setFlashBg] = useState<string>('transparent')

    // Transform motion value to formatted display
    const transformedValue = useTransform(motionValue, latest => {
      const formatted = formatNumber(latest, {
        currency,
        locale,
        decimals,
        prefix,
        suffix,
      })
      return formatted
    })

    // Determine change characteristics
    const changeType = getChangeType(value, previousValue)
    const percentageChange = previousValue
      ? getPercentageChange(value, previousValue)
      : 0
    const hasChanged = previousValue !== undefined && previousValue !== value

    // Respect reduced motion preference
    const reducedMotion = shouldReduceMotion()
    const animationDuration = reducedMotion ? 0.1 : duration

    // Animation effect
    useEffect(() => {
      if (isAnimating) return

      const startValue = motionValue.get()
      if (startValue === value) return

      setIsAnimating(true)

      // Flash effect for value changes
      if (enableFlash && hasChanged) {
        setFlashBg(flashColors[changeType])
        setTimeout(() => setFlashBg('transparent'), 300)
      }

      // Animate to new value
      const controls = animate(motionValue, value, {
        duration: animationDuration,
        delay,
        ease: ease as any,
        onUpdate: latest => {
          setDisplayValue(latest)
          onUpdate?.(latest)
        },
        onComplete: () => {
          setIsAnimating(false)
          onComplete?.()
        },
      })

      return controls.stop
    }, [
      value,
      motionValue,
      animationDuration,
      delay,
      ease,
      enableFlash,
      hasChanged,
      changeType,
      onUpdate,
      onComplete,
      isAnimating,
    ])

    // Determine final color
    const finalColor = highlightChange && hasChanged ? changeType : color

    // Build classes
    const classes = cn(
      'transition-all duration-300 font-mono tabular-nums',
      sizeClasses[size],
      weightClasses[weight],
      colorClasses[finalColor],
      className
    )

    return (
      <span className="relative inline-block">
        {/* Flash background */}
        <motion.span
          className="absolute inset-0 rounded px-1"
          style={{ backgroundColor: flashBg }}
          animate={{ backgroundColor: flashBg }}
          transition={{ duration: 0.3 }}
        />

        {/* Main counter */}
        <motion.span
          ref={ref}
          className={classes}
          style={{
            display: 'inline-block',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {transformedValue}
        </motion.span>

        {/* Change indicator */}
        {showChangeIndicator && hasChanged && (
          <motion.span
            className={cn('ml-2 text-xs font-medium', {
              'text-green-600 dark:text-green-400': changeType === 'positive',
              'text-red-600 dark:text-red-400': changeType === 'negative',
              'text-gray-600 dark:text-gray-400': changeType === 'neutral',
            })}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: animationDuration + delay + 0.1,
              duration: 0.3,
            }}
          >
            {changeType === 'positive' && '↗'}
            {changeType === 'negative' && '↘'}
            {Math.abs(percentageChange) > 0.01 && (
              <>
                {changeType === 'positive' ? '+' : ''}
                {percentageChange.toFixed(1)}%
              </>
            )}
          </motion.span>
        )}
      </span>
    )
  }
)

NumberCounter.displayName = 'NumberCounter'

// =============================================================================
// SPECIALIZED COUNTER VARIANTS
// =============================================================================

/**
 * Currency Counter - Optimized for monetary values
 */
export const CurrencyCounter = forwardRef<
  HTMLSpanElement,
  Omit<NumberCounterProps, 'currency'> & {
    currency?: string
    compact?: boolean
  }
>(({ currency = 'NOK', compact = false, value, ...props }, ref) => {
  // Format large numbers in compact form (K, M, B)
  const formatValue = (val: number): { value: number; suffix: string } => {
    if (!compact) return { value: val, suffix: '' }

    if (Math.abs(val) >= 1e9) {
      return { value: val / 1e9, suffix: ' mrd' }
    } else if (Math.abs(val) >= 1e6) {
      return { value: val / 1e6, suffix: ' mill' }
    } else if (Math.abs(val) >= 1e3) {
      return { value: val / 1e3, suffix: ' k' }
    }
    return { value: val, suffix: '' }
  }

  const { value: displayValue, suffix: compactSuffix } = formatValue(value)

  return (
    <NumberCounter
      ref={ref}
      value={displayValue}
      currency={currency}
      suffix={compactSuffix}
      decimals={compact && Math.abs(displayValue) >= 10 ? 1 : 0}
      {...props}
    />
  )
})

CurrencyCounter.displayName = 'CurrencyCounter'

/**
 * Percentage Counter - For displaying percentage values
 */
export const PercentageCounter = forwardRef<
  HTMLSpanElement,
  Omit<NumberCounterProps, 'suffix' | 'decimals'> & {
    precision?: number
    showSign?: boolean
  }
>(({ precision = 2, showSign = true, value, ...props }, ref) => {
  const prefix = showSign && value > 0 ? '+' : ''

  return (
    <NumberCounter
      ref={ref}
      value={value}
      prefix={prefix}
      suffix="%"
      decimals={precision}
      {...props}
    />
  )
})

PercentageCounter.displayName = 'PercentageCounter'

/**
 * Stock Price Counter - Specialized for stock prices with precision
 */
export const StockPriceCounter = forwardRef<
  HTMLSpanElement,
  Omit<NumberCounterProps, 'decimals'> & {
    tickSize?: number
  }
>(({ tickSize = 0.01, value, ...props }, ref) => {
  // Determine precision based on tick size
  const decimals =
    tickSize >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(tickSize)))

  return (
    <NumberCounter
      ref={ref}
      value={value}
      decimals={decimals}
      enableFlash
      highlightChange
      {...props}
    />
  )
})

StockPriceCounter.displayName = 'StockPriceCounter'

/**
 * Portfolio Value Counter - For large portfolio values with emphasis
 */
export const PortfolioValueCounter = forwardRef<
  HTMLSpanElement,
  Omit<NumberCounterProps, 'size' | 'weight'> & {
    emphasis?: boolean
  }
>(({ emphasis = false, ...props }, ref) => {
  return (
    <CurrencyCounter
      ref={ref}
      size={emphasis ? '3xl' : '2xl'}
      weight={emphasis ? 'bold' : 'semibold'}
      compact
      enableFlash
      highlightChange
      showChangeIndicator
      {...props}
    />
  )
})

PortfolioValueCounter.displayName = 'PortfolioValueCounter'

// =============================================================================
// EXPORTS
// =============================================================================

export default NumberCounter
