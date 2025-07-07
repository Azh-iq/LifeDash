'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUserPortfolios,
  getPortfolioById,
  type PortfolioResult,
} from '@/lib/actions/portfolio/crud'
import { useFinnhubStockPrices } from '@/lib/hooks/use-finnhub-stock-prices'

// Extended Portfolio interface with calculated metrics
export interface PortfolioWithMetrics {
  id: string
  name: string
  description?: string
  type: 'INVESTMENT' | 'RETIREMENT' | 'SAVINGS' | 'TRADING'
  is_public: boolean
  user_id: string
  created_at: string
  updated_at: string
  total_value: number
  total_cost: number
  total_gain_loss: number
  total_gain_loss_percent: number
  holdings_count: number
  holdings?: HoldingWithMetrics[]
  daily_change?: number
  daily_change_percent?: number
  weekly_change?: number
  monthly_change?: number
  currency: string
  last_updated: string
}

export interface HoldingWithMetrics {
  id: string
  account_id: string
  symbol: string
  quantity: number
  cost_basis: number
  current_price: number
  current_value: number
  gain_loss: number
  gain_loss_percent: number
  weight: number
  daily_change?: number
  daily_change_percent?: number
  stocks?: {
    symbol: string
    name: string
    currency: string
    asset_type: string
    sector?: string
    market_cap?: number
    last_updated?: string
  }
  accounts?: {
    id: string
    portfolio_id: string
  }
}

export interface UsePortfolioStateReturn {
  portfolio: PortfolioWithMetrics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updatePortfolio: (updates: Partial<PortfolioWithMetrics>) => Promise<void>
  deletePortfolio: () => Promise<void>
  // Holdings management
  holdings: HoldingWithMetrics[]
  holdingsLoading: boolean
  holdingsError: string | null
  refreshHoldings: () => Promise<void>
  // Real-time data
  realtimePrices: { [symbol: string]: any }
  pricesLoading: boolean
  isPricesConnected: boolean
  // Portfolio metrics
  metrics: {
    totalValue: number
    totalCost: number
    totalGainLoss: number
    totalGainLossPercent: number
    holdingsCount: number
    topHoldings: HoldingWithMetrics[]
    sectorAllocation: { [sector: string]: number }
    currencyAllocation: { [currency: string]: number }
    performanceMetrics: {
      dailyChange: number
      dailyChangePercent: number
      weeklyChange: number
      monthlyChange: number
      sharpeRatio?: number
      volatility?: number
    }
  }
  // Filters and sorting
  filters: {
    search: string
    sector: string
    currency: string
    minValue: number
    maxValue: number
    showOnlyProfitable: boolean
    showOnlyLosers: boolean
  }
  setFilters: (filters: Partial<typeof filters>) => void
  filteredHoldings: HoldingWithMetrics[]
  sortConfig: {
    key: keyof HoldingWithMetrics
    direction: 'asc' | 'desc'
  }
  setSortConfig: (config: typeof sortConfig) => void
  sortedHoldings: HoldingWithMetrics[]
}

export interface UsePortfolioStateOptions {
  enableRealtime?: boolean
  refreshInterval?: number
  includeHoldings?: boolean
  autoRefresh?: boolean
  cacheResults?: boolean
}

/**
 * Central portfolio state management hook with comprehensive functionality
 * Manages portfolio data, holdings, real-time updates, and derived metrics
 */
