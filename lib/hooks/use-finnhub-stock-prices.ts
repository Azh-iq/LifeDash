'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  currency: string
  marketState: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
  source: string
}

export interface StockPricesState {
  [symbol: string]: StockPrice
}

export interface UseFinnhubStockPricesOptions {
  // Refresh interval in seconds (default: 60 seconds for Finnhub rate limits)
  refreshInterval?: number
  // Whether to use caching (default: true)
  useCache?: boolean
  // Whether to start fetching immediately (default: true)
  enabled?: boolean
  // Callback when prices update
  onPricesUpdate?: (prices: StockPricesState) => void
  // Callback when errors occur
  onError?: (errors: any[]) => void
  // Max symbols per batch (default: 10 to respect rate limits)
  maxBatchSize?: number
}

export interface UseFinnhubStockPricesReturn {
  // Current stock prices
  prices: StockPricesState
  // Loading state
  loading: boolean
  // Error state
  error: string | null
  // All errors from API
  errors: any[]
  // Whether data is from cache
  fromCache: boolean
  // Last update timestamp
  lastUpdate: string | null
  // Manual refresh function
  refresh: () => Promise<void>
  // Add symbols to fetch queue
  addSymbols: (symbols: string[]) => void
  // Remove symbols from queue
  removeSymbols: (symbols: string[]) => void
  // Queue status
  queueStatus: {
    total: number
    processing: number
    completed: number
    failed: number
  }
}

// Global queue manager for Finnhub API calls
class FinnhubQueueManager {
  private queue: string[] = []
  private processing = new Set<string>()
  private completed = new Set<string>()
  private failed = new Set<string>()
  private isProcessing = false
  private lastRequestTime = 0

  // Rate limiting: 60 calls per minute (free tier)
  private readonly MIN_DELAY = 1000 // 1 second between calls for free tier
  private readonly MAX_CONCURRENT = 1 // Max concurrent requests (sequential for free tier)

  addToQueue(symbols: string[]): void {
    symbols.forEach(symbol => {
      if (
        !this.queue.includes(symbol) &&
        !this.processing.has(symbol) &&
        !this.completed.has(symbol)
      ) {
        this.queue.push(symbol)
      }
    })
  }

  removeFromQueue(symbols: string[]): void {
    symbols.forEach(symbol => {
      const index = this.queue.indexOf(symbol)
      if (index > -1) {
        this.queue.splice(index, 1)
      }
      this.processing.delete(symbol)
    })
  }

  getStatus() {
    return {
      total: this.queue.length + this.processing.size + this.completed.size,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
    }
  }

  async processQueue(
    onUpdate: (symbol: string, price: StockPrice) => void,
    onError: (symbol: string, error: any) => void
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (
      this.queue.length > 0 &&
      this.processing.size < this.MAX_CONCURRENT
    ) {
      const symbol = this.queue.shift()
      if (!symbol) continue

      this.processing.add(symbol)

      // Respect rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.MIN_DELAY) {
        await new Promise(resolve =>
          setTimeout(resolve, this.MIN_DELAY - timeSinceLastRequest)
        )
      }

      this.lastRequestTime = Date.now()

      // Process individual symbol
      this.processSingleSymbol(symbol, onUpdate, onError)
    }

