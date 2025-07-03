'use client'

import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const cardVariants = cva(
  // Base styles with LifeDash design system
  'rounded-xl border bg-white shadow-sm transition-all duration-200 dark:bg-neutral-950 dark:border-neutral-800',
  {
    variants: {
      variant: {
        default: 
          'border-neutral-200 hover:shadow-md',
        elevated: 
          'border-neutral-200 shadow-lg hover:shadow-xl',
        interactive: 
          'border-neutral-200 hover:border-neutral-300 hover:shadow-md cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        outlined: 
          'border-2 border-neutral-200 hover:border-neutral-300 shadow-none hover:shadow-sm',
        ghost: 
          'border-transparent shadow-none hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div'
    
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-100',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Specialized card variants for common use cases
const MetricCard = forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string
    value: string | number
    description?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    icon?: React.ReactNode
  }
>(({ title, value, description, trend, trendValue, icon, className, ...props }, ref) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'down':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      default:
        return (
          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        )
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-neutral-600 dark:text-neutral-400'
    }
  }

  return (
    <Card ref={ref} className={cn('hover:shadow-md transition-shadow', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && <span className="text-neutral-500 dark:text-neutral-400">{icon}</span>}
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {title}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {value}
              </p>
              {description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {trendValue && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
              {getTrendIcon()}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
MetricCard.displayName = 'MetricCard'

const LoadingCard = forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, ...props }, ref) => (
  <Card ref={ref} className={cn('animate-pulse', className)} {...props}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-4 bg-neutral-200 rounded dark:bg-neutral-800"></div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4 dark:bg-neutral-800"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 dark:bg-neutral-800"></div>
        </div>
      </div>
    </CardContent>
  </Card>
))
LoadingCard.displayName = 'LoadingCard'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  LoadingCard,
  cardVariants,
}