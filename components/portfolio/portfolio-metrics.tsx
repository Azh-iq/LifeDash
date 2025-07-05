'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { AnimatedCard, NumberCounter, CurrencyCounter, PercentageCounter } from '@/components/animated'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { formatCurrency, formatPercentage } from '@/components/charts'

interface PortfolioMetricsProps {
  portfolioId: string
}

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  format: 'currency' | 'percentage' | 'number'
  icon: React.ReactNode
  subtitle?: string
  isLoading?: boolean
  trend?: 'up' | 'down' | 'neutral'
  changeValue?: number
  changePercent?: number
}

function MetricCard({ 
  title, 
  value, 
  previousValue, 
  format, 
  icon, 
  subtitle, 
  isLoading,
  trend,
  changeValue,
  changePercent
}: MetricCardProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4" />
      case 'down':
        return <ArrowDownIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <AnimatedCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              {format === 'currency' && (
                <CurrencyCounter 
                  value={value} 
                  previousValue={previousValue}
                  className="text-xl font-bold text-gray-900"
                  currency="NOK"
                />
              )}
              {format === 'percentage' && (
                <PercentageCounter 
                  value={value} 
                  previousValue={previousValue}
                  className="text-xl font-bold text-gray-900"
                />
              )}
              {format === 'number' && (
                <NumberCounter 
                  value={value} 
                  previousValue={previousValue}
                  className="text-xl font-bold text-gray-900"
                />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {(changeValue !== undefined || changePercent !== undefined) && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend || 'neutral')}`}>
            {getTrendIcon(trend || 'neutral')}
            <div className="text-right">
              {changeValue !== undefined && (
                <p className="text-sm font-medium">
                  {changeValue > 0 ? '+' : ''}{formatCurrency(changeValue)}
                </p>
              )}
              {changePercent !== undefined && (
                <p className="text-xs">
                  {changePercent > 0 ? '+' : ''}{formatPercentage(changePercent)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}

export default function PortfolioMetrics({ portfolioId }: PortfolioMetricsProps) {
  const { portfolio, loading, error } = usePortfolioState(portfolioId)
  const { priceUpdates, isConnected } = useRealtimeUpdates(portfolioId)

  if (error) {
    return (
      <div className="mb-6">
        <AnimatedCard className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-600">
            <InformationCircleIcon className="h-5 w-5" />
            <p>Kunne ikke laste inn porteføljemålinger: {error}</p>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  // Calculate metrics
  const totalValue = portfolio?.total_value || 0
  const totalCost = portfolio?.total_cost || 0
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
  const holdingsCount = portfolio?.holdings_count || 0

  // Mock daily change (in real app, this would come from historical data)
  const dailyChange = totalValue * (Math.random() - 0.5) * 0.02 // ±1% daily change
  const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0

  // Mock weekly/monthly performance
  const weeklyChange = totalValue * (Math.random() - 0.5) * 0.05 // ±2.5% weekly change
  const monthlyChange = totalValue * (Math.random() - 0.5) * 0.1 // ±5% monthly change

  const metrics = [
    {
      title: 'Totalverdi',
      value: totalValue,
      format: 'currency' as const,
      icon: <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />,
      subtitle: 'Nåværende markedsverdi',
      trend: dailyChange >= 0 ? 'up' as const : 'down' as const,
      changeValue: dailyChange,
      changePercent: dailyChangePercent
    },
    {
      title: 'Total gevinst/tap',
      value: totalGainLoss,
      format: 'currency' as const,
      icon: totalGainLoss >= 0 
        ? <TrendingUpIcon className="h-5 w-5 text-green-600" />
        : <TrendingDownIcon className="h-5 w-5 text-red-600" />,
      subtitle: `${formatPercentage(totalGainLossPercent)} av kostbasis`,
      trend: totalGainLoss >= 0 ? 'up' as const : 'down' as const,
      changePercent: totalGainLossPercent
    },
    {
      title: 'Kostbasis',
      value: totalCost,
      format: 'currency' as const,
      icon: <ChartBarIcon className="h-5 w-5 text-blue-600" />,
      subtitle: 'Opprinnelig investering',
    },
    {
      title: 'Beholdninger',
      value: holdingsCount,
      format: 'number' as const,
      icon: <ChartBarIcon className="h-5 w-5 text-blue-600" />,
      subtitle: 'Antall aktive posisjoner',
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-6"
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <InformationCircleIcon className="h-4 w-4" />
            <p className="text-sm">Sanntidsoppdateringer er utilgjengelige</p>
          </div>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <MetricCard
              {...metric}
              isLoading={loading}
            />
          </motion.div>
        ))}
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Ytelsessammendrag
            </h3>
            <Badge variant="outline" className={isConnected ? 'text-green-600' : 'text-gray-500'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">I dag</p>
              <p className={`text-lg font-bold ${
                dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dailyChange >= 0 ? '+' : ''}{formatCurrency(dailyChange)}
              </p>
              <p className={`text-xs ${
                dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dailyChangePercent >= 0 ? '+' : ''}{formatPercentage(dailyChangePercent)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Denne uken</p>
              <p className={`text-lg font-bold ${
                weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyChange >= 0 ? '+' : ''}{formatCurrency(weeklyChange)}
              </p>
              <p className={`text-xs ${
                weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyChange >= 0 ? '+' : ''}{formatPercentage((weeklyChange / totalValue) * 100)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Denne måneden</p>
              <p className={`text-lg font-bold ${
                monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyChange >= 0 ? '+' : ''}{formatCurrency(monthlyChange)}
              </p>
              <p className={`text-xs ${
                monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyChange >= 0 ? '+' : ''}{formatPercentage((monthlyChange / totalValue) * 100)}
              </p>
            </div>
          </div>
        </AnimatedCard>
      </motion.div>
    </motion.div>
  )
}