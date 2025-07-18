'use client'

import { memo, Suspense, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ErrorBoundary } from 'react-error-boundary'
import {
  PortfolioMetricsSkeleton,
  PortfolioDashboardSkeleton,
  useSmartRefresh,
  LazyComponents,
  PortfolioCacheManager,
  PerformanceMonitor,
  CacheKeys,
} from '@/lib/optimization'
import PortfolioMetrics from './portfolio-metrics'
import PortfolioHeader from './portfolio-header'

interface OptimizedPortfolioDashboardProps {
  portfolioId: string
  initialData?: any
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-red-800">Noe gikk galt</h2>
      <p className="mb-4 text-red-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Prøv igjen
      </button>
    </div>
  )
}

// Critical data component (loads immediately)
const CriticalPortfolioData = memo(function CriticalPortfolioData({
  portfolioId,
}: {
  portfolioId: string
}) {
  PerformanceMonitor.mark('critical-data-start')

  const {
    data: portfolio,
    loading,
    error,
  } = useSmartRefresh(
    CacheKeys.portfolio(portfolioId),
    async () => {
      // Check cache first for instant loading
      const cached = PortfolioCacheManager.getPortfolio(portfolioId)
      if (cached) {
        PerformanceMonitor.measure(
          'critical-data-cached',
          'critical-data-start'
        )
        return cached
      }

      // Simulate API call (replace with actual API)
      const data = await new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              id: portfolioId,
              total_value: 1250000,
              total_cost: 1000000,
              holdings_count: 15,
            }),
          100
        )
      )

      PortfolioCacheManager.setPortfolio(portfolioId, data)
      PerformanceMonitor.measure('critical-data-fresh', 'critical-data-start')
      return data
    },
    {
      staleTime: 300000, // 5 minutes
      interval: 30000, // 30 seconds auto-refresh
      maxRetries: 3,
      onError: error => console.error('Critical data fetch failed:', error),
      onSuccess: () => PerformanceMonitor.mark('critical-data-success'),
    }
  )

  if (loading && !portfolio) {
    return (
      <div className="space-y-6">
        <PortfolioMetricsSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => window.location.reload()}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PortfolioHeader portfolioId={portfolioId} />
      <PortfolioMetrics portfolioId={portfolioId} />
    </motion.div>
  )
})

// Secondary data component (loads progressively)
const SecondaryPortfolioData = memo(function SecondaryPortfolioData({
  portfolioId,
}: {
  portfolioId: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="space-y-6 lg:col-span-3">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={error => console.error('Chart section error:', error)}
        >
          <LazyComponents.PortfolioChartSection portfolioId={portfolioId} />
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={error => console.error('Holdings section error:', error)}
        >
          <LazyComponents.HoldingsSection portfolioId={portfolioId} />
        </ErrorBoundary>
      </div>

      <div className="space-y-4 lg:col-span-1">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <LazyComponents.QuickActions portfolioId={portfolioId} />
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <LazyComponents.RecentActivity portfolioId={portfolioId} />
        </ErrorBoundary>
      </div>
    </div>
  )
})

// Main optimized portfolio dashboard
const OptimizedPortfolioDashboard = memo(function OptimizedPortfolioDashboard({
  portfolioId,
  initialData,
}: OptimizedPortfolioDashboardProps) {
  PerformanceMonitor.mark('dashboard-render-start')

  // Pre-populate cache with initial data if available
  useMemo(() => {
    if (initialData) {
      PortfolioCacheManager.setPortfolio(portfolioId, initialData, 600000) // 10 minutes
    }
  }, [portfolioId, initialData])

  // Cache warming for better performance
  useMemo(() => {
    // Warm up common cache entries
    setTimeout(() => {
      PerformanceMonitor.mark('cache-warm-start')
      // Pre-fetch related data in background
      PortfolioCacheManager.warmPortfolio?.(portfolioId)
      PerformanceMonitor.measure('cache-warm', 'cache-warm-start')
    }, 1000)
  }, [portfolioId])

  PerformanceMonitor.measure('dashboard-render', 'dashboard-render-start')

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Critical data loads immediately */}
      <CriticalPortfolioData portfolioId={portfolioId} />

      {/* Secondary data loads progressively with delay */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="space-y-6 lg:col-span-3">
              <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-96 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SecondaryPortfolioData portfolioId={portfolioId} />
        </motion.div>
      </Suspense>

      {/* Performance debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 rounded bg-black p-2 text-xs text-white opacity-50">
          Cache Stats:{' '}
          {JSON.stringify(PortfolioCacheManager.getStats?.() || {})}
        </div>
      )}
    </div>
  )
})

// Higher-order component with performance tracking
export default function PortfolioDashboardWithTracking(
  props: OptimizedPortfolioDashboardProps
) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Portfolio dashboard error:', error, errorInfo)
        PerformanceMonitor.mark('dashboard-error')
      }}
    >
      <OptimizedPortfolioDashboard {...props} />
    </ErrorBoundary>
  )
}
