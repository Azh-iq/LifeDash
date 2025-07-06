'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import {
  AnimatedCard,
  ProgressRing,
  NumberCounter,
} from '@/components/animated'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { formatCurrency, formatPercentage } from '@/components/charts'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import {
  MobileResponsiveWrapper,
  ResponsiveGrid,
  ResponsiveVisibility,
} from '@/components/mobile/mobile-responsive-wrapper'

interface PortfolioSidebarProps {
  portfolioId: string
}

interface AllocationItem {
  symbol: string
  name: string
  value: number
  weight: number
  change: number
  changePercent: number
  color: string
}

interface MoverItem {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  trend: 'up' | 'down'
}

export default function PortfolioSidebar({
  portfolioId,
}: PortfolioSidebarProps) {
  const [allocationView, setAllocationView] = useState<'value' | 'weight'>(
    'weight'
  )
  const [moversPeriod, setMoversPeriod] = useState<'day' | 'week' | 'month'>(
    'day'
  )

  const { portfolio, holdings, loading, error } = usePortfolioState(portfolioId)
  const { priceUpdates, isConnected } = useRealtimeUpdates(portfolioId)
  const { isMobile, isTablet } = useResponsiveLayout()

  // Calculate allocation data
  const allocationData = useMemo(() => {
    if (!holdings || holdings.length === 0) return []

    const totalValue = holdings.reduce(
      (sum, holding) => sum + (holding.market_value || 0),
      0
    )

    const colors = [
      '#1e40af',
      '#3b82f6',
      '#60a5fa',
      '#93c5fd',
      '#1d4ed8',
      '#2563eb',
      '#6366f1',
      '#8b5cf6',
      '#a855f7',
      '#059669',
    ]

    return holdings
      .sort((a, b) => (b.market_value || 0) - (a.market_value || 0))
      .slice(0, 10) // Top 10 holdings
      .map((holding, index) => ({
        symbol: holding.stock_symbol || 'N/A',
        name: holding.stock_name || 'Ukjent',
        value: holding.market_value || 0,
        weight:
          totalValue > 0 ? ((holding.market_value || 0) / totalValue) * 100 : 0,
        change: holding.day_change || 0,
        changePercent: holding.day_change_percent || 0,
        color: colors[index % colors.length],
      }))
  }, [holdings])

  // Calculate movers data
  const moversData = useMemo(() => {
    if (!holdings || holdings.length === 0) return { gainers: [], losers: [] }

    const processedHoldings = holdings.map(holding => {
      // Mock different period changes (in real app, this would come from historical data)
      let change = 0
      let changePercent = 0

      switch (moversPeriod) {
        case 'day':
          change = holding.day_change || 0
          changePercent = holding.day_change_percent || 0
          break
        case 'week':
          change = (holding.market_value || 0) * (Math.random() - 0.5) * 0.1 // ±5% weekly
          changePercent = (change / (holding.market_value || 1)) * 100
          break
        case 'month':
          change = (holding.market_value || 0) * (Math.random() - 0.5) * 0.2 // ±10% monthly
          changePercent = (change / (holding.market_value || 1)) * 100
          break
      }

      return {
        symbol: holding.stock_symbol || 'N/A',
        name: holding.stock_name || 'Ukjent',
        value: holding.market_value || 0,
        change,
        changePercent,
        trend: change >= 0 ? ('up' as const) : ('down' as const),
      }
    })

    const gainers = processedHoldings
      .filter(item => item.change > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5)

    const losers = processedHoldings
      .filter(item => item.change < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)

    return { gainers, losers }
  }, [holdings, moversPeriod])

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <MobileResponsiveWrapper>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}
        >
          <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <LoadingSkeleton />
          </AnimatedCard>
          <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <LoadingSkeleton />
          </AnimatedCard>
        </motion.div>
      </MobileResponsiveWrapper>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-6"
      >
        <AnimatedCard className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <InformationCircleIcon className="h-5 w-5" />
            <p className="text-sm">Kunne ikke laste inn sidebardata</p>
          </div>
        </AnimatedCard>
      </motion.div>
    )
  }

  return (
    <MobileResponsiveWrapper>
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}
      >
        {/* Asset Allocation */}
        <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div
            className={`mb-4 flex items-center justify-between ${isMobile ? 'flex-col space-y-3' : ''}`}
          >
            <h3
              className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center font-semibold text-gray-900`}
            >
              <ChartPieIcon className="mr-2 h-5 w-5" />
              Aktivafordeling
            </h3>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={allocationView === 'weight' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAllocationView('weight')}
                className={`touch-manipulation text-xs ${isMobile ? 'px-3 py-2' : ''}`}
              >
                Vekt
              </Button>
              <Button
                variant={allocationView === 'value' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAllocationView('value')}
                className={`touch-manipulation text-xs ${isMobile ? 'px-3 py-2' : ''}`}
              >
                Verdi
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {allocationData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <ChartPieIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">Ingen beholdninger funnet</p>
              </div>
            ) : (
              <>
                {/* Donut Chart */}
                <ResponsiveVisibility hideOn={['mobile']}>
                  <div className="mb-4 flex justify-center">
                    <div className="relative h-32 w-32">
                      <ProgressRing
                        value={100}
                        size={128}
                        strokeWidth={12}
                        className="text-blue-600"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {allocationData.length}
                          </div>
                          <div className="text-xs text-gray-500">
                            beholdninger
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResponsiveVisibility>

                {/* Allocation List */}
                <div className="space-y-2">
                  {allocationData.map((item, index) => (
                    <motion.div
                      key={item.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.symbol}
                          </p>
                          <p className="max-w-20 truncate text-xs text-gray-500">
                            {item.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {allocationView === 'weight'
                            ? `${item.weight.toFixed(1)}%`
                            : formatCurrency(item.value)}
                        </p>
                        <p
                          className={`flex items-center text-xs ${
                            item.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.change >= 0 ? (
                            <ArrowUpIcon className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="mr-1 h-3 w-3" />
                          )}
                          {formatPercentage(item.changePercent)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {allocationData.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-blue-600 hover:text-blue-700"
                  >
                    Se full fordeling
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </AnimatedCard>

        {/* Top Movers */}
        <AnimatedCard className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div
            className={`mb-4 flex items-center justify-between ${isMobile ? 'flex-col space-y-3' : ''}`}
          >
            <h3
              className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center font-semibold text-gray-900`}
            >
              <ArrowTrendingUpIcon className="mr-2 h-5 w-5" />
              Største bevegelser
            </h3>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={moversPeriod === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMoversPeriod('day')}
                className={`touch-manipulation text-xs ${isMobile ? 'px-2' : ''}`}
              >
                Dag
              </Button>
              <Button
                variant={moversPeriod === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMoversPeriod('week')}
                className={`touch-manipulation text-xs ${isMobile ? 'px-2' : ''}`}
              >
                Uke
              </Button>
              <Button
                variant={moversPeriod === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMoversPeriod('month')}
                className={`touch-manipulation text-xs ${isMobile ? 'px-2' : ''}`}
              >
                Måned
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Gainers */}
            {moversData.gainers.length > 0 && (
              <div>
                <div className="mb-2 flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-medium text-gray-900">Oppgang</h4>
                </div>
                <div className="space-y-2">
                  {moversData.gainers.map((item, index) => (
                    <motion.div
                      key={`gainer-${item.symbol}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-green-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.symbol}
                        </p>
                        <p className="max-w-24 truncate text-xs text-gray-500">
                          {item.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          +{formatPercentage(item.changePercent)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.value)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {moversData.gainers.length > 0 && moversData.losers.length > 0 && (
              <Separator />
            )}

            {/* Losers */}
            {moversData.losers.length > 0 && (
              <div>
                <div className="mb-2 flex items-center space-x-2">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                  <h4 className="text-sm font-medium text-gray-900">Nedgang</h4>
                </div>
                <div className="space-y-2">
                  {moversData.losers.map((item, index) => (
                    <motion.div
                      key={`loser-${item.symbol}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-red-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.symbol}
                        </p>
                        <p className="max-w-24 truncate text-xs text-gray-500">
                          {item.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {formatPercentage(item.changePercent)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.value)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {moversData.gainers.length === 0 &&
              moversData.losers.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <ArrowTrendingUpIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p className="text-sm">Ingen bevegelser å vise</p>
                </div>
              )}
          </div>
        </AnimatedCard>

        {/* Connection Status */}
        <AnimatedCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Tilkoblet' : 'Frakoblet'}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </AnimatedCard>
      </motion.div>
    </MobileResponsiveWrapper>
  )
}
