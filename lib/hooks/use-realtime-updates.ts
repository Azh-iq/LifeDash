'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

export interface PriceUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume?: number
  timestamp: string
  marketCap?: number
  currency: string
}

export interface PortfolioUpdate {
  portfolioId: string
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercent: number
  dailyChange: number
  dailyChangePercent: number
  lastUpdated: string
}

export interface HoldingUpdate {
  id: string
  portfolioId: string
  symbol: string
  quantity: number
  currentPrice: number
  currentValue: number
  gainLoss: number
  gainLossPercent: number
  weight: number
  lastUpdated: string
}

export interface RealtimeConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  lastPing: string | null
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
  subscriptionCount: number
  errors: string[]
}

export interface UseRealtimeUpdatesReturn {
  // Connection state
  connectionState: RealtimeConnectionState
  isConnected: boolean

  // Price updates
  priceUpdates: { [symbol: string]: PriceUpdate }
  portfolioUpdates: { [portfolioId: string]: PortfolioUpdate }
  holdingUpdates: { [holdingId: string]: HoldingUpdate }

  // Subscription management
  subscribeToSymbols: (symbols: string[]) => void
  unsubscribeFromSymbols: (symbols: string[]) => void
  subscribeToPortfolio: (portfolioId: string) => void
  unsubscribeFromPortfolio: (portfolioId: string) => void

  // Connection management
  connect: () => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>

  // Utilities
  getLatestPrice: (symbol: string) => PriceUpdate | null
  getPortfolioData: (portfolioId: string) => PortfolioUpdate | null
  clearErrors: () => void
}

export interface UseRealtimeUpdatesOptions {
  // Connection options
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number

  // Subscription options
  priceUpdateThreshold?: number // Minimum price change to trigger update
  batchUpdates?: boolean
  batchDelay?: number

  // Performance options
  maxConcurrentSubscriptions?: number
  enableDebugLogging?: boolean

  // Callbacks
  onConnect?: () => void
  onDisconnect?: () => void
  onPriceUpdate?: (update: PriceUpdate) => void
  onPortfolioUpdate?: (update: PortfolioUpdate) => void
  onError?: (error: string) => void
}

const DEFAULT_OPTIONS: Required<UseRealtimeUpdatesOptions> = {
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 2000,
  heartbeatInterval: 30000,
  priceUpdateThreshold: 0.01,
  batchUpdates: true,
  batchDelay: 500,
  maxConcurrentSubscriptions: 50,
  enableDebugLogging: false,
  onConnect: () => {},
  onDisconnect: () => {},
  onPriceUpdate: () => {},
  onPortfolioUpdate: () => {},
  onError: () => {},
}

/**
 * Advanced realtime updates hook with intelligent reconnection and performance optimization
 */
