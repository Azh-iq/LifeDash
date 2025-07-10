'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { Database } from '@/lib/types/database.types'

// Types for benchmark data
type BenchmarkData = Database['public']['Tables']['benchmark_data']['Row']
type CurrencyCode = Database['public']['Enums']['currency_code']

// Validation schemas
const benchmarkDataSchema = z.object({
  symbols: z.array(z.string()).min(1).max(10).default(['SPY']),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', '3Y', '5Y', 'ALL'])
    .default('1Y'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currency: z.string().length(3).optional(),
  includeMetrics: z.boolean().default(true),
})

const benchmarkComparisonSchema = z.object({
  primarySymbol: z.string(),
  comparisonSymbols: z.array(z.string()).max(5),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', '3Y', '5Y', 'ALL'])
    .default('1Y'),
  normalizeToBase: z.boolean().default(true),
})

const marketOverviewSchema = z.object({
  region: z.enum(['US', 'EUROPE', 'ASIA', 'NORDIC', 'GLOBAL']).default('US'),
  assetClasses: z
    .array(z.enum(['INDEX', 'ETF', 'SECTOR', 'CUSTOM']))
    .default(['INDEX', 'ETF']),
  currency: z.string().length(3).optional(),
})

export interface BenchmarkDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  adjustedClose?: number
  change?: number
  changePercent?: number
  metadata?: {
    marketCap?: number
    peRatio?: number
    dividendYield?: number
    volatility?: number
  }
}

export interface BenchmarkMetrics {
  symbol: string
  name: string
  type: string
  currency: string
  currentPrice: number
  dayChange: number
  dayChangePercent: number
  return1W?: number
  return1M?: number
  return3M?: number
  return6M?: number
  return1Y?: number
  returnYTD?: number
  return3Y?: number
  return5Y?: number
  volatility30D?: number
  volatility1Y?: number
  marketCap?: number
  peRatio?: number
  dividendYield?: number
  volume?: number
  avgVolume30D?: number
  beta?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  lastUpdate: string
}

export interface BenchmarkPerformanceData {
  symbol: string
  name: string
  type: string
  currency: string
  data: BenchmarkDataPoint[]
  metrics: BenchmarkMetrics
  correlations?: Record<string, number>
}

export interface MarketOverview {
  region: string
  asOfDate: string
  indices: BenchmarkMetrics[]
  sectors: BenchmarkMetrics[]
  summary: {
    advancers: number
    decliners: number
    unchanged: number
    newHighs: number
    newLows: number
    marketSentiment: 'bullish' | 'bearish' | 'neutral'
    volatilityIndex?: number
  }
}

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    cached?: boolean
    calculatedAt?: string
    dataPoints?: number
    source?: string
  }
}

/**
 * Get benchmark performance data for specified symbols and time period
 * Supports various market indices, ETFs, and custom benchmarks
 */
