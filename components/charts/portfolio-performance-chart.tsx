'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Types
interface PortfolioDataPoint {
  date: string
  value: number
  change: number
  changePercent: number
  timestamp: number
}

interface PortfolioPerformanceChartProps {
  data: PortfolioDataPoint[]
  title?: string
  className?: string
  height?: number
  showArea?: boolean
  showGrid?: boolean
  showLegend?: boolean
  timeRange?: string
  isLoading?: boolean
  currency?: string
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

// Date formatter for different time ranges
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

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const isPositive = data.change >= 0

    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {new Date(label).toLocaleDateString('nb-NO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Porteføljeverdi:
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatNOK(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Endring:
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositive ? '+' : ''}
              {formatNOK(data.change)} ({formatPercentage(data.changePercent)})
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
)

// Main component
export const PortfolioPerformanceChart = ({
  data,
  title = 'Portefølje Utvikling',
  className,
  height = 300,
  showArea = true,
  showGrid = true,
  showLegend = false,
  timeRange = '1M',
  isLoading = false,
  currency: _currency = 'NOK',
}: PortfolioPerformanceChartProps) => {
  // Calculate performance metrics
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null

    const latest = data[data.length - 1]
    const earliest = data[0]
    const totalChange = latest.value - earliest.value
    const totalChangePercent = (totalChange / earliest.value) * 100

    return {
      currentValue: latest.value,
      totalChange,
      totalChangePercent,
      isPositive: totalChange >= 0,
    }
  }, [data])

  // Format data for chart
  const chartData = useMemo(() => {
    if (!data) return []

    return data.map(point => ({
      ...point,
      formattedDate: formatDate(point.date, timeRange),
    }))
  }, [data, timeRange])

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
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
            <p>Ingen data tilgjengelig</p>
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
          {metrics && (
            <Badge
              variant={metrics.isPositive ? 'default' : 'destructive'}
              className={cn(
                'text-sm font-medium',
                metrics.isPositive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              )}
            >
              {metrics.isPositive ? '+' : ''}
              {formatPercentage(metrics.totalChangePercent)}
            </Badge>
          )}
        </div>
        {metrics && (
          <div className="mt-2 flex items-center gap-4">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatNOK(metrics.currentValue)}
            </div>
            <div
              className={cn(
                'text-sm font-medium',
                metrics.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {metrics.isPositive ? '+' : ''}
              {formatNOK(metrics.totalChange)}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {showArea ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="portfolioGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={formatNOK}
                className="fill-neutral-600 dark:fill-neutral-400"
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1e40af"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                name="Porteføljeverdi"
              />
            </AreaChart>
          ) : (
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
                tickFormatter={formatNOK}
                className="fill-neutral-600 dark:fill-neutral-400"
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1e40af"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#1e40af' }}
                name="Porteføljeverdi"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default PortfolioPerformanceChart
