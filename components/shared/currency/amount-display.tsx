'use client'

import React, { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const amountDisplayVariants = cva(
  'font-medium tabular-nums transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'text-neutral-900 dark:text-neutral-100',
        muted: 'text-neutral-600 dark:text-neutral-400',
        success: 'text-green-600 dark:text-green-400',
        danger: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      weight: 'medium',
    },
  }
)

export interface AmountDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof amountDisplayVariants> {
  amount: number
  currency?: string
  locale?: string
  showCurrency?: boolean
  showSign?: boolean
  precision?: number
  abbreviate?: boolean
  loading?: boolean
  placeholder?: string
}

const AmountDisplay = forwardRef<HTMLSpanElement, AmountDisplayProps>(
  (
    {
      className,
      variant,
      size,
      weight,
      amount,
      currency = 'USD',
      locale = 'en-US',
      showCurrency = true,
      showSign = false,
      precision,
      abbreviate = false,
      loading = false,
      placeholder = '---',
      ...props
    },
    ref
  ) => {
    // Loading state
    if (loading) {
      return (
        <span
          ref={ref}
          className={cn(
            amountDisplayVariants({ variant: 'muted', size, weight }),
            'animate-pulse',
            className
          )}
          {...props}
        >
          {placeholder}
        </span>
      )
    }

    // Determine variant based on amount if not explicitly set
    const resolvedVariant = variant || (amount >= 0 ? 'success' : 'danger')

    // Format the amount
    const formatAmount = (value: number) => {
      // Handle abbreviation for large numbers
      if (abbreviate) {
        const abs = Math.abs(value)
        if (abs >= 1e9) {
          return (value / 1e9).toFixed(1) + 'B'
        } else if (abs >= 1e6) {
          return (value / 1e6).toFixed(1) + 'M'
        } else if (abs >= 1e3) {
          return (value / 1e3).toFixed(1) + 'K'
        }
      }

      // Determine precision
      const fractionDigits = precision ?? (Math.abs(value) < 1 ? 4 : 2)

      // Format with currency
      if (showCurrency) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        }).format(value)
      }

      // Format as number
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(Math.abs(value))

      // Add sign if requested
      if (showSign && value !== 0) {
        return `${value >= 0 ? '+' : '-'}${formatted}`
      }

      return value < 0 ? `-${formatted}` : formatted
    }

    return (
      <span
        ref={ref}
        className={cn(amountDisplayVariants({ variant: resolvedVariant, size, weight }), className)}
        {...props}
      >
        {formatAmount(amount)}
      </span>
    )
  }
)

AmountDisplay.displayName = 'AmountDisplay'

// Specialized components for common use cases
export interface PercentageDisplayProps
  extends Omit<AmountDisplayProps, 'currency' | 'showCurrency' | 'abbreviate'> {
  value: number
  showPercentSign?: boolean
}

const PercentageDisplay = forwardRef<HTMLSpanElement, PercentageDisplayProps>(
  ({ value, showPercentSign = true, precision = 1, ...props }, ref) => {
    const formatPercentage = (val: number) => {
      const formatted = val.toFixed(precision)
      return showPercentSign ? `${formatted}%` : formatted
    }

    const displayValue = showPercentSign ? value : value / 100

    return (
      <span
        ref={ref}
        className={cn(
          amountDisplayVariants({
            variant: value >= 0 ? 'success' : 'danger',
            size: props.size,
            weight: props.weight,
          }),
          props.className
        )}
        {...props}
      >
        {props.loading ? (props.placeholder || '---') : formatPercentage(value)}
      </span>
    )
  }
)

PercentageDisplay.displayName = 'PercentageDisplay'

export interface DifferenceDisplayProps extends Omit<AmountDisplayProps, 'amount'> {
  current: number
  previous: number
  showArrow?: boolean
  showPercentage?: boolean
}

const DifferenceDisplay = forwardRef<HTMLSpanElement, DifferenceDisplayProps>(
  (
    {
      current,
      previous,
      showArrow = true,
      showPercentage = false,
      showSign = true,
      ...props
    },
    ref
  ) => {
    const difference = current - previous
    const percentageChange = previous !== 0 ? (difference / Math.abs(previous)) * 100 : 0

    const displayValue = showPercentage ? percentageChange : difference

    const ArrowIcon = ({ direction }: { direction: 'up' | 'down' | 'flat' }) => {
      if (direction === 'flat') {
        return (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
          </svg>
        )
      }
      
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={direction === 'up' ? 'M7 17l9.2-9.2M17 17V8m0 0H8' : 'M7 7l9.2 9.2M17 7v9m0 0H8'}
          />
        </svg>
      )
    }

    const direction = difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat'

    return (
      <span
        ref={ref}
        className={cn(
          amountDisplayVariants({
            variant: difference >= 0 ? 'success' : 'danger',
            size: props.size,
            weight: props.weight,
          }),
          'inline-flex items-center gap-1',
          props.className
        )}
        {...props}
      >
        {showArrow && <ArrowIcon direction={direction} />}
        <AmountDisplay
          amount={displayValue}
          showSign={showSign}
          showCurrency={!showPercentage && props.showCurrency}
          precision={showPercentage ? 1 : props.precision}
          {...props}
        />
        {showPercentage && '%'}
      </span>
    )
  }
)

DifferenceDisplay.displayName = 'DifferenceDisplay'

// Utility function for formatting amounts
export const formatCurrency = (
  amount: number,
  options: {
    currency?: string
    locale?: string
    precision?: number
    abbreviate?: boolean
  } = {}
) => {
  const { currency = 'USD', locale = 'en-US', precision = 2, abbreviate = false } = options

  if (abbreviate) {
    const abs = Math.abs(amount)
    if (abs >= 1e9) {
      return `${(amount / 1e9).toFixed(1)}B`
    } else if (abs >= 1e6) {
      return `${(amount / 1e6).toFixed(1)}M`
    } else if (abs >= 1e3) {
      return `${(amount / 1e3).toFixed(1)}K`
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount)
}

export const formatPercentage = (value: number, precision: number = 1) => {
  return `${value.toFixed(precision)}%`
}

export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export { AmountDisplay, PercentageDisplay, DifferenceDisplay }