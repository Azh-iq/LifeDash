'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  getWidgetDataService,
  type WidgetDataService,
  type WidgetStockPricesResult,
  type WidgetStockPriceResult,
  type WidgetCompanyProfileResult,
  type WidgetBasicFinancialsResult,
  type WidgetCompanyNewsResult,
  type WidgetPortfolioOverviewResult,
  type WidgetPortfolioHoldingsResult,
  type WidgetPortfolioPerformanceResult,
  type WidgetTransactionsResult,
  type WidgetPortfolioAnalyticsResult,
  type WidgetStockAnalyticsResult,
  type WidgetCacheStats,
  isValidPortfolioId,
  isValidSymbol,
} from '@/lib/services/widget-data'
import { type StockPrice } from '@/lib/utils/finnhub-api'

/**
 * Widget API Hooks for LifeDash
 * 
 * Provides custom React hooks for each widget type:
 * - useStockChart, useNewsFeed, useTransactions, etc.
 * - Error handling and loading states
 * - Real-time data updates
 * - Cache management
 * - Norwegian localization
 */

// ===== HOOK INTERFACES =====

interface UseWidgetHookOptions {
  enabled?: boolean
  refreshInterval?: number
  useCache?: boolean
  retryCount?: number
  retryDelay?: number
  onError?: (error: string) => void
  onSuccess?: (data: any) => void
}

interface UseWidgetHookResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: string | null
  fromCache: boolean
  retryCount: number
  isStale: boolean
}

interface UseRealtimeHookOptions extends UseWidgetHookOptions {
  pollInterval?: number
  enableRealtime?: boolean
}

interface UseRealtimeHookResult<T> extends UseWidgetHookResult<T> {
  subscribe: () => void
  unsubscribe: () => void
  isConnected: boolean
}

// ===== UTILITY FUNCTIONS =====

function useWidgetService(): WidgetDataService {
  return useMemo(() => getWidgetDataService(), [])
}

function useRefreshInterval(callback: () => Promise<void>, interval: number, enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled || interval <= 0) return

    intervalRef.current = setInterval(async () => {
      await callbackRef.current()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, enabled])
}

function useRetryLogic(
  operation: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  const [retryCount, setRetryCount] = useState(0)
  
  const executeWithRetry = useCallback(async () => {
    let lastError: Error | null = null
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await operation()
        setRetryCount(i)
        return result
      } catch (error) {
        lastError = error as Error
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }
    
    setRetryCount(maxRetries + 1)
    throw lastError
  }, [operation, maxRetries, delay])
  
  return { executeWithRetry, retryCount }
}

// ===== STOCK DATA HOOKS =====