export function usePortfolioState(
  portfolioId: string,
  options: UsePortfolioStateOptions = {}
): UsePortfolioStateReturn {
  const {
    enableRealtime = true,
    refreshInterval = 30000,
    includeHoldings = true,
    autoRefresh = true,
    cacheResults = true,
  } = options

  // Core portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioWithMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Holdings state
  const [holdings, setHoldings] = useState<HoldingWithMetrics[]>([])
  const [holdingsLoading, setHoldingsLoading] = useState(true)
  const [holdingsError, setHoldingsError] = useState<string | null>(null)

  // Filters and sorting
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    currency: '',
    minValue: 0,
    maxValue: 0,
    showOnlyProfitable: false,
    showOnlyLosers: false,
  })

  const [sortConfig, setSortConfig] = useState<{
    key: keyof HoldingWithMetrics
    direction: 'asc' | 'desc'
  }>({
    key: 'current_value',
    direction: 'desc',
  })

  // Extract symbols for real-time price updates
  const symbols = useMemo(() => {
    const holdingSymbols = holdings.map(holding => holding.symbol)
    // Always include demo symbols for testing real prices
    const demoSymbols = ['AAPL', 'MSFT', 'EQNR.OL']
    const allSymbols = [...new Set([...holdingSymbols, ...demoSymbols])]
    return allSymbols
  }, [holdings])

  // Use Finnhub for real-time price updates
  const { prices: realtimePrices, loading: pricesLoading } = useFinnhubStockPrices(
    enableRealtime ? symbols : [],
    {
      refreshInterval: 60, // 1 minute for Finnhub rate limits
      enabled: enableRealtime,
      useCache: true,
    }
  )

  const isPricesConnected = useMemo(() => {
    return Object.keys(realtimePrices).length > 0
  }, [realtimePrices])

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId || portfolioId === 'empty') return

    try {
      setLoading(true)
      setError(null)

      const result = await getPortfolioById(portfolioId)

      if (result.success && result.data) {
        const portfolioData = result.data

        // Calculate additional metrics
        const totalValue = portfolioData.total_value || 0
        const totalCost = portfolioData.total_cost || 0
        const totalGainLoss = totalValue - totalCost
        const totalGainLossPercent =
          totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

        // Calculate performance data based on actual price movements
        // For now, use zero values until we have historical data
        const dailyChange = 0
        const dailyChangePercent = 0
        const weeklyChange = 0
        const monthlyChange = 0

        const enhancedPortfolio: PortfolioWithMetrics = {
          ...portfolioData,
          total_gain_loss: totalGainLoss,
          total_gain_loss_percent: totalGainLossPercent,
          daily_change: dailyChange,
          daily_change_percent: dailyChangePercent,
          weekly_change: weeklyChange,
          monthly_change: monthlyChange,
          currency: 'NOK',
          last_updated: new Date().toISOString(),
        }

        setPortfolio(enhancedPortfolio)
      } else {
        setError(result.error || 'Kunne ikke hente portefølje')
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError('En uventet feil oppstod')
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  // Stable refs for avoiding dependencies
  const holdingsRef = useRef<HoldingWithMetrics[]>([])
  const lastUpdateRef = useRef<number>(0)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update holdings ref whenever holdings state changes
  useEffect(() => {
    holdingsRef.current = holdings
  }, [holdings])

  // Fetch holdings
  const fetchHoldings = useCallback(async () => {
    if (!portfolioId || !includeHoldings || portfolioId === 'empty') return

    try {
      setHoldingsLoading(true)
      setHoldingsError(null)

      const supabase = createClient()
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select(
          `
          *,
          stocks (
            symbol,
            name,
            currency,
            asset_class,
            sector,
            market_cap,
            current_price,
            last_updated
          ),
          accounts!inner (
            id,
            portfolio_id
          )
        `
        )
        .eq('accounts.portfolio_id', portfolioId)

      if (holdingsError) {
        throw holdingsError
      }

      if (holdingsData) {
        const enhancedHoldings: HoldingWithMetrics[] = holdingsData.map(
          holding => {
            const currentPrice =
              holding.stocks?.current_price || holding.cost_basis
            const currentValue = holding.quantity * currentPrice
            const gainLoss =
              currentValue - holding.quantity * holding.cost_basis
            const gainLossPercent =
              holding.cost_basis > 0
                ? (gainLoss / (holding.quantity * holding.cost_basis)) * 100
                : 0

            return {
              ...holding,
              current_price: currentPrice,
              current_value: currentValue,
              gain_loss: gainLoss,
              gain_loss_percent: gainLossPercent,
              weight: 0, // Weight will be calculated separately
              daily_change: 0, // Will be updated with real prices from Finnhub
              daily_change_percent: 0, // Will be updated with real prices from Finnhub
            }
          }
        )

        // Sort by current value (descending)
        const sortedHoldings = enhancedHoldings.sort(
          (a, b) => b.current_value - a.current_value
        )

        setHoldings(sortedHoldings)
      }
    } catch (err) {
      console.error('Error fetching holdings:', err)
      setHoldingsError('Kunne ikke hente beholdninger')
    } finally {
      setHoldingsLoading(false)
    }
  }, [portfolioId, includeHoldings])

  // Stable refs for avoiding dependency cycles
  const realtimePricesRef = useRef(realtimePrices)

  // Update refs when prices change
  useEffect(() => {
    realtimePricesRef.current = realtimePrices
  }, [realtimePrices])

  // Debounced update function for price changes (stabilized with refs)
  const updateHoldingsWithPrices = useCallback(() => {
    const currentHoldings = holdingsRef.current
    const currentRealtimePrices = realtimePricesRef.current

    if (!currentHoldings.length || !Object.keys(currentRealtimePrices).length) {
      return
    }

    const updatedHoldings = currentHoldings.map(holding => {
      const symbol = holding.symbol
      const realtimePrice = currentRealtimePrices[symbol]

      if (realtimePrice) {
        const newCurrentPrice = realtimePrice.price
        const newCurrentValue = holding.quantity * newCurrentPrice
        const newGainLoss =
          newCurrentValue - holding.quantity * holding.cost_basis
        const newGainLossPercent =
          holding.cost_basis > 0
            ? (newGainLoss / (holding.quantity * holding.cost_basis)) * 100
            : 0

        return {
          ...holding,
          current_price: newCurrentPrice,
          current_value: newCurrentValue,
          gain_loss: newGainLoss,
          gain_loss_percent: newGainLossPercent,
          daily_change: realtimePrice.change || holding.daily_change,
          daily_change_percent:
            realtimePrice.changePercent || holding.daily_change_percent,
        }
      }

      return holding
    })

    setHoldings(updatedHoldings)
  }, []) // Empty dependency array since we use refs

  // Update holdings with real-time prices (debounced)
  useEffect(() => {
    // Only trigger if we have holdings to update
    if (!holdingsRef.current || holdingsRef.current.length === 0) return

    const now = Date.now()

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Debounce updates to avoid excessive re-renders
    const timeSinceLastUpdate = now - lastUpdateRef.current
    const delay = timeSinceLastUpdate < 1000 ? 1000 - timeSinceLastUpdate : 0

    updateTimeoutRef.current = setTimeout(() => {
      updateHoldingsWithPrices()
      lastUpdateRef.current = Date.now()
    }, delay)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [realtimePrices]) // Removed updateHoldingsWithPrices since it's now stable

  // Calculate portfolio weights separately
  const holdingsWithWeights = useMemo(() => {
    const totalValue = holdings.reduce(
      (sum, holding) => sum + holding.current_value,
      0
    )

    return holdings.map(holding => ({
      ...holding,
      weight: totalValue > 0 ? (holding.current_value / totalValue) * 100 : 0,
    }))
  }, [holdings])

  // Computed metrics
  const metrics = useMemo(() => {
    const totalValue = holdingsWithWeights.reduce(
      (sum, holding) => sum + holding.current_value,
      0
    )
    const totalCost = holdingsWithWeights.reduce(
      (sum, holding) => sum + holding.quantity * holding.cost_basis,
      0
    )
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    // Top holdings (top 5)
    const topHoldings = holdingsWithWeights
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, 5)

    // Sector allocation
    const sectorAllocation: { [sector: string]: number } = {}
    holdingsWithWeights.forEach(holding => {
      const sector = holding.stocks?.sector || 'Ukjent'
      sectorAllocation[sector] =
        (sectorAllocation[sector] || 0) + holding.weight
    })

    // Currency allocation
    const currencyAllocation: { [currency: string]: number } = {}
    holdingsWithWeights.forEach(holding => {
      const currency = holding.stocks?.currency || 'NOK'
      currencyAllocation[currency] =
        (currencyAllocation[currency] || 0) + holding.weight
    })

    // Performance metrics
    const dailyChange = holdingsWithWeights.reduce(
      (sum, holding) => sum + (holding.daily_change || 0),
      0
    )
    const dailyChangePercent =
      totalValue > 0 ? (dailyChange / totalValue) * 100 : 0
    const weeklyChange = 0 // Will be calculated from historical data
    const monthlyChange = 0 // Will be calculated from historical data

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: holdingsWithWeights.length,
      topHoldings,
      sectorAllocation,
      currencyAllocation,
      performanceMetrics: {
        dailyChange,
        dailyChangePercent,
        weeklyChange,
        monthlyChange,
      },
    }
  }, [holdingsWithWeights])

  // Filtered holdings
  const filteredHoldings = useMemo(() => {
    return holdingsWithWeights.filter(holding => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSymbol = holding.symbol.toLowerCase().includes(searchTerm)
        const matchesName =
          holding.stocks?.name?.toLowerCase().includes(searchTerm) || false
        if (!matchesSymbol && !matchesName) return false
      }

      // Sector filter
      if (filters.sector && holding.stocks?.sector !== filters.sector) {
        return false
      }

      // Currency filter
      if (filters.currency && holding.stocks?.currency !== filters.currency) {
        return false
      }

      // Value range filter
      if (filters.minValue > 0 && holding.current_value < filters.minValue) {
        return false
      }
      if (filters.maxValue > 0 && holding.current_value > filters.maxValue) {
        return false
      }

      // Profit/loss filters
      if (filters.showOnlyProfitable && holding.gain_loss <= 0) {
        return false
      }
      if (filters.showOnlyLosers && holding.gain_loss >= 0) {
        return false
      }

      return true
    })
  }, [holdingsWithWeights, filters])

  // Sorted holdings
  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }

      return 0
    })
  }, [filteredHoldings, sortConfig])

  // Refresh functions
  const refresh = useCallback(async () => {
    await Promise.all([fetchPortfolio(), fetchHoldings()])
  }, [fetchPortfolio, fetchHoldings])

  const refreshHoldings = useCallback(async () => {
    await fetchHoldings()
  }, [fetchHoldings])

  // Portfolio operations
  const updatePortfolio = useCallback(
    async (updates: Partial<PortfolioWithMetrics>) => {
      // Implementation would call portfolio update API
      // For now, just update local state
      if (portfolio) {
        setPortfolio({ ...portfolio, ...updates })
      }
    },
    [portfolio]
  )

  const deletePortfolio = useCallback(async () => {
    // Implementation would call portfolio delete API
    // For now, just clear local state
    setPortfolio(null)
    setHoldings([])
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!portfolioId) return

    const supabase = createClient()

    // Subscribe to portfolio changes
    const portfolioSubscription = supabase
      .channel(`portfolio_${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `id=eq.${portfolioId}`,
        },
        payload => {
          console.log('Portfolio change detected:', payload)
          fetchPortfolio()
        }
      )
      .subscribe()

    // Subscribe to holdings changes
    // Note: Since holdings table doesn't have portfolio_id directly, we need to listen to all holdings
    // and filter in the callback. For better performance, consider creating a database view.
    const holdingsSubscription = supabase
      .channel(`holdings_${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
        },
        payload => {
          console.log('Holdings change detected:', payload)
          // Refetch holdings to ensure we get the correct data for this portfolio
          fetchHoldings()
        }
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(portfolioSubscription)
        supabase.removeChannel(holdingsSubscription)
      } catch (error) {
        console.warn('Error removing subscriptions:', error)
      }
    }
  }, [portfolioId, fetchPortfolio, fetchHoldings])

  // Initial data fetch
  useEffect(() => {
    if (portfolioId) {
      fetchPortfolio()
    }
  }, [portfolioId]) // Remove fetchPortfolio from dependencies to prevent infinite loop

  useEffect(() => {
    if (portfolioId && includeHoldings) {
      fetchHoldings()
    }
  }, [portfolioId, includeHoldings]) // Remove fetchHoldings from dependencies to prevent infinite loop

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !portfolioId) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => {
      clearInterval(interval)
    }
  }, [autoRefresh, portfolioId, refreshInterval]) // Remove refresh from dependencies to prevent infinite loop

  return {
    portfolio,
    loading,
    error,
    refresh,
    updatePortfolio,
    deletePortfolio,
    holdings: holdingsWithWeights,
    holdingsLoading,
    holdingsError,
    refreshHoldings,
    realtimePrices,
    pricesLoading,
    isPricesConnected,
    metrics,
    filters,
    setFilters,
    filteredHoldings,
    sortConfig,
    setSortConfig,
    sortedHoldings,
  }
}

/**
 * Hook for managing multiple portfolios
 */
export function usePortfoliosState() {
  const [portfolios, setPortfolios] = useState<PortfolioWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getUserPortfolios()

      if (result.success && result.data) {
        const enhancedPortfolios: PortfolioWithMetrics[] = result.data.map(
          portfolio => ({
            ...portfolio,
            total_gain_loss: portfolio.total_value - portfolio.total_cost,
            total_gain_loss_percent:
              portfolio.total_cost > 0
                ? ((portfolio.total_value - portfolio.total_cost) /
                    portfolio.total_cost) *
                  100
                : 0,
            daily_change: 0, // Will be calculated from real price data
            daily_change_percent: 0, // Will be calculated from real price data
            weekly_change: 0, // Will be calculated from historical data
            monthly_change: 0, // Will be calculated from historical data
            currency: 'NOK',
            last_updated: new Date().toISOString(),
          })
        )

        setPortfolios(enhancedPortfolios)
      } else {
        setError(result.error || 'Kunne ikke hente porteføljer')
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err)
      setError('En uventet feil oppstod')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  return {
    portfolios,
    loading,
    error,
    refresh: fetchPortfolios,
  }
}
