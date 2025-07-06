'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUserPortfolios,
  getPortfolioById,
  type PortfolioResult,
} from '@/lib/actions/portfolio/crud'
import { useRealtimePrices } from '@/lib/hooks/use-realtime-prices'
import { useStockPrices } from '@/lib/hooks/use-stock-prices'

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
  portfolio_id: string
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
    return holdings.map(holding => holding.symbol)
  }, [holdings])

  // Real-time price updates
  const { prices: realtimePrices, loading: pricesLoading } = useRealtimePrices(
    enableRealtime ? symbols : []
  )
  
  // Fallback to Yahoo Finance for additional price data
  const { prices: yahooFinancePrices } = useStockPrices(symbols, {
    enabled: enableRealtime,
    refreshInterval: refreshInterval / 1000,
  })

  const isPricesConnected = useMemo(() => {
    return Object.keys(realtimePrices).length > 0 || Object.keys(yahooFinancePrices).length > 0
  }, [realtimePrices, yahooFinancePrices])

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId) return

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
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

        // Mock performance data (in production, fetch from historical data)
        const dailyChange = totalValue * (Math.random() - 0.5) * 0.02
        const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0
        const weeklyChange = totalValue * (Math.random() - 0.5) * 0.05
        const monthlyChange = totalValue * (Math.random() - 0.5) * 0.1

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

  // Fetch holdings
  const fetchHoldings = useCallback(async () => {
    if (!portfolioId || !includeHoldings) return

    try {
      setHoldingsLoading(true)
      setHoldingsError(null)

      const supabase = createClient()
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select(`
          *,
          stocks (
            symbol,
            name,
            currency,
            asset_type,
            sector,
            market_cap,
            current_price,
            last_updated
          )
        `)
        .eq('portfolio_id', portfolioId)
        .order('current_value', { ascending: false })

      if (holdingsError) {
        throw holdingsError
      }

      if (holdingsData) {
        const enhancedHoldings: HoldingWithMetrics[] = holdingsData.map(holding => {
          const currentPrice = holding.stocks?.current_price || holding.cost_basis
          const currentValue = holding.quantity * currentPrice
          const gainLoss = currentValue - (holding.quantity * holding.cost_basis)
          const gainLossPercent = holding.cost_basis > 0 ? 
            (gainLoss / (holding.quantity * holding.cost_basis)) * 100 : 0

          // Calculate weight in portfolio
          const totalPortfolioValue = portfolio?.total_value || 0
          const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0

          return {
            ...holding,
            current_price: currentPrice,
            current_value: currentValue,
            gain_loss: gainLoss,
            gain_loss_percent: gainLossPercent,
            weight,
            daily_change: currentValue * (Math.random() - 0.5) * 0.03,
            daily_change_percent: (Math.random() - 0.5) * 3,
          }
        })

        setHoldings(enhancedHoldings)
      }
    } catch (err) {
      console.error('Error fetching holdings:', err)
      setHoldingsError('Kunne ikke hente beholdninger')
    } finally {
      setHoldingsLoading(false)
    }
  }, [portfolioId, includeHoldings, portfolio?.total_value])

  // Update holdings with real-time prices
  useEffect(() => {
    if (!holdings.length || (!Object.keys(realtimePrices).length && !Object.keys(yahooFinancePrices).length)) {
      return
    }

    const updatedHoldings = holdings.map(holding => {
      const symbol = holding.symbol
      const realtimePrice = realtimePrices[symbol]
      const yahooPrice = yahooFinancePrices[symbol]
      
      // Use realtime price if available, otherwise use Yahoo Finance price
      const priceData = realtimePrice || yahooPrice
      
      if (priceData) {
        const newCurrentPrice = priceData.price
        const newCurrentValue = holding.quantity * newCurrentPrice
        const newGainLoss = newCurrentValue - (holding.quantity * holding.cost_basis)
        const newGainLossPercent = holding.cost_basis > 0 ? 
          (newGainLoss / (holding.quantity * holding.cost_basis)) * 100 : 0

        return {
          ...holding,
          current_price: newCurrentPrice,
          current_value: newCurrentValue,
          gain_loss: newGainLoss,
          gain_loss_percent: newGainLossPercent,
          daily_change: priceData.change || holding.daily_change,
          daily_change_percent: priceData.changePercent || holding.daily_change_percent,
        }
      }

      return holding
    })

    setHoldings(updatedHoldings)
  }, [realtimePrices, yahooFinancePrices, holdings])

  // Computed metrics
  const metrics = useMemo(() => {
    const totalValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0)
    const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.cost_basis), 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    // Top holdings (top 5)
    const topHoldings = holdings
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, 5)

    // Sector allocation
    const sectorAllocation: { [sector: string]: number } = {}
    holdings.forEach(holding => {
      const sector = holding.stocks?.sector || 'Ukjent'
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + holding.weight
    })

    // Currency allocation
    const currencyAllocation: { [currency: string]: number } = {}
    holdings.forEach(holding => {
      const currency = holding.stocks?.currency || 'NOK'
      currencyAllocation[currency] = (currencyAllocation[currency] || 0) + holding.weight
    })

    // Performance metrics
    const dailyChange = holdings.reduce((sum, holding) => sum + (holding.daily_change || 0), 0)
    const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0
    const weeklyChange = totalValue * (Math.random() - 0.5) * 0.05
    const monthlyChange = totalValue * (Math.random() - 0.5) * 0.1

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: holdings.length,
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
  }, [holdings])

  // Filtered holdings
  const filteredHoldings = useMemo(() => {
    return holdings.filter(holding => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSymbol = holding.symbol.toLowerCase().includes(searchTerm)
        const matchesName = holding.stocks?.name?.toLowerCase().includes(searchTerm) || false
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
  }, [holdings, filters])

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
    await Promise.all([
      fetchPortfolio(),
      fetchHoldings(),
    ])
  }, [fetchPortfolio, fetchHoldings])

  const refreshHoldings = useCallback(async () => {
    await fetchHoldings()
  }, [fetchHoldings])

  // Portfolio operations
  const updatePortfolio = useCallback(async (updates: Partial<PortfolioWithMetrics>) => {
    // Implementation would call portfolio update API
    // For now, just update local state
    if (portfolio) {
      setPortfolio({ ...portfolio, ...updates })
    }
  }, [portfolio])

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
        (payload) => {
          console.log('Portfolio change detected:', payload)
          fetchPortfolio()
        }
      )
      .subscribe()

    // Subscribe to holdings changes
    const holdingsSubscription = supabase
      .channel(`holdings_${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        (payload) => {
          console.log('Holdings change detected:', payload)
          fetchHoldings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(portfolioSubscription)
      supabase.removeChannel(holdingsSubscription)
    }
  }, [portfolioId, fetchPortfolio, fetchHoldings])

  // Initial data fetch
  useEffect(() => {
    if (portfolioId) {
      fetchPortfolio()
    }
  }, [portfolioId, fetchPortfolio])

  useEffect(() => {
    if (portfolioId && includeHoldings) {
      fetchHoldings()
    }
  }, [portfolioId, includeHoldings, fetchHoldings])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !portfolioId) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, portfolioId, refresh, refreshInterval])

  return {
    portfolio,
    loading,
    error,
    refresh,
    updatePortfolio,
    deletePortfolio,
    holdings,
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
        const enhancedPortfolios: PortfolioWithMetrics[] = result.data.map(portfolio => ({
          ...portfolio,
          total_gain_loss: portfolio.total_value - portfolio.total_cost,
          total_gain_loss_percent: portfolio.total_cost > 0 ? 
            ((portfolio.total_value - portfolio.total_cost) / portfolio.total_cost) * 100 : 0,
          daily_change: portfolio.total_value * (Math.random() - 0.5) * 0.02,
          daily_change_percent: (Math.random() - 0.5) * 2,
          weekly_change: portfolio.total_value * (Math.random() - 0.5) * 0.05,
          monthly_change: portfolio.total_value * (Math.random() - 0.5) * 0.1,
          currency: 'NOK',
          last_updated: new Date().toISOString(),
        }))

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