export function useStockPrices(
  symbols: string[],
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<StockPrice[]> {
  const {
    enabled = true,
    refreshInterval = 60000, // 1 minute
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<StockPrice[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [currentRetryCount, setCurrentRetryCount] = useState(0)

  const service = useWidgetService()
  const validSymbols = useMemo(() => symbols.filter(isValidSymbol), [symbols])

  const fetchData = useCallback(async () => {
    if (!enabled || validSymbols.length === 0) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getStockPrices(validSymbols)
      
      if (result.success) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        setCurrentRetryCount(0)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.errors[0]?.message || 'Failed to fetch stock prices'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, validSymbols, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbols.length > 0) {
      refresh()
    }
  }, [enabled, validSymbols, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function useStockPrice(
  symbol: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<StockPrice> {
  const {
    enabled = true,
    refreshInterval = 60000,
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<StockPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validSymbol = useMemo(() => isValidSymbol(symbol), [symbol])

  const fetchData = useCallback(async () => {
    if (!enabled || !validSymbol) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getStockPrice(symbol)
      
      if (result.success && result.data) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch stock price'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, symbol, validSymbol, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbol) {
      refresh()
    }
  }, [enabled, validSymbol, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function useCompanyProfile(
  symbol: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetCompanyProfileResult['data']> {
  const {
    enabled = true,
    refreshInterval = 24 * 60 * 60 * 1000, // 24 hours
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetCompanyProfileResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validSymbol = useMemo(() => isValidSymbol(symbol), [symbol])

  const fetchData = useCallback(async () => {
    if (!enabled || !validSymbol) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getCompanyProfile(symbol)
      
      if (result.success && result.data) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch company profile'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, symbol, validSymbol, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbol) {
      refresh()
    }
  }, [enabled, validSymbol, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 24 * 60 * 60 * 1000 // 24 hours
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function useBasicFinancials(
  symbol: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetBasicFinancialsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 6 * 60 * 60 * 1000, // 6 hours
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetBasicFinancialsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validSymbol = useMemo(() => isValidSymbol(symbol), [symbol])

  const fetchData = useCallback(async () => {
    if (!enabled || !validSymbol) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getBasicFinancials(symbol)
      
      if (result.success && result.data) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch basic financials'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, symbol, validSymbol, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbol) {
      refresh()
    }
  }, [enabled, validSymbol, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 6 * 60 * 60 * 1000 // 6 hours
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function useCompanyNews(
  symbol: string,
  days: number = 7,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetCompanyNewsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 60 * 60 * 1000, // 1 hour
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetCompanyNewsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validSymbol = useMemo(() => isValidSymbol(symbol), [symbol])

  const fetchData = useCallback(async () => {
    if (!enabled || !validSymbol) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getCompanyNews(symbol, days)
      
      if (result.success) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch company news'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, symbol, validSymbol, days, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbol) {
      refresh()
    }
  }, [enabled, validSymbol, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 60 * 60 * 1000 // 1 hour
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

// ===== PORTFOLIO DATA HOOKS =====

export function usePortfolioOverview(
  portfolioId: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetPortfolioOverviewResult['data']> {
  const {
    enabled = true,
    refreshInterval = 30000, // 30 seconds
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetPortfolioOverviewResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioOverview(portfolioId)
      
      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio overview'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
    }
  }, [enabled, validPortfolioId, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 2 * 60 * 1000 // 2 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function usePortfolioHoldings(
  portfolioId: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetPortfolioHoldingsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 60000, // 1 minute
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetPortfolioHoldingsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioHoldings(portfolioId)
      
      if (result.success) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio holdings'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
    }
  }, [enabled, validPortfolioId, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function usePortfolioPerformance(
  portfolioId: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetPortfolioPerformanceResult['data']> {
  const {
    enabled = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetPortfolioPerformanceResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioPerformance(portfolioId)
      
      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio performance'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
    }
  }, [enabled, validPortfolioId, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 10 * 60 * 1000 // 10 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function usePortfolioTransactions(
  portfolioId: string,
  limit: number = 20,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetTransactionsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 2 * 60 * 1000, // 2 minutes
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetTransactionsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioTransactions(portfolioId, limit)
      
      if (result.success) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio transactions'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, limit, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
    }
  }, [enabled, validPortfolioId, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

// ===== ANALYTICS HOOKS =====

export function usePortfolioAnalytics(
  portfolioId: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetPortfolioAnalyticsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetPortfolioAnalyticsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioAnalytics(portfolioId)
      
      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio analytics'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
    }
  }, [enabled, validPortfolioId, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 15 * 60 * 1000 // 15 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

export function useStockAnalytics(
  symbol: string,
  options: UseWidgetHookOptions = {}
): UseWidgetHookResult<WidgetStockAnalyticsResult['data']> {
  const {
    enabled = true,
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    useCache = true,
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetStockAnalyticsResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const service = useWidgetService()
  const validSymbol = useMemo(() => isValidSymbol(symbol), [symbol])

  const fetchData = useCallback(async () => {
    if (!enabled || !validSymbol) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getStockAnalytics(symbol)
      
      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch stock analytics'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, symbol, validSymbol, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  useEffect(() => {
    if (enabled && validSymbol) {
      refresh()
    }
  }, [enabled, validSymbol, refresh])

  useRefreshInterval(refresh, refreshInterval, enabled && !loading)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 15 * 60 * 1000 // 15 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale
  }
}

// ===== REAL-TIME HOOKS =====

export function useRealtimeStockPrices(
  symbols: string[],
  options: UseRealtimeHookOptions = {}
): UseRealtimeHookResult<StockPrice[]> {
  const {
    enabled = true,
    enableRealtime = true,
    pollInterval = 60000, // 1 minute
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<StockPrice[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const service = useWidgetService()
  const validSymbols = useMemo(() => symbols.filter(isValidSymbol), [symbols])
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled || validSymbols.length === 0) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getStockPrices(validSymbols)
      
      if (result.success) {
        setData(result.data)
        setFromCache(result.fromCache)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.errors[0]?.message || 'Failed to fetch stock prices'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, validSymbols, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  const subscribe = useCallback(() => {
    if (!enableRealtime || validSymbols.length === 0) return

    unsubscribeRef.current = service.subscribeToStockPrices(validSymbols, (prices) => {
      setData(prices)
      setLastUpdated(new Date().toISOString())
      setFromCache(false)
      setIsConnected(true)
      onSuccess?.(prices)
    })
  }, [service, validSymbols, enableRealtime, onSuccess])

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (enabled && validSymbols.length > 0) {
      refresh()
      if (enableRealtime) {
        subscribe()
      }
    }

    return () => {
      unsubscribe()
    }
  }, [enabled, validSymbols, refresh, enableRealtime, subscribe, unsubscribe])

  useRefreshInterval(refresh, pollInterval, enabled && !loading && !enableRealtime)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale,
    subscribe,
    unsubscribe,
    isConnected
  }
}

export function useRealtimePortfolio(
  portfolioId: string,
  options: UseRealtimeHookOptions = {}
): UseRealtimeHookResult<WidgetPortfolioOverviewResult['data']> {
  const {
    enabled = true,
    enableRealtime = true,
    pollInterval = 30000, // 30 seconds
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options

  const [data, setData] = useState<WidgetPortfolioOverviewResult['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const service = useWidgetService()
  const validPortfolioId = useMemo(() => isValidPortfolioId(portfolioId), [portfolioId])
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled || !validPortfolioId) return

    try {
      setLoading(true)
      setError(null)

      const result = await service.getPortfolioOverview(portfolioId)
      
      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(result.timestamp)
        onSuccess?.(result.data)
      } else {
        const errorMessage = result.error || 'Failed to fetch portfolio overview'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service, portfolioId, validPortfolioId, enabled, onSuccess, onError])

  const { executeWithRetry, retryCount: hookRetryCount } = useRetryLogic(fetchData, retryCount, retryDelay)

  const refresh = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  const subscribe = useCallback(() => {
    if (!enableRealtime || !validPortfolioId) return

    unsubscribeRef.current = service.subscribeToPortfolioUpdates(portfolioId, () => {
      // Refresh data when portfolio updates
      refresh()
      setIsConnected(true)
    })
  }, [service, portfolioId, validPortfolioId, enableRealtime, refresh])

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (enabled && validPortfolioId) {
      refresh()
      if (enableRealtime) {
        subscribe()
      }
    }

    return () => {
      unsubscribe()
    }
  }, [enabled, validPortfolioId, refresh, enableRealtime, subscribe, unsubscribe])

  useRefreshInterval(refresh, pollInterval, enabled && !loading && !enableRealtime)

  const isStale = useMemo(() => {
    if (!lastUpdated) return true
    const staleTime = 2 * 60 * 1000 // 2 minutes
    return Date.now() - new Date(lastUpdated).getTime() > staleTime
  }, [lastUpdated])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
    retryCount: hookRetryCount,
    isStale,
    subscribe,
    unsubscribe,
    isConnected
  }
}

// ===== CACHE MANAGEMENT HOOKS =====

export function useCacheStats(): UseWidgetHookResult<WidgetCacheStats> {
  const [data, setData] = useState<WidgetCacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const service = useWidgetService()

  const fetchData = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      const stats = service.getCacheStats()
      setData(stats)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [service])

  const refresh = useCallback(async () => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRefreshInterval(refresh, 5000, true) // Update every 5 seconds

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache: false,
    retryCount: 0,
    isStale: false
  }
}

export function useCacheClear() {
  const service = useWidgetService()

  const clearCache = useCallback((pattern?: string) => {
    service.clearCache(pattern)
  }, [service])

  return { clearCache }
}

// ===== COMBINED WIDGET HOOKS =====

export function useStockWidget(
  symbol: string,
  options: UseWidgetHookOptions = {}
) {
  const priceResult = useStockPrice(symbol, options)
  const profileResult = useCompanyProfile(symbol, {
    ...options,
    refreshInterval: 24 * 60 * 60 * 1000 // 24 hours
  })
  const financialsResult = useBasicFinancials(symbol, {
    ...options,
    refreshInterval: 6 * 60 * 60 * 1000 // 6 hours
  })
  const newsResult = useCompanyNews(symbol, 7, {
    ...options,
    refreshInterval: 60 * 60 * 1000 // 1 hour
  })
  const analyticsResult = useStockAnalytics(symbol, {
    ...options,
    refreshInterval: 10 * 60 * 1000 // 10 minutes
  })

  const loading = priceResult.loading || profileResult.loading || financialsResult.loading || newsResult.loading || analyticsResult.loading
  const error = priceResult.error || profileResult.error || financialsResult.error || newsResult.error || analyticsResult.error

  const refresh = useCallback(async () => {
    await Promise.all([
      priceResult.refresh(),
      profileResult.refresh(),
      financialsResult.refresh(),
      newsResult.refresh(),
      analyticsResult.refresh()
    ])
  }, [priceResult.refresh, profileResult.refresh, financialsResult.refresh, newsResult.refresh, analyticsResult.refresh])

  return {
    price: priceResult.data,
    profile: profileResult.data,
    financials: financialsResult.data,
    news: newsResult.data,
    analytics: analyticsResult.data,
    loading,
    error,
    refresh,
    lastUpdated: priceResult.lastUpdated,
    fromCache: priceResult.fromCache
  }
}

export function usePortfolioWidget(
  portfolioId: string,
  options: UseWidgetHookOptions = {}
) {
  const overviewResult = usePortfolioOverview(portfolioId, options)
  const holdingsResult = usePortfolioHoldings(portfolioId, options)
  const performanceResult = usePortfolioPerformance(portfolioId, options)
  const transactionsResult = usePortfolioTransactions(portfolioId, 10, options)
  const analyticsResult = usePortfolioAnalytics(portfolioId, {
    ...options,
    refreshInterval: 10 * 60 * 1000 // 10 minutes
  })

  const loading = overviewResult.loading || holdingsResult.loading || performanceResult.loading || transactionsResult.loading || analyticsResult.loading
  const error = overviewResult.error || holdingsResult.error || performanceResult.error || transactionsResult.error || analyticsResult.error

  const refresh = useCallback(async () => {
    await Promise.all([
      overviewResult.refresh(),
      holdingsResult.refresh(),
      performanceResult.refresh(),
      transactionsResult.refresh(),
      analyticsResult.refresh()
    ])
  }, [overviewResult.refresh, holdingsResult.refresh, performanceResult.refresh, transactionsResult.refresh, analyticsResult.refresh])

  return {
    overview: overviewResult.data,
    holdings: holdingsResult.data,
    performance: performanceResult.data,
    transactions: transactionsResult.data,
    analytics: analyticsResult.data,
    loading,
    error,
    refresh,
    lastUpdated: overviewResult.lastUpdated,
    fromCache: overviewResult.fromCache
  }
}

// ===== EXPORTS =====

export type {
  UseWidgetHookOptions,
  UseWidgetHookResult,
  UseRealtimeHookOptions,
  UseRealtimeHookResult,
}