'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Types
interface PerformanceDataPoint {
  date: string
  timestamp: number
  [key: string]: number | string // Dynamic keys for different portfolios/benchmarks
}

interface PerformanceComparison {
  id: string
  name: string
  color: string
  data: PerformanceDataPoint[]
  currentValue?: number
  totalReturn?: number
  totalReturnPercent?: number
  isVisible?: boolean
  isBenchmark?: boolean
  type?: 'portfolio' | 'benchmark' | 'index'
}

interface PerformanceComparisonChartProps {
  comparisons: PerformanceComparison[]
  title?: string
  className?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showBenchmark?: boolean
  timeRange?: string
  isLoading?: boolean
  currency?: string
  baselineValue?: number // For normalization (e.g., 100 for percentage view)
}

// Norwegian currency formatter
const formatNOK = (value: number): string => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Percentage formatter
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

// Date formatter
const formatDate = (dateString: string, timeRange?: string): string => {
  const date = new Date(dateString)

  switch (timeRange) {
    case '1W':
    case '1M':
      return date.toLocaleDateString('nb-NO', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    case '3M':
    case '6M':
      return date.toLocaleDateString('nb-NO', {
        month: 'short',
        day: 'numeric',
      })
    case '1Y':
    case 'ALL':
      return date.toLocaleDateString('nb-NO', {
        year: 'numeric',
        month: 'short',
      })
    default:
      return date.toLocaleDateString('nb-NO')
  }
}

// Normalize data to percentage or indexed view (utility function - kept for potential future use)
// const normalizeData = (
//   data: PerformanceDataPoint[],
//   key: string,
//   baselineValue: number = 100
// ): PerformanceDataPoint[] => {
//   if (data.length === 0) return []

//   const firstValue = data[0][key] as number
//   if (firstValue === 0) return data

//   return data.map(point => ({
//     ...point,
//     [key]: ((point[key] as number) / firstValue) * baselineValue,
//   }))
// }

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  baselineValue,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  baselineValue?: number
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
        <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {new Date(label).toLocaleDateString('nb-NO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {entry.name}:
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {baselineValue === 100
                  ? formatPercentage(entry.value - 100)
                  : formatNOK(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// Performance stats component
const PerformanceStats = ({
  comparisons,
}: {
  comparisons: PerformanceComparison[]
}) => {
  const visibleComparisons = comparisons.filter(c => c.isVisible !== false)

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleComparisons.map(comparison => (
        <div
          key={comparison.id}
          className="rounded-lg border bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: comparison.color }}
            />
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {comparison.name}
            </h4>
            {comparison.isBenchmark && (
              <Badge variant="outline" className="text-xs">
                Benchmark
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {comparison.currentValue && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Verdi:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatNOK(comparison.currentValue)}
                </span>
              </div>
            )}
            {comparison.totalReturn && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Avkastning:
                </span>
                <span
                  className={cn(
                    'font-medium',
                    comparison.totalReturn >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {comparison.totalReturn >= 0 ? '+' : ''}
                  {formatNOK(comparison.totalReturn)}
                </span>
              </div>
            )}
            {comparison.totalReturnPercent !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Prosent:
                </span>
                <span
                  className={cn(
                    'font-medium',
                    comparison.totalReturnPercent >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {comparison.totalReturnPercent >= 0 ? '+' : ''}
                  {formatPercentage(comparison.totalReturnPercent)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Loading skeleton
const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
)

// Main component
export const PerformanceComparisonChart = ({
  comparisons,
  title = 'Portefølje Sammenligning',
  className,
  height = 400,
  showGrid = true,
  showLegend = true,
  timeRange = '1M',
  isLoading = false,
  baselineValue = 100,
}: PerformanceComparisonChartProps) => {
  // Merge all data points by date
  const chartData = useMemo(() => {
    if (!comparisons || comparisons.length === 0) return []

    const visibleComparisons = comparisons.filter(c => c.isVisible !== false)
    if (visibleComparisons.length === 0) return []

    // Get all unique dates
    const allDates = new Set<string>()
    visibleComparisons.forEach(comparison => {
      comparison.data.forEach(point => allDates.add(point.date))
    })

    // Sort dates
    const sortedDates = Array.from(allDates).sort()

    // Create merged data
    return sortedDates.map(date => {
      const dataPoint: PerformanceDataPoint = {
        date,
        timestamp: new Date(date).getTime(),
        formattedDate: formatDate(date, timeRange),
      }

      // Add data for each visible comparison
      visibleComparisons.forEach(comparison => {
        const point = comparison.data.find(p => p.date === date)
        if (point) {
          // Normalize data if baseline value is provided
          const value = point[comparison.id] as number
          dataPoint[comparison.id] =
            baselineValue === 100
              ? ((value / comparison.data[0][comparison.id]) as number) * 100
              : value
        }
      })

      return dataPoint
    })
  }, [comparisons, timeRange, baselineValue])

  // Get visible comparisons for rendering
  const visibleComparisons = useMemo(() => {
    return comparisons.filter(c => c.isVisible !== false)
  }, [comparisons])

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    )
  }

  if (!comparisons || comparisons.length === 0 || chartData.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-neutral-500 dark:text-neutral-400"
            style={{ height }}
          >
            <p>Ingen data tilgjengelig for sammenligning</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* Toggle normalized view */
              }}
              className="h-8 px-3 text-xs"
            >
              {baselineValue === 100 ? 'Prosent' : 'Verdi'}
            </Button>
            <Badge variant="outline" className="text-xs">
              {visibleComparisons.length} sammenligninger
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-neutral-200 dark:stroke-neutral-800"
              />
            )}
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              className="fill-neutral-600 dark:fill-neutral-400"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={
                baselineValue === 100
                  ? (value: number) => `${value.toFixed(0)}%`
                  : formatNOK
              }
              className="fill-neutral-600 dark:fill-neutral-400"
            />
            <Tooltip
              content={<CustomTooltip baselineValue={baselineValue} />}
            />
            {showLegend && <Legend />}

            {/* Baseline reference line for percentage view */}
            {baselineValue === 100 && (
              <ReferenceLine
                y={100}
                stroke="#6b7280"
                strokeDasharray="5 5"
                className="stroke-neutral-400 dark:stroke-neutral-500"
              />
            )}

            {/* Render lines for each comparison */}
            {visibleComparisons.map(comparison => (
              <Line
                key={comparison.id}
                type="monotone"
                dataKey={comparison.id}
                stroke={comparison.color}
                strokeWidth={comparison.isBenchmark ? 2 : 3}
                strokeDasharray={comparison.isBenchmark ? '5 5' : '0'}
                dot={false}
                activeDot={{ r: 6, fill: comparison.color }}
                name={comparison.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Performance statistics */}
        <PerformanceStats comparisons={visibleComparisons} />
      </CardContent>
    </Card>
  )
}

// Utility function to create benchmark comparison
export const createBenchmarkComparison = (
  name: string,
  data: PerformanceDataPoint[],
  color: string = '#6b7280'
): PerformanceComparison => ({
  id: `benchmark-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  color,
  data,
  isBenchmark: true,
  isVisible: true,
  type: 'benchmark',
})

// Utility function to create portfolio comparison
export const createPortfolioComparison = (
  id: string,
  name: string,
  data: PerformanceDataPoint[],
  color: string,
  metrics?: {
    currentValue?: number
    totalReturn?: number
    totalReturnPercent?: number
  }
): PerformanceComparison => ({
  id,
  name,
  color,
  data,
  currentValue: metrics?.currentValue,
  totalReturn: metrics?.totalReturn,
  totalReturnPercent: metrics?.totalReturnPercent,
  isBenchmark: false,
  isVisible: true,
  type: 'portfolio',
})

export default PerformanceComparisonChart
