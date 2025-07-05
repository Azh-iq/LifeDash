/**
 * Chart Data Server Actions - LifeDash
 * 
 * This module provides comprehensive server actions for fetching and processing
 * chart data from the LifeDash database. All actions include proper error handling,
 * validation, caching, and RLS compliance.
 * 
 * Features:
 * - Portfolio performance tracking with historical snapshots
 * - Asset allocation analysis and drift calculations
 * - Multi-portfolio performance comparisons
 * - Benchmark data and market comparisons
 * - Norwegian market data support
 * - Currency conversion handling
 * - Optimized caching strategies
 * 
 * @author LifeDash Team
 * @version 1.0.0
 */

// Performance Data Actions
export {
  getPortfolioPerformanceData,
  getCachedPortfolioPerformanceData,
  getMultiPortfolioPerformanceComparison,
  getPortfolioMetrics,
  getPortfolioValueHistory,
  type ChartDataPoint,
  type PortfolioPerformanceData,
  type ActionResult,
} from './performance-data'

// Allocation Data Actions
export {
  getPortfolioAllocation,
  getCachedPortfolioAllocation,
  comparePortfolioAllocations,
  getAllocationDriftAnalysis,
  type AllocationDataPoint,
  type AllocationHistory,
  type AllocationData,
} from './allocation-data'

// Comparison Data Actions
export {
  comparePortfolios,
  compareWithBenchmarks,
  getRiskReturnAnalysis,
  getCachedPortfolioComparison,
  type ComparisonDataPoint,
  type PortfolioComparisonMetrics,
  type ComparisonData,
  type RiskReturnPoint,
} from './comparison-data'

// Benchmark Data Actions
export {
  getBenchmarkData,
  getCachedBenchmarkData,
  compareBenchmarks,
  getMarketOverview,
  getNorwegianMarketData,
  getGlobalMarketIndices,
  type BenchmarkDataPoint,
  type BenchmarkMetrics,
  type BenchmarkPerformanceData,
  type MarketOverview,
} from './benchmark-data'

/**
 * Common Types and Interfaces
 */

export interface ChartConfiguration {
  theme: 'light' | 'dark'
  currency: string
  timeZone: string
  dateFormat: string
  numberFormat: {
    decimals: number
    thousands: string
    decimal: string
  }
  colors: {
    primary: string
    secondary: string
    positive: string
    negative: string
    neutral: string
  }
}

export interface TimeRange {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ITD' | 'ALL'
  startDate?: string
  endDate?: string
  customRange?: boolean
}

export interface ChartFilters {
  portfolios?: string[]
  assetClasses?: string[]
  sectors?: string[]
  currencies?: string[]
  minValue?: number
  maxValue?: number
  excludeZeroHoldings?: boolean
}

/**
 * Utility Functions for Chart Data Processing
 */

/**
 * Format currency values for display
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format percentage values for display
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  includeSign: boolean = true
): string {
  const sign = includeSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Calculate period return from start and end values
 */
export function calculatePeriodReturn(
  startValue: number,
  endValue: number,
  asPercentage: boolean = true
): number {
  if (startValue <= 0) return 0
  const returnValue = (endValue - startValue) / startValue
  return asPercentage ? returnValue * 100 : returnValue
}

/**
 * Determine chart color based on value and theme
 */
export function getChartColor(
  value: number,
  theme: 'light' | 'dark' = 'light',
  colorType: 'performance' | 'allocation' | 'neutral' = 'performance'
): string {
  const colors = {
    light: {
      performance: {
        positive: '#10B981', // Green
        negative: '#EF4444', // Red
        neutral: '#6B7280',  // Gray
      },
      allocation: {
        primary: '#3B82F6',   // Blue
        secondary: '#8B5CF6', // Purple
        tertiary: '#F59E0B',  // Amber
      },
      neutral: '#6B7280',
    },
    dark: {
      performance: {
        positive: '#34D399', // Light Green
        negative: '#F87171', // Light Red
        neutral: '#9CA3AF',  // Light Gray
      },
      allocation: {
        primary: '#60A5FA',   // Light Blue
        secondary: '#A78BFA', // Light Purple
        tertiary: '#FBBF24',  // Light Amber
      },
      neutral: '#9CA3AF',
    },
  }

  if (colorType === 'performance') {
    if (value > 0) return colors[theme].performance.positive
    if (value < 0) return colors[theme].performance.negative
    return colors[theme].performance.neutral
  }

  if (colorType === 'allocation') {
    return colors[theme].allocation.primary
  }

  return colors[theme].neutral
}

/**
 * Validate time range parameters
 */
export function validateTimeRange(timeRange: TimeRange): {
  isValid: boolean
  error?: string
  startDate: Date
  endDate: Date
} {
  const endDate = timeRange.endDate ? new Date(timeRange.endDate) : new Date()
  let startDate: Date

  try {
    if (timeRange.customRange && timeRange.startDate) {
      startDate = new Date(timeRange.startDate)
    } else {
      // Calculate start date based on period
      switch (timeRange.period) {
        case '1D':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
          break
        case '1W':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '1M':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3M':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6M':
          startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1Y':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        case 'YTD':
          startDate = new Date(endDate.getFullYear(), 0, 1)
          break
        case 'ITD':
        case 'ALL':
          startDate = new Date('2020-01-01') // Default inception date
          break
        default:
          throw new Error(`Invalid period: ${timeRange.period}`)
      }
    }

    // Validate date range
    if (startDate >= endDate) {
      return {
        isValid: false,
        error: 'Start date must be before end date',
        startDate,
        endDate,
      }
    }

    const maxRangeDays = 365 * 5 // 5 years maximum
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    
    if (daysDiff > maxRangeDays) {
      return {
        isValid: false,
        error: 'Date range cannot exceed 5 years',
        startDate,
        endDate,
      }
    }

    return {
      isValid: true,
      startDate,
      endDate,
    }

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid date range',
      startDate: new Date(),
      endDate: new Date(),
    }
  }
}

/**
 * Cache tags for chart data invalidation
 */
export const CHART_CACHE_TAGS = {
  PORTFOLIO_PERFORMANCE: 'portfolio-performance',
  PORTFOLIO_ALLOCATION: 'portfolio-allocation',
  PORTFOLIO_COMPARISON: 'portfolio-comparison',
  BENCHMARK_DATA: 'benchmark-data',
  MARKET_OVERVIEW: 'market-overview',
} as const

/**
 * Default chart configurations
 */
export const DEFAULT_CHART_CONFIG: ChartConfiguration = {
  theme: 'light',
  currency: 'USD',
  timeZone: 'UTC',
  dateFormat: 'MMM dd, yyyy',
  numberFormat: {
    decimals: 2,
    thousands: ',',
    decimal: '.',
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
  },
}

/**
 * Norwegian market specific configurations
 */
export const NORWEGIAN_MARKET_CONFIG: Partial<ChartConfiguration> = {
  currency: 'NOK',
  timeZone: 'Europe/Oslo',
  numberFormat: {
    decimals: 2,
    thousands: ' ',
    decimal: ',',
  },
}

/**
 * Error messages for chart actions
 */
export const CHART_ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required to access chart data',
  PORTFOLIO_NOT_FOUND: 'Portfolio not found or access denied',
  BENCHMARK_NOT_FOUND: 'Benchmark data not available',
  INSUFFICIENT_DATA: 'Insufficient data for the requested time period',
  INVALID_DATE_RANGE: 'Invalid date range specified',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for chart data requests',
  CACHE_ERROR: 'Error accessing cached chart data',
  CALCULATION_ERROR: 'Error calculating chart metrics',
} as const