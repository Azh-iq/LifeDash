'use client'

import React, { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const metricCardVariants = cva(
  'transition-all duration-300 hover:shadow-md',
  {
    variants: {
      variant: {
        default: 'border-neutral-200 dark:border-neutral-700',
        primary: 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950',
        success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950',
        warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950',
        danger: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950',
        info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const trendVariants = cva(
  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      trend: {
        up: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        flat: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
      },
    },
    defaultVariants: {
      trend: 'flat',
    },
  }
)

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  trendLabel?: string
  loading?: boolean
  currency?: boolean
  percentage?: boolean
  onClick?: () => void
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      variant,
      size,
      title,
      value,
      description,
      icon,
      trend,
      trendValue,
      trendLabel,
      loading = false,
      currency = false,
      percentage = false,
      onClick,
      ...props
    },
    ref
  ) => {
    // Loading state
    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn(metricCardVariants({ variant, size }), className)}
          {...props}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 animate-pulse" />
              <div className="h-6 w-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )
    }

    const formatValue = (val: string | number) => {
      if (typeof val === 'number') {
        if (currency) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(val)
        }
        if (percentage) {
          return `${val.toFixed(1)}%`
        }
        return new Intl.NumberFormat('en-US').format(val)
      }
      return val
    }

    const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
      switch (trend) {
        case 'up':
          return (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 17l9.2-9.2M17 17V8m0 0H8"
              />
            </svg>
          )
        case 'down':
          return (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7l9.2 9.2M17 7v9m0 0H8"
              />
            </svg>
          )
        case 'flat':
          return (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h8"
              />
            </svg>
          )
        default:
          return null
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(
          metricCardVariants({ variant, size }),
          onClick && 'cursor-pointer hover:shadow-lg active:scale-[0.98]',
          className
        )}
        onClick={onClick}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {title}
            </CardTitle>
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatValue(value)}
            </div>
            
            {description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
            
            {trend && trendValue && (
              <div className="flex items-center gap-2">
                <div className={cn(trendVariants({ trend }))}>
                  <TrendIcon trend={trend} />
                  <span>{trendValue}</span>
                </div>
                {trendLabel && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

MetricCard.displayName = 'MetricCard'

// Specialized Financial Metric Cards
export interface FinancialMetricCardProps extends Omit<MetricCardProps, 'currency'> {
  type: 'currency' | 'percentage' | 'count' | 'ratio'
  change?: number
  changeType?: 'amount' | 'percentage'
  period?: string
}

const FinancialMetricCard = forwardRef<HTMLDivElement, FinancialMetricCardProps>(
  ({ type, change, changeType = 'percentage', period = 'vs last month', ...props }, ref) => {
    const currency = type === 'currency'
    const percentage = type === 'percentage'
    
    let trend: 'up' | 'down' | 'flat' | undefined
    let trendValue: string | undefined
    
    if (change !== undefined) {
      trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      
      if (changeType === 'percentage') {
        trendValue = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
      } else {
        trendValue = change > 0 ? `+${change}` : change.toString()
      }
    }

    return (
      <MetricCard
        ref={ref}
        {...props}
        currency={currency}
        percentage={percentage}
        trend={trend}
        trendValue={trendValue}
        trendLabel={period}
      />
    )
  }
)

FinancialMetricCard.displayName = 'FinancialMetricCard'

// Metric Cards Grid Container
export interface MetricGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'default' | 'lg'
  className?: string
}

const MetricGrid = forwardRef<HTMLDivElement, MetricGridProps>(
  ({ children, columns = 4, gap = 'default', className, ...props }, ref) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    }

    const gapClasses = {
      sm: 'gap-3',
      default: 'gap-4',
      lg: 'gap-6',
    }

    return (
      <div
        ref={ref}
        className={cn('grid', gridCols[columns], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MetricGrid.displayName = 'MetricGrid'

export { MetricCard, FinancialMetricCard, MetricGrid }