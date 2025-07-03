'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserPortfolios, getPortfolioById, type PortfolioResult } from '@/lib/actions/portfolio/crud'

export interface Portfolio {
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
  holdings_count: number
  holdings?: any[]
}

export interface UsePortfoliosReturn {
  portfolios: Portfolio[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface UsePortfolioReturn {
  portfolio: Portfolio | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to manage portfolios with real-time updates
 */
export function usePortfolios(): UsePortfoliosReturn {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getUserPortfolios()
      
      if (result.success) {
        setPortfolios(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch portfolios')
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    // Initial fetch
    fetchPortfolios()

    // Subscribe to portfolio changes
    const portfoliosSubscription = supabase
      .channel('portfolios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
        },
        (payload) => {
          console.log('Portfolio change detected:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Add new portfolio to the list
            const newPortfolio = {
              ...payload.new,
              total_value: 0,
              total_cost: 0,
              total_gain_loss: 0,
              holdings_count: 0,
            } as Portfolio
            
            setPortfolios(prev => [newPortfolio, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Update existing portfolio
            setPortfolios(prev => 
              prev.map(portfolio => 
                portfolio.id === payload.new.id 
                  ? { ...portfolio, ...payload.new }
                  : portfolio
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted portfolio
            setPortfolios(prev => 
              prev.filter(portfolio => portfolio.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Subscribe to holdings changes to update portfolio totals
    const holdingsSubscription = supabase
      .channel('holdings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
        },
        () => {
          console.log('Holdings change detected, refreshing portfolios')
          fetchPortfolios()
        }
      )
      .subscribe()

    // Subscribe to stock price changes to update portfolio values
    const stocksSubscription = supabase
      .channel('stocks')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stocks',
        },
        () => {
          console.log('Stock price change detected, refreshing portfolios')
          fetchPortfolios()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(portfoliosSubscription)
      supabase.removeChannel(holdingsSubscription)
      supabase.removeChannel(stocksSubscription)
    }
  }, [fetchPortfolios])

  return {
    portfolios,
    loading,
    error,
    refresh: fetchPortfolios,
  }
}

/**
 * Hook to manage a single portfolio with real-time updates
 */
export function usePortfolio(portfolioId: string): UsePortfolioReturn {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await getPortfolioById(portfolioId)
      
      if (result.success) {
        setPortfolio(result.data || null)
      } else {
        setError(result.error || 'Failed to fetch portfolio')
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  // Set up real-time subscription
  useEffect(() => {
    if (!portfolioId) return

    const supabase = createClient()
    
    // Initial fetch
    fetchPortfolio()

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
          
          if (payload.eventType === 'UPDATE') {
            setPortfolio(prev => 
              prev ? { ...prev, ...payload.new } : null
            )
          } else if (payload.eventType === 'DELETE') {
            setPortfolio(null)
          }
        }
      )
      .subscribe()

    // Subscribe to holdings changes for this portfolio
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
        () => {
          console.log('Holdings change detected for portfolio, refreshing')
          fetchPortfolio()
        }
      )
      .subscribe()

    // Subscribe to stock price changes to update portfolio values
    const stocksSubscription = supabase
      .channel(`stocks_for_portfolio_${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stocks',
        },
        () => {
          console.log('Stock price change detected, refreshing portfolio')
          fetchPortfolio()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(portfolioSubscription)
      supabase.removeChannel(holdingsSubscription)
      supabase.removeChannel(stocksSubscription)
    }
  }, [portfolioId, fetchPortfolio])

  return {
    portfolio,
    loading,
    error,
    refresh: fetchPortfolio,
  }
}

/**
 * Hook for optimistic updates during portfolio operations
 */
export function useOptimisticPortfolios() {
  const { portfolios, loading, error, refresh } = usePortfolios()
  const [optimisticPortfolios, setOptimisticPortfolios] = useState<Portfolio[]>([])

  // Update optimistic state when real data changes
  useEffect(() => {
    setOptimisticPortfolios(portfolios)
  }, [portfolios])

  const addOptimisticPortfolio = useCallback((portfolio: Partial<Portfolio>) => {
    const optimisticPortfolio: Portfolio = {
      id: `temp_${Date.now()}`,
      name: portfolio.name || '',
      description: portfolio.description,
      type: portfolio.type || 'INVESTMENT',
      is_public: portfolio.is_public || false,
      user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_value: 0,
      total_cost: 0,
      total_gain_loss: 0,
      holdings_count: 0,
      ...portfolio,
    }

    setOptimisticPortfolios(prev => [optimisticPortfolio, ...prev])
  }, [])

  const updateOptimisticPortfolio = useCallback((id: string, updates: Partial<Portfolio>) => {
    setOptimisticPortfolios(prev =>
      prev.map(portfolio =>
        portfolio.id === id ? { ...portfolio, ...updates } : portfolio
      )
    )
  }, [])

  const removeOptimisticPortfolio = useCallback((id: string) => {
    setOptimisticPortfolios(prev =>
      prev.filter(portfolio => portfolio.id !== id)
    )
  }, [])

  return {
    portfolios: optimisticPortfolios,
    loading,
    error,
    refresh,
    addOptimisticPortfolio,
    updateOptimisticPortfolio,
    removeOptimisticPortfolio,
  }
}