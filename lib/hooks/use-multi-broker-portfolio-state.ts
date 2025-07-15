'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AggregationResult {
  aggregation_status: 'pending' | 'running' | 'completed' | 'failed' | 'never_run'
  total_holdings_count: number
  consolidated_holdings_count: number
  duplicates_detected: number
  conflicts_resolved: number
  base_currency: string
  aggregation_summary?: {
    totalValue: number
    totalCostBasis: number
    totalGainLoss: number
    totalGainLossPercent: number
    assetAllocation: Array<{
      assetClass: string
      value: number
      percentage: number
    }>
    topHoldings: Array<{
      symbol: string
      marketValue: number
      quantity: number
    }>
  }
  errors?: string[]
  warnings?: string[]
  started_at?: string
  completed_at?: string
}

interface ConsolidatedHolding {
  symbol: string
  total_quantity: number
  total_market_value: number
  total_cost_basis: number
  account_count: number
  broker_ids: string[]
  is_duplicate: boolean
  last_updated: string
}

interface BrokerPerformance {
  broker_id: string
  account_count: number
  unique_holdings: number
  total_portfolio_value: number
  total_cost_basis: number
  total_unrealized_pnl: number
  avg_return_percent: number
  connection_status: string
  last_sync_time: string
}

interface MultiBrokerPortfolioData {
  aggregationResult: AggregationResult
  consolidatedHoldings: ConsolidatedHolding[]
  brokerPerformance: BrokerPerformance[]
}

interface MultiBrokerPortfolioState {
  data: MultiBrokerPortfolioData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  triggerAggregation: (baseCurrency?: string) => Promise<void>
  isAggregating: boolean
}

const brokerDisplayNames: Record<string, string> = {
  'plaid': 'Plaid (US Brokers)',
  'schwab': 'Charles Schwab',
  'interactive_brokers': 'Interactive Brokers',
  'nordnet': 'Nordnet'
}

const assetClassTranslations: Record<string, string> = {
  'stocks': 'Aksjer',
  'crypto': 'Crypto',
  'bonds': 'Obligasjoner',
  'commodities': 'Råvarer',
  'real_estate': 'Eiendom',
  'alternatives': 'Alternative',
  'cash': 'Kontanter'
}

export function useMultiBrokerPortfolioState() {
  const [data, setData] = useState<MultiBrokerPortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAggregating, setIsAggregating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAggregationData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/portfolio/aggregate')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch aggregation data')
      }
      
      setData(result.data)
    } catch (err) {
      console.error('Error fetching aggregation data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerAggregation = async (baseCurrency: string = 'USD') => {
    try {
      setIsAggregating(true)
      setError(null)
      
      const response = await fetch('/api/portfolio/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseCurrency,
          force: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger aggregation')
      }
      
      // Refresh data after aggregation
      await fetchAggregationData()
      
    } catch (err) {
      console.error('Error triggering aggregation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsAggregating(false)
    }
  }

  useEffect(() => {
    fetchAggregationData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAggregationData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Helper functions that dashboard expects
  const getAssetClassBreakdown = () => {
    if (!data?.aggregationResult?.aggregation_summary?.assetAllocation) {
      return []
    }

    return data.aggregationResult.aggregation_summary.assetAllocation.map(allocation => ({
      displayName: assetClassTranslations[allocation.assetClass] || allocation.assetClass,
      value: allocation.value,
      percentage: allocation.percentage
    }))
  }

  const getBrokerBreakdown = () => {
    if (!data?.brokerPerformance) {
      return []
    }

    const total = data.brokerPerformance.reduce((sum, broker) => sum + broker.total_portfolio_value, 0)
    
    return data.brokerPerformance.map(broker => ({
      displayName: brokerDisplayNames[broker.broker_id] || broker.broker_id,
      value: broker.total_portfolio_value,
      percentage: total > 0 ? (broker.total_portfolio_value / total) * 100 : 0
    }))
  }

  const needsAggregation = () => {
    if (!data?.aggregationResult) return true
    
    const status = data.aggregationResult.aggregation_status
    return status === 'never_run' || status === 'failed'
  }

  return {
    data,
    isLoading,
    error,
    refresh: fetchAggregationData,
    triggerAggregation,
    isAggregating,
    summary: data?.aggregationResult?.aggregation_summary || null,
    aggregationStatus: data?.aggregationResult ? {
      status: data.aggregationResult.aggregation_status,
      totalHoldings: data.aggregationResult.total_holdings_count,
      consolidatedHoldings: data.aggregationResult.consolidated_holdings_count,
      duplicatesDetected: data.aggregationResult.duplicates_detected,
      conflictsResolved: data.aggregationResult.conflicts_resolved
    } : null,
    getAssetClassBreakdown,
    getBrokerBreakdown,
    needsAggregation,
    hasData: !!data?.aggregationResult,
    isReady: !isLoading && !error
  }
}

// Helper functions for data transformation
export function getAssetClassBreakdown(data: MultiBrokerPortfolioData | null) {
  if (!data?.aggregationResult?.aggregation_summary?.assetAllocation) {
    return []
  }

  return data.aggregationResult.aggregation_summary.assetAllocation.map(allocation => ({
    assetClass: assetClassTranslations[allocation.assetClass] || allocation.assetClass,
    value: allocation.value,
    percentage: allocation.percentage
  }))
}

export function getBrokerBreakdown(data: MultiBrokerPortfolioData | null) {
  if (!data?.brokerPerformance) {
    return []
  }

  return data.brokerPerformance.map(broker => ({
    name: brokerDisplayNames[broker.broker_id] || broker.broker_id,
    value: broker.total_portfolio_value,
    pnl: broker.total_unrealized_pnl,
    percentage: 0 // Will be calculated based on total
  }))
}

export function getPortfolioSummary(data: MultiBrokerPortfolioData | null) {
  if (!data?.aggregationResult?.aggregation_summary) {
    return null
  }

  const summary = data.aggregationResult.aggregation_summary
  return {
    totalValue: summary.totalValue,
    totalCostBasis: summary.totalCostBasis,
    totalGainLoss: summary.totalGainLoss,
    totalGainLossPercent: summary.totalGainLossPercent,
    currency: data.aggregationResult.base_currency || 'USD'
  }
}

export function getAggregationStatus(data: MultiBrokerPortfolioData | null) {
  if (!data?.aggregationResult) {
    return {
      status: 'never_run' as const,
      lastUpdated: null,
      duplicatesFound: 0,
      conflictsResolved: 0,
      holdingsCount: 0
    }
  }

  return {
    status: data.aggregationResult.aggregation_status,
    lastUpdated: data.aggregationResult.completed_at || data.aggregationResult.started_at,
    duplicatesFound: data.aggregationResult.duplicates_detected,
    conflictsResolved: data.aggregationResult.conflicts_resolved,
    holdingsCount: data.aggregationResult.total_holdings_count
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'NOK') {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}