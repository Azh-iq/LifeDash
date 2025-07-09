'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Compare,
  Percent,
  DollarSign,
  Users,
  Globe
} from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export interface PerformanceData {
  date: string
  portfolioValue: number
  stockValue: number
  benchmarkValue: number
  portfolioReturn: number
  stockReturn: number
  benchmarkReturn: number
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  beta: number
  alpha: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  bestDay: number
  worstDay: number
  daysInProfit: number
  daysInLoss: number
}

interface PerformanceWidgetProps {
  symbol: string
  companyName: string
  performanceData: PerformanceData[]
  metrics: PerformanceMetrics
  benchmarkName?: string
  currency?: string
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}

const PERFORMANCE_VIEWS = [
  { value: 'returns', label: 'Avkastning', icon: TrendingUp },
  { value: 'comparison', label: 'Sammenligning', icon: Compare },
  { value: 'metrics', label: 'Nøkkeltall', icon: Target },
  { value: 'risk', label: 'Risiko', icon: Activity },
] as const

const CHART_COLORS = {
  stock: '#6366f1',
  portfolio: '#10b981',
  benchmark: '#f59e0b',
  profit: '#10b981',
  loss: '#ef4444',
  neutral: '#6b7280',
} as const

function PerformanceChart({ 
  data, 
  type, 
  currency = 'NOK' 
}: { 
  data: PerformanceData[]
  type: 'returns' | 'comparison'
  currency?: string
}) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {type === 'returns' ? formatPercentage(entry.value) : formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (type === 'returns') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="stockReturnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.stock} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.stock} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="portfolioReturnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.portfolio} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.portfolio} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="date" 
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
            tickFormatter={value => formatPercentage(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          <Area
            type="monotone"
            dataKey="stockReturn"
            stroke={CHART_COLORS.stock}
            strokeWidth={2}
            fill="url(#stockReturnGradient)"
            name="Aksje"
          />
          <Area
            type="monotone"
            dataKey="portfolioReturn"
            stroke={CHART_COLORS.portfolio}
            strokeWidth={2}
            fill="url(#portfolioReturnGradient)"
            name="Portefølje"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="date" 
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
          tickFormatter={value => formatCurrency(value, currency, { minimumFractionDigits: 0 })}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="stockValue"
          stroke={CHART_COLORS.stock}
          strokeWidth={2}
          dot={false}
          name="Aksje"
        />
        <Line
          type="monotone"
          dataKey="portfolioValue"
          stroke={CHART_COLORS.portfolio}
          strokeWidth={2}
          dot={false}
          name="Portefølje"
        />
        <Line
          type="monotone"
          dataKey="benchmarkValue"
          stroke={CHART_COLORS.benchmark}
          strokeWidth={2}
          dot={false}
          name="Benchmark"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function MetricsGrid({ metrics, currency = 'NOK' }: { metrics: PerformanceMetrics, currency?: string }) {
  const metricCards = [
    {
      title: 'Total avkastning',
      value: formatPercentage(metrics.totalReturnPercent),
      change: metrics.totalReturnPercent,
      icon: <TrendingUp className="h-4 w-4" />,
      color: metrics.totalReturnPercent > 0 ? 'green' : 'red',
      tooltip: 'Total avkastning siden oppstart',
    },
    {
      title: 'Annualisert avkastning',
      value: formatPercentage(metrics.annualizedReturn),
      change: metrics.annualizedReturn,
      icon: <Calendar className="h-4 w-4" />,
      color: metrics.annualizedReturn > 0 ? 'green' : 'red',
      tooltip: 'Årlig gjennomsnittlig avkastning',
    },
    {
      title: 'Volatilitet',
      value: formatPercentage(metrics.volatility),
      icon: <Activity className="h-4 w-4" />,
      color: 'orange',
      tooltip: 'Standardavvik av avkastning (risiko)',
    },
    {
      title: 'Sharpe Ratio',
      value: metrics.sharpeRatio.toFixed(2),
      icon: <Award className="h-4 w-4" />,
      color: metrics.sharpeRatio > 1 ? 'green' : metrics.sharpeRatio > 0.5 ? 'orange' : 'red',
      tooltip: 'Risikojustert avkastning',
    },
    {
      title: 'Max Drawdown',
      value: formatPercentage(metrics.maxDrawdown),
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'red',
      tooltip: 'Største fall fra topp til bunn',
    },
    {
      title: 'Beta',
      value: metrics.beta.toFixed(2),
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'blue',
      tooltip: 'Sensitivitet i forhold til markedet',
    },
    {
      title: 'Alpha',
      value: formatPercentage(metrics.alpha),
      icon: <Target className="h-4 w-4" />,
      color: metrics.alpha > 0 ? 'green' : 'red',
      tooltip: 'Meravkastning utover benchmark',
    },
    {
      title: 'Vinnrate',
      value: formatPercentage(metrics.winRate),
      icon: <Percent className="h-4 w-4" />,
      color: metrics.winRate > 50 ? 'green' : 'red',
      tooltip: 'Andel dager med positiv avkastning',
    },
  ]

  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </CardTitle>
              <div className={cn('rounded-lg p-2', colors[metric.color as keyof typeof colors])}>
                {metric.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metric.value}
            </div>
            {metric.change !== undefined && (
              <div className="mt-1 flex items-center gap-1 text-sm">
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : metric.change < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span className={cn(
                  'font-medium',
                  metric.change > 0 ? 'text-green-600 dark:text-green-400' : 
                  metric.change < 0 ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-500 dark:text-gray-400'
                )}>
                  {metric.change > 0 ? 'Positiv' : metric.change < 0 ? 'Negativ' : 'Nøytral'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RiskAnalysis({ metrics, currency = 'NOK' }: { metrics: PerformanceMetrics, currency?: string }) {
  const riskMetrics = [
    {
      title: 'Beste dag',
      value: formatPercentage(metrics.bestDay),
      color: 'green',
      description: 'Høyeste daglige avkastning',
    },
    {
      title: 'Verste dag',
      value: formatPercentage(metrics.worstDay),
      color: 'red',
      description: 'Laveste daglige avkastning',
    },
    {
      title: 'Gjennomsnittlig gevinst',
      value: formatPercentage(metrics.averageWin),
      color: 'green',
      description: 'Gjennomsnittlig gevinst på vinnerdager',
    },
    {
      title: 'Gjennomsnittlig tap',
      value: formatPercentage(metrics.averageLoss),
      color: 'red',
      description: 'Gjennomsnittlig tap på tapsdager',
    },
  ]

  const profitLossData = [
    { name: 'Dager i gevinst', value: metrics.daysInProfit, color: CHART_COLORS.profit },
    { name: 'Dager i tap', value: metrics.daysInLoss, color: CHART_COLORS.loss },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {riskMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                'text-2xl font-bold',
                metric.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {metric.value}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profit/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Gevinst/Tap fordeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profitLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {profitLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} dager`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risikoindikatorer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Profit Factor</span>
                <span className="font-medium">{metrics.profitFactor.toFixed(2)}</span>
              </div>
              <Progress 
                value={Math.min(metrics.profitFactor * 50, 100)} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.profitFactor > 1 ? 'Lønnsom strategi' : 'Ulønnsom strategi'}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Vinnrate</span>
                <span className="font-medium">{formatPercentage(metrics.winRate)}</span>
              </div>
              <Progress 
                value={metrics.winRate} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.winRate > 50 ? 'Over 50% vinnrate' : 'Under 50% vinnrate'}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Sharpe Ratio</span>
                <span className="font-medium">{metrics.sharpeRatio.toFixed(2)}</span>
              </div>
              <Progress 
                value={Math.min(Math.max(metrics.sharpeRatio * 25, 0), 100)} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.sharpeRatio > 1 ? 'Utmerket' : 
                 metrics.sharpeRatio > 0.5 ? 'Bra' : 'Dårlig'} risikojustert avkastning
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function PerformanceWidget({
  symbol,
  companyName,
  performanceData = [],
  metrics,
  benchmarkName = 'OSE Benchmark Index',
  currency = 'NOK',
  loading = false,
  error = null,
  onRefresh,
  className,
}: PerformanceWidgetProps) {
  const [selectedView, setSelectedView] = useState<'returns' | 'comparison' | 'metrics' | 'risk'>('returns')

  const chartData = useMemo(() => {
    return performanceData.map(item => ({
      ...item,
      date: formatDate(item.date, { month: 'short', day: 'numeric' }),
    }))
  }, [performanceData])

  const hasData = performanceData.length > 0 && metrics

  return (
    <StockWidget
      title={`Ytelsesanalyse - ${symbol}`}
      description={`Detaljert ytelsesanalyse for ${companyName}`}
      icon={<BarChart3 className="h-5 w-5" />}
      size="large"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={cn('min-h-[700px]', className)}
      refreshLabel="Oppdater ytelsesdata"
      actions={
        hasData && (
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {PERFORMANCE_VIEWS.map(view => (
              <Button
                key={view.value}
                variant={selectedView === view.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView(view.value)}
                className={cn(
                  'h-7 px-3 text-xs font-medium transition-all duration-200',
                  selectedView === view.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                <view.icon className="h-3 w-3 mr-1" />
                {view.label}
              </Button>
            ))}
          </div>
        )
      }
    >
      <div className="space-y-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Ingen ytelsesdata tilgjengelig
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Ytelsesanalyse krever historiske data
            </p>
          </div>
        ) : (
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedView === 'returns' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Kumulativ avkastning
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span>Aksje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Portefølje</span>
                    </div>
                  </div>
                </div>
                <PerformanceChart data={chartData} type="returns" currency={currency} />
              </div>
            )}
            
            {selectedView === 'comparison' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Verdiutvikling
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span>Aksje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Portefølje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                      <span>{benchmarkName}</span>
                    </div>
                  </div>
                </div>
                <PerformanceChart data={chartData} type="comparison" currency={currency} />
              </div>
            )}
            
            {selectedView === 'metrics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Ytelsesnøkkeltall
                </h3>
                <MetricsGrid metrics={metrics} currency={currency} />
              </div>
            )}
            
            {selectedView === 'risk' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Risikoanalyse
                </h3>
                <RiskAnalysis metrics={metrics} currency={currency} />
              </div>
            )}
          </motion.div>
        )}

        {/* Performance Summary */}
        {hasData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Ytelsessammendrag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPercentage(metrics.totalReturnPercent)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total avkastning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPercentage(metrics.annualizedReturn)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Annualisert avkastning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metrics.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sharpe Ratio
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StockWidget>
  )
}