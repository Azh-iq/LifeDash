'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { Database } from '@/lib/types/database.types'

// Types for performance data
type PortfolioSnapshot =
  Database['public']['Tables']['portfolio_snapshots_enhanced']['Row']
type PerformanceMetrics =
  Database['public']['Tables']['performance_metrics']['Row']

// Validation schemas
const portfolioPerformanceSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL'])
    .default('1M'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  currency: z.string().length(3).optional(),
})

const multiPortfolioComparisonSchema = z.object({
  portfolioIds: z.array(z.string().uuid()).min(1).max(10),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL'])
    .default('1M'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  normalizeToBase: z.boolean().default(true),
})

export interface ChartDataPoint {
  date: string
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  volume?: number
  metadata?: Record<string, any>
}

export interface PortfolioPerformanceData {
  portfolioId: string
  portfolioName: string
  currency: string
  data: ChartDataPoint[]
  summary: {
    totalValue: number
    totalCost: number
    totalReturn: number
    totalReturnPercent: number
    volatility?: number
    sharpeRatio?: number
    maxDrawdown?: number
    bestDay?: { date: string; return: number }
    worstDay?: { date: string; return: number }
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
  }
}

/**
 * Get portfolio performance data with historical snapshots and calculated metrics
 * Supports various time periods and granularities for chart visualization
 */
export async function getPortfolioPerformanceData(
  input: z.infer<typeof portfolioPerformanceSchema>
): Promise<ActionResult<PortfolioPerformanceData>> {
  try {
    const validatedInput = portfolioPerformanceSchema.parse(input)
    const { portfolioId, period, startDate, endDate, granularity, currency } =
      validatedInput

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

    // Verify portfolio ownership/access
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, name, currency, user_id, is_public')
      .eq('id', portfolioId)
      .single()

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: 'Portfolio not found',
      }
    }

    // Check access permissions
    if (portfolio.user_id !== user.id && !portfolio.is_public) {
      return {
        success: false,
        error: 'Access denied to this portfolio',
      }
    }

    // Calculate date range based on period
    const endDateTime = endDate ? new Date(endDate) : new Date()
    let startDateTime: Date

    switch (period) {
      case '1D':
        startDateTime = new Date(endDateTime.getTime() - 24 * 60 * 60 * 1000)
        break
      case '1W':
        startDateTime = new Date(
          endDateTime.getTime() - 7 * 24 * 60 * 60 * 1000
        )
        break
      case '1M':
        startDateTime = new Date(
          endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
        )
        break
      case '3M':
        startDateTime = new Date(
          endDateTime.getTime() - 90 * 24 * 60 * 60 * 1000
        )
        break
      case '6M':
        startDateTime = new Date(
          endDateTime.getTime() - 180 * 24 * 60 * 60 * 1000
        )
        break
      case '1Y':
        startDateTime = new Date(
          endDateTime.getTime() - 365 * 24 * 60 * 60 * 1000
        )
        break
      case 'YTD':
        startDateTime = new Date(endDateTime.getFullYear(), 0, 1)
        break
      case 'ITD':
        // Get inception date from first snapshot
        const { data: firstSnapshot } = await supabase
          .from('portfolio_snapshots_enhanced')
          .select('snapshot_date')
          .eq('portfolio_id', portfolioId)
          .order('snapshot_date', { ascending: true })
          .limit(1)
          .single()

        startDateTime = firstSnapshot
          ? new Date(firstSnapshot.snapshot_date)
          : new Date(endDateTime.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'ALL':
        startDateTime = new Date('2020-01-01') // Default far back date
        break
      default:
        startDateTime = startDate
          ? new Date(startDate)
          : new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Build query for portfolio snapshots with proper date filtering
    let query = supabase
      .from('portfolio_snapshots_enhanced')
      .select(
        `
        snapshot_date,
        snapshot_time,
        total_value,
        total_cost,
        cash_balance,
        day_change,
        day_change_percent,
        unrealized_pnl,
        unrealized_pnl_percent,
        volatility_30d,
        sharpe_ratio,
        max_drawdown_percent,
        currency
      `
      )
      .eq('portfolio_id', portfolioId)
      .gte('snapshot_date', startDateTime.toISOString().split('T')[0])
      .lte('snapshot_date', endDateTime.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    // Apply granularity filtering for performance
    if (granularity === 'weekly') {
      // For weekly data, we'll take one snapshot per week (e.g., last trading day of each week)
      query = query.or(
        "date_part('dow', snapshot_date) = 5,snapshot_date = (SELECT MAX(s2.snapshot_date) FROM portfolio_snapshots_enhanced s2 WHERE s2.portfolio_id = portfolio_snapshots_enhanced.portfolio_id AND date_trunc('week', s2.snapshot_date) = date_trunc('week', portfolio_snapshots_enhanced.snapshot_date))"
      )
    } else if (granularity === 'monthly') {
      // For monthly data, take last day of each month
      query = query.or(
        "snapshot_date = (SELECT MAX(s2.snapshot_date) FROM portfolio_snapshots_enhanced s2 WHERE s2.portfolio_id = portfolio_snapshots_enhanced.portfolio_id AND date_trunc('month', s2.snapshot_date) = date_trunc('month', portfolio_snapshots_enhanced.snapshot_date))"
      )
    }

    const { data: snapshots, error: snapshotsError } = await query

    if (snapshotsError) {
      console.error('Error fetching portfolio snapshots:', snapshotsError)
      return {
        success: false,
        error: 'Failed to fetch portfolio performance data',
      }
    }

    if (!snapshots || snapshots.length === 0) {
      return {
        success: false,
        error: 'No performance data available for this time period',
      }
    }

    // Transform snapshots into chart data points
    const chartData: ChartDataPoint[] = snapshots.map((snapshot, index) => {
      const previousSnapshot = index > 0 ? snapshots[index - 1] : null

      return {
        date: snapshot.snapshot_date,
        value: snapshot.total_value,
        previousValue: previousSnapshot?.total_value,
        change: snapshot.day_change,
        changePercent: snapshot.day_change_percent,
        metadata: {
          totalCost: snapshot.total_cost,
          cashBalance: snapshot.cash_balance,
          unrealizedPnl: snapshot.unrealized_pnl,
          unrealizedPnlPercent: snapshot.unrealized_pnl_percent,
          volatility: snapshot.volatility_30d,
          sharpeRatio: snapshot.sharpe_ratio,
          maxDrawdown: snapshot.max_drawdown_percent,
        },
      }
    })

    // Calculate summary statistics
    const latestSnapshot = snapshots[snapshots.length - 1]
    const firstSnapshot = snapshots[0]

    const totalReturn = latestSnapshot.total_value - firstSnapshot.total_value
    const totalReturnPercent =
      firstSnapshot.total_value > 0
        ? (totalReturn / firstSnapshot.total_value) * 100
        : 0

    // Find best and worst days
    const dailyReturns = snapshots
      .filter(s => s.day_change_percent !== null)
      .map(s => ({ date: s.snapshot_date, return: s.day_change_percent! }))
      .sort((a, b) => Math.abs(b.return) - Math.abs(a.return))

    const bestDay = dailyReturns.find(d => d.return > 0)
    const worstDay = dailyReturns.find(d => d.return < 0)

    const performanceData: PortfolioPerformanceData = {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      currency: currency || portfolio.currency || 'USD',
      data: chartData,
      summary: {
        totalValue: latestSnapshot.total_value,
        totalCost: latestSnapshot.total_cost,
        totalReturn,
        totalReturnPercent,
        volatility: latestSnapshot.volatility_30d,
        sharpeRatio: latestSnapshot.sharpe_ratio,
        maxDrawdown: latestSnapshot.max_drawdown_percent,
        bestDay,
        worstDay,
      },
    }

    return {
      success: true,
      data: performanceData,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: chartData.length,
      },
    }
  } catch (error) {
    console.error('Portfolio performance data error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while fetching performance data',
    }
  }
}

/**
 * Get cached portfolio performance data with automatic cache invalidation
 * Cache key includes portfolio ID, period, and date range for granular caching
 */
export const getCachedPortfolioPerformanceData = unstable_cache(
  async (input: z.infer<typeof portfolioPerformanceSchema>) => {
    const result = await getPortfolioPerformanceData(input)
    return {
      ...result,
      metadata: {
        ...result.metadata,
        cached: true,
      },
    }
  },
  ['portfolio-performance'],
  {
    revalidate: 300, // 5 minutes cache for real-time data
    tags: ['portfolio-performance'],
  }
)

/**
 * Compare multiple portfolios performance over the same time period
 * Normalizes all portfolios to a base value (100) for fair comparison
 */
export async function getMultiPortfolioPerformanceComparison(
  input: z.infer<typeof multiPortfolioComparisonSchema>
): Promise<ActionResult<PortfolioPerformanceData[]>> {
  try {
    const validatedInput = multiPortfolioComparisonSchema.parse(input)
    const { portfolioIds, period, startDate, endDate, normalizeToBase } =
      validatedInput

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

    // Fetch performance data for each portfolio
    const portfolioDataPromises = portfolioIds.map(portfolioId =>
      getPortfolioPerformanceData({
        portfolioId,
        period,
        startDate,
        endDate,
        granularity: 'daily',
      })
    )

    const portfolioResults = await Promise.all(portfolioDataPromises)

    // Check for any errors
    const failedPortfolios = portfolioResults.filter(result => !result.success)
    if (failedPortfolios.length > 0) {
      return {
        success: false,
        error: `Failed to fetch data for ${failedPortfolios.length} portfolio(s)`,
      }
    }

    const portfolioData = portfolioResults
      .filter(result => result.success && result.data)
      .map(result => result.data!)

    // Normalize portfolios to base 100 if requested
    if (normalizeToBase && portfolioData.length > 0) {
      portfolioData.forEach(portfolio => {
        const baseValue = portfolio.data[0]?.value || 1
        portfolio.data = portfolio.data.map(point => ({
          ...point,
          value: baseValue > 0 ? (point.value / baseValue) * 100 : 100,
          previousValue:
            point.previousValue && baseValue > 0
              ? (point.previousValue / baseValue) * 100
              : undefined,
        }))
      })
    }

    return {
      success: true,
      data: portfolioData,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: portfolioData.reduce((sum, p) => sum + p.data.length, 0),
      },
    }
  } catch (error) {
    console.error('Multi-portfolio comparison error:', error)

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
 * Get portfolio performance metrics for a specific time period
 * Returns calculated risk and return metrics suitable for performance analysis
 */
export async function getPortfolioMetrics(
  portfolioId: string,
  period: string = '1Y'
): Promise<ActionResult<PerformanceMetrics>> {
  try {
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

    // Fetch latest performance metrics for the portfolio
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('entity_type', 'PORTFOLIO')
      .eq('entity_id', portfolioId)
      .eq('period_type', period)
      .eq('user_id', user.id)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single()

    if (metricsError) {
      console.error('Error fetching performance metrics:', metricsError)
      return {
        success: false,
        error: 'Failed to fetch performance metrics',
      }
    }

    if (!metrics) {
      return {
        success: false,
        error: 'No performance metrics available for this period',
      }
    }

    return {
      success: true,
      data: metrics,
      metadata: {
        calculatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Portfolio metrics error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching portfolio metrics',
    }
  }
}

/**
 * Get portfolio value history with support for currency conversion
 * Optimized for large datasets with proper indexing and caching
 */
export async function getPortfolioValueHistory(
  portfolioId: string,
  options: {
    days?: number
    currency?: string
    includeProjections?: boolean
  } = {}
): Promise<ActionResult<ChartDataPoint[]>> {
  try {
    const { days = 365, currency, includeProjections = false } = options

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

    // Calculate start date
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Fetch value history with optimized query
    const { data: history, error: historyError } = await supabase
      .from('portfolio_snapshots_enhanced')
      .select(
        `
        snapshot_date,
        total_value,
        day_change,
        day_change_percent,
        currency
      `
      )
      .eq('portfolio_id', portfolioId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (historyError) {
      console.error('Error fetching portfolio value history:', historyError)
      return {
        success: false,
        error: 'Failed to fetch portfolio value history',
      }
    }

    if (!history || history.length === 0) {
      return {
        success: false,
        error: 'No value history available',
      }
    }

    // Transform to chart data points
    const chartData: ChartDataPoint[] = history.map(point => ({
      date: point.snapshot_date,
      value: point.total_value,
      change: point.day_change,
      changePercent: point.day_change_percent,
      metadata: {
        currency: point.currency,
      },
    }))

    // TODO: Add currency conversion logic here if needed
    // TODO: Add projections based on historical trends if includeProjections is true

    return {
      success: true,
      data: chartData,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: chartData.length,
        currency: currency || history[0]?.currency || 'USD',
      },
    }
  } catch (error) {
    console.error('Portfolio value history error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching value history',
    }
  }
}