    this.isProcessing = false
  }

  private async processSingleSymbol(
    symbol: string,
    onUpdate: (symbol: string, price: StockPrice) => void,
    onError: (symbol: string, error: any) => void
  ): Promise<void> {
    try {
      // Use real Finnhub API call
      const { fetchRealStockPrice } = await import('@/lib/utils/finnhub-api')

      const result = await fetchRealStockPrice(symbol, {
        useCache: true,
        bypassRateLimit: false,
      })

      if (result.success && result.data) {
        const realPrice: StockPrice = {
          symbol: result.data.symbol,
          price: result.data.price,
          change: result.data.change,
          changePercent: result.data.changePercent,
          volume: result.data.volume,
          timestamp: result.data.timestamp,
          currency: result.data.currency,
          marketState: result.data.marketState,
          source: 'finnhub',
        }

        onUpdate(symbol, realPrice)
        this.completed.add(symbol)
      } else {
        // Handle API errors
        const error = result.errors[0] || {
          code: 'NO_DATA',
          message: 'No data available for symbol',
          timestamp: new Date().toISOString(),
        }

        onError(symbol, error)
        this.failed.add(symbol)
      }
    } catch (error) {
      onError(symbol, {
        code: 'QUEUE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
      this.failed.add(symbol)
    } finally {
      this.processing.delete(symbol)
    }
  }

  clearCompleted(): void {
    this.completed.clear()
    this.failed.clear()
  }
}

// Global queue instance
const globalQueue = new FinnhubQueueManager()

/**
 * Hook for fetching stock prices from Finnhub with intelligent queuing
 */
export function useFinnhubStockPrices(
  initialSymbols: string[] = [],
  options: UseFinnhubStockPricesOptions = {}
): UseFinnhubStockPricesReturn {
  const opts = {
    refreshInterval: 60, // 1 minute for Finnhub rate limits
    useCache: true,
    enabled: true,
    maxBatchSize: 10,
    ...options,
  }

  // State
  const [symbols, setSymbols] = useState<string[]>(initialSymbols)
  const [prices, setPrices] = useState<StockPricesState>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<any[]>([])
  const [fromCache, setFromCache] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [queueStatus, setQueueStatus] = useState(globalQueue.getStatus())

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  /**
   * Update queue status
   */
  const updateQueueStatus = useCallback(() => {
    if (mountedRef.current) {
      setQueueStatus(globalQueue.getStatus())
    }
  }, [])

  /**
   * Handle price updates from queue
   */
  const handlePriceUpdate = useCallback(
    (symbol: string, price: StockPrice) => {
      if (!mountedRef.current) return

      setPrices(prev => {
        const updated = { ...prev, [symbol]: price }
        opts.onPricesUpdate?.(updated)
        return updated
      })

      setLastUpdate(new Date().toISOString())
      updateQueueStatus()
    },
    [opts, updateQueueStatus]
  )

  /**
   * Handle errors from queue
   */
  const handleError = useCallback(
    (symbol: string, error: any) => {
      if (!mountedRef.current) return

      setErrors(prev => [...prev, error])
      opts.onError?.([error])
      updateQueueStatus()
    },
    [opts, updateQueueStatus]
  )

  /**
   * Add symbols to fetch queue
   */
  const addSymbols = useCallback(
    (newSymbols: string[]) => {
      setSymbols(prev => {
        const uniqueSymbols = [...new Set([...prev, ...newSymbols])]
        globalQueue.addToQueue(newSymbols)
        updateQueueStatus()
        return uniqueSymbols
      })
    },
    [updateQueueStatus]
  )

  /**
   * Remove symbols from queue
   */
  const removeSymbols = useCallback(
    (symbolsToRemove: string[]) => {
      setSymbols(prev => {
        const filtered = prev.filter(s => !symbolsToRemove.includes(s))
        globalQueue.removeFromQueue(symbolsToRemove)
        updateQueueStatus()
        return filtered
      })
    },
    [updateQueueStatus]
  )

  /**
   * Process the queue
   */
  const processQueue = useCallback(async () => {
    if (!opts.enabled || !mountedRef.current) return

    try {
      setLoading(true)
      setError(null)

      await globalQueue.processQueue(handlePriceUpdate, handleError)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        updateQueueStatus()
      }
    }
  }, [opts.enabled, handlePriceUpdate, handleError, updateQueueStatus])

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    globalQueue.clearCompleted()
    globalQueue.addToQueue(symbols)
    await processQueue()
  }, [symbols, processQueue])

  // Initialize queue with initial symbols
  useEffect(() => {
    if (initialSymbols.length > 0) {
      addSymbols(initialSymbols)
    }
  }, [addSymbols, initialSymbols])

  // Set up interval for queue processing
  useEffect(() => {
    if (!opts.enabled) return

    // Initial queue processing
    processQueue()

    // Set up interval for regular processing
    intervalRef.current = setInterval(() => {
      processQueue()
    }, opts.refreshInterval * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [opts.enabled, opts.refreshInterval, processQueue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
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
    refresh,
    addSymbols,
    removeSymbols,
    queueStatus,
  }
}
