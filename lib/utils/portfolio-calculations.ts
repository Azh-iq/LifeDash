'use client'

import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import { StockPrice } from '@/lib/hooks/use-stock-prices'

export interface PortfolioCalculations {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercent: number
  dailyChange: number
  dailyChangePercent: number
}

/**
 * Calculate portfolio metrics based on holdings and current prices
 */
export function calculatePortfolioMetrics(
  holdings: HoldingWithMetrics[],
  currentPrices: { [symbol: string]: StockPrice }
): PortfolioCalculations {
  if (!holdings.length) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      dailyChange: 0,
      dailyChangePercent: 0,
    }
  }

  let totalValue = 0
  let totalCost = 0
  let dailyChange = 0

  holdings.forEach(holding => {
    const currentPrice = currentPrices[holding.symbol]
    const price =
      currentPrice?.price || holding.current_price || holding.cost_basis
    const dailyChangeAmount = currentPrice?.change || 0

    const holdingValue = holding.quantity * price
    const holdingCost = holding.quantity * holding.cost_basis
    const holdingDailyChange = holding.quantity * dailyChangeAmount

    totalValue += holdingValue
    totalCost += holdingCost
    dailyChange += holdingDailyChange
  })

  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent =
    totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
  const dailyChangePercent =
    totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dailyChange,
    dailyChangePercent,
  }
}

/**
 * Generate realistic historical portfolio data based on current holdings
 * This simulates what the portfolio value would have been historically
 */
export function generatePortfolioHistoryData(
  holdings: HoldingWithMetrics[],
  currentPrices: { [symbol: string]: StockPrice },
  days: number = 30
): Array<{
  timestamp: string
  value: number
  change: number
  changePercent: number
  volume: number
}> {
  const data = []
  const now = new Date()

  // Calculate current portfolio value
  const currentMetrics = calculatePortfolioMetrics(holdings, currentPrices)
  const currentTotalValue = currentMetrics.totalValue || 100000 // Fallback value

  // Generate historical data points
  for (let i = 0; i < days; i++) {
    const daysAgo = days - 1 - i
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // More realistic portfolio simulation based on actual composition
    // Portfolios typically have lower volatility than individual stocks
    const baseVolatility = 0.008 // 0.8% daily volatility for diversified portfolio
    const trendComponent = Math.sin((daysAgo / days) * Math.PI) * 0.1 // Long-term trend
    const randomComponent = (Math.random() - 0.5) * 2 * baseVolatility

    const totalChangePercent = trendComponent + randomComponent
    const totalChangeAmount = currentTotalValue * totalChangePercent

    // Calculate value for this historical point
    const historicalValue =
      currentTotalValue - totalChangeAmount * (daysAgo / days)

    // Calculate daily change (change from previous day)
    const previousValue = i > 0 ? data[i - 1].value : historicalValue * 0.995
    const dailyChangeAmount = historicalValue - previousValue
    const dailyChangePercent =
      previousValue > 0 ? (dailyChangeAmount / previousValue) * 100 : 0

    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.max(historicalValue, currentTotalValue * 0.5), // Ensure reasonable minimum
      change: dailyChangeAmount,
      changePercent: dailyChangePercent,
      volume: Math.floor(Math.random() * 20000) + 10000, // Simulated trading volume
    })
  }

  return data
}
