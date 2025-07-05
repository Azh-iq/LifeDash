// Performance optimization utilities for LifeDash

import React from 'react'

export { default as PortfolioCacheManager, CacheKeys, CacheWarmer, useCachedData } from '@/lib/cache/portfolio-cache'
export { default as useSmartRefresh, useMultipleSmartRefresh, useBackgroundRefresh } from '@/lib/hooks/use-smart-refresh'
export { LazyComponents } from '@/components/portfolio/lazy-components'
export { 
  PortfolioSkeletons,
  PortfolioMetricsSkeleton,
  PortfolioHeaderSkeleton,
  HoldingsSectionSkeleton,
  PortfolioChartSectionSkeleton,
  PortfolioSidebarSkeleton,
  PortfolioDashboardSkeleton,
  QuickActionsSkeleton,
  RecentActivitySkeleton,
  ShimmerSkeleton,
} from '@/components/ui/portfolio-skeletons'

// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map()
  private static measures: Map<string, number> = new Map()

  static mark(name: string) {
    this.marks.set(name, performance.now())
  }

  static measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.marks.get(startMark)
    const endTime = endMark ? this.marks.get(endMark) : performance.now()
    
    if (startTime && endTime) {
      const duration = endTime - startTime
      this.measures.set(name, duration)
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      return duration
    }
    
    return 0
  }

  static getMeasure(name: string): number {
    return this.measures.get(name) || 0
  }

  static getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }

  static clear() {
    this.marks.clear()
    this.measures.clear()
  }
}

// React performance helpers
export const withPerformanceTracking = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) => {
  return function PerformanceTrackedComponent(props: T) {
    const renderStart = performance.now()
    
    React.useEffect(() => {
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart
      
      if (renderTime > 16) { // Log renders slower than 16ms (60fps)
        console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    })
    
    return React.createElement(Component, props)
  }
}

// Bundle size optimization
export const withLazyLoading = <T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback: React.ComponentType<any> = () => null
) => {
  const LazyComponent = React.lazy(importFn)
  
  return function LazyLoadedComponent(props: T) {
    return (
      <React.Suspense fallback={React.createElement(fallback)}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static observers: Map<string, IntersectionObserver> = new Map()
  private static mutationObservers: Map<string, MutationObserver> = new Map()
  
  static createIntersectionObserver(
    id: string,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    if (this.observers.has(id)) {
      this.observers.get(id)?.disconnect()
    }
    
    const observer = new IntersectionObserver(callback, options)
    this.observers.set(id, observer)
    return observer
  }
  
  static createMutationObserver(
    id: string,
    callback: MutationCallback,
    options?: MutationObserverInit
  ) {
    if (this.mutationObservers.has(id)) {
      this.mutationObservers.get(id)?.disconnect()
    }
    
    const observer = new MutationObserver(callback)
    this.mutationObservers.set(id, observer)
    return observer
  }
  
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.mutationObservers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.mutationObservers.clear()
  }
}

// Image optimization
export const optimizeImages = {
  lazy: (src: string, options?: { placeholder?: string; quality?: number }) => {
    const { placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=', quality = 75 } = options || {}
    
    return {
      src,
      placeholder,
      quality,
      loading: 'lazy' as const,
      decoding: 'async' as const,
    }
  },
  
  responsive: (baseSrc: string, sizes: number[]) => {
    const srcSet = sizes.map(size => `${baseSrc}?w=${size} ${size}w`).join(', ')
    return {
      src: baseSrc,
      srcSet,
      sizes: sizes.map(size => `(max-width: ${size}px) ${size}px`).join(', '),
    }
  },
}

// Network optimization
export const networkOptimization = {
  preload: (url: string, type: 'image' | 'font' | 'script' | 'style') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = type
    document.head.appendChild(link)
  },
  
  prefetch: (url: string) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  },
  
  preconnect: (origin: string) => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    document.head.appendChild(link)
  },
}

// Export all optimization utilities
export const OptimizationUtils = {
  PerformanceMonitor,
  MemoryOptimizer,
  optimizeImages,
  networkOptimization,
  withPerformanceTracking,
  withLazyLoading,
}