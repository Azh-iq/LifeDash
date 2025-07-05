'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  fetchStockPrices,
  StockPrice,
  YahooFinanceError,
  getMarketStatus,
  type YahooFinanceQuote,
} from '@/lib/utils/yahoo-finance'

export interface StockPricesState {
  [symbol: string]: StockPrice
}

export interface UseStockPricesOptions {
  // Refresh interval in seconds (default: 30 seconds)
  refreshInterval?: number
  // Whether to refresh only during market hours (default: true)
  refreshOnlyDuringMarketHours?: boolean
  // Whether to use caching (default: true)
  useCache?: boolean
  // Whether to start fetching immediately (default: true)
  enabled?: boolean
  // Callback when prices update
  onPricesUpdate?: (prices: StockPricesState) => void
  // Callback when errors occur
  onError?: (errors: YahooFinanceError[]) => void
}

export interface UseStockPricesReturn {
  // Current stock prices
  prices: StockPricesState
  // Loading state
  loading: boolean
  // Error state
  error: string | null
  // All errors from API
  errors: YahooFinanceError[]
  // Whether data is from cache
  fromCache: boolean
  // Last update timestamp
  lastUpdate: string | null
  // Market status
  marketStatus: {
    isOpen: boolean
    nextOpen: string | null
    nextClose: string | null
  }
  // Manual refresh function
  refresh: () => Promise<void>
  // Function to add/remove symbols
  updateSymbols: (symbols: string[]) => void
  // Function to clear all data
  clear: () => void
}

const DEFAULT_OPTIONS: Required<UseStockPricesOptions> = {
  refreshInterval: 30,
  refreshOnlyDuringMarketHours: true,
  useCache: true,
  enabled: true,
  onPricesUpdate: () => {},
  onError: () => {},
}

/**
 * Hook for fetching and managing real-time stock prices
 */
export function useStockPrices(
  initialSymbols: string[] = [],
  options: UseStockPricesOptions = {}
): UseStockPricesReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // State
  const [symbols, setSymbols] = useState<string[]>(initialSymbols)
  const [prices, setPrices] = useState<StockPricesState>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<YahooFinanceError[]>([])
  const [fromCache, setFromCache] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [marketStatus, setMarketStatus] = useState(getMarketStatus())

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Fetch stock prices
   */
  const fetchPrices = useCallback(
    async (symbolsToFetch: string[]) => {
      if (!symbolsToFetch.length || !opts.enabled) {
        return
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        setLoading(true)
        setError(null)

        const result = await fetchStockPrices(symbolsToFetch, {
          useCache: opts.useCache,
        })

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return
        }

        if (result.success) {
          // Convert array to state object
          const pricesState: StockPricesState = {}
          result.data.forEach(price => {
            pricesState[price.symbol] = price
          })

          setPrices(pricesState)
          setFromCache(result.fromCache)
          setLastUpdate(new Date().toISOString())
          setErrors(result.errors)

          // Call callback
          opts.onPricesUpdate(pricesState)

          // Set error only if no data was returned
          if (result.data.length === 0 && result.errors.length > 0) {
            setError(result.errors[0].message)
          }
        } else {
          const errorMessage =
            result.errors.length > 0
              ? result.errors[0].message
              : 'Failed to fetch stock prices'

          setError(errorMessage)
          setErrors(result.errors)
          opts.onError(result.errors)
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          return
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)

        const errorObj: YahooFinanceError = {
          code: 'FETCH_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        }

        setErrors([errorObj])
        opts.onError([errorObj])
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [opts]
  )

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchPrices(symbols)
  }, [symbols, fetchPrices])

  /**
   * Update symbols
   */
  const updateSymbols = useCallback((newSymbols: string[]) => {
    setSymbols(newSymbols)
  }, [])

  /**
   * Clear all data
   */
  const clear = useCallback(() => {
    setPrices({})
    setError(null)
    setErrors([])
    setFromCache(false)
    setLastUpdate(null)
    setLoading(false)
  }, [])

  /**
   * Check if should refresh based on market hours
   */
  const shouldRefresh = useCallback(() => {
    if (!opts.refreshOnlyDuringMarketHours) {
      return true
    }

    const status = getMarketStatus()
    setMarketStatus(status)

    return status.isOpen
  }, [opts.refreshOnlyDuringMarketHours])

  /**
   * Setup interval for automatic refresh
   */
  useEffect(() => {
    if (!opts.enabled || symbols.length === 0) {
      return
    }

    // Initial fetch
    fetchPrices(symbols)

    // Setup interval
    if (opts.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (shouldRefresh()) {
          fetchPrices(symbols)
        }
      }, opts.refreshInterval * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [symbols, opts.enabled, opts.refreshInterval, fetchPrices, shouldRefresh])

  /**
   * Update market status periodically
   */
  useEffect(() => {
    const updateMarketStatus = () => {
      setMarketStatus(getMarketStatus())
    }

    // Update every minute
    const statusInterval = setInterval(updateMarketStatus, 60 * 1000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    prices,
    loading,
    error,
    errors,
    fromCache,
    lastUpdate,
    marketStatus,
    refresh,
    updateSymbols,
    clear,
  }
}

/**
 * Hook for fetching a single stock price
 */
export function useStockPrice(
  symbol: string,
  options: UseStockPricesOptions = {}
): Omit<UseStockPricesReturn, 'updateSymbols'> & {
  price: StockPrice | null
} {
  const result = useStockPrices(symbol ? [symbol] : [], options)

  return {
    ...result,
    price: symbol ? result.prices[symbol] || null : null,
  }
}

/**
 * Hook that provides stock price updates for a portfolio
 */
export function usePortfolioStockPrices(
  portfolioSymbols: string[],
  options: UseStockPricesOptions = {}
): UseStockPricesReturn & {
  // Portfolio-specific metrics
  totalValue: number
  totalChange: number
  totalChangePercent: number
  getSymbolPrice: (symbol: string) => StockPrice | null
} {
  const result = useStockPrices(portfolioSymbols, options)

  // Calculate portfolio metrics
  const totalValue = Object.values(result.prices).reduce(
    (sum, price) => sum + price.price,
    0
  )
  const totalChange = Object.values(result.prices).reduce(
    (sum, price) => sum + price.change,
    0
  )
  const totalChangePercent =
    totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0

  const getSymbolPrice = useCallback(
    (symbol: string) => {
      return result.prices[symbol] || null
    },
    [result.prices]
  )

  return {
    ...result,
    totalValue,
    totalChange,
    totalChangePercent,
    getSymbolPrice,
  }
}

// Export types
export type { StockPrice, YahooFinanceError }
