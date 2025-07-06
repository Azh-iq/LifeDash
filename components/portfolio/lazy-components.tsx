'use client'

import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import {
  PortfolioChartSectionSkeleton,
  HoldingsSectionSkeleton,
} from '@/components/ui/portfolio-skeletons'

// Lazy load heavy components
const PortfolioChartSection = lazy(() => import('./portfolio-chart-section'))
const HoldingsSection = lazy(() => import('./holdings-section'))
const QuickActions = lazy(() => import('./quick-actions'))
const RecentActivity = lazy(() => import('./recent-activity'))

// Wrapper components with suspense and error boundaries
export function LazyPortfolioChartSection(props: any) {
  return (
    <Suspense fallback={<PortfolioChartSectionSkeleton />}>
      <PortfolioChartSection {...props} />
    </Suspense>
  )
}

export function LazyHoldingsSection(props: any) {
  return (
    <Suspense fallback={<HoldingsSectionSkeleton />}>
      <HoldingsSection {...props} />
    </Suspense>
  )
}

export function LazyQuickActions(props: any) {
  return (
    <Suspense
      fallback={<div className="h-32 animate-pulse rounded-lg bg-gray-100" />}
    >
      <QuickActions {...props} />
    </Suspense>
  )
}

export function LazyRecentActivity(props: any) {
  return (
    <Suspense
      fallback={<div className="h-40 animate-pulse rounded-lg bg-gray-100" />}
    >
      <RecentActivity {...props} />
    </Suspense>
  )
}

// Progressive loading component that shows critical data first
export function ProgressivePortfolioLoader({
  portfolioId,
}: {
  portfolioId: string
}) {
  return (
    <div className="space-y-6">
      {/* Load immediately - critical data */}
      <div className="space-y-4">
        {/* Portfolio metrics are loaded synchronously as they're critical */}
      </div>

      {/* Load after a delay - secondary data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          <LazyPortfolioChartSection portfolioId={portfolioId} />
          <LazyHoldingsSection portfolioId={portfolioId} />
        </div>

        <div className="space-y-4 lg:col-span-1">
          <LazyQuickActions portfolioId={portfolioId} />
          <LazyRecentActivity portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  )
}

// Intersection Observer based lazy loading
export function IntersectionLazyLoader({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
}: {
  children: React.ReactNode
  fallback: React.ReactNode
  rootMargin?: string
  threshold?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold, hasLoaded])

  return <div ref={ref}>{isVisible ? children : fallback}</div>
}

// Export all lazy components
export const LazyComponents = {
  PortfolioChartSection: LazyPortfolioChartSection,
  HoldingsSection: LazyHoldingsSection,
  QuickActions: LazyQuickActions,
  RecentActivity: LazyRecentActivity,
  ProgressiveLoader: ProgressivePortfolioLoader,
  IntersectionLoader: IntersectionLazyLoader,
}
