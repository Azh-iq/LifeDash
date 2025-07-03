'use client'

import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800',
  {
    variants: {
      variant: {
        default: '',
        text: 'rounded-sm',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Specialized skeleton components for common patterns
const SkeletonText = forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'variant'> & {
    lines?: number
    spacing?: 'tight' | 'normal' | 'relaxed'
  }
>(({ lines = 1, spacing = 'normal', className, ...props }, ref) => {
  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-3',
  }

  if (lines === 1) {
    return (
      <Skeleton
        ref={ref}
        variant="text"
        className={cn('h-4 w-full', className)}
        {...props}
      />
    )
  }

  return (
    <div className={cn(spacingClasses[spacing], className)} ref={ref} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
})
SkeletonText.displayName = 'SkeletonText'

const SkeletonAvatar = forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'variant'> & {
    size?: 'sm' | 'default' | 'lg' | 'xl'
  }
>(({ size = 'default', className, ...props }, ref) => {
  const sizes = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  return (
    <Skeleton
      ref={ref}
      variant="circular"
      className={cn(sizes[size], className)}
      {...props}
    />
  )
})
SkeletonAvatar.displayName = 'SkeletonAvatar'

const SkeletonCard = forwardRef<
  HTMLDivElement,
  SkeletonProps & {
    showAvatar?: boolean
    showImage?: boolean
    lines?: number
  }
>(({ showAvatar = false, showImage = false, lines = 3, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border border-neutral-200 p-6 dark:border-neutral-800', className)}
      {...props}
    >
      {showImage && (
        <Skeleton className="h-48 w-full mb-4" />
      )}
      
      <div className="space-y-4">
        {showAvatar && (
          <div className="flex items-center space-x-4">
            <SkeletonAvatar />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <SkeletonText lines={lines} />
        </div>
        
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
})
SkeletonCard.displayName = 'SkeletonCard'

const SkeletonTable = forwardRef<
  HTMLDivElement,
  SkeletonProps & {
    rows?: number
    columns?: number
    showHeader?: boolean
  }
>(({ rows = 5, columns = 4, showHeader = true, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    >
      {showHeader && (
        <div className="flex space-x-4 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})
SkeletonTable.displayName = 'SkeletonTable'

const SkeletonChart = forwardRef<
  HTMLDivElement,
  SkeletonProps & {
    type?: 'line' | 'bar' | 'pie'
    height?: string
  }
>(({ type = 'line', height = 'h-64', className, ...props }, ref) => {
  const renderContent = () => {
    switch (type) {
      case 'line':
        return (
          <div className="relative h-full">
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 200">
              <path
                d="M20,180 Q50,120 100,140 T200,100 T280,80"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        )
      case 'bar':
        return (
          <div className="flex items-end justify-between h-full px-4 pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  'w-8',
                  `h-${Math.floor(Math.random() * 4) + 8}`
                )}
              />
            ))}
          </div>
        )
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full">
            <Skeleton variant="circular" className="h-32 w-32" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-neutral-200 dark:border-neutral-800 p-4',
        height,
        className
      )}
      {...props}
    >
      <div className="space-y-2 mb-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {renderContent()}
    </div>
  )
})
SkeletonChart.displayName = 'SkeletonChart'

const SkeletonList = forwardRef<
  HTMLDivElement,
  SkeletonProps & {
    items?: number
    showAvatar?: boolean
    showIcon?: boolean
  }
>(({ items = 5, showAvatar = false, showIcon = false, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && <SkeletonAvatar size="sm" />}
          {showIcon && <Skeleton className="h-5 w-5" />}
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
})
SkeletonList.displayName = 'SkeletonList'

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonList,
  skeletonVariants,
}