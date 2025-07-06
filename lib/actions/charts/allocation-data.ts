'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
import { Database } from '@/lib/types/database.types'

// Types for allocation data
type AssetAllocationHistory =
  Database['public']['Tables']['asset_allocation_history']['Row']
type AssetClass = Database['public']['Enums']['asset_class']

// Validation schemas
const allocationDataSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),
  period: z
    .enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL'])
    .default('1M'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z
    .enum(['asset_class', 'sector', 'industry', 'geographic_region'])
    .default('asset_class'),
  includeTargets: z.boolean().default(true),
})

const portfolioAllocationComparisonSchema = z.object({
  portfolioIds: z.array(z.string().uuid()).min(1).max(5),
  groupBy: z
    .enum(['asset_class', 'sector', 'industry', 'geographic_region'])
    .default('asset_class'),
  date: z.string().datetime().optional(),
})

export interface AllocationDataPoint {
  category: string
  value: number
  percentage: number
  targetPercentage?: number
  deviation?: number
  color?: string
  subAllocations?: AllocationDataPoint[]
  metadata?: {
    marketValue: number
    costBasis: number
    unrealizedPnl: number
    unrealizedPnlPercent: number
    holdingsCount: number
    largestHoldingPercent?: number
  }
}

export interface AllocationHistory {
  date: string
  allocations: AllocationDataPoint[]
}

export interface AllocationData {
  portfolioId: string
  portfolioName: string
  currency: string
  asOfDate: string
  totalValue: number
  allocations: AllocationDataPoint[]
  history?: AllocationHistory[]
  targets?: AllocationDataPoint[]
  summary: {
    diversificationScore: number
    concentrationRisk: number
    allocationDrift: number
    rebalanceRecommended: boolean
  }
}

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    cached?: boolean
    calculatedAt?: string
    groupBy?: string
  }
}

/**
 * Get current portfolio allocation breakdown with historical data
 * Supports grouping by asset class, sector, industry, or geographic region
 */
export async function getPortfolioAllocation(
  input: z.infer<typeof allocationDataSchema>
): Promise<ActionResult<AllocationData>> {
  try {
    const validatedInput = allocationDataSchema.parse(input)
    const { portfolioId, period, startDate, endDate, groupBy, includeTargets } =
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

    // Get the latest allocation data
    const { data: latestAllocations, error: allocationError } = await supabase
      .from('asset_allocation_history')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('allocation_date', { ascending: false })
      .limit(100) // Get recent allocations for the latest date

    if (allocationError) {
      console.error('Error fetching allocation data:', allocationError)
      return {
        success: false,
        error: 'Failed to fetch allocation data',
      }
    }

    if (!latestAllocations || latestAllocations.length === 0) {
      return {
        success: false,
        error: 'No allocation data available',
      }
    }

    // Group allocations by the latest date and requested groupBy field
    const latestDate = latestAllocations[0].allocation_date
    const currentAllocations = latestAllocations.filter(
      allocation => allocation.allocation_date === latestDate
    )

    // Transform and group allocations based on groupBy parameter
    const allocationMap = new Map<
      string,
      {
        marketValue: number
        costBasis: number
        percentage: number
        targetPercentage?: number
        holdingsCount: number
        unrealizedPnl: number
        unrealizedPnlPercent: number
        largestHoldingPercent?: number
      }
    >()

    let totalValue = 0

    currentAllocations.forEach(allocation => {
      const key = getGroupByKey(allocation, groupBy)
      const existing = allocationMap.get(key) || {
        marketValue: 0,
        costBasis: 0,
        percentage: 0,
        holdingsCount: 0,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
      }

      existing.marketValue += allocation.market_value
      existing.costBasis += allocation.cost_basis
      existing.percentage += allocation.allocation_percent
      existing.holdingsCount += allocation.number_of_holdings || 0
      existing.unrealizedPnl += allocation.unrealized_pnl || 0
      existing.targetPercentage = allocation.target_percent || undefined
      existing.largestHoldingPercent = Math.max(
        existing.largestHoldingPercent || 0,
        allocation.largest_holding_percent || 0
      )

      allocationMap.set(key, existing)
      totalValue += allocation.market_value
    })

    // Recalculate percentages based on total portfolio value
    const allocations: AllocationDataPoint[] = Array.from(
      allocationMap.entries()
    )
      .map(([category, data]) => {
        const percentage =
          totalValue > 0 ? (data.marketValue / totalValue) * 100 : 0
        const unrealizedPnlPercent =
          data.costBasis > 0 ? (data.unrealizedPnl / data.costBasis) * 100 : 0
        const deviation = data.targetPercentage
          ? percentage - data.targetPercentage
          : undefined

        return {
          category,
          value: data.marketValue,
          percentage,
          targetPercentage: data.targetPercentage,
          deviation,
          color: getColorForCategory(category, groupBy),
          metadata: {
            marketValue: data.marketValue,
            costBasis: data.costBasis,
            unrealizedPnl: data.unrealizedPnl,
            unrealizedPnlPercent,
            holdingsCount: data.holdingsCount,
            largestHoldingPercent: data.largestHoldingPercent,
          },
        }
      })
      .sort((a, b) => b.percentage - a.percentage)

    // Get target allocations if requested
    let targets: AllocationDataPoint[] | undefined
    if (includeTargets) {
      const { data: targetAllocations } = await supabase
        .from('portfolio_allocations')
        .select(
          'asset_class, target_percentage, min_percentage, max_percentage'
        )
        .eq('portfolio_id', portfolioId)

      if (targetAllocations && targetAllocations.length > 0) {
        targets = targetAllocations.map(target => ({
          category: target.asset_class,
          value: 0,
          percentage: target.target_percentage,
          targetPercentage: target.target_percentage,
          color: getColorForCategory(target.asset_class, 'asset_class'),
          metadata: {
            marketValue: 0,
            costBasis: 0,
            unrealizedPnl: 0,
            unrealizedPnlPercent: 0,
            holdingsCount: 0,
            minPercentage: target.min_percentage,
            maxPercentage: target.max_percentage,
          },
        }))
      }
    }

    // Calculate allocation history if period is specified
    let history: AllocationHistory[] | undefined
    if (period !== '1D') {
      const endDateTime = endDate ? new Date(endDate) : new Date()
      const startDateTime = calculateStartDate(period, startDate, endDateTime)

      const { data: historicalAllocations } = await supabase
        .from('asset_allocation_history')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .gte('allocation_date', startDateTime.toISOString().split('T')[0])
        .lte('allocation_date', endDateTime.toISOString().split('T')[0])
        .order('allocation_date', { ascending: true })

      if (historicalAllocations && historicalAllocations.length > 0) {
        history = processAllocationHistory(historicalAllocations, groupBy)
      }
    }

    // Calculate summary metrics
    const summary = calculateAllocationSummary(allocations, targets)

    const allocationData: AllocationData = {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      currency: portfolio.currency || 'USD',
      asOfDate: latestDate,
      totalValue,
      allocations,
      history,
      targets,
      summary,
    }

    return {
      success: true,
      data: allocationData,
      metadata: {
        calculatedAt: new Date().toISOString(),
        groupBy,
      },
    }
  } catch (error) {
    console.error('Portfolio allocation error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while fetching allocation data',
    }
  }
}

/**
 * Get cached portfolio allocation data with automatic cache invalidation
 */
export const getCachedPortfolioAllocation = unstable_cache(
  async (input: z.infer<typeof allocationDataSchema>) => {
    const result = await getPortfolioAllocation(input)
    return {
      ...result,
      metadata: {
        ...result.metadata,
        cached: true,
      },
    }
  },
  ['portfolio-allocation'],
  {
    revalidate: 600, // 10 minutes cache for allocation data
    tags: ['portfolio-allocation'],
  }
)

/**
 * Compare allocation across multiple portfolios
 */
export async function comparePortfolioAllocations(
  input: z.infer<typeof portfolioAllocationComparisonSchema>
): Promise<ActionResult<AllocationData[]>> {
  try {
    const validatedInput = portfolioAllocationComparisonSchema.parse(input)
    const { portfolioIds, groupBy, date } = validatedInput

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

    // Fetch allocation data for each portfolio
    const allocationPromises = portfolioIds.map(portfolioId =>
      getPortfolioAllocation({
        portfolioId,
        period: '1D',
        groupBy,
        includeTargets: false,
      })
    )

    const allocationResults = await Promise.all(allocationPromises)

    // Check for any errors
    const failedPortfolios = allocationResults.filter(result => !result.success)
    if (failedPortfolios.length > 0) {
      return {
        success: false,
        error: `Failed to fetch allocation data for ${failedPortfolios.length} portfolio(s)`,
      }
    }

    const allocationData = allocationResults
      .filter(result => result.success && result.data)
      .map(result => result.data!)

    return {
      success: true,
      data: allocationData,
      metadata: {
        calculatedAt: new Date().toISOString(),
        groupBy,
      },
    }
  } catch (error) {
    console.error('Portfolio allocation comparison error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error:
        'An unexpected error occurred while comparing portfolio allocations',
    }
  }
}

/**
 * Get allocation drift analysis for rebalancing recommendations
 */
export async function getAllocationDriftAnalysis(portfolioId: string): Promise<
  ActionResult<{
    currentAllocations: AllocationDataPoint[]
    targetAllocations: AllocationDataPoint[]
    driftAnalysis: {
      category: string
      currentPercent: number
      targetPercent: number
      drift: number
      driftPercent: number
      action: 'buy' | 'sell' | 'hold'
      recommendedAmount: number
    }[]
    rebalanceRequired: boolean
    totalDrift: number
  }>
> {
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

    // Get current allocation
    const currentResult = await getPortfolioAllocation({
      portfolioId,
      period: '1D',
      groupBy: 'asset_class',
      includeTargets: true,
    })

    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: currentResult.error || 'Failed to get current allocation',
      }
    }

    const {
      allocations: currentAllocations,
      targets: targetAllocations,
      totalValue,
    } = currentResult.data

    if (!targetAllocations || targetAllocations.length === 0) {
      return {
        success: false,
        error: 'No target allocations defined for this portfolio',
      }
    }

    // Calculate drift analysis
    const driftAnalysis = targetAllocations.map(target => {
      const current = currentAllocations.find(
        alloc => alloc.category === target.category
      )
      const currentPercent = current?.percentage || 0
      const targetPercent = target.percentage
      const drift = currentPercent - targetPercent
      const driftPercent = targetPercent > 0 ? (drift / targetPercent) * 100 : 0

      let action: 'buy' | 'sell' | 'hold' = 'hold'
      let recommendedAmount = 0

      // Determine action based on drift (using 5% threshold)
      if (Math.abs(driftPercent) > 5) {
        if (drift > 0) {
          action = 'sell'
          recommendedAmount = (drift / 100) * totalValue
        } else {
          action = 'buy'
          recommendedAmount = Math.abs(drift / 100) * totalValue
        }
      }

      return {
        category: target.category,
        currentPercent,
        targetPercent,
        drift,
        driftPercent,
        action,
        recommendedAmount,
      }
    })

    const totalDrift = driftAnalysis.reduce(
      (sum, item) => sum + Math.abs(item.drift),
      0
    )
    const rebalanceRequired = totalDrift > 10 // Rebalance if total drift > 10%

    return {
      success: true,
      data: {
        currentAllocations,
        targetAllocations,
        driftAnalysis,
        rebalanceRequired,
        totalDrift,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Allocation drift analysis error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while analyzing allocation drift',
    }
  }
}

// Helper functions

function getGroupByKey(
  allocation: AssetAllocationHistory,
  groupBy: string
): string {
  switch (groupBy) {
    case 'asset_class':
      return allocation.asset_class
    case 'sector':
      return allocation.sector || 'Unknown'
    case 'industry':
      return allocation.industry || 'Unknown'
    case 'geographic_region':
      return allocation.geographic_region || 'Unknown'
    default:
      return allocation.asset_class
  }
}

function getColorForCategory(category: string, groupBy: string): string {
  const colorMaps = {
    asset_class: {
      STOCK: '#3B82F6',
      ETF: '#10B981',
      BOND: '#F59E0B',
      CASH: '#6B7280',
      CRYPTOCURRENCY: '#8B5CF6',
      REAL_ESTATE: '#EF4444',
      COMMODITY: '#F97316',
      ALTERNATIVE: '#EC4899',
    },
    sector: {
      Technology: '#3B82F6',
      Healthcare: '#10B981',
      Financial: '#F59E0B',
      Consumer: '#EF4444',
      Industrial: '#8B5CF6',
      Energy: '#F97316',
      Unknown: '#6B7280',
    },
  }

  return colorMaps[groupBy as keyof typeof colorMaps]?.[category] || '#6B7280'
}

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
    default:
      return new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

function processAllocationHistory(
  historicalAllocations: AssetAllocationHistory[],
  groupBy: string
): AllocationHistory[] {
  const historyMap = new Map<string, Map<string, number>>()

  // Group by date and category
  historicalAllocations.forEach(allocation => {
    const date = allocation.allocation_date
    const category = getGroupByKey(allocation, groupBy)

    if (!historyMap.has(date)) {
      historyMap.set(date, new Map())
    }

    const dateMap = historyMap.get(date)!
    const existing = dateMap.get(category) || 0
    dateMap.set(category, existing + allocation.allocation_percent)
  })

  // Convert to array format
  return Array.from(historyMap.entries())
    .map(([date, allocationsMap]) => ({
      date,
      allocations: Array.from(allocationsMap.entries()).map(
        ([category, percentage]) => ({
          category,
          value: 0, // We don't have market value in history, only percentages
          percentage,
          color: getColorForCategory(category, groupBy),
        })
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateAllocationSummary(
  allocations: AllocationDataPoint[],
  targets?: AllocationDataPoint[]
): AllocationData['summary'] {
  // Calculate diversification score (inverse of concentration)
  const concentrationRisk = Math.max(...allocations.map(a => a.percentage))
  const diversificationScore = Math.max(0, 100 - concentrationRisk)

  // Calculate allocation drift if targets exist
  let allocationDrift = 0
  let rebalanceRecommended = false

  if (targets && targets.length > 0) {
    allocationDrift = allocations.reduce((sum, allocation) => {
      const target = targets.find(t => t.category === allocation.category)
      return sum + Math.abs(allocation.percentage - (target?.percentage || 0))
    }, 0)

    rebalanceRecommended = allocationDrift > 10 // Recommend rebalance if drift > 10%
  }

  return {
    diversificationScore,
    concentrationRisk,
    allocationDrift,
    rebalanceRecommended,
  }
}