export async function getBenchmarkData(
  input: z.infer<typeof benchmarkDataSchema>
): Promise<ActionResult<BenchmarkPerformanceData[]>> {
  try {
    const validatedInput = benchmarkDataSchema.parse(input)
    const { symbols, period, startDate, endDate, currency, includeMetrics } =
      validatedInput

    const supabase = createClient()

    // Calculate date range
    const endDateTime = endDate ? new Date(endDate) : new Date()
    const startDateTime = calculateStartDate(period, startDate, endDateTime)

    // Fetch benchmark data for all symbols
    const benchmarkPromises = symbols.map(async symbol => {
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

      if (!benchmarkData || benchmarkData.length === 0) {
        console.warn(`No data found for benchmark symbol: ${symbol}`)
        return null
      }

      // Transform data points
      const dataPoints: BenchmarkDataPoint[] = benchmarkData.map(
        (point, index) => {
          const previousPoint = index > 0 ? benchmarkData[index - 1] : null
          const change = previousPoint
            ? point.close_price - previousPoint.close_price
            : point.day_change
          const changePercent =
            previousPoint && previousPoint.close_price > 0
              ? ((point.close_price - previousPoint.close_price) /
                  previousPoint.close_price) *
                100
              : point.day_change_percent

          return {
            date: point.price_date,
            open: point.open_price || point.close_price,
            high: point.high_price || point.close_price,
            low: point.low_price || point.close_price,
            close: point.close_price,
            volume: point.volume,
            adjustedClose: point.adjusted_close,
            change,
            changePercent,
            metadata: {
              marketCap: point.market_cap,
              peRatio: point.pe_ratio,
              dividendYield: point.dividend_yield,
              volatility: point.volatility_30d,
            },
          }
        }
      )

      // Calculate metrics
      const latestData = benchmarkData[benchmarkData.length - 1]
      const metrics: BenchmarkMetrics = {
        symbol: latestData.benchmark_symbol,
        name: latestData.benchmark_name,
        type: latestData.benchmark_type,
        currency: currency || latestData.currency,
        currentPrice: latestData.close_price,
        dayChange: latestData.day_change || 0,
        dayChangePercent: latestData.day_change_percent || 0,
        return1W: latestData.return_1w,
        return1M: latestData.return_1m,
        return3M: latestData.return_3m,
        return6M: latestData.return_6m,
        return1Y: latestData.return_1y,
        returnYTD: latestData.return_ytd,
        return3Y: latestData.return_3y,
        return5Y: latestData.return_5y,
        volatility30D: latestData.volatility_30d,
        volatility1Y: latestData.volatility_1y,
        marketCap: latestData.market_cap,
        peRatio: latestData.pe_ratio,
        dividendYield: latestData.dividend_yield,
        volume: latestData.volume,
        lastUpdate: latestData.updated_at,
      }

      // Calculate additional metrics if includeMetrics is true
      if (includeMetrics) {
        const priceHistory = dataPoints.map(d => d.close)
        if (priceHistory.length > 0) {
          metrics.fiftyTwoWeekHigh = Math.max(...priceHistory)
          metrics.fiftyTwoWeekLow = Math.min(...priceHistory)

          // Calculate 30-day average volume
          const recentVolumes = dataPoints
            .slice(-30)
            .map(d => d.volume)
            .filter(v => v != null) as number[]
          if (recentVolumes.length > 0) {
            metrics.avgVolume30D =
              recentVolumes.reduce((sum, vol) => sum + vol, 0) /
              recentVolumes.length
          }
        }
      }

      return {
        symbol,
        name: latestData.benchmark_name,
        type: latestData.benchmark_type,
        currency: currency || latestData.currency,
        data: dataPoints,
        metrics,
      }
    })

    const benchmarkResults = await Promise.all(benchmarkPromises)
    const validBenchmarks = benchmarkResults.filter(
      result => result !== null
    ) as BenchmarkPerformanceData[]

    if (validBenchmarks.length === 0) {
      return {
        success: false,
        error:
          'No benchmark data available for the specified symbols and period',
      }
    }

    // Calculate correlations between benchmarks if multiple symbols
    if (validBenchmarks.length > 1) {
      validBenchmarks.forEach(benchmark => {
        benchmark.correlations = {}
        const returns1 = calculateReturns(benchmark.data.map(d => d.close))

        validBenchmarks.forEach(otherBenchmark => {
          if (benchmark.symbol !== otherBenchmark.symbol) {
            const returns2 = calculateReturns(
              otherBenchmark.data.map(d => d.close)
            )
            benchmark.correlations![otherBenchmark.symbol] =
              calculateCorrelation(returns1, returns2)
          }
        })
      })
    }

    return {
      success: true,
      data: validBenchmarks,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: validBenchmarks.reduce((sum, b) => sum + b.data.length, 0),
        source: 'benchmark_data',
      },
    }
  } catch (error) {
    console.error('Benchmark data error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while fetching benchmark data',
    }
  }
}

/**
 * Get cached benchmark data with automatic cache invalidation
 */
export const getCachedBenchmarkData = unstable_cache(
  async (input: z.infer<typeof benchmarkDataSchema>) => {
    const result = await getBenchmarkData(input)
    return {
      ...result,
      metadata: {
        ...result.metadata,
        cached: true,
      },
    }
  },
  ['benchmark-data'],
  {
    revalidate: 300, // 5 minutes cache for benchmark data
    tags: ['benchmark-data'],
  }
)

/**
 * Compare multiple benchmarks with normalized performance
 * Useful for comparing different market indices or sectors
 */
export async function compareBenchmarks(
  input: z.infer<typeof benchmarkComparisonSchema>
): Promise<
  ActionResult<{
    primary: BenchmarkPerformanceData
    comparisons: BenchmarkPerformanceData[]
    normalizedData: Array<{
      date: string
      [symbol: string]: number | string
    }>
    relativePerformance: Record<string, number>
  }>
> {
  try {
    const validatedInput = benchmarkComparisonSchema.parse(input)
    const { primarySymbol, comparisonSymbols, period, normalizeToBase } =
      validatedInput

    const allSymbols = [primarySymbol, ...comparisonSymbols]

    const benchmarkResult = await getBenchmarkData({
      symbols: allSymbols,
      period,
      includeMetrics: true,
    })

    if (!benchmarkResult.success || !benchmarkResult.data) {
      return {
        success: false,
        error: benchmarkResult.error || 'Failed to fetch benchmark data',
      }
    }

    const benchmarks = benchmarkResult.data
    const primary = benchmarks.find(b => b.symbol === primarySymbol)
    const comparisons = benchmarks.filter(b => b.symbol !== primarySymbol)

    if (!primary) {
      return {
        success: false,
        error: `Primary benchmark ${primarySymbol} not found`,
      }
    }

    // Find common dates
    const allDates = new Set<string>()
    benchmarks.forEach(benchmark => {
      benchmark.data.forEach(dataPoint => {
        allDates.add(dataPoint.date)
      })
    })

    const commonDates = Array.from(allDates).sort()

    // Create normalized comparison data
    let normalizedData: Array<{
      date: string
      [symbol: string]: number | string
    }> = []
    const baseValues: Record<string, number> = {}

    if (normalizeToBase && commonDates.length > 0) {
      // Calculate base values (first available price for each benchmark)
      benchmarks.forEach(benchmark => {
        const firstDataPoint = benchmark.data.find(d =>
          commonDates.includes(d.date)
        )
        baseValues[benchmark.symbol] = firstDataPoint?.close || 1
      })

      normalizedData = commonDates.map(date => {
        const dataPoint: { date: string; [symbol: string]: number | string } = {
          date,
        }

        benchmarks.forEach(benchmark => {
          const point = benchmark.data.find(d => d.date === date)
          if (point && baseValues[benchmark.symbol] > 0) {
            dataPoint[benchmark.symbol] =
              (point.close / baseValues[benchmark.symbol]) * 100
          }
        })

        return dataPoint
      })
    } else {
      normalizedData = commonDates.map(date => {
        const dataPoint: { date: string; [symbol: string]: number | string } = {
          date,
        }

        benchmarks.forEach(benchmark => {
          const point = benchmark.data.find(d => d.date === date)
          if (point) {
            dataPoint[benchmark.symbol] = point.close
          }
        })

        return dataPoint
      })
    }

    // Calculate relative performance vs primary benchmark
    const relativePerformance: Record<string, number> = {}
    comparisons.forEach(comparison => {
      const primaryReturn = primary.metrics.return1Y || 0
      const comparisonReturn = comparison.metrics.return1Y || 0
      relativePerformance[comparison.symbol] = comparisonReturn - primaryReturn
    })

    return {
      success: true,
      data: {
        primary,
        comparisons,
        normalizedData,
        relativePerformance,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: normalizedData.length,
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
      error: 'An unexpected error occurred while comparing benchmarks',
    }
  }
}

/**
 * Get market overview for a specific region
 * Provides a snapshot of major indices, sectors, and market sentiment
 */
export async function getMarketOverview(
  input: z.infer<typeof marketOverviewSchema>
): Promise<ActionResult<MarketOverview>> {
  try {
    const validatedInput = marketOverviewSchema.parse(input)
    const { region, assetClasses, currency } = validatedInput

    const supabase = createClient()

    // Get regional benchmark symbols
    const regionalSymbols = getRegionalSymbols(region)

    // Fetch latest benchmark data for the region
    const { data: benchmarkData, error } = await supabase
      .from('benchmark_data')
      .select('*')
      .in('benchmark_symbol', regionalSymbols)
      .in('benchmark_type', assetClasses)
      .eq('is_active', true)
      .order('price_date', { ascending: false })

    if (error) {
      console.error('Error fetching market overview data:', error)
      return {
        success: false,
        error: 'Failed to fetch market overview data',
      }
    }

    if (!benchmarkData || benchmarkData.length === 0) {
      return {
        success: false,
        error: 'No market data available for the specified region',
      }
    }

    // Group by symbol and get latest data for each
    const latestDataMap = new Map<string, BenchmarkData>()
    benchmarkData.forEach(data => {
      const existing = latestDataMap.get(data.benchmark_symbol)
      if (!existing || data.price_date > existing.price_date) {
        latestDataMap.set(data.benchmark_symbol, data)
      }
    })

    const latestData = Array.from(latestDataMap.values())

    // Separate indices and sectors
    const indices = latestData
      .filter(data => data.benchmark_type === 'INDEX')
      .map(data => createBenchmarkMetrics(data, currency))

    const sectors = latestData
      .filter(
        data =>
          data.benchmark_type === 'SECTOR' || data.benchmark_type === 'ETF'
      )
      .map(data => createBenchmarkMetrics(data, currency))

    // Calculate market summary
    const allMetrics = [...indices, ...sectors]
    const advancers = allMetrics.filter(m => m.dayChangePercent > 0).length
    const decliners = allMetrics.filter(m => m.dayChangePercent < 0).length
    const unchanged = allMetrics.filter(m => m.dayChangePercent === 0).length

    // Calculate new highs/lows (simplified - would need more historical data)
    const newHighs = allMetrics.filter(
      m => m.currentPrice === m.fiftyTwoWeekHigh
    ).length
    const newLows = allMetrics.filter(
      m => m.currentPrice === m.fiftyTwoWeekLow
    ).length

    // Determine market sentiment
    const advancerRatio =
      allMetrics.length > 0 ? advancers / allMetrics.length : 0
    let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (advancerRatio > 0.6) marketSentiment = 'bullish'
    else if (advancerRatio < 0.4) marketSentiment = 'bearish'

    const overview: MarketOverview = {
      region,
      asOfDate:
        latestData[0]?.price_date || new Date().toISOString().split('T')[0],
      indices,
      sectors,
      summary: {
        advancers,
        decliners,
        unchanged,
        newHighs,
        newLows,
        marketSentiment,
      },
    }

    return {
      success: true,
      data: overview,
      metadata: {
        calculatedAt: new Date().toISOString(),
        source: 'benchmark_data',
      },
    }
  } catch (error) {
    console.error('Market overview error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while fetching market overview',
    }
  }
}

/**
 * Get Norwegian market benchmarks (OSEBX, OBX, etc.)
 * Specialized function for Norwegian market data
 */
export async function getNorwegianMarketData(
  period: string = '1Y'
): Promise<ActionResult<BenchmarkPerformanceData[]>> {
  const norwegianSymbols = ['OSEBX', 'OBX', 'OSEAX', 'MSCI-NORDIC']

  return getBenchmarkData({
    symbols: norwegianSymbols,
    period: period as any,
    currency: 'NOK',
    includeMetrics: true,
  })
}

/**
 * Get major global market indices
 * Provides a quick overview of global market performance
 */
export async function getGlobalMarketIndices(
  period: string = '1D'
): Promise<ActionResult<BenchmarkPerformanceData[]>> {
  const globalSymbols = ['SPY', 'QQQ', 'VTI', 'EFA', 'VWO', 'OSEBX', 'FTSE']

  return getBenchmarkData({
    symbols: globalSymbols,
    period: period as any,
    includeMetrics: true,
  })
}

// Helper functions

function calculateStartDate(
  period: string,
  startDate?: string,
  endDate?: Date
): Date {
  const endDateTime = endDate || new Date()

  if (startDate) {
    return new Date(startDate)
  }

  switch (period) {
    case '1D':
      return new Date(endDateTime.getTime() - 24 * 60 * 60 * 1000)
    case '1W':
      return new Date(endDateTime.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '1M':
      return new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '3M':
      return new Date(endDateTime.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6M':
      return new Date(endDateTime.getTime() - 180 * 24 * 60 * 60 * 1000)
    case '1Y':
      return new Date(endDateTime.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'YTD':
      return new Date(endDateTime.getFullYear(), 0, 1)
    case '3Y':
      return new Date(endDateTime.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)
    case '5Y':
      return new Date(endDateTime.getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
    case 'ALL':
      return new Date('2000-01-01')
    default:
      return new Date(endDateTime.getTime() - 365 * 24 * 60 * 60 * 1000)
  }
}

function getRegionalSymbols(region: string): string[] {
  const symbolMaps = {
    US: ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VTV', 'VUG'],
    EUROPE: ['VGK', 'EFA', 'FEZ', 'IEUR', 'FTSE'],
    ASIA: ['VWO', 'EWJ', 'ASHR', 'EWY', 'EWT'],
    NORDIC: ['OSEBX', 'OBX', 'OSEAX', 'MSCI-NORDIC'],
    GLOBAL: ['VT', 'ACWI', 'URTH', 'IOO'],
  }

  return symbolMaps[region as keyof typeof symbolMaps] || symbolMaps.US
}

function createBenchmarkMetrics(
  data: BenchmarkData,
  currency?: string
): BenchmarkMetrics {
  return {
    symbol: data.benchmark_symbol,
    name: data.benchmark_name,
    type: data.benchmark_type,
    currency: currency || data.currency,
    currentPrice: data.close_price,
    dayChange: data.day_change || 0,
    dayChangePercent: data.day_change_percent || 0,
    return1W: data.return_1w,
    return1M: data.return_1m,
    return3M: data.return_3m,
    return6M: data.return_6m,
    return1Y: data.return_1y,
    returnYTD: data.return_ytd,
    return3Y: data.return_3y,
    return5Y: data.return_5y,
    volatility30D: data.volatility_30d,
    volatility1Y: data.volatility_1y,
    marketCap: data.market_cap,
    peRatio: data.pe_ratio,
    dividendYield: data.dividend_yield,
    volume: data.volume,
    lastUpdate: data.updated_at,
  }
}

function calculateReturns(prices: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
  }
  return returns
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
