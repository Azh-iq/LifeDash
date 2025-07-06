'use client'

import { motion } from 'framer-motion'
import { memo, useCallback, useMemo, Suspense } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  AnimatedCard,
  NumberCounter,
  CurrencyCounter,
  PercentageCounter,
} from '@/components/animated'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PortfolioMetricsSkeleton } from '@/components/ui/portfolio-skeletons'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { formatCurrency, formatPercentage } from '@/components/charts'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import {
  MobileResponsiveWrapper,
  ResponsiveGrid,
  AdaptiveComponent,
} from '@/components/mobile/mobile-responsive-wrapper'
import { MobileMetricCards } from '@/components/mobile'
import { PortfolioCacheManager, CacheKeys } from '@/lib/cache/portfolio-cache'

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

const MetricCard = memo(function MetricCard({
  title,
  value,
  previousValue,
  format,
  icon,
  subtitle,
  isLoading,
  trend,
  changeValue,
  changePercent,
}: MetricCardProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const { isMobile } = useResponsiveLayout()

  const getTrendColor = useCallback((trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }, [])

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4" />
      case 'down':
        return <ArrowDownIcon className="h-4 w-4" />
      default:
        return null
    }
  }, [])

  // Early return AFTER all hooks
  if (isLoading) {
    return (
      <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard
      className={`${isMobile ? 'p-4' : 'p-6'} touch-manipulation transition-shadow hover:shadow-lg`}
    >
      <div
        className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}
      >
        <div
          className={`flex items-center ${isMobile ? 'w-full justify-between' : 'space-x-3'}`}
        >
          <div
            className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-blue-50`}
          >
            {icon}
          </div>
          <div className={isMobile ? 'flex-1 text-center' : ''}>
            <p
              className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}
            >
              {title}
            </p>
            <div className="flex items-center space-x-2">
              {format === 'currency' && (
                <CurrencyCounter
                  value={value}
                  previousValue={previousValue}
                  className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}
                  currency="NOK"
                />
              )}
              {format === 'percentage' && (
                <PercentageCounter
                  value={value}
                  previousValue={previousValue}
                  className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}
                />
              )}
              {format === 'number' && (
                <NumberCounter
                  value={value}
                  previousValue={previousValue}
                  className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}
                />
              )}
            </div>
            {subtitle && (
              <p
                className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1 text-gray-500`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(changeValue !== undefined || changePercent !== undefined) && (
          <div
            className={`flex items-center space-x-1 ${getTrendColor(trend || 'neutral')} ${isMobile ? 'w-full justify-center' : ''}`}
          >
            {getTrendIcon(trend || 'neutral')}
            <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
              {changeValue !== undefined && (
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
                >
                  {changeValue > 0 ? '+' : ''}
                  {formatCurrency(changeValue)}
                </p>
              )}
              {changePercent !== undefined && (
                <p className={`${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {changePercent > 0 ? '+' : ''}
                  {formatPercentage(changePercent)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatedCard>
  )
})

const PortfolioMetrics = memo(function PortfolioMetrics({
  portfolioId,
}: PortfolioMetricsProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const { portfolio, loading, error } = usePortfolioState(portfolioId)
  const { priceUpdates, isConnected } = useRealtimeUpdates(portfolioId)
  const { isMobile, isTablet } = useResponsiveLayout()

  // Cached expensive calculations - MUST be called before early returns
  const {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    holdingsCount,
    dailyChange,
    dailyChangePercent,
    weeklyChange,
    monthlyChange,
  } = useMemo(() => {
    // Check cache first
    const cacheKey = CacheKeys.metrics(portfolioId)
    const cached = PortfolioCacheManager.getMetrics(portfolioId)

    if (cached && !loading) {
      return cached
    }

    // Calculate metrics
    const totalValue = portfolio?.total_value || 0
    const totalCost = portfolio?.total_cost || 0
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
    const holdingsCount = portfolio?.holdings_count || 0

    // Mock daily change (in real app, this would come from historical data)
    const dailyChange = totalValue * (Math.random() - 0.5) * 0.02 // ±1% daily change
    const dailyChangePercent =
      totalValue > 0 ? (dailyChange / totalValue) * 100 : 0

    // Mock weekly/monthly performance
    const weeklyChange = totalValue * (Math.random() - 0.5) * 0.05 // ±2.5% weekly change
    const monthlyChange = totalValue * (Math.random() - 0.5) * 0.1 // ±5% monthly change

    const result = {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount,
      dailyChange,
      dailyChangePercent,
      weeklyChange,
      monthlyChange,
    }

    // Cache the result
    PortfolioCacheManager.setMetrics(portfolioId, result, 120000) // 2 minutes TTL
    return result
  }, [portfolio, portfolioId, loading])

  const metrics = useMemo(
    () => [
      {
        title: 'Totalverdi',
        value: totalValue,
        format: 'currency' as const,
        icon: <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />,
        subtitle: 'Nåværende markedsverdi',
        trend: dailyChange >= 0 ? ('up' as const) : ('down' as const),
        changeValue: dailyChange,
        changePercent: dailyChangePercent,
      },
      {
        title: 'Total gevinst/tap',
        value: totalGainLoss,
        format: 'currency' as const,
        icon:
          totalGainLoss >= 0 ? (
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
          ),
        subtitle: `${formatPercentage(totalGainLossPercent)} av kostbasis`,
        trend: totalGainLoss >= 0 ? ('up' as const) : ('down' as const),
        changePercent: totalGainLossPercent,
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
      },
    ],
    [
      totalValue,
      totalGainLoss,
      totalCost,
      holdingsCount,
      dailyChange,
      dailyChangePercent,
      totalGainLossPercent,
    ]
  )

  // Early returns AFTER all hooks have been called
  if (loading) {
    return <PortfolioMetricsSkeleton />
  }

  if (error) {
    return (
      <div className="mb-6">
        <AnimatedCard className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <InformationCircleIcon className="h-5 w-5" />
            <p>Kunne ikke laste inn porteføljemålinger: {error}</p>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  return (
    <MobileResponsiveWrapper
      className="mb-6"
      mobileFirst={true}
      enableAnimations={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Connection Status */}
        {!isConnected && (
          <div className={`mb-4 ${isMobile ? 'px-2' : ''}`}>
            <div
              className={`flex items-center space-x-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-600 ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              <InformationCircleIcon className="h-4 w-4" />
              <p>Sanntidsoppdateringer er utilgjengelige</p>
            </div>
          </div>
        )}

        {/* Main Metrics Grid - Responsive */}
        <ResponsiveGrid
          className="mb-6"
          mobileColumns={1}
          tabletColumns={2}
          desktopColumns={4}
          gap={isMobile ? 'sm' : 'md'}
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <MetricCard {...metric} isLoading={loading} />
            </motion.div>
          ))}
        </ResponsiveGrid>

        {/* Performance Summary - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div
              className={`mb-4 flex items-center justify-between ${isMobile ? 'flex-col space-y-2' : ''}`}
            >
              <h3
                className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}
              >
                Ytelsessammendrag
              </h3>
              <Badge
                variant="outline"
                className={`${isConnected ? 'text-green-600' : 'text-gray-500'} ${isMobile ? 'text-xs' : ''}`}
              >
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>

            <ResponsiveGrid
              mobileColumns={1}
              tabletColumns={3}
              desktopColumns={3}
              gap={isMobile ? 'sm' : 'md'}
            >
              <div
                className={`text-center ${isMobile ? 'border-b border-gray-200 py-3' : ''}`}
              >
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
                >
                  I dag
                </p>
                <p
                  className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${
                    dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {dailyChange >= 0 ? '+' : ''}
                  {formatCurrency(dailyChange)}
                </p>
                <p
                  className={`text-xs ${
                    dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {dailyChangePercent >= 0 ? '+' : ''}
                  {formatPercentage(dailyChangePercent)}
                </p>
              </div>

              <div
                className={`text-center ${isMobile ? 'border-b border-gray-200 py-3' : ''}`}
              >
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
                >
                  Denne uken
                </p>
                <p
                  className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${
                    weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {weeklyChange >= 0 ? '+' : ''}
                  {formatCurrency(weeklyChange)}
                </p>
                <p
                  className={`text-xs ${
                    weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {weeklyChange >= 0 ? '+' : ''}
                  {formatPercentage((weeklyChange / totalValue) * 100)}
                </p>
              </div>

              <div className={`text-center ${isMobile ? 'py-3' : ''}`}>
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
                >
                  Denne måneden
                </p>
                <p
                  className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${
                    monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {monthlyChange >= 0 ? '+' : ''}
                  {formatCurrency(monthlyChange)}
                </p>
                <p
                  className={`text-xs ${
                    monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {monthlyChange >= 0 ? '+' : ''}
                  {formatPercentage((monthlyChange / totalValue) * 100)}
                </p>
              </div>
            </ResponsiveGrid>
          </AnimatedCard>
        </motion.div>
      </motion.div>
    </MobileResponsiveWrapper>
  )
})

export default PortfolioMetrics
