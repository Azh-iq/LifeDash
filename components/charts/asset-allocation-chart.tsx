'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Types
interface AssetAllocation {
  name: string
  value: number
  percentage: number
  color: string
  category?: string
}

interface AssetAllocationChartProps {
  data: AssetAllocation[]
  title?: string
  className?: string
  height?: number
  showLegend?: boolean
  chartType?: 'pie' | 'donut' | 'bar'
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
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// Default color palette (blue investment theme)
const DEFAULT_COLORS = [
  '#1e40af', // Deep blue
  '#3b82f6', // Blue
  '#60a5fa', // Light blue
  '#93c5fd', // Lighter blue
  '#dbeafe', // Very light blue
  '#1d4ed8', // Darker blue
  '#2563eb', // Medium blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#a855f7', // Light purple
]

// Custom tooltip for pie/donut charts
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-950 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {data.name}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Verdi:
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatNOK(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Andel:
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatPercentage(data.percentage)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-950 dark:border-neutral-800">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {label}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Verdi:
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatNOK(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Andel:
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatPercentage(data.percentage)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-700 dark:text-neutral-300">
            {entry.value}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            ({formatPercentage(entry.payload.percentage)})
          </span>
        </div>
      ))}
    </div>
  )
}

// Loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
)

// Main component
export const AssetAllocationChart = ({
  data,
  title = "Aktivafordeling",
  className,
  height = 300,
  showLegend = true,
  chartType = 'donut',
  isLoading = false,
  currency = 'NOK',
}: AssetAllocationChartProps) => {
  // Add colors to data if not provided
  const chartData = useMemo(() => {
    if (!data) return []
    
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))
  }, [data])

  // Calculate total value
  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0)
  }, [chartData])

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={height} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
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

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.4, 120)}
              label={({ percentage }) => `${formatPercentage(percentage)}`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            {showLegend && <Legend content={<CustomLegend />} />}
          </PieChart>
        )
      
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={Math.min(height * 0.2, 60)}
              outerRadius={Math.min(height * 0.4, 120)}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            {showLegend && <Legend content={<CustomLegend />} />}
          </PieChart>
        )
      
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
            <XAxis 
              dataKey="name"
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
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="text-sm">
            {formatNOK(totalValue)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
        
        {/* Asset breakdown list */}
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.name}
                  </p>
                  {item.category && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.category}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatNOK(item.value)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatPercentage(item.percentage)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default AssetAllocationChart