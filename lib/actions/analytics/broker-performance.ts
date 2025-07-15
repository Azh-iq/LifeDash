'use server'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface BrokerPerformanceData {
  brokerId: string
  brokerName: string
  displayName: string
  accountCount: number
  uniqueHoldings: number
  totalPortfolioValue: number
  totalCostBasis: number
  totalUnrealizedPnl: number
  avgReturnPercent: number
  lastSyncTime: string | null
  connectionStatus: 'connected' | 'disconnected' | 'error'
  syncReliabilityScore: number
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
  lastSyncedAt: string | null
  monthlyPerformance: Array<{
    month: string
    value: number
    returnPercent: number
  }>
}

export interface BrokerComparisonMetrics {
  totalBrokers: number
  bestPerformingBroker: string
  worstPerformingBroker: string
  avgReturnAcrossBrokers: number
  mostReliableBroker: string
  totalPortfolioValue: number
  diversificationScore: number
  riskScore: 'low' | 'medium' | 'high'
  lastUpdated: string
}

// Broker display names mapping
const brokerDisplayNames: Record<string, string> = {
  'plaid': 'Plaid (US Brokers)',
  'schwab': 'Charles Schwab',
  'interactive_brokers': 'Interactive Brokers',
  'nordnet': 'Nordnet'
}

// Cache broker performance data for 5 minutes
export const getBrokerPerformanceData = cache(async (): Promise<BrokerPerformanceData[]> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Fetch broker performance data from materialized view
    const { data: performanceData, error } = await supabase
      .from('broker_performance_comparison')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching broker performance data:', error)
      throw new Error('Failed to fetch broker performance data')
    }

    // Get broker connections for reliability scoring
    const { data: connectionsData } = await supabase
      .from('brokerage_connections')
      .select(`
        broker_id,
        status,
        last_synced_at,
        created_at,
        sync_frequency,
        error_count,
        last_error_at
      `)
      .eq('user_id', user.id)

    const connections = connectionsData || []

    // Transform data and calculate additional metrics
    const brokerPerformance: BrokerPerformanceData[] = performanceData.map(broker => {
      const connection = connections.find(c => c.broker_id === broker.broker_id)
      
      // Calculate sync reliability score (0-100)
      const syncReliabilityScore = calculateSyncReliabilityScore(connection)
      
      // Calculate performance rating
      const performanceRating = calculatePerformanceRating(broker.avg_return_percent, syncReliabilityScore)
      
      // Generate recommendations
      const recommendations = generateRecommendations(broker, connection)
      
      // Generate mock monthly performance data (in production, this would come from historical data)
      const monthlyPerformance = generateMonthlyPerformanceData(broker.total_portfolio_value, broker.avg_return_percent)

      return {
        brokerId: broker.broker_id,
        brokerName: broker.broker_id,
        displayName: brokerDisplayNames[broker.broker_id] || broker.broker_id,
        accountCount: broker.account_count || 0,
        uniqueHoldings: broker.unique_holdings || 0,
        totalPortfolioValue: broker.total_portfolio_value || 0,
        totalCostBasis: broker.total_cost_basis || 0,
        totalUnrealizedPnl: broker.total_unrealized_pnl || 0,
        avgReturnPercent: broker.avg_return_percent || 0,
        lastSyncTime: broker.last_sync_time,
        connectionStatus: broker.connection_status as 'connected' | 'disconnected' | 'error',
        syncReliabilityScore,
        performanceRating,
        recommendations,
        lastSyncedAt: broker.last_synced_at,
        monthlyPerformance
      }
    })

    return brokerPerformance
  } catch (error) {
    console.error('Error in getBrokerPerformanceData:', error)
    throw new Error('Failed to fetch broker performance data')
  }
})

// Calculate overall broker comparison metrics
export const getBrokerComparisonMetrics = cache(async (): Promise<BrokerComparisonMetrics> => {
  const brokerData = await getBrokerPerformanceData()
  
  if (brokerData.length === 0) {
    return {
      totalBrokers: 0,
      bestPerformingBroker: 'None',
      worstPerformingBroker: 'None',
      avgReturnAcrossBrokers: 0,
      mostReliableBroker: 'None',
      totalPortfolioValue: 0,
      diversificationScore: 0,
      riskScore: 'low',
      lastUpdated: new Date().toISOString()
    }
  }

  // Find best and worst performing brokers
  const bestPerforming = brokerData.reduce((best, current) => 
    current.avgReturnPercent > best.avgReturnPercent ? current : best
  )
  
  const worstPerforming = brokerData.reduce((worst, current) => 
    current.avgReturnPercent < worst.avgReturnPercent ? current : worst
  )

  // Find most reliable broker
  const mostReliable = brokerData.reduce((most, current) => 
    current.syncReliabilityScore > most.syncReliabilityScore ? current : most
  )

  // Calculate overall metrics
  const totalPortfolioValue = brokerData.reduce((sum, broker) => sum + broker.totalPortfolioValue, 0)
  const avgReturnAcrossBrokers = brokerData.reduce((sum, broker) => sum + broker.avgReturnPercent, 0) / brokerData.length
  
  // Calculate diversification score based on distribution across brokers
  const diversificationScore = calculateDiversificationScore(brokerData)
  
  // Calculate risk score based on concentration and performance volatility
  const riskScore = calculateRiskScore(brokerData)

  return {
    totalBrokers: brokerData.length,
    bestPerformingBroker: bestPerforming.displayName,
    worstPerformingBroker: worstPerforming.displayName,
    avgReturnAcrossBrokers,
    mostReliableBroker: mostReliable.displayName,
    totalPortfolioValue,
    diversificationScore,
    riskScore,
    lastUpdated: new Date().toISOString()
  }
})

// Trigger refresh of broker performance materialized view
export async function refreshBrokerPerformanceData() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Call the refresh function
    const { error } = await supabase.rpc('refresh_consolidated_holdings')
    
    if (error) {
      console.error('Error refreshing broker performance data:', error)
      throw new Error('Failed to refresh broker performance data')
    }

    return { success: true }
  } catch (error) {
    console.error('Error in refreshBrokerPerformanceData:', error)
    throw new Error('Failed to refresh broker performance data')
  }
}

// Helper functions

function calculateSyncReliabilityScore(connection: any): number {
  if (!connection) return 0
  
  let score = 100
  
  // Deduct points for errors
  if (connection.error_count > 0) {
    score -= Math.min(connection.error_count * 10, 50)
  }
  
  // Deduct points for recent errors
  if (connection.last_error_at) {
    const daysSinceError = (Date.now() - new Date(connection.last_error_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceError < 7) {
      score -= 20
    }
  }
  
  // Deduct points for infrequent syncing
  if (connection.last_synced_at) {
    const daysSinceSync = (Date.now() - new Date(connection.last_synced_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSync > 7) {
      score -= 30
    }
  }
  
  return Math.max(score, 0)
}

function calculatePerformanceRating(returnPercent: number, reliabilityScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
  const combinedScore = (returnPercent * 0.6) + (reliabilityScore * 0.4)
  
  if (combinedScore >= 80) return 'excellent'
  if (combinedScore >= 60) return 'good'
  if (combinedScore >= 40) return 'fair'
  return 'poor'
}

function generateRecommendations(broker: any, connection: any): string[] {
  const recommendations: string[] = []
  
  if (broker.avg_return_percent < 5) {
    recommendations.push('Consider reviewing your investment strategy for this broker')
  }
  
  if (connection?.error_count > 0) {
    recommendations.push('Check connection settings to resolve sync errors')
  }
  
  if (broker.unique_holdings < 5) {
    recommendations.push('Consider diversifying your holdings within this broker')
  }
  
  if (broker.total_portfolio_value > 100000) {
    recommendations.push('High portfolio value - consider risk management strategies')
  }
  
  if (connection?.last_synced_at) {
    const daysSinceSync = (Date.now() - new Date(connection.last_synced_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSync > 7) {
      recommendations.push('Enable automatic sync for more frequent updates')
    }
  }
  
  return recommendations
}

function generateMonthlyPerformanceData(totalValue: number, avgReturn: number): Array<{month: string, value: number, returnPercent: number}> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const monthlyVariation = (Math.random() - 0.5) * 0.1 // ±5% variation
    const baseValue = totalValue * (0.8 + (index / 12) * 0.2) // Growth over time
    const returnPercent = avgReturn + (monthlyVariation * 100)
    
    return {
      month,
      value: baseValue,
      returnPercent
    }
  })
}

function calculateDiversificationScore(brokerData: BrokerPerformanceData[]): number {
  const totalValue = brokerData.reduce((sum, broker) => sum + broker.totalPortfolioValue, 0)
  
  if (totalValue === 0) return 0
  
  // Calculate Herfindahl-Hirschman Index (HHI) for concentration
  const hhi = brokerData.reduce((sum, broker) => {
    const marketShare = broker.totalPortfolioValue / totalValue
    return sum + (marketShare * marketShare)
  }, 0)
  
  // Convert HHI to diversification score (0-100, higher is more diversified)
  return Math.round((1 - hhi) * 100)
}

function calculateRiskScore(brokerData: BrokerPerformanceData[]): 'low' | 'medium' | 'high' {
  const totalValue = brokerData.reduce((sum, broker) => sum + broker.totalPortfolioValue, 0)
  
  // Calculate concentration risk
  const maxConcentration = Math.max(...brokerData.map(broker => broker.totalPortfolioValue / totalValue))
  
  // Calculate performance volatility
  const returns = brokerData.map(broker => broker.avgReturnPercent)
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length)
  
  // Score based on concentration and volatility
  if (maxConcentration > 0.7 || volatility > 15) return 'high'
  if (maxConcentration > 0.5 || volatility > 10) return 'medium'
  return 'low'
}