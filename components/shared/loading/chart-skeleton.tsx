'use client'

import React, { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'

const chartSkeletonVariants = cva(
  'w-full rounded-lg border bg-white dark:bg-neutral-950 p-4',
  {
    variants: {
      variant: {
        default: 'border-neutral-200 dark:border-neutral-800',
        elevated: 'border-neutral-200 dark:border-neutral-800 shadow-sm',
        bordered: 'border-2 border-neutral-200 dark:border-neutral-800',
      },
      size: {
        sm: 'h-48',
        default: 'h-64',
        lg: 'h-80',
        xl: 'h-96',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ChartSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartSkeletonVariants> {
  showTitle?: boolean
  showLegend?: boolean
  showAxes?: boolean
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  animate?: boolean
}

const ChartSkeleton = forwardRef<HTMLDivElement, ChartSkeletonProps>(
  (
    {
      className,
      variant,
      size,
      showTitle = true,
      showLegend = true,
      showAxes = true,
      chartType = 'line',
      animate = true,
      ...props
    },
    ref
  ) => {
    const renderChart = () => {
      switch (chartType) {
        case 'line':
          return <LineChartSkeleton animate={animate} />
        case 'bar':
          return <BarChartSkeleton animate={animate} />
        case 'pie':
          return <PieChartSkeleton animate={animate} />
        case 'area':
          return <AreaChartSkeleton animate={animate} />
        case 'scatter':
          return <ScatterChartSkeleton animate={animate} />
        default:
          return <LineChartSkeleton animate={animate} />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(chartSkeletonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Title */}
        {showTitle && (
          <div className="mb-4 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="relative flex-1">
          {showAxes && (
            <>
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
              </div>
              
              {/* X-axis */}
              <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between items-end">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
              </div>
            </>
          )}

          {/* Chart Content */}
          <div className={cn(
            'h-full',
            showAxes ? 'ml-8 mb-8' : '',
            'flex items-center justify-center'
          )}>
            {renderChart()}
          </div>
        </div>
      </div>
    )
  }
)

ChartSkeleton.displayName = 'ChartSkeleton'

// Specific chart type skeletons
const LineChartSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-full h-full">
    {/* Grid lines */}
    <div className="absolute inset-0 flex flex-col justify-between">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-full h-px bg-neutral-200 dark:bg-neutral-700" />
      ))}
    </div>
    
    {/* Line paths */}
    <div className="absolute inset-0 flex items-center">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        <path
          d="M 20 180 Q 100 120, 180 140 T 380 60"
          stroke="rgb(59 130 246)"
          strokeWidth="2"
          fill="none"
          className={animate ? 'animate-pulse' : ''}
        />
        <path
          d="M 20 160 Q 100 100, 180 120 T 380 80"
          stroke="rgb(16 185 129)"
          strokeWidth="2"
          fill="none"
          className={animate ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
    
    {/* Data points */}
    <div className="absolute inset-0 flex items-center justify-between px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className={cn(
            'w-2 h-2 rounded-full bg-blue-400',
            animate && 'animate-pulse'
          )} />
          <div className={cn(
            'w-2 h-2 rounded-full bg-green-400',
            animate && 'animate-pulse'
          )} />
        </div>
      ))}
    </div>
  </div>
)

const BarChartSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-full h-full flex items-end justify-between gap-2 px-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex-1 space-y-1">
        <Skeleton 
          className={cn(
            'w-full bg-blue-200 dark:bg-blue-800',
            animate && 'animate-pulse'
          )}
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
        <Skeleton 
          className={cn(
            'w-full bg-green-200 dark:bg-green-800',
            animate && 'animate-pulse'
          )}
          style={{ height: `${Math.random() * 40 + 10}%` }}
        />
      </div>
    ))}
  </div>
)

const PieChartSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <div className={cn(
      'w-32 h-32 rounded-full border-8 border-neutral-200 dark:border-neutral-700',
      animate && 'animate-pulse'
    )} style={{
      borderTopColor: 'rgb(59 130 246)',
      borderRightColor: 'rgb(16 185 129)',
      borderBottomColor: 'rgb(245 158 11)',
      borderLeftColor: 'rgb(239 68 68)',
    }} />
  </div>
)

const AreaChartSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-full h-full">
    {/* Grid lines */}
    <div className="absolute inset-0 flex flex-col justify-between">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-full h-px bg-neutral-200 dark:bg-neutral-700" />
      ))}
    </div>
    
    {/* Area fill */}
    <div className="absolute inset-0 flex items-end">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        <path
          d="M 20 180 Q 100 120, 180 140 T 380 60 L 380 180 L 20 180 Z"
          fill="rgb(59 130 246 / 0.3)"
          className={animate ? 'animate-pulse' : ''}
        />
        <path
          d="M 20 160 Q 100 100, 180 120 T 380 80 L 380 180 L 20 180 Z"
          fill="rgb(16 185 129 / 0.3)"
          className={animate ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  </div>
)

const ScatterChartSkeleton = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-full h-full">
    {/* Grid lines */}
    <div className="absolute inset-0 flex flex-col justify-between">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-full h-px bg-neutral-200 dark:bg-neutral-700" />
      ))}
    </div>
    
    {/* Scatter points */}
    <div className="absolute inset-0 p-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute w-2 h-2 rounded-full',
            i % 3 === 0 && 'bg-blue-400',
            i % 3 === 1 && 'bg-green-400',
            i % 3 === 2 && 'bg-yellow-400',
            animate && 'animate-pulse'
          )}
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 90 + 5}%`,
          }}
        />
      ))}
    </div>
  </div>
)

// Specialized skeleton components
export interface MetricChartSkeletonProps extends ChartSkeletonProps {
  metrics?: number
}

const MetricChartSkeleton = forwardRef<HTMLDivElement, MetricChartSkeletonProps>(
  ({ metrics = 3, ...props }, ref) => (
    <div ref={ref} className="space-y-4">
      {/* Metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: metrics }).map((_, i) => (
          <div key={i} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <ChartSkeleton {...props} />
    </div>
  )
)

MetricChartSkeleton.displayName = 'MetricChartSkeleton'

export interface DashboardChartSkeletonProps extends ChartSkeletonProps {
  showControls?: boolean
  showFilters?: boolean
}

const DashboardChartSkeleton = forwardRef<HTMLDivElement, DashboardChartSkeletonProps>(
  ({ showControls = true, showFilters = true, ...props }, ref) => (
    <div ref={ref} className="space-y-4">
      {/* Controls */}
      {showControls && (
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
      
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      )}
      
      {/* Chart */}
      <ChartSkeleton {...props} />
    </div>
  )
)

DashboardChartSkeleton.displayName = 'DashboardChartSkeleton'

export { ChartSkeleton, MetricChartSkeleton, DashboardChartSkeleton }