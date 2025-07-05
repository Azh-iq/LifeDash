// Cache System Exports
export { default as portfolioCache, usePortfolioCache, setupPortfolioRealTimeUpdates } from './portfolio-cache';
export { default as priceCache, usePriceCache } from './price-cache';
export { default as chartCache, useChartCache, CHART_CONFIGS } from './chart-cache';

// Re-export types
export type { PriceData, HistoricalPrice } from './price-cache';
export type { ChartData, ChartConfig, ChartDataPoint } from './chart-cache';

// Unified cache management
class CacheManager {
  constructor() {
    this.setupCacheCoordination();
  }

  private setupCacheCoordination() {
    // Portfolio changes should invalidate related price and chart data
    // This would be implemented with event listeners or pub/sub
  }

  // Global cache operations
  async clearAllCaches(): Promise<void> {
    const { default: portfolioCache } = await import('./portfolio-cache');
    const { default: priceCache } = await import('./price-cache');
    const { default: chartCache } = await import('./chart-cache');

    portfolioCache.invalidateAllPortfolios();
    // priceCache doesn't have a clear all method, but we could add it
    chartCache.clearCache();
  }

  async getCacheStats(): Promise<{
    portfolio: any;
    price: any;
    chart: any;
    totalMemoryUsage: string;
  }> {
    const { default: portfolioCache } = await import('./portfolio-cache');
    const { default: priceCache } = await import('./price-cache');
    const { default: chartCache } = await import('./chart-cache');

    const portfolioStats = portfolioCache.getCacheStats();
    const priceStats = priceCache.getCacheStats();
    const chartStats = chartCache.getCacheStats();

    // Calculate total memory usage (rough estimate)
    const totalMemoryKB = 
      parseInt(portfolioStats.estimatedSize?.replace('KB', '') || '0') +
      parseInt(priceStats.memoryUsage?.replace('KB', '') || '0') +
      parseInt(chartStats.memoryUsage?.replace('KB', '') || '0');

    return {
      portfolio: portfolioStats,
      price: priceStats,
      chart: chartStats,
      totalMemoryUsage: `${totalMemoryKB}KB`
    };
  }

  // Preloading strategies
  async preloadUserData(userId: string, portfolioIds: string[]): Promise<void> {
    const { default: portfolioCache } = await import('./portfolio-cache');
    const { default: priceCache } = await import('./price-cache');
    const { default: chartCache, CHART_CONFIGS } = await import('./chart-cache');

    // Preload portfolio data
    const portfolioPromises = portfolioIds.map(id => 
      portfolioCache.warmupPortfolioCache(userId, id)
    );

    // Get symbols from portfolios for price preloading
    const symbols: string[] = [];
    for (const portfolioId of portfolioIds) {
      const holdings = await portfolioCache.getPortfolioHoldings(userId, portfolioId);
      if (holdings) {
        symbols.push(...holdings.map(h => h.stocks?.symbol).filter(Boolean));
      }
    }

    // Preload price data
    const pricePromises = [
      priceCache.preloadPrices(symbols),
      priceCache.preloadHistoricalData(symbols, ['1M', '3M', '1Y'])
    ];

    // Preload chart data
    const chartPromises = [
      chartCache.preloadChartData(symbols, [
        CHART_CONFIGS.DAILY,
        CHART_CONFIGS.WEEKLY,
        CHART_CONFIGS.MONTHLY
      ]),
      chartCache.preloadPortfolioCharts(portfolioIds, [
        CHART_CONFIGS.DAILY,
        CHART_CONFIGS.WEEKLY
      ])
    ];

    await Promise.allSettled([
      ...portfolioPromises,
      ...pricePromises,
      ...chartPromises
    ]);
  }

  // Cache invalidation coordination
  async invalidateSymbol(symbol: string): Promise<void> {
    const { default: priceCache } = await import('./price-cache');
    const { default: chartCache } = await import('./chart-cache');

    priceCache.invalidatePrice(symbol);
    priceCache.invalidateHistoricalPrices(symbol);
    priceCache.invalidateMarketData(symbol);
    chartCache.invalidateSymbol(symbol);
  }

  async invalidatePortfolio(userId: string, portfolioId: string): Promise<void> {
    const { default: portfolioCache } = await import('./portfolio-cache');
    const { default: chartCache } = await import('./chart-cache');

    portfolioCache.invalidatePortfolio(userId, portfolioId);
    chartCache.invalidatePortfolio(portfolioId);
  }

  // Health check
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const stats = await this.getCacheStats();
      
      const memoryUsageKB = parseInt(stats.totalMemoryUsage.replace('KB', ''));
      const maxMemoryKB = 50000; // 50MB limit
      
      const status = memoryUsageKB > maxMemoryKB ? 'degraded' : 'healthy';
      
      return {
        status,
        details: {
          memoryUsage: stats.totalMemoryUsage,
          maxMemory: `${maxMemoryKB}KB`,
          cacheStats: stats
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// React hook for cache management
export const useCacheManager = () => {
  return {
    clearAllCaches: cacheManager.clearAllCaches.bind(cacheManager),
    getCacheStats: cacheManager.getCacheStats.bind(cacheManager),
    preloadUserData: cacheManager.preloadUserData.bind(cacheManager),
    invalidateSymbol: cacheManager.invalidateSymbol.bind(cacheManager),
    invalidatePortfolio: cacheManager.invalidatePortfolio.bind(cacheManager),
    performHealthCheck: cacheManager.performHealthCheck.bind(cacheManager)
  };
};

// Service Worker integration for offline caching
export const setupServiceWorkerCaching = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
};

// IndexedDB fallback for offline storage
export const setupOfflineStorage = () => {
  if ('indexedDB' in window) {
    const request = indexedDB.open('LifeDashCache', 1);
    
    request.onerror = () => {
      console.error('IndexedDB setup failed');
    };
    
    request.onsuccess = () => {
      console.log('IndexedDB setup successful');
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores for different data types
      if (!db.objectStoreNames.contains('portfolios')) {
        db.createObjectStore('portfolios', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('prices')) {
        db.createObjectStore('prices', { keyPath: 'symbol' });
      }
      
      if (!db.objectStoreNames.contains('charts')) {
        db.createObjectStore('charts', { keyPath: 'id' });
      }
    };
  }
};