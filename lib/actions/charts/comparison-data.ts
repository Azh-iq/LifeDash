'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { Database } from '@/lib/types/database.types'
import { getPortfolioPerformanceData } from './performance-data'
import { getPortfolioAllocation } from './allocation-data'

// Types for comparison data
type BenchmarkData = Database['public']['Tables']['benchmark_data']['Row']

// Validation schemas
const portfolioComparisonSchema = z.object({
  portfolioIds: z.array(z.string().uuid()).min(2).max(10),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL'])
    .default('1Y'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z
    .array(
      z.enum([
        'return',
        'volatility',
        'sharpe',
        'max_drawdown',
        'alpha',
        'beta',
      ])
    )
    .default(['return', 'volatility', 'sharpe']),
  normalizeToBase: z.boolean().default(true),
  currency: z.string().length(3).optional(),
})

const benchmarkComparisonSchema = z.object({
  portfolioId: z.string().uuid(),
  benchmarkSymbols: z.array(z.string()).min(1).max(5).default(['SPY']),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL'])
    .default('1Y'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeAlpha: z.boolean().default(true),
  includeBeta: z.boolean().default(true),
})

const riskReturnAnalysisSchema = z.object({
  portfolioIds: z.array(z.string().uuid()).min(1).max(20),
  period: z.enum(['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y']).default('1Y'),
  riskFreeRate: z.number().min(0).max(0.2).default(0.02), // 2% default risk-free rate
})

export interface ComparisonDataPoint {
  date: string
  portfolios: Record<string, number>
  benchmarks?: Record<string, number>
  metadata?: Record<string, any>
}

export interface PortfolioComparisonMetrics {
  portfolioId: string
  portfolioName: string
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  alpha?: number
  beta?: number
  calmarRatio: number
  sortinoRatio: number
  winRate: number
  bestMonth: number
  worstMonth: number
  correlation?: Record<string, number>
}

export interface ComparisonData {
  comparisonType: 'portfolio' | 'benchmark'
  period: string
  startDate: string
  endDate: string
  currency: string
  data: ComparisonDataPoint[]
  metrics: PortfolioComparisonMetrics[]
  summary: {
    bestPerformer: string
    worstPerformer: string
    mostVolatile: string
    leastVolatile: string
    bestSharpeRatio: string
    correlationMatrix?: Record<string, Record<string, number>>
  }
}

export interface RiskReturnPoint {
  portfolioId: string
  portfolioName: string
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  color?: string
  size?: number
}

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    cached?: boolean
    calculatedAt?: string
    dataPoints?: number
  }
}

/**
 * Compare performance across multiple portfolios
 * Provides normalized comparison charts and relative performance metrics
 */
export async function comparePortfolios(
  input: z.infer<typeof portfolioComparisonSchema>
): Promise<ActionResult<ComparisonData>> {
  try {
    const validatedInput = portfolioComparisonSchema.parse(input)
    const {
      portfolioIds,
      period,
      startDate,
      endDate,
      metrics,
      normalizeToBase,
      currency,
    } = validatedInput

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Fetch performance data for all portfolios
    const performancePromises = portfolioIds.map(portfolioId =>
      getPortfolioPerformanceData({
        portfolioId,
        period,
        startDate,
        endDate,
        granularity: 'daily',
        currency,
      })
    )

    const performanceResults = await Promise.all(performancePromises)

    // Check for any errors
    const failedPortfolios = performanceResults.filter(
      result => !result.success
    )
    if (failedPortfolios.length > 0) {
      return {
        success: false,
        error: `Failed to fetch data for ${failedPortfolios.length} portfolio(s)`,
      }
    }

    const portfolioData = performanceResults
      .filter(result => result.success && result.data)
      .map(result => result.data!)

    if (portfolioData.length < 2) {
      return {
        success: false,
        error: 'At least 2 portfolios with data are required for comparison',
      }
    }

    // Find common date range across all portfolios
    const commonDates = findCommonDates(portfolioData.map(p => p.data))

    if (commonDates.length === 0) {
      return {
        success: false,
        error: 'No common dates found across portfolios',
      }
    }

    // Create comparison data points
    const comparisonData: ComparisonDataPoint[] = commonDates.map(date => {
      const portfolios: Record<string, number> = {}

      portfolioData.forEach(portfolio => {
        const dataPoint = portfolio.data.find(d => d.date === date)
        if (dataPoint) {
          portfolios[portfolio.portfolioId] = dataPoint.value
        }
      })

      return {
        date,
        portfolios,
      }
    })

    // Normalize to base 100 if requested
    if (normalizeToBase && comparisonData.length > 0) {
      const baseValues: Record<string, number> = {}

      // Get base values (first data point for each portfolio)
      portfolioData.forEach(portfolio => {
        baseValues[portfolio.portfolioId] =
          comparisonData[0].portfolios[portfolio.portfolioId] || 1
      })

      // Normalize all data points
      comparisonData.forEach(dataPoint => {
        Object.keys(dataPoint.portfolios).forEach(portfolioId => {
          const baseValue = baseValues[portfolioId]
          if (baseValue > 0) {
            dataPoint.portfolios[portfolioId] =
              (dataPoint.portfolios[portfolioId] / baseValue) * 100
          }
        })
      })
    }

    // Calculate comparison metrics
    const comparisonMetrics = await calculatePortfolioMetrics(
      portfolioData,
      comparisonData,
      period
    )

    // Calculate correlation matrix if multiple portfolios
    const correlationMatrix = calculateCorrelationMatrix(
      comparisonData,
      portfolioData
    )

    // Generate summary statistics
    const summary = generateComparisonSummary(
      comparisonMetrics,
      correlationMatrix,
      portfolioData
    )

    const comparison: ComparisonData = {
      comparisonType: 'portfolio',
      period,
      startDate: comparisonData[0]?.date || '',
      endDate: comparisonData[comparisonData.length - 1]?.date || '',
      currency: currency || portfolioData[0]?.currency || 'USD',
      data: comparisonData,
      metrics: comparisonMetrics,
      summary,
    }

    return {
      success: true,
      data: comparison,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: comparisonData.length,
      },
    }
  } catch (error) {
    console.error('Portfolio comparison error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while comparing portfolios',
    }
  }
}

/**
 * Compare portfolio performance against market benchmarks
 * Includes alpha, beta, and tracking error calculations
 */
export async function compareWithBenchmarks(
  input: z.infer<typeof benchmarkComparisonSchema>
): Promise<ActionResult<ComparisonData>> {
  try {
    const validatedInput = benchmarkComparisonSchema.parse(input)
    const {
      portfolioId,
      benchmarkSymbols,
      period,
      startDate,
      endDate,
      includeAlpha,
      includeBeta,
    } = validatedInput

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Fetch portfolio performance data
    const portfolioResult = await getPortfolioPerformanceData({
      portfolioId,
      period,
      startDate,
      endDate,
      granularity: 'daily',
    })

    if (!portfolioResult.success || !portfolioResult.data) {
      return {
        success: false,
        error: portfolioResult.error || 'Failed to fetch portfolio data',
      }
    }

    const portfolioData = portfolioResult.data

    // Calculate date range
    const endDateTime = endDate ? new Date(endDate) : new Date()
    const startDateTime = startDate
      ? new Date(startDate)
      : calculateStartDate(period, endDateTime)

    // Fetch benchmark data
    const benchmarkPromises = benchmarkSymbols.map(async symbol => {
      const { data: benchmarkData, error } = await supabase
        .from('benchmark_data')
        .select('*')
        .eq('benchmark_symbol', symbol)
        .gte('price_date', startDateTime.toISOString().split('T')[0])
        .lte('price_date', endDateTime.toISOString().split('T')[0])
        .order('price_date', { ascending: true })

      if (error) {
        console.error(`Error fetching benchmark data for ${symbol}:`, error)
        return null
      }

      return { symbol, data: benchmarkData || [] }
    })

    const benchmarkResults = await Promise.all(benchmarkPromises)
    const validBenchmarks = benchmarkResults.filter(
      result => result !== null
    ) as Array<{
      symbol: string
      data: BenchmarkData[]
    }>

    if (validBenchmarks.length === 0) {
      return {
        success: false,
        error: 'No benchmark data available for the specified period',
      }
    }

    // Find common dates between portfolio and benchmarks
    const portfolioDates = new Set(portfolioData.data.map(d => d.date))
    const benchmarkDates = new Set(
      validBenchmarks.flatMap(b => b.data.map(d => d.price_date))
    )
    const commonDates = Array.from(portfolioDates)
      .filter(date => benchmarkDates.has(date))
      .sort()

    // Create comparison data points
    const comparisonData: ComparisonDataPoint[] = commonDates.map(date => {
      const portfolios: Record<string, number> = {}
      const benchmarks: Record<string, number> = {}

      // Portfolio data
      const portfolioPoint = portfolioData.data.find(d => d.date === date)
      if (portfolioPoint) {
        portfolios[portfolioId] = portfolioPoint.value
      }

      // Benchmark data
      validBenchmarks.forEach(benchmark => {
        const benchmarkPoint = benchmark.data.find(d => d.price_date === date)
        if (benchmarkPoint) {
          benchmarks[benchmark.symbol] = benchmarkPoint.close_price
        }
      })

      return {
        date,
        portfolios,
        benchmarks,
      }
    })

    // Normalize to base 100
    if (comparisonData.length > 0) {
      const portfolioBase = comparisonData[0].portfolios[portfolioId] || 1
      const benchmarkBases: Record<string, number> = {}

      validBenchmarks.forEach(benchmark => {
        benchmarkBases[benchmark.symbol] =
          comparisonData[0].benchmarks?.[benchmark.symbol] || 1
      })

      comparisonData.forEach(dataPoint => {
        // Normalize portfolio
        if (portfolioBase > 0 && dataPoint.portfolios[portfolioId]) {
          dataPoint.portfolios[portfolioId] =
            (dataPoint.portfolios[portfolioId] / portfolioBase) * 100
        }

        // Normalize benchmarks
        if (dataPoint.benchmarks) {
          Object.keys(dataPoint.benchmarks).forEach(symbol => {
            const base = benchmarkBases[symbol]
            if (base > 0) {
              dataPoint.benchmarks![symbol] =
                (dataPoint.benchmarks![symbol] / base) * 100
            }
          })
        }
      })
    }

    // Calculate metrics including alpha and beta if requested
    const portfolioMetrics = await calculateBenchmarkMetrics(
      portfolioData,
      validBenchmarks,
      comparisonData,
      { includeAlpha, includeBeta }
    )

    const comparison: ComparisonData = {
      comparisonType: 'benchmark',
      period,
      startDate: comparisonData[0]?.date || '',
      endDate: comparisonData[comparisonData.length - 1]?.date || '',
      currency: portfolioData.currency,
      data: comparisonData,
      metrics: portfolioMetrics,
      summary: {
        bestPerformer: portfolioData.portfolioName,
        worstPerformer: validBenchmarks[0]?.symbol || '',
        mostVolatile: portfolioData.portfolioName,
        leastVolatile: validBenchmarks[0]?.symbol || '',
        bestSharpeRatio: portfolioData.portfolioName,
      },
    }

    return {
      success: true,
      data: comparison,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: comparisonData.length,
      },
    }
  } catch (error) {
    console.error('Benchmark comparison error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while comparing with benchmarks',
    }
  }
}

/**
 * Generate risk-return scatter plot data for multiple portfolios
 * Useful for visualizing efficient frontier and portfolio positioning
 */
export async function getRiskReturnAnalysis(
  input: z.infer<typeof riskReturnAnalysisSchema>
): Promise<
  ActionResult<{
    riskReturnPoints: RiskReturnPoint[]
    efficientFrontier?: { risk: number; return: number }[]
    marketPortfolio?: RiskReturnPoint
    riskFreeRate: number
  }>
> {
  try {
    const validatedInput = riskReturnAnalysisSchema.parse(input)
    const { portfolioIds, period, riskFreeRate } = validatedInput

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Fetch performance metrics for all portfolios
    const metricsPromises = portfolioIds.map(async portfolioId => {
      const { data: metrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('entity_type', 'PORTFOLIO')
        .eq('entity_id', portfolioId)
        .eq('period_type', period.toUpperCase())
        .eq('user_id', user.id)
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single()

      if (error || !metrics) {
        return null
      }

      // Get portfolio name
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('name')
        .eq('id', portfolioId)
        .single()

      return {
        portfolioId,
        portfolioName: portfolio?.name || 'Unknown Portfolio',
        metrics,
      }
    })

    const metricsResults = await Promise.all(metricsPromises)
    const validMetrics = metricsResults.filter(
      result => result !== null
    ) as Array<{
      portfolioId: string
      portfolioName: string
      metrics: any
    }>

    if (validMetrics.length === 0) {
      return {
        success: false,
        error:
          'No performance metrics available for the specified portfolios and period',
      }
    }

    // Create risk-return points
    const riskReturnPoints: RiskReturnPoint[] = validMetrics.map(
      (item, index) => {
        const expectedReturn = (item.metrics.annualized_return || 0) * 100
        const volatility = (item.metrics.volatility || 0) * 100
        const sharpeRatio = item.metrics.sharpe_ratio || 0

        return {
          portfolioId: item.portfolioId,
          portfolioName: item.portfolioName,
          expectedReturn,
          volatility,
          sharpeRatio,
          color: getPortfolioColor(index),
          size: Math.max(8, Math.min(20, sharpeRatio * 10)), // Size based on Sharpe ratio
        }
      }
    )

    // TODO: Calculate efficient frontier if we have sufficient data
    // This would require optimization algorithms and more sophisticated calculations

    return {
      success: true,
      data: {
        riskReturnPoints,
        riskFreeRate: riskFreeRate * 100, // Convert to percentage
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Risk-return analysis error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred during risk-return analysis',
    }
  }
}

/**
 * Get cached portfolio comparison data
 */
export const getCachedPortfolioComparison = unstable_cache(
  async (input: z.infer<typeof portfolioComparisonSchema>) => {
    const result = await comparePortfolios(input)
    return {
      ...result,
      metadata: {
        ...result.metadata,
        cached: true,
      },
    }
  },
  ['portfolio-comparison'],
  {
    revalidate: 600, // 10 minutes cache
    tags: ['portfolio-comparison'],
  }
)

// Helper functions

function findCommonDates(
  portfolioDataArrays: Array<Array<{ date: string }>>
): string[] {
  if (portfolioDataArrays.length === 0) return []

  const firstPortfolioDates = new Set(portfolioDataArrays[0].map(d => d.date))

  return portfolioDataArrays
    .slice(1)
    .reduce((commonDates, portfolioData) => {
      const portfolioDates = new Set(portfolioData.map(d => d.date))
      return commonDates.filter(date => portfolioDates.has(date))
    }, Array.from(firstPortfolioDates))
    .sort()
}

function calculateStartDate(period: string, endDate: Date): Date {
  switch (period) {
    case '1D':
      return new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
    case '1W':
      return new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '1M':
      return new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '3M':
      return new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6M':
      return new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000)
    case '1Y':
      return new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'YTD':
      return new Date(endDate.getFullYear(), 0, 1)
    default:
      return new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
  }
}

async function calculatePortfolioMetrics(
  portfolioData: any[],
  comparisonData: ComparisonDataPoint[],
  period: string
): Promise<PortfolioComparisonMetrics[]> {
  return portfolioData.map(portfolio => {
    const returns = comparisonData
      .map((dataPoint, index) => {
        if (index === 0) return 0
        const current = dataPoint.portfolios[portfolio.portfolioId]
        const previous =
          comparisonData[index - 1].portfolios[portfolio.portfolioId]
        return previous > 0 ? (current - previous) / previous : 0
      })
      .slice(1) // Remove first element (always 0)

    const totalReturn = portfolio.summary.totalReturn
    const totalReturnPercent = portfolio.summary.totalReturnPercent
    const volatility = calculateVolatility(returns)
    const sharpeRatio = portfolio.summary.sharpeRatio || 0
    const maxDrawdown = portfolio.summary.maxDrawdown || 0

    return {
      portfolioId: portfolio.portfolioId,
      portfolioName: portfolio.portfolioName,
      totalReturn,
      totalReturnPercent,
      annualizedReturn: calculateAnnualizedReturn(totalReturnPercent, period),
      volatility,
      sharpeRatio,
      maxDrawdown,
      calmarRatio: totalReturnPercent / Math.abs(maxDrawdown || 1),
      sortinoRatio: calculateSortinoRatio(returns),
      winRate: calculateWinRate(returns),
      bestMonth: Math.max(...returns) * 100,
      worstMonth: Math.min(...returns) * 100,
    }
  })
}

async function calculateBenchmarkMetrics(
  portfolioData: any,
  benchmarkData: any[],
  comparisonData: ComparisonDataPoint[],
  options: { includeAlpha: boolean; includeBeta: boolean }
): Promise<PortfolioComparisonMetrics[]> {
  // Calculate portfolio returns
  const portfolioReturns = comparisonData
    .map((dataPoint, index) => {
      if (index === 0) return 0
      const current = dataPoint.portfolios[portfolioData.portfolioId]
      const previous =
        comparisonData[index - 1].portfolios[portfolioData.portfolioId]
      return previous > 0 ? (current - previous) / previous : 0
    })
    .slice(1)

  // Calculate benchmark returns (using first benchmark as market proxy)
  const primaryBenchmark = benchmarkData[0]?.symbol
  const benchmarkReturns = primaryBenchmark
    ? comparisonData
        .map((dataPoint, index) => {
          if (index === 0) return 0
          const current = dataPoint.benchmarks?.[primaryBenchmark]
          const previous =
            comparisonData[index - 1].benchmarks?.[primaryBenchmark]
          return previous > 0 && current ? (current - previous) / previous : 0
        })
        .slice(1)
    : []

  // Calculate alpha and beta if requested
  let alpha: number | undefined
  let beta: number | undefined

  if (options.includeAlpha || options.includeBeta) {
    const regression = calculateLinearRegression(
      benchmarkReturns,
      portfolioReturns
    )
    alpha = options.includeAlpha ? regression.intercept : undefined
    beta = options.includeBeta ? regression.slope : undefined
  }

  const volatility = calculateVolatility(portfolioReturns)
  const sharpeRatio = portfolioData.summary.sharpeRatio || 0

  return [
    {
      portfolioId: portfolioData.portfolioId,
      portfolioName: portfolioData.portfolioName,
      totalReturn: portfolioData.summary.totalReturn,
      totalReturnPercent: portfolioData.summary.totalReturnPercent,
      annualizedReturn: portfolioData.summary.totalReturnPercent, // Simplified
      volatility,
      sharpeRatio,
      maxDrawdown: portfolioData.summary.maxDrawdown || 0,
      alpha,
      beta,
      calmarRatio:
        portfolioData.summary.totalReturnPercent /
        Math.abs(portfolioData.summary.maxDrawdown || 1),
      sortinoRatio: calculateSortinoRatio(portfolioReturns),
      winRate: calculateWinRate(portfolioReturns),
      bestMonth: Math.max(...portfolioReturns) * 100,
      worstMonth: Math.min(...portfolioReturns) * 100,
    },
  ]
}

function calculateCorrelationMatrix(
  comparisonData: ComparisonDataPoint[],
  portfolioData: any[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {}

  portfolioData.forEach(portfolio1 => {
    matrix[portfolio1.portfolioId] = {}

    portfolioData.forEach(portfolio2 => {
      const returns1 = comparisonData
        .map((d, i) => {
          if (i === 0) return 0
          const current = d.portfolios[portfolio1.portfolioId]
          const previous =
            comparisonData[i - 1].portfolios[portfolio1.portfolioId]
          return previous > 0 ? (current - previous) / previous : 0
        })
        .slice(1)

      const returns2 = comparisonData
        .map((d, i) => {
          if (i === 0) return 0
          const current = d.portfolios[portfolio2.portfolioId]
          const previous =
            comparisonData[i - 1].portfolios[portfolio2.portfolioId]
          return previous > 0 ? (current - previous) / previous : 0
        })
        .slice(1)

      matrix[portfolio1.portfolioId][portfolio2.portfolioId] =
        calculateCorrelation(returns1, returns2)
    })
  })

  return matrix
}

function generateComparisonSummary(
  metrics: PortfolioComparisonMetrics[],
  correlationMatrix: Record<string, Record<string, number>>,
  portfolioData: any[]
): ComparisonData['summary'] {
  const bestPerformer = metrics.reduce((best, current) =>
    current.totalReturnPercent > best.totalReturnPercent ? current : best
  )

  const worstPerformer = metrics.reduce((worst, current) =>
    current.totalReturnPercent < worst.totalReturnPercent ? current : worst
  )

  const mostVolatile = metrics.reduce((most, current) =>
    current.volatility > most.volatility ? current : most
  )

  const leastVolatile = metrics.reduce((least, current) =>
    current.volatility < least.volatility ? current : least
  )

  const bestSharpeRatio = metrics.reduce((best, current) =>
    current.sharpeRatio > best.sharpeRatio ? current : best
  )

  return {
    bestPerformer: bestPerformer.portfolioName,
    worstPerformer: worstPerformer.portfolioName,
    mostVolatile: mostVolatile.portfolioName,
    leastVolatile: leastVolatile.portfolioName,
    bestSharpeRatio: bestSharpeRatio.portfolioName,
    correlationMatrix,
  }
}

// Statistical helper functions

function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized volatility as percentage
}

function calculateAnnualizedReturn(
  totalReturnPercent: number,
  period: string
): number {
  const periodDays: Record<string, number> = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    YTD: 365, // Simplified
  }

  const days = periodDays[period] || 365
  return ((1 + totalReturnPercent / 100) ** (365 / days) - 1) * 100
}

function calculateSortinoRatio(returns: number[]): number {
  if (returns.length === 0) return 0
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const downside = returns.filter(r => r < 0)
  if (downside.length === 0) return 0
  const downsideVariance =
    downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length
  return (mean / Math.sqrt(downsideVariance)) * Math.sqrt(252)
}

function calculateWinRate(returns: number[]): number {
  if (returns.length === 0) return 0
  const wins = returns.filter(r => r > 0).length
  return (wins / returns.length) * 100
}

function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) return 0

  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length

  const numerator = returns1.reduce(
    (sum, r1, i) => sum + (r1 - mean1) * (returns2[i] - mean2),
    0
  )
  const denominator1 = Math.sqrt(
    returns1.reduce((sum, r) => sum + Math.pow(r - mean1, 2), 0)
  )
  const denominator2 = Math.sqrt(
    returns2.reduce((sum, r) => sum + Math.pow(r - mean2, 2), 0)
  )

  return denominator1 * denominator2 > 0
    ? numerator / (denominator1 * denominator2)
    : 0
}

function calculateLinearRegression(
  x: number[],
  y: number[]
): { slope: number; intercept: number } {
  if (x.length !== y.length || x.length === 0) return { slope: 0, intercept: 0 }

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

function getPortfolioColor(index: number): string {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#84CC16',
    '#6366F1',
  ]
  return colors[index % colors.length]
}
