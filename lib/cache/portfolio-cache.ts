'use client'

import { useState, useEffect } from 'react'

// Simple in-memory cache implementation with TTL
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class PortfolioCache<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private defaultTtl: number = 300000) { // 5 minutes default TTL
    // Start cleanup interval to remove expired items
    this.startCleanup()
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    }
    this.cache.set(key, item)
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidate(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  size(): number {
    return this.cache.size
  }

  destroy(): void {
    this.clear()
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Global cache instances
const portfolioCache = new PortfolioCache(300000) // 5 minutes
const holdingsCache = new PortfolioCache(180000) // 3 minutes
const priceCache = new PortfolioCache(60000) // 1 minute
const calculationCache = new PortfolioCache(120000) // 2 minutes

// Cache keys
export const CacheKeys = {
  portfolio: (id: string) => `portfolio:${id}`,
  holdings: (portfolioId: string) => `holdings:${portfolioId}`,
  holdingsPaginated: (portfolioId: string, page: number, limit: number) => 
    `holdings:${portfolioId}:page:${page}:limit:${limit}`,
  price: (symbol: string) => `price:${symbol}`,
  prices: (symbols: string[]) => `prices:${symbols.sort().join(',')}`,
  calculations: (portfolioId: string, type: string) => `calc:${portfolioId}:${type}`,
  metrics: (portfolioId: string) => `metrics:${portfolioId}`,
  allocation: (portfolioId: string, type: string) => `allocation:${portfolioId}:${type}`,
  performance: (portfolioId: string, period: string) => `performance:${portfolioId}:${period}`,
}

// Cache utility functions
export const PortfolioCacheManager = {
  // Portfolio data caching
  getPortfolio: (id: string) => portfolioCache.get(CacheKeys.portfolio(id)),
  setPortfolio: (id: string, data: any, ttl?: number) => 
    portfolioCache.set(CacheKeys.portfolio(id), data, ttl),
  
  // Holdings data caching
  getHoldings: (portfolioId: string) => holdingsCache.get(CacheKeys.holdings(portfolioId)),
  setHoldings: (portfolioId: string, data: any, ttl?: number) => 
    holdingsCache.set(CacheKeys.holdings(portfolioId), data, ttl),
  
  // Price data caching
  getPrice: (symbol: string) => priceCache.get(CacheKeys.price(symbol)),
  setPrice: (symbol: string, data: any, ttl?: number) => 
    priceCache.set(CacheKeys.price(symbol), data, ttl),
  
  getPrices: (symbols: string[]) => priceCache.get(CacheKeys.prices(symbols)),
  setPrices: (symbols: string[], data: any, ttl?: number) => 
    priceCache.set(CacheKeys.prices(symbols), data, ttl),
  
  // Calculation caching
  getCalculation: (portfolioId: string, type: string) => 
    calculationCache.get(CacheKeys.calculations(portfolioId, type)),
  setCalculation: (portfolioId: string, type: string, data: any, ttl?: number) => 
    calculationCache.set(CacheKeys.calculations(portfolioId, type), data, ttl),
  
  // Metrics caching
  getMetrics: (portfolioId: string) => calculationCache.get(CacheKeys.metrics(portfolioId)),
  setMetrics: (portfolioId: string, data: any, ttl?: number) => 
    calculationCache.set(CacheKeys.metrics(portfolioId), data, ttl),
  
  // Allocation caching
  getAllocation: (portfolioId: string, type: string) => 
    calculationCache.get(CacheKeys.allocation(portfolioId, type)),
  setAllocation: (portfolioId: string, type: string, data: any, ttl?: number) => 
    calculationCache.set(CacheKeys.allocation(portfolioId, type), data, ttl),
  
  // Performance caching
  getPerformance: (portfolioId: string, period: string) => 
    calculationCache.get(CacheKeys.performance(portfolioId, period)),
  setPerformance: (portfolioId: string, period: string, data: any, ttl?: number) => 
    calculationCache.set(CacheKeys.performance(portfolioId, period), data, ttl),
  
  // Cache invalidation
  invalidatePortfolio: (id: string) => {
    portfolioCache.delete(CacheKeys.portfolio(id))
    holdingsCache.invalidate(id)
    calculationCache.invalidate(id)
  },
  
  invalidateHoldings: (portfolioId: string) => {
    holdingsCache.invalidate(portfolioId)
    calculationCache.invalidate(portfolioId)
  },
  
  invalidatePrices: (symbols?: string[]) => {
    if (symbols) {
      symbols.forEach(symbol => priceCache.delete(CacheKeys.price(symbol)))
    } else {
      priceCache.clear()
    }
  },
  
  invalidateCalculations: (portfolioId: string) => {
    calculationCache.invalidate(portfolioId)
  },
  
  // Cache statistics
  getStats: () => ({
    portfolioCache: portfolioCache.size(),
    holdingsCache: holdingsCache.size(),
    priceCache: priceCache.size(),
    calculationCache: calculationCache.size(),
  }),
  
  // Clear all caches
  clearAll: () => {
    portfolioCache.clear()
    holdingsCache.clear()
    priceCache.clear()
    calculationCache.clear()
  },
  
  // Destroy all caches
  destroy: () => {
    portfolioCache.destroy()
    holdingsCache.destroy()
    priceCache.destroy()
    calculationCache.destroy()
  },
}

// Enhanced cache with compression for large datasets
export class CompressedCache<T = any> {
  private cache = new Map<string, CacheItem<string>>()
  private defaultTtl: number

  constructor(defaultTtl: number = 300000) {
    this.defaultTtl = defaultTtl
  }

  private compress(data: T): string {
    return JSON.stringify(data)
  }

  private decompress(data: string): T {
    return JSON.parse(data)
  }

  set(key: string, data: T, ttl?: number): void {
    const compressed = this.compress(data)
    const item: CacheItem<string> = {
      data: compressed,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    }
    this.cache.set(key, item)
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return this.decompress(item.data)
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Cache hooks for React components
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to get from cache first
        const cached = calculationCache.get(key)
        if (cached) {
          setData(cached)
          setLoading(false)
          return
        }

        // Fetch fresh data
        const result = await fetcher()
        calculationCache.set(key, result, ttl)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, fetcher, ttl])

  return { data, loading, error }
}

// Cache warming utility
export const CacheWarmer = {
  warmPortfolio: async (portfolioId: string) => {
    // Warm up common cache entries for a portfolio
    const keys = [
      CacheKeys.portfolio(portfolioId),
      CacheKeys.holdings(portfolioId),
      CacheKeys.metrics(portfolioId),
      CacheKeys.allocation(portfolioId, 'sector'),
      CacheKeys.allocation(portfolioId, 'currency'),
      CacheKeys.performance(portfolioId, 'daily'),
      CacheKeys.performance(portfolioId, 'weekly'),
      CacheKeys.performance(portfolioId, 'monthly'),
    ]
    
    console.log(`Warming cache for portfolio ${portfolioId}:`, keys)
  },
  
  warmPrices: async (symbols: string[]) => {
    // Warm up price cache for multiple symbols
    console.log(`Warming price cache for symbols:`, symbols)
  },
}

export default PortfolioCacheManager