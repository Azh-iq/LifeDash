'use client';

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading utilities for code splitting and performance optimization

// Higher-order component for lazy loading with fallback
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props: any) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy loading with skeleton fallback
export function withSkeletonFallback<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  skeletonProps?: {
    height?: number;
    width?: number;
    count?: number;
    className?: string;
  }
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props: any) {
    const { height = 100, width, count = 1, className } = skeletonProps || {};
    
    const skeletonFallback = (
      <div className={className}>
        {Array.from({ length: count }, (_, i) => (
          <Skeleton
            key={i}
            className="mb-2"
            style={{
              height: `${height}px`,
              ...(width && { width: `${width}px` })
            }}
          />
        ))}
      </div>
    );
    
    return (
      <Suspense fallback={skeletonFallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer for lazy loading content
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver(callback, defaultOptions);
  
  return {
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
}

// Lazy loading component wrapper
export function LazyLoadWrapper({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  className
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasLoaded(true);
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  const shouldRender = triggerOnce ? hasLoaded || isVisible : isVisible;

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
}

// Dynamic import with preloading
export class DynamicImportManager {
  private cache = new Map<string, Promise<any>>();
  private preloadedModules = new Set<string>();

  // Preload a module without executing it
  preload(modulePath: string, importFunc: () => Promise<any>): void {
    if (this.preloadedModules.has(modulePath)) return;
    
    this.preloadedModules.add(modulePath);
    const promise = importFunc();
    this.cache.set(modulePath, promise);
    
    // Preload but don't block
    promise.catch(() => {
      this.preloadedModules.delete(modulePath);
      this.cache.delete(modulePath);
    });
  }

  // Import with caching
  async import(modulePath: string, importFunc: () => Promise<any>): Promise<any> {
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath);
    }

    const promise = importFunc();
    this.cache.set(modulePath, promise);
    
    try {
      return await promise;
    } catch (error) {
      this.cache.delete(modulePath);
      throw error;
    }
  }

  // Preload multiple modules
  preloadBatch(modules: Array<{ path: string; importFunc: () => Promise<any> }>): void {
    modules.forEach(({ path, importFunc }) => {
      this.preload(path, importFunc);
    });
  }

  // Get cache statistics
  getCacheStats(): { cached: number; preloaded: number } {
    return {
      cached: this.cache.size,
      preloaded: this.preloadedModules.size
    };
  }
}

// Singleton instance
export const dynamicImportManager = new DynamicImportManager();

// Route-based preloading
export function preloadRoute(route: string): void {
  const routeMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/app/dashboard/page'),
    '/investments': () => import('@/app/investments/page'),
    '/investments/stocks': () => import('@/app/investments/stocks/page'),
    '/economy': () => import('@/app/economy/page'),
    '/hobby': () => import('@/app/hobby/page'),
    '/tools': () => import('@/app/tools/page')
  };

  const importFunc = routeMap[route];
  if (importFunc) {
    dynamicImportManager.preload(route, importFunc);
  }
}

// Component-based preloading
export function preloadComponents(components: string[]): void {
  const componentMap: Record<string, () => Promise<any>> = {
    'mobile-chart': () => import('@/components/mobile/mobile-chart'),
    'mobile-holdings': () => import('@/components/mobile/mobile-holdings-list'),
    'mobile-metrics': () => import('@/components/mobile/mobile-metric-cards'),
    'mobile-navigation': () => import('@/components/mobile/mobile-navigation'),
    'mobile-action-sheet': () => import('@/components/mobile/mobile-action-sheet'),
    'portfolio-chart': () => import('@/components/charts/portfolio-performance-chart'),
    'asset-allocation': () => import('@/components/charts/asset-allocation-chart'),
    'csv-upload': () => import('@/components/features/import/csv-upload'),
    'platform-wizard': () => import('@/components/features/platforms/platform-wizard')
  };

  components.forEach(component => {
    const importFunc = componentMap[component];
    if (importFunc) {
      dynamicImportManager.preload(component, importFunc);
    }
  });
}

// Image lazy loading
export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  width,
  height,
  onLoad,
  onError
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
      {(!isInView || (!isLoaded && !hasError)) && (
        <div 
          className="absolute inset-0 bg-gray-200 flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="text-gray-400">Loading...</div>
          )}
        </div>
      )}
      
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400">Failed to load</div>
        </div>
      )}
    </div>
  );
}

// Progressive loading for data
export function useProgressiveLoading<T>(
  dataFetcher: (page: number, pageSize: number) => Promise<T[]>,
  initialPageSize: number = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await dataFetcher(page, initialPageSize);
      
      if (newData.length < initialPageSize) {
        setHasMore(false);
      }
      
      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataFetcher, loading, hasMore, page, initialPageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset
  };
}

// Lazy loading for large lists
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Preload strategies
export const PRELOAD_STRATEGIES = {
  // Preload on hover
  onHover: (element: HTMLElement, preloadFunc: () => void) => {
    const handleMouseEnter = () => {
      preloadFunc();
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
    
    return () => element.removeEventListener('mouseenter', handleMouseEnter);
  },

  // Preload on idle
  onIdle: (preloadFunc: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadFunc);
    } else {
      setTimeout(preloadFunc, 0);
    }
  },

  // Preload on user interaction
  onInteraction: (preloadFunc: () => void) => {
    const events = ['mousedown', 'touchstart', 'keydown'];
    
    const handleInteraction = () => {
      preloadFunc();
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
  }
};

// Export common lazy-loaded components
export const LazyPortfolioChart = withSkeletonFallback(
  () => import('@/components/charts/portfolio-performance-chart'),
  { height: 300, count: 1 }
);

export const LazyAssetAllocation = withSkeletonFallback(
  () => import('@/components/charts/asset-allocation-chart'),
  { height: 250, count: 1 }
);

export const LazyMobileChart = withSkeletonFallback(
  () => import('@/components/mobile/mobile-chart'),
  { height: 200, count: 1 }
);

export const LazyMobileHoldings = withSkeletonFallback(
  () => import('@/components/mobile/mobile-holdings-list'),
  { height: 100, count: 3 }
);

export const LazyCsvUpload = withSkeletonFallback(
  () => import('@/components/features/import/csv-upload'),
  { height: 200, count: 1 }
);

export const LazyPlatformWizard = withSkeletonFallback(
  () => import('@/components/features/platforms/platform-wizard'),
  { height: 400, count: 1 }
);

// Import required dependencies
import { useState, useEffect, useRef, useCallback } from 'react';