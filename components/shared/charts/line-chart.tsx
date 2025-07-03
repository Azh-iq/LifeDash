'use client'

import React, { forwardRef } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const chartVariants = cva(
  'w-full rounded-lg border bg-white dark:bg-neutral-950',
  {
    variants: {
      variant: {
        default: 'border-neutral-200 dark:border-neutral-800',
        elevated: 'border-neutral-200 dark:border-neutral-800 shadow-sm',
        bordered: 'border-2 border-neutral-200 dark:border-neutral-800',
      },
      size: {
        sm: 'h-48',
        default: 'h-64',
        lg: 'h-80',
        xl: 'h-96',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface LineChartDataPoint {
  [key: string]: string | number
}

export interface LineChartProps extends VariantProps<typeof chartVariants> {
  data: LineChartDataPoint[]
  lines: Array<{
    dataKey: string
    name?: string
    color?: string
    strokeWidth?: number
    strokeDasharray?: string
    dot?: boolean
  }>
  xAxisDataKey: string
  title?: string
  description?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any, name: string) => [string, string]
  className?: string
  loading?: boolean
  emptyMessage?: string
}

// Custom Tooltip Component
const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltip,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  formatTooltip?: (value: any, name: string) => [string, string]
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {label}
        </p>
        {payload.map((entry, index) => {
          const [formattedValue, formattedName] = formatTooltip
            ? formatTooltip(entry.value, entry.name)
            : [entry.value, entry.name]
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-600 dark:text-neutral-400">
                {formattedName}:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

const LineChart = forwardRef<HTMLDivElement, LineChartProps>(
  (
    {
      data,
      lines,
      xAxisDataKey,
      title,
      description,
      showGrid = true,
      showLegend = true,
      showTooltip = true,
      xAxisLabel,
      yAxisLabel,
      formatXAxis,
      formatYAxis,
      formatTooltip,
      className,
      variant,
      size,
      loading = false,
      emptyMessage = 'No data available',
      ...props
    },
    ref
  ) => {
    // Loading state
    if (loading) {
      return (
        <div ref={ref} className={cn(chartVariants({ variant, size }), className)} {...props}>
          <div className="p-4">
            {title && (
              <div className="mb-4">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-2 animate-pulse" />
                {description && (
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 animate-pulse" />
                )}
              </div>
            )}
            <div className="h-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse flex items-center justify-center">
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading chart...</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Empty state
    if (!data || data.length === 0) {
      return (
        <div ref={ref} className={cn(chartVariants({ variant, size }), className)} {...props}>
          <div className="p-4">
            {title && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {description}
                  </p>
                )}
              </div>
            )}
            <div className="h-full flex flex-col items-center justify-center text-center">
              <svg
                className="h-12 w-12 text-neutral-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn(chartVariants({ variant, size }), className)} {...props}>
        <div className="p-4">
          {title && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
              )}
              <XAxis
                dataKey={xAxisDataKey}
                tickFormatter={formatXAxis}
                className="text-neutral-600 dark:text-neutral-400"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                className="text-neutral-600 dark:text-neutral-400"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              {showTooltip && (
                <Tooltip
                  content={<CustomTooltip formatTooltip={formatTooltip} />}
                  cursor={{
                    stroke: 'rgb(59 130 246)',
                    strokeWidth: 1,
                    strokeDasharray: '5 5',
                  }}
                />
              )}
              {showLegend && (
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    color: 'rgb(115 115 115)',
                  }}
                />
              )}
              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name || line.dataKey}
                  stroke={line.color || `hsl(${index * 137.5}, 70%, 50%)`}
                  strokeWidth={line.strokeWidth || 2}
                  strokeDasharray={line.strokeDasharray}
                  dot={line.dot !== false}
                  activeDot={{
                    r: 4,
                    fill: line.color || `hsl(${index * 137.5}, 70%, 50%)`,
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                  className="transition-all duration-300 hover:stroke-[3]"
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
)

LineChart.displayName = 'LineChart'

export { LineChart }