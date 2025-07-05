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

        // Process fetched prices
        const latestPrices: PriceState = {}

        if (stocks && stocks.length > 0) {
          stocks.forEach(stock => {
            // Calculate a mock change for demo (in real app, this would come from price history)
            const change = (Math.random() - 0.5) * 10 // Random change between -5 and +5
            const changePercent = stock.current_price
              ? (change / stock.current_price) * 100
              : 0

            latestPrices[stock.symbol] = {
              price: stock.current_price || 0,
              change,
              changePercent,
              timestamp: stock.last_updated || new Date().toISOString(),
            }
          })
        }

        // For symbols not found in database, use mock data
        symbols.forEach(symbol => {
          if (!latestPrices[symbol]) {
            const mockPrice = 180 + Math.random() * 40
            const change = (Math.random() - 0.5) * 10

            latestPrices[symbol] = {
              price: mockPrice,
              change,
              changePercent: (change / mockPrice) * 100,
              timestamp: new Date().toISOString(),
            }
          }
        })

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

        // For demo purposes, use mock portfolio data
        const mockPortfolio: PortfolioUpdate = {
          portfolioId: portfolioId,
          totalValue: 150000 + Math.random() * 50000,
          totalPnl: (Math.random() - 0.5) * 20000,
          totalPnlPercent: (Math.random() - 0.5) * 20,
          lastUpdated: new Date().toISOString(),
        }
        setPortfolio(mockPortfolio)

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

        // For demo purposes, use mock holdings data
        const mockHoldings = [
          {
            id: '1',
            symbol: 'AAPL',
            quantity: 100,
            cost_basis: 185.5,
            current_value: 190.25,
            stocks: {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              currency: 'USD',
              asset_type: 'STOCK',
            },
          },
          {
            id: '2',
            symbol: 'MSFT',
            quantity: 50,
            cost_basis: 320.8,
            current_value: 330.15,
            stocks: {
              symbol: 'MSFT',
              name: 'Microsoft Corp.',
              currency: 'USD',
              asset_type: 'STOCK',
            },
          },
        ]
        setHoldings(mockHoldings)

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
