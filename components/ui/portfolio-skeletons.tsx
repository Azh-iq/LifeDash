'use client'

import { motion } from 'framer-motion'
import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  SkeletonText,
} from '@/components/ui/skeleton'
import { AnimatedCard } from '@/components/animated'

interface SkeletonProps {
  className?: string
}

// Enhanced shimmer animation for better UX
const shimmerAnimation = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
}

// Portfolio Metrics Skeleton
export function PortfolioMetricsSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`mb-6 space-y-4 ${className || ''}`}>
      {/* Connection Status Skeleton */}
      <div className="mb-4">
        <Skeleton className="h-10 w-80 rounded-lg" />
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * i }}
          >
            <AnimatedCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </div>

      {/* Performance Summary Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <AnimatedCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <Skeleton className="mx-auto h-4 w-20" />
                <Skeleton className="mx-auto h-6 w-24" />
                <Skeleton className="mx-auto h-3 w-16" />
              </div>
            ))}
          </div>
        </AnimatedCard>
      </motion.div>
    </div>
  )
}

// Portfolio Header Skeleton
export function PortfolioHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`mb-6 ${className || ''}`}>
      <AnimatedCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}

// Holdings Section Skeleton
export function HoldingsSectionSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <AnimatedCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Holdings Table Skeleton */}
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 border-b pb-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Table Rows */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * i }}
              className="grid grid-cols-6 gap-4 py-3"
            >
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </motion.div>
          ))}
        </div>
      </AnimatedCard>
    </div>
  )
}

// Portfolio Chart Section Skeleton
export function PortfolioChartSectionSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <AnimatedCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="space-y-4">
          <SkeletonChart type="line" height="h-64" />

          {/* Chart Controls */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-12" />
              ))}
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}

// Portfolio Sidebar Skeleton
export function PortfolioSidebarSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Quick Actions */}
      <AnimatedCard className="p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </AnimatedCard>

      {/* Recent Activity */}
      <AnimatedCard className="p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <SkeletonList items={5} showIcon={true} />
      </AnimatedCard>

      {/* Portfolio Summary */}
      <AnimatedCard className="p-4">
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </AnimatedCard>
    </div>
  )
}

// Comprehensive Portfolio Dashboard Skeleton
export function PortfolioDashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <PortfolioHeaderSkeleton />
      <PortfolioMetricsSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          <PortfolioChartSectionSkeleton />
          <HoldingsSectionSkeleton />
        </div>
        <div className="lg:col-span-1">
          <PortfolioSidebarSkeleton />
        </div>
      </div>
    </div>
  )
}

// Quick Actions Skeleton
export function QuickActionsSkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

// Recent Activity Skeleton
export function RecentActivitySkeleton({ className }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 * i }}
          className="flex items-center space-x-3"
        >
          <Skeleton className="h-6 w-6 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced shimmer skeleton with better animation
export function ShimmerSkeleton({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'card' | 'text' | 'chart'
}) {
  const baseClasses =
    'relative overflow-hidden bg-neutral-100 dark:bg-neutral-800'

  const variantClasses = {
    default: 'rounded-md',
    card: 'rounded-lg',
    text: 'rounded-sm',
    chart: 'rounded-lg',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5"
        {...shimmerAnimation}
      />
    </div>
  )
}

// Export all skeleton components
export const PortfolioSkeletons = {
  PortfolioMetricsSkeleton,
  PortfolioHeaderSkeleton,
  HoldingsSectionSkeleton,
  PortfolioChartSectionSkeleton,
  PortfolioSidebarSkeleton,
  PortfolioDashboardSkeleton,
  QuickActionsSkeleton,
  RecentActivitySkeleton,
  ShimmerSkeleton,
}
