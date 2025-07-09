'use client'

import { useState, useMemo, useEffect } from 'react'
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
  LineChart,
  Line,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, BarChart3, Signal } from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export interface StockChartData {
  timestamp: string
  price: number
  volume?: number
  change?: number
  changePercent?: number
}

interface StockChartWidgetProps {
  symbol: string
  companyName: string
  data: StockChartData[]
  currentPrice: number
  priceChange: number
  priceChangePercent: number
  currency?: string
  loading?: boolean
  error?: string | null
  onTimeRangeChange?: (range: string) => void
  onRefresh?: () => void
  className?: string
}

const TIME_RANGES = [
  { value: '4h', label: '4t', description: 'Siste 4 timer' },
  { value: 'D', label: 'D', description: 'I dag' },
  { value: 'W', label: 'U', description: 'Denne uken' },
  { value: 'M', label: 'M', description: 'Denne måneden' },
  { value: '3M', label: '3M', description: 'Siste 3 måneder' },
  { value: 'YTD', label: 'ÅTD', description: 'År til dato' },
  { value: '1Y', label: '1Å', description: 'Siste år' },
] as const

const CHART_TYPES = [
  { value: 'area', label: 'Område', icon: BarChart3 },
  { value: 'line', label: 'Linje', icon: Signal },
] as const

export function StockChartWidget({
  symbol,
  companyName,
  data = [],
  currentPrice,
  priceChange,
  priceChangePercent,
  currency = 'NOK',
  loading = false,
  error = null,
  onTimeRangeChange,
  onRefresh,
  className,
}: StockChartWidgetProps) {
  const [selectedRange, setSelectedRange] = useState<string>('W')
  const [chartType, setChartType] = useState<'area' | 'line'>('area')
  const [hoveredData, setHoveredData] = useState<StockChartData | null>(null)
  const [showVolume, setShowVolume] = useState(false)

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    onTimeRangeChange?.(range)
  }

  const isPositive = priceChangePercent > 0
  const isNegative = priceChangePercent < 0
  
  const displayPrice = hoveredData?.price ?? currentPrice
  const displayChange = hoveredData?.change ?? priceChange
  const displayChangePercent = hoveredData?.changePercent ?? priceChangePercent

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      timestamp: item.timestamp,
      formattedTime: formatDate(item.timestamp, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      index,
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.formattedTime}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Pris: {formatCurrency(data.price, currency)}
          </p>
          {data.change && (
            <p
              className={cn(
                'text-sm font-medium',
                data.change > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              Endring: {formatPercentage(data.changePercent || 0)}
            </p>
          )}
          {showVolume && data.volume && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Volum: {data.volume.toLocaleString('nb-NO')}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const handleMouseMove = (state: any) => {
    if (state.isTooltipActive && state.activePayload) {
      setHoveredData(state.activePayload[0].payload)
    }
  }

  const handleMouseLeave = () => {
    setHoveredData(null)
  }

  const priceColor = isPositive ? 'text-green-600 dark:text-green-400' : 
                   isNegative ? 'text-red-600 dark:text-red-400' : 
                   'text-gray-500 dark:text-gray-400'

  const chartColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6366f1'

  return (
    <StockWidget
      title={`${symbol} - ${companyName}`}
      description={`Prisutvikling for ${companyName}`}
      icon={<BarChart3 className="h-5 w-5" />}
      size="large"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={cn('min-h-[500px]', className)}
      refreshLabel="Oppdater priser"
      actions={
        <div className="flex items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {CHART_TYPES.map(type => (
              <Button
                key={type.value}
                variant={chartType === type.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType(type.value)}
                className={cn(
                  'h-7 px-2 text-xs transition-all duration-200',
                  chartType === type.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                <type.icon className="h-3 w-3" />
              </Button>
            ))}
          </div>

          {/* Volume Toggle */}
          <Button
            variant={showVolume ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
            className={cn(
              'h-7 px-2 text-xs transition-all duration-200',
              showVolume
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            Volum
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Price Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayPrice}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              >
                {formatCurrency(displayPrice, currency)}
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

              <span className={cn('text-sm font-medium', priceColor)}>
                {displayChange > 0 ? '+' : ''}{formatCurrency(displayChange, currency)} 
                ({formatPercentage(displayChangePercent)})
              </span>

              {hoveredData && (
                <Badge variant="secondary" className="text-xs">
                  {hoveredData.formattedTime}
                </Badge>
              )}
            </motion.div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {TIME_RANGES.map(range => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleRangeChange(range.value)}
                className={cn(
                  'h-8 px-2 text-xs font-medium transition-all duration-200',
                  selectedRange === range.value
                    ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
                title={range.description}
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
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={chartColor}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={chartColor}
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
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={value =>
                    formatCurrency(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 1 })
                  }
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: chartColor,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />

                <ReferenceLine
                  y={currentPrice}
                  stroke={chartColor}
                  strokeDasharray="2 2"
                  strokeOpacity={0.7}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  vertical={false}
                />

                <XAxis
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={value =>
                    formatCurrency(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 1 })
                  }
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: chartColor,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />

                <ReferenceLine
                  y={currentPrice}
                  stroke={chartColor}
                  strokeDasharray="2 2"
                  strokeOpacity={0.7}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Chart Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Siste oppdatering: {formatDate(new Date(), { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500 opacity-70"></div>
              Realtidspriser
            </span>
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 opacity-70"></div>
              {selectedRange} visning
            </span>
          </div>
        </div>
      </div>
    </StockWidget>
  )
}