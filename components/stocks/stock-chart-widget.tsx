'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { Widget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StockChartData {
  timestamp: string
  value: number
  change: number
  changePercent: number
  volume?: number
}

interface StockChartWidgetProps {
  title: string
  data: StockChartData[]
  currentValue: number
  changePercent: number
  loading?: boolean
  error?: string | null
  onTimeRangeChange?: (range: string) => void
  className?: string
}

const STOCKS_TIME_RANGES = [
  { value: '4h', label: '4h', description: 'Siste 4 timer' },
  { value: 'D', label: 'D', description: 'I dag' },
  { value: 'W', label: 'W', description: 'Denne uken' },
  { value: 'M', label: 'M', description: 'Denne måneden' },
] as const

const STOCKS_THEME = {
  primary: '#6366f1',
  secondary: '#a855f7',
  light: '#f3f4ff',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  chartGradient: 'from-purple-500/20 to-indigo-500/5',
}

export function StockChartWidget({
  title,
  data = [],
  currentValue,
  changePercent,
  loading = false,
  error = null,
  onTimeRangeChange,
  className,
}: StockChartWidgetProps) {
  const [selectedRange, setSelectedRange] = useState<string>('W')
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    onTimeRangeChange?.(range)
  }

  const isPositive = changePercent > 0
  const isNegative = changePercent < 0
  const displayValue = hoveredValue ?? currentValue

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).toLocaleString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Verdi: {formatCurrency(data.value, 'NOK')}
          </p>
          <p
            className={cn(
              'text-sm font-medium',
              data.changePercent > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            Endring: {formatPercentage(data.changePercent)}
          </p>
        </div>
      )
    }
    return null
  }

  const handleMouseMove = (state: any) => {
    if (state.isTooltipActive && state.activePayload) {
      setHoveredValue(state.activePayload[0].value)
    }
  }

  const handleMouseLeave = () => {
    setHoveredValue(null)
  }

  return (
    <Widget
      title={title}
      size="large"
      category="stocks"
      loading={loading}
      error={error}
      className={cn('min-h-[400px]', className)}
    >
      <div className="space-y-6">
        {/* Value Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              >
                {formatCurrency(displayValue, 'NOK')}
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
              {!isPositive && !isNegative && (
                <Minus className="h-4 w-4 text-gray-400" />
              )}

              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-600 dark:text-green-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  !isPositive &&
                    !isNegative &&
                    'text-gray-500 dark:text-gray-400'
                )}
              >
                {formatPercentage(changePercent)}
              </span>
            </motion.div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {STOCKS_TIME_RANGES.map(range => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleRangeChange(range.value)}
                className={cn(
                  'h-8 px-3 text-xs font-medium transition-all duration-200',
                  selectedRange === range.value
                    ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="stocksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={STOCKS_THEME.primary}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={STOCKS_THEME.primary}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
                vertical={false}
              />

              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                className="text-gray-500 dark:text-gray-400"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-500 dark:text-gray-400"
                axisLine={false}
                tickLine={false}
                tickFormatter={value =>
                  formatCurrency(value, 'NOK', { compact: true })
                }
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke={STOCKS_THEME.primary}
                strokeWidth={2}
                fill="url(#stocksGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: STOCKS_THEME.primary,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />

              {/* Reference line for current value */}
              <ReferenceLine
                y={currentValue}
                stroke={STOCKS_THEME.secondary}
                strokeDasharray="2 2"
                strokeOpacity={0.7}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chart Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Siste oppdatering: {new Date().toLocaleTimeString('nb-NO')}
          </span>
          <span className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500 opacity-70"></div>
            Realtid
          </span>
        </div>
      </div>
    </Widget>
  )
}
