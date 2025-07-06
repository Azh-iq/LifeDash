'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ShareIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import MobileNavigation, { MobileTopBar } from './mobile-navigation'
import MobileMetricCards from './mobile-metric-cards'
import MobileChart from './mobile-chart'
import MobileHoldingsList from './mobile-holdings-list'
import MobileActionSheet from './mobile-action-sheet'
import type { MetricData } from './mobile-metric-cards'
import type { ChartDataPoint } from './mobile-chart'
import type { Holding } from './mobile-holdings-list'
import type { ActionSheetItem } from './mobile-action-sheet'
import {
  LoadingPortfolioState,
  EmptyPortfolioState,
  ErrorPortfolioState,
} from '@/components/states'
import { AnimatedCard, NumberCounter } from '@/components/animated'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import {
  APIErrorBoundary,
  RenderErrorBoundary,
  MobileErrorBoundary,
} from '@/components/ui/error-boundaries'

interface MobilePortfolioDashboardProps {
  portfolioId: string
  initialView?: 'overview' | 'holdings' | 'charts'
  showNavigation?: boolean
  showTopBar?: boolean
  className?: string
}

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultExpanded?: boolean
  icon?: React.ReactNode
  badge?: string | number
  onToggle?: (expanded: boolean) => void
}

const CollapsibleSection = ({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  icon,
  badge,
  onToggle,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(newExpanded)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [isExpanded, onToggle])

  return (
    <div className="mb-4">
      <motion.div
        className="flex cursor-pointer touch-manipulation items-center justify-between rounded-t-lg border-b border-gray-100 bg-white p-4"
        onClick={handleToggle}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="rounded-lg bg-blue-50 p-2">{icon}</div>}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const PullToRefresh = ({
  onRefresh,
  isRefreshing,
  children,
}: {
  onRefresh: () => Promise<void>
  isRefreshing: boolean
  children: React.ReactNode
}) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const currentY = e.touches[0].clientY
      const distance = currentY - startY

      if (distance > 0 && window.scrollY === 0) {
        setIsPulling(true)
        setPullDistance(Math.min(distance, 100))
      }
    },
    [startY]
  )

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60) {
      await onRefresh()
    }
    setIsPulling(false)
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center bg-blue-50 py-4"
          >
            <div className="flex items-center space-x-2 text-blue-600">
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{
                  duration: 1,
                  repeat: isRefreshing ? Infinity : 0,
                }}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-medium">
                {pullDistance > 60
                  ? 'Slipp for å oppdatere'
                  : 'Dra ned for å oppdatere'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{
          transform: `translateY(${isPulling ? pullDistance * 0.5 : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function MobilePortfolioDashboard({
  portfolioId,
  initialView = 'overview',
  showNavigation = true,
  showTopBar = true,
  className,
}: MobilePortfolioDashboardProps) {
  const router = useRouter()
  const [currentView, setCurrentView] = useState(initialView)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [hideValues, setHideValues] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    holdings: true,
    performance: true,
    activity: false,
  })

  // Portfolio state management
  const {
    portfolio,
    loading,
    error,
    refresh,
    holdings,
    holdingsLoading,
    metrics,
    realtimePrices,
    isPricesConnected,
  } = usePortfolioState(portfolioId, {
    enableRealtime: true,
    includeHoldings: true,
    autoRefresh: true,
    refreshInterval: 30000,
  })

  // Simple refresh management
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const performRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refresh()
      setLastRefresh(Date.now())
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Real-time updates
  const { isConnected: realtimeConnected } = useRealtimeUpdates(portfolioId)

  // Handle loading states
  if (loading && !portfolio) {
    return <LoadingPortfolioState type="initial" />
  }

  if (error && !portfolio) {
    return <ErrorPortfolioState error={error} onRetry={refresh} />
  }

  if (!portfolio) {
    return <EmptyPortfolioState />
  }

  // Prepare mobile metrics
  const mobileMetrics: MetricData[] = [
    {
      id: 'total-value',
      title: 'Totalverdi',
      value: hideValues ? 0 : metrics.totalValue,
      change: hideValues ? 0 : metrics.performanceMetrics.dailyChange,
      changeType: 'currency',
      period: 'I dag',
      trend: metrics.performanceMetrics.dailyChange >= 0 ? 'up' : 'down',
      icon: BanknotesIcon,
      color: 'blue',
      format: 'currency',
      subtitle: 'Markedsverdi',
    },
    {
      id: 'total-return',
      title: 'Total avkastning',
      value: hideValues ? 0 : metrics.totalGainLossPercent,
      change: hideValues ? 0 : metrics.performanceMetrics.dailyChangePercent,
      changeType: 'percentage',
      period: 'Siden oppstart',
      trend: metrics.totalGainLoss >= 0 ? 'up' : 'down',
      icon: ArrowTrendingUpIcon,
      color: metrics.totalGainLoss >= 0 ? 'green' : 'red',
      format: 'percentage',
    },
    {
      id: 'holdings-count',
      title: 'Posisjoner',
      value: metrics.holdingsCount,
      icon: ChartBarIcon,
      color: 'purple',
      format: 'number',
      subtitle: 'Aktive beholdninger',
    },
    {
      id: 'cost-basis',
      title: 'Kostbasis',
      value: hideValues ? 0 : metrics.totalCost,
      icon: BanknotesIcon,
      color: 'gray',
      format: 'currency',
      subtitle: 'Investert beløp',
    },
  ]

  // Prepare chart data (mock data - in production, fetch from API)
  const chartData: ChartDataPoint[] = useMemo(() => {
    const now = Date.now()
    const data: ChartDataPoint[] = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const baseValue = metrics.totalValue || 100000
      const variation = (Math.random() - 0.5) * 0.05 * baseValue

      data.push({
        date: date.toISOString().split('T')[0],
        value: baseValue + variation,
        timestamp: date.getTime(),
      })
    }

    return data
  }, [metrics.totalValue])

  // Convert holdings to mobile format
  const mobileHoldings: Holding[] = holdings.map(holding => ({
    id: holding.id,
    symbol: holding.symbol,
    name: holding.stocks?.name || holding.symbol,
    quantity: holding.quantity,
    currentPrice: holding.current_price,
    averagePrice: holding.cost_basis,
    marketValue: holding.current_value,
    unrealizedPL: holding.gain_loss,
    unrealizedPLPercent: holding.gain_loss_percent,
    sector: holding.stocks?.sector,
    lastUpdated: new Date(),
  }))

  // Action sheet items
  const actionSheetItems: ActionSheetItem[] = [
    {
      id: 'add-holding',
      title: 'Legg til posisjon',
      icon: PlusIcon,
      action: () => router.push(`/investments/portfolios/${portfolioId}/add`),
    },
    {
      id: 'edit-portfolio',
      title: 'Rediger portefølje',
      icon: Cog6ToothIcon,
      action: () => router.push(`/investments/portfolios/${portfolioId}/edit`),
    },
    {
      id: 'share-portfolio',
      title: 'Del portefølje',
      icon: ShareIcon,
      action: () => console.log('Share portfolio'),
    },
    {
      id: 'export-data',
      title: 'Eksporter data',
      icon: DocumentArrowDownIcon,
      action: () => console.log('Export data'),
    },
  ]

  const handleSectionToggle = (section: string, expanded: boolean) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: expanded,
    }))
  }

  const handleRefresh = async () => {
    await performRefresh()
  }

  const formatCurrency = (value: number) => {
    if (hideValues) return '••••••'
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    if (hideValues) return '••••'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile Top Bar */}
      {showTopBar && (
        <RenderErrorBoundary>
          <MobileTopBar
            title={portfolio.name}
            showBack={true}
            onBackClick={() => router.push('/investments')}
            rightContent={
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideValues(!hideValues)}
                  className="p-2"
                >
                  {hideValues ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex items-center space-x-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isPricesConnected ? 'bg-green-500' : 'bg-gray-400'
                    )}
                  />
                  <span className="text-xs text-gray-600">
                    {isPricesConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            }
          />
        </RenderErrorBoundary>
      )}

      {/* Main Content */}
      <div className="pb-20 pt-16">
        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
          <div className="space-y-6 px-4 py-6">
            {/* Portfolio Overview */}
            <APIErrorBoundary>
              <CollapsibleSection
                title="Porteføljeoversikt"
                subtitle={`Oppdatert ${new Date(lastRefresh).toLocaleTimeString(
                  'nb-NO',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}`}
                defaultExpanded={expandedSections.overview}
                icon={<BanknotesIcon className="h-5 w-5 text-blue-600" />}
                onToggle={expanded => handleSectionToggle('overview', expanded)}
              >
                <div className="p-4">
                  <RenderErrorBoundary>
                    <MobileMetricCards
                      metrics={mobileMetrics}
                      layout="grid"
                      compact={true}
                      showTrends={true}
                      showTargets={false}
                    />
                  </RenderErrorBoundary>
                </div>
              </CollapsibleSection>
            </APIErrorBoundary>

            {/* Performance Chart */}
            <APIErrorBoundary>
              <CollapsibleSection
                title="Ytelsesutvikling"
                subtitle="Siste 30 dager"
                defaultExpanded={expandedSections.performance}
                icon={<ChartBarIcon className="h-5 w-5 text-blue-600" />}
                badge={formatPercentage(
                  metrics.performanceMetrics.dailyChangePercent
                )}
                onToggle={expanded =>
                  handleSectionToggle('performance', expanded)
                }
              >
                <div className="p-4">
                  <RenderErrorBoundary>
                    <MobileChart
                      data={chartData}
                      title="Porteføljeverdi"
                      height={200}
                      showControls={false}
                      enableGestures={true}
                    />
                  </RenderErrorBoundary>
                </div>
              </CollapsibleSection>
            </APIErrorBoundary>

            {/* Holdings List */}
            <APIErrorBoundary>
              <CollapsibleSection
                title="Beholdninger"
                subtitle={`${holdings.length} aktive posisjoner`}
                defaultExpanded={expandedSections.holdings}
                icon={<ChartBarIcon className="h-5 w-5 text-blue-600" />}
                badge={holdings.length}
                onToggle={expanded => handleSectionToggle('holdings', expanded)}
              >
                <div className="p-4">
                  {holdingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 rounded-lg bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : holdings.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="mb-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                          <PlusIcon className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        Ingen beholdninger
                      </h3>
                      <p className="mb-4 text-gray-600">
                        Legg til dine første aksjer for å komme i gang
                      </p>
                      <Button
                        onClick={() =>
                          router.push(
                            `/investments/portfolios/${portfolioId}/add`
                          )
                        }
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Legg til aksje
                      </Button>
                    </div>
                  ) : (
                    <RenderErrorBoundary>
                      <MobileHoldingsList
                        holdings={mobileHoldings}
                        onEdit={holding =>
                          router.push(
                            `/investments/holdings/${holding.id}/edit`
                          )
                        }
                        onDelete={holding =>
                          console.log('Delete holding:', holding.id)
                        }
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                      />
                    </RenderErrorBoundary>
                  )}
                </div>
              </CollapsibleSection>
            </APIErrorBoundary>

            {/* Recent Activity */}
            <RenderErrorBoundary>
              <CollapsibleSection
                title="Nylig aktivitet"
                subtitle="Transaksjoner og oppdateringer"
                defaultExpanded={expandedSections.activity}
                icon={<ClockIcon className="h-5 w-5 text-blue-600" />}
                onToggle={expanded => handleSectionToggle('activity', expanded)}
              >
                <div className="p-4">
                  <div className="py-8 text-center">
                    <InformationCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">Ingen nylig aktivitet</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Transaksjoner og oppdateringer vises her
                    </p>
                  </div>
                </div>
              </CollapsibleSection>
            </RenderErrorBoundary>
          </div>
        </PullToRefresh>
      </div>

      {/* Mobile Navigation */}
      {showNavigation && (
        <MobileErrorBoundary>
          <MobileNavigation
            showFab={true}
            showNotifications={true}
            notificationCount={0}
            onFabClick={() => setShowActionSheet(true)}
          />
        </MobileErrorBoundary>
      )}

      {/* Action Sheet */}
      <RenderErrorBoundary>
        <MobileActionSheet
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          title="Porteføljehandlinger"
          items={actionSheetItems}
        />
      </RenderErrorBoundary>
    </div>
  )
}
