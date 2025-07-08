'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  realtimeService,
  PriceUpdate,
  PortfolioUpdate,
  RealtimeConnectionStatus,
} from '@/lib/supabase/realtime'

export interface PriceState {
  [symbol: string]: {
    price: number
    change: number
    changePercent: number
    volume?: number
    timestamp: string
    isFlashing?: boolean
  }
}

export function useRealtimePrices(symbols: string[]) {
  const [prices, setPrices] = useState<PriceState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setPrices(prev => ({
      ...prev,
      [update.symbol]: {
        price: update.price,
        change: update.change,
        changePercent: update.changePercent,
        volume: update.volume,
        timestamp: update.timestamp,
        isFlashing: true,
      },
    }))

    // Remove flash effect after animation
    setTimeout(() => {
      setPrices(prev => ({
        ...prev,
        [update.symbol]: {
          ...prev[update.symbol],
          isFlashing: false,
        },
      }))
    }, 1000)
  }, [])

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const initializePrices = async () => {
      try {
        setLoading(true)
        setError(null)

        // Import supabase client
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Fetch initial stock prices from database
        const { data: stocks, error: stocksError } = await supabase
          .from('stocks')
          .select('symbol, current_price, last_updated')
          .in('symbol', symbols)
          .not('current_price', 'is', null)

        if (stocksError) {
          console.error('Error fetching stocks:', stocksError)
          throw new Error('Failed to fetch stock data')
        }

        // Use Finnhub API to get real prices
        const { fetchRealStockPrices } = await import('@/lib/utils/finnhub-api')

        const finnhubResult = await fetchRealStockPrices(symbols, {
          useCache: true,
          bypassRateLimit: false,
        })

        const latestPrices: PriceState = {}

        if (finnhubResult.success && finnhubResult.data.length > 0) {
          // Use real Finnhub data
          finnhubResult.data.forEach(stockPrice => {
            latestPrices[stockPrice.symbol] = {
              price: stockPrice.price,
              change: stockPrice.change,
              changePercent: stockPrice.changePercent,
              volume: stockPrice.volume,
              timestamp: stockPrice.timestamp,
            }
          })
        }

        // For symbols not found in Finnhub, try database fallback
        if (stocks && stocks.length > 0) {
          stocks.forEach(stock => {
            if (!latestPrices[stock.symbol]) {
              latestPrices[stock.symbol] = {
                price: stock.current_price || 0,
                change: 0, // No historical data available
                changePercent: 0,
                timestamp: stock.last_updated || new Date().toISOString(),
              }
            }
          })
        }

        setPrices(latestPrices)

        // Enable real-time subscriptions
        unsubscribe = realtimeService.subscribeToStockPrices(
          symbols,
          handlePriceUpdate
        )

        setLoading(false)
      } catch (err) {
        console.error('Error initializing prices:', err)
        setError(err instanceof Error ? err.message : 'Failed to load prices')
        setLoading(false)
      }
    }

    initializePrices()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [symbols, handlePriceUpdate])

  return { prices, loading, error }
}

export function useRealtimePortfolio(portfolioId: string | null) {
  const [portfolio, setPortfolio] = useState<PortfolioUpdate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handlePortfolioUpdate = useCallback((update: PortfolioUpdate) => {
    setPortfolio(update)
  }, [])

  useEffect(() => {
    if (!portfolioId) {
      setLoading(false)
      return
    }

    const unsubscribe: (() => void) | null = null

    const initializePortfolio = async () => {
      try {
        setLoading(true)
        setError(null)

        // Mock portfolio data removed - real portfolio data should come from usePortfolioState hook
        // This hook is deprecated and should not be used for displaying portfolio data
        setPortfolio(null)

        // Note: Real-time subscriptions disabled for demo
        // unsubscribe = realtimeService.subscribeToPortfolio(
        //   portfolioId,
        //   handlePortfolioUpdate
        // )

        setLoading(false)
      } catch (err) {
        console.error('Error initializing portfolio:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load portfolio'
        )
        setLoading(false)
      }
    }

    initializePortfolio()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [portfolioId, handlePortfolioUpdate])

  return { portfolio, loading, error }
}

export function useRealtimeHoldings(portfolioId: string | null) {
  const [holdings, setHoldings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleHoldingsUpdate = useCallback((updatedHoldings: any[]) => {
    setHoldings(updatedHoldings)
  }, [])

  useEffect(() => {
    if (!portfolioId) {
      setLoading(false)
      return
    }

    const unsubscribe: (() => void) | null = null

    const initializeHoldings = async () => {
      try {
        setLoading(true)
        setError(null)

        // Mock holdings data removed - real holdings data should come from usePortfolioState hook
        // This hook is deprecated and should not be used for displaying holdings data
        setHoldings([])

        // Note: Real-time subscriptions disabled for demo
        // unsubscribe = realtimeService.subscribeToHoldings(
        //   portfolioId,
        //   handleHoldingsUpdate
        // )

        setLoading(false)
      } catch (err) {
        console.error('Error initializing holdings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load holdings')
        setLoading(false)
      }
    }

    initializeHoldings()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [portfolioId, handleHoldingsUpdate])

  return { holdings, loading, error }
}

export function useRealtimeConnection() {
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>({
      connected: false,
      lastUpdate: null,
    })

  useEffect(() => {
    // Get initial status
    setConnectionStatus(realtimeService.getConnectionStatus())

    // Subscribe to status changes
    const unsubscribe =
      realtimeService.onConnectionStatusChange(setConnectionStatus)

    return unsubscribe
  }, [])

  return connectionStatus
}