export function useRealtimeUpdates(
  portfolioId?: string,
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesReturn {
  // Memoize options to prevent recreation on every render
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])

  // Add mounted ref to prevent setState after unmount
  const mountedRef = useRef(true)

  // Connection state
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>({
      isConnected: false,
      isReconnecting: false,
      lastPing: null,
      connectionQuality: 'disconnected',
      subscriptionCount: 0,
      errors: [],
    })

  // Update data
  const [priceUpdates, setPriceUpdates] = useState<{
    [symbol: string]: PriceUpdate
  }>({})
  const [portfolioUpdates, setPortfolioUpdates] = useState<{
    [portfolioId: string]: PortfolioUpdate
  }>({})
  const [holdingUpdates, setHoldingUpdates] = useState<{
    [holdingId: string]: HoldingUpdate
  }>({})

  // Refs for managing subscriptions and timers
  const supabaseRef = useRef<any>(null)
  const subscriptionsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<{
    prices: PriceUpdate[]
    portfolios: PortfolioUpdate[]
    holdings: HoldingUpdate[]
  }>({
    prices: [],
    portfolios: [],
    holdings: [],
  })

  // Connection quality monitoring
  const connectionQualityRef = useRef<{
    lastPingTime: number
    pingHistory: number[]
    errorCount: number
  }>({
    lastPingTime: 0,
    pingHistory: [],
    errorCount: 0,
  })

  // Stable refs for connection state to avoid dependency issues
  const connectionStateRef = useRef<RealtimeConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastPing: null,
    connectionQuality: 'disconnected',
    subscriptionCount: 0,
    errors: [],
  })

  // Initialize Supabase client
  const initializeSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  // Log debug messages
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (opts.enableDebugLogging) {
        console.log(`[RealtimeUpdates] ${message}`, data)
      }
    },
    [opts.enableDebugLogging]
  )

  // Add error to state
  const addError = useCallback(
    (error: string) => {
      setConnectionState(prev => ({
        ...prev,
        errors: [...prev.errors, error].slice(-10), // Keep last 10 errors
      }))
      connectionQualityRef.current.errorCount++
      opts.onError(error)
    },
    [opts]
  )

  // Clear errors
  const clearErrors = useCallback(() => {
    setConnectionState(prev => ({
      ...prev,
      errors: [],
    }))
    connectionQualityRef.current.errorCount = 0
  }, [])

  // Calculate connection quality
  const updateConnectionQuality = useCallback(() => {
    const { pingHistory, errorCount } = connectionQualityRef.current
    const avgPing =
      pingHistory.length > 0
        ? pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length
        : 0

    let quality: RealtimeConnectionState['connectionQuality']

    if (!connectionState.isConnected) {
      quality = 'disconnected'
    } else if (errorCount > 5 || avgPing > 2000) {
      quality = 'poor'
    } else if (errorCount > 2 || avgPing > 1000) {
      quality = 'good'
    } else {
      quality = 'excellent'
    }

    setConnectionState(prev => ({
      ...prev,
      connectionQuality: quality,
    }))
  }, [connectionState.isConnected])

  // Batch update processing
  const processBatchUpdates = useCallback(() => {
    const { prices, portfolios, holdings } = pendingUpdatesRef.current

    if (prices.length > 0) {
      setPriceUpdates(prev => {
        const newUpdates = { ...prev }
        prices.forEach(update => {
          newUpdates[update.symbol] = update
          opts.onPriceUpdate(update)
        })
        return newUpdates
      })
    }

    if (portfolios.length > 0) {
      setPortfolioUpdates(prev => {
        const newUpdates = { ...prev }
        portfolios.forEach(update => {
          newUpdates[update.portfolioId] = update
          opts.onPortfolioUpdate(update)
        })
        return newUpdates
      })
    }

    if (holdings.length > 0) {
      setHoldingUpdates(prev => {
        const newUpdates = { ...prev }
        holdings.forEach(update => {
          newUpdates[update.id] = update
        })
        return newUpdates
      })
    }

    // Clear pending updates
    pendingUpdatesRef.current = {
      prices: [],
      portfolios: [],
      holdings: [],
    }
  }, [opts])

  // Add update to batch
  const addToBatch = useCallback(
    (
      type: 'price' | 'portfolio' | 'holding',
      update: PriceUpdate | PortfolioUpdate | HoldingUpdate
    ) => {
      if (type === 'price') {
        pendingUpdatesRef.current.prices.push(update as PriceUpdate)
      } else if (type === 'portfolio') {
        pendingUpdatesRef.current.portfolios.push(update as PortfolioUpdate)
      } else if (type === 'holding') {
        pendingUpdatesRef.current.holdings.push(update as HoldingUpdate)
      }

      if (opts.batchUpdates) {
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current)
        }
        batchTimeoutRef.current = setTimeout(
          processBatchUpdates,
          opts.batchDelay
        )
      } else {
        processBatchUpdates()
      }
    },
    [opts.batchUpdates, opts.batchDelay, processBatchUpdates]
  )

  // Handle stock price changes
  const handleStockPriceChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      debugLog('Stock price change:', payload)

      if (payload.eventType === 'UPDATE' && payload.new) {
        const stock = payload.new
        const oldStock = payload.old

        // Calculate change
        const change =
          stock.current_price - (oldStock?.current_price || stock.current_price)
        const changePercent = oldStock?.current_price
          ? ((stock.current_price - oldStock.current_price) /
              oldStock.current_price) *
            100
          : 0

        // Only update if change is significant
        if (Math.abs(changePercent) >= opts.priceUpdateThreshold) {
          const update: PriceUpdate = {
            symbol: stock.symbol,
            price: stock.current_price,
            change,
            changePercent,
            volume: stock.volume,
            timestamp: new Date().toISOString(),
            marketCap: stock.market_cap,
            currency: stock.currency || 'NOK',
          }

          addToBatch('price', update)
        }
      }
    },
    [opts.priceUpdateThreshold, addToBatch, debugLog]
  )

  // Handle portfolio changes
  const handlePortfolioChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      debugLog('Portfolio change:', payload)

      if (payload.eventType === 'UPDATE' && payload.new) {
        const portfolio = payload.new

        const update: PortfolioUpdate = {
          portfolioId: portfolio.id,
          totalValue: portfolio.total_value || 0,
          totalCost: portfolio.total_cost || 0,
          totalGainLoss:
            (portfolio.total_value || 0) - (portfolio.total_cost || 0),
          totalGainLossPercent:
            portfolio.total_cost > 0
              ? (((portfolio.total_value || 0) - (portfolio.total_cost || 0)) /
                  portfolio.total_cost) *
                100
              : 0,
          dailyChange: portfolio.daily_change || 0,
          dailyChangePercent: portfolio.daily_change_percent || 0,
          lastUpdated: new Date().toISOString(),
        }

        addToBatch('portfolio', update)
      }
    },
    [addToBatch, debugLog]
  )

  // Handle holdings changes
  const handleHoldingsChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      debugLog('Holdings change:', payload)

      if (payload.eventType === 'UPDATE' && payload.new) {
        const holding = payload.new

        const update: HoldingUpdate = {
          id: holding.id,
          portfolioId: holding.portfolio_id,
          symbol: holding.symbol,
          quantity: holding.quantity,
          currentPrice: holding.current_price || 0,
          currentValue: holding.quantity * (holding.current_price || 0),
          gainLoss:
            holding.quantity * (holding.current_price || 0) -
            holding.quantity * holding.cost_basis,
          gainLossPercent:
            holding.cost_basis > 0
              ? ((holding.quantity * (holding.current_price || 0) -
                  holding.quantity * holding.cost_basis) /
                  (holding.quantity * holding.cost_basis)) *
                100
              : 0,
          weight: 0, // Would be calculated based on portfolio total
          lastUpdated: new Date().toISOString(),
        }

        addToBatch('holding', update)
      }
    },
    [addToBatch, debugLog]
  )

  // Connect to realtime
  const connect = useCallback(async () => {
    try {
      const supabase = initializeSupabase()

      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
      }))

      debugLog('Connected to realtime')
      opts.onConnect()

      // Start heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      heartbeatIntervalRef.current = setInterval(() => {
        const pingStart = Date.now()

        // Simple ping test using a lightweight query
        supabase
          .from('stocks')
          .select('id')
          .limit(1)
          .then(() => {
            const pingTime = Date.now() - pingStart
            connectionQualityRef.current.lastPingTime = pingTime
            connectionQualityRef.current.pingHistory.push(pingTime)

            // Keep only last 10 pings
            if (connectionQualityRef.current.pingHistory.length > 10) {
              connectionQualityRef.current.pingHistory.shift()
            }

            setConnectionState(prev => ({
              ...prev,
              lastPing: new Date().toISOString(),
            }))

            updateConnectionQuality()
          })
          .catch(() => {
            addError('Heartbeat failed')
          })
      }, opts.heartbeatInterval)
    } catch (error) {
      addError(`Connection failed: ${error}`)
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isReconnecting: false,
      }))
    }
  }, [initializeSupabase, opts, debugLog, addError, updateConnectionQuality])

  // Disconnect from realtime
  const disconnect = useCallback(() => {
    debugLog('Disconnecting from realtime')

    // Clear all subscriptions
    subscriptionsRef.current.forEach(channel => {
      const supabase = initializeSupabase()
      supabase.removeChannel(channel)
    })
    subscriptionsRef.current.clear()

    // Clear timers
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
      batchTimeoutRef.current = null
    }

    setConnectionState(prev => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
      subscriptionCount: 0,
    }))

    opts.onDisconnect()
  }, [initializeSupabase, opts, debugLog])

  // Reconnect with exponential backoff
  const reconnect = useCallback(async () => {
    if (connectionState.isReconnecting) return

    setConnectionState(prev => ({
      ...prev,
      isReconnecting: true,
    }))

    let attempts = 0
    const maxAttempts = opts.reconnectAttempts

    const attemptReconnect = async () => {
      attempts++
      debugLog(`Reconnection attempt ${attempts}/${maxAttempts}`)

      try {
        await connect()
        debugLog('Reconnection successful')
      } catch (error) {
        addError(`Reconnection attempt ${attempts} failed: ${error}`)

        if (attempts < maxAttempts) {
          const delay = opts.reconnectDelay * Math.pow(2, attempts - 1) // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay)
        } else {
          setConnectionState(prev => ({
            ...prev,
            isReconnecting: false,
          }))
          addError('Max reconnection attempts reached')
        }
      }
    }

    attemptReconnect()
  }, [connectionState.isReconnecting, opts, connect, addError, debugLog])

  // Subscribe to stock symbols - use stable refs to avoid dependency issues
  const subscribeToSymbols = useCallback(
    (symbols: string[]) => {
      if (subscriptionsRef.current.size >= opts.maxConcurrentSubscriptions) {
        addError('Maximum subscription limit reached')
        return
      }

      const supabase = initializeSupabase()

      symbols.forEach(symbol => {
        const key = `stocks_${symbol}`

        if (subscriptionsRef.current.has(key)) {
          return // Already subscribed
        }

        const channel = supabase
          .channel(key)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'stocks',
              filter: `symbol=eq.${symbol}`,
            },
            handleStockPriceChange
          )
          .subscribe()

        subscriptionsRef.current.set(key, channel)
        debugLog(`Subscribed to ${symbol}`)
      })

      if (!mountedRef.current) return
      setConnectionState(prev => ({
        ...prev,
        subscriptionCount: subscriptionsRef.current.size,
      }))
    },
    [
      opts.maxConcurrentSubscriptions,
      initializeSupabase,
      handleStockPriceChange,
      addError,
      debugLog,
    ]
  )

  // Unsubscribe from stock symbols - use stable refs to avoid dependency issues
  const unsubscribeFromSymbols = useCallback(
    (symbols: string[]) => {
      const supabase = initializeSupabase()

      symbols.forEach(symbol => {
        const key = `stocks_${symbol}`
        const channel = subscriptionsRef.current.get(key)

        if (channel) {
          supabase.removeChannel(channel)
          subscriptionsRef.current.delete(key)
          debugLog(`Unsubscribed from ${symbol}`)
        }
      })

      if (!mountedRef.current) return
      setConnectionState(prev => ({
        ...prev,
        subscriptionCount: subscriptionsRef.current.size,
      }))
    },
    [initializeSupabase, debugLog]
  )

  // Subscribe to portfolio - use stable refs to avoid dependency issues
  const subscribeToPortfolio = useCallback(
    (portfolioId: string) => {
      const supabase = initializeSupabase()

      const portfolioKey = `portfolio_${portfolioId}`
      const holdingsKey = `holdings_${portfolioId}`

      // Subscribe to portfolio changes
      if (!subscriptionsRef.current.has(portfolioKey)) {
        const portfolioChannel = supabase
          .channel(portfolioKey)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'portfolios',
              filter: `id=eq.${portfolioId}`,
            },
            handlePortfolioChange
          )
          .subscribe()

        subscriptionsRef.current.set(portfolioKey, portfolioChannel)
      }

      // Subscribe to holdings changes
      if (!subscriptionsRef.current.has(holdingsKey)) {
        const holdingsChannel = supabase
          .channel(holdingsKey)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'holdings',
              filter: `portfolio_id=eq.${portfolioId}`,
            },
            handleHoldingsChange
          )
          .subscribe()

        subscriptionsRef.current.set(holdingsKey, holdingsChannel)
      }

      if (!mountedRef.current) return
      setConnectionState(prev => ({
        ...prev,
        subscriptionCount: subscriptionsRef.current.size,
      }))

      debugLog(`Subscribed to portfolio ${portfolioId}`)
    },
    [initializeSupabase, handlePortfolioChange, handleHoldingsChange, debugLog]
  )

  // Unsubscribe from portfolio - use stable refs to avoid dependency issues
  const unsubscribeFromPortfolio = useCallback(
    (portfolioId: string) => {
      const supabase = initializeSupabase()

      const portfolioKey = `portfolio_${portfolioId}`
      const holdingsKey = `holdings_${portfolioId}`
      ;[portfolioKey, holdingsKey].forEach(key => {
        const channel = subscriptionsRef.current.get(key)
        if (channel) {
          supabase.removeChannel(channel)
          subscriptionsRef.current.delete(key)
        }
      })

      if (!mountedRef.current) return
      setConnectionState(prev => ({
        ...prev,
        subscriptionCount: subscriptionsRef.current.size,
      }))

      debugLog(`Unsubscribed from portfolio ${portfolioId}`)
    },
    [initializeSupabase, debugLog]
  )

  // Get latest price
  const getLatestPrice = useCallback(
    (symbol: string) => {
      return priceUpdates[symbol] || null
    },
    [priceUpdates]
  )

  // Get portfolio data
  const getPortfolioData = useCallback(
    (portfolioId: string) => {
      return portfolioUpdates[portfolioId] || null
    },
    [portfolioUpdates]
  )

  // Auto-connect on mount - use stable refs to avoid dependency issues
  useEffect(() => {
    if (opts.autoConnect) {
      connect()
    }

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [opts.autoConnect, connect, disconnect])

  // Auto-subscribe to portfolio - use stable refs to avoid dependency issues
  useEffect(() => {
    if (portfolioId && connectionState.isConnected) {
      subscribeToPortfolio(portfolioId)

      return () => {
        unsubscribeFromPortfolio(portfolioId)
      }
    }
  }, [
    portfolioId,
    connectionState.isConnected,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
  ])

  // Connection monitoring - use stable refs to avoid dependency issues
  useEffect(() => {
    const handleOnline = () => {
      if (!connectionStateRef.current.isConnected) {
        reconnect()
      }
    }

    const handleOffline = () => {
      addError('Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [reconnect, addError])

  // Sync refs with state
  useEffect(() => {
    connectionStateRef.current = connectionState
  }, [connectionState])

  return {
    connectionState,
    isConnected: connectionState.isConnected,
    priceUpdates,
    portfolioUpdates,
    holdingUpdates,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    connect,
    disconnect,
    reconnect,
    getLatestPrice,
    getPortfolioData,
    clearErrors,
  }
}
