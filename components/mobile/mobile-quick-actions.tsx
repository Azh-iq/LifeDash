'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  Squares2X2Icon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  LightBulbIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/animated'
import MobileActionSheet, { useActionSheet } from '@/components/mobile/mobile-action-sheet'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { cn } from '@/lib/utils/cn'

interface MobileQuickActionsProps {
  portfolioId: string
  onAddStock?: () => void
  onImportCSV?: () => void
  onExportData?: () => void
  onSharePortfolio?: () => void
  onViewAnalytics?: () => void
  onRefresh?: () => void
  className?: string
  fabPosition?: 'bottom-right' | 'bottom-center' | 'top-right'
  showSuggestions?: boolean
}

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  action: () => void
  disabled?: boolean
  badge?: string
  priority: 'high' | 'medium' | 'low'
  category: 'trading' | 'data' | 'analysis' | 'sharing'
  description?: string
}

interface ActionSuggestion {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  action: () => void
  conditions: (portfolio: any, metrics: any) => boolean
}

const FLOATING_ACTION_SIZE = 56
const FAB_ACTIONS_RADIUS = 140

export default function MobileQuickActions({
  portfolioId,
  onAddStock,
  onImportCSV,
  onExportData,
  onSharePortfolio,
  onViewAnalytics,
  onRefresh,
  className,
  fabPosition = 'bottom-right',
  showSuggestions = true
}: MobileQuickActionsProps) {
  const [isFabExpanded, setIsFabExpanded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ [key: string]: boolean }>({})
  const { isOpen: isActionSheetOpen, config, showActionSheet, hideActionSheet } = useActionSheet()

  const {
    portfolio,
    holdings,
    metrics,
    loading,
    error,
    isPricesConnected,
    refresh
  } = usePortfolioState(portfolioId)

  // Define quick actions
  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: 'add-stock',
      label: 'Legg til aksje',
      icon: PlusIcon,
      color: 'text-white',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      action: () => onAddStock?.(),
      priority: 'high',
      category: 'trading',
      description: 'Legg til en ny aksje i porteføljen'
    },
    {
      id: 'import-csv',
      label: 'Importer CSV',
      icon: DocumentArrowUpIcon,
      color: 'text-white',
      bgColor: 'bg-green-600 hover:bg-green-700',
      action: () => onImportCSV?.(),
      priority: 'high',
      category: 'data',
      description: 'Last opp CSV-fil med beholdninger'
    },
    {
      id: 'refresh',
      label: 'Oppdater',
      icon: ArrowPathIcon,
      color: 'text-white',
      bgColor: 'bg-orange-600 hover:bg-orange-700',
      action: handleRefresh,
      disabled: isRefreshing,
      priority: 'medium',
      category: 'data',
      description: 'Hent de nyeste aksjekursene',
      badge: !isPricesConnected ? 'Offline' : undefined
    },
    {
      id: 'analytics',
      label: 'Analyse',
      icon: ChartBarIcon,
      color: 'text-white',
      bgColor: 'bg-purple-600 hover:bg-purple-700',
      action: () => onViewAnalytics?.(),
      priority: 'medium',
      category: 'analysis',
      description: 'Se detaljert porteføljeanalyse'
    },
    {
      id: 'export',
      label: 'Eksporter',
      icon: ArrowDownTrayIcon,
      color: 'text-white',
      bgColor: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => onExportData?.(),
      disabled: holdings.length === 0,
      priority: 'low',
      category: 'data',
      description: 'Eksporter porteføljedata'
    },
    {
      id: 'share',
      label: 'Del',
      icon: ShareIcon,
      color: 'text-white',
      bgColor: 'bg-pink-600 hover:bg-pink-700',
      action: () => onSharePortfolio?.(),
      priority: 'low',
      category: 'sharing',
      description: 'Del porteføljen med andre'
    }
  ], [onAddStock, onImportCSV, onExportData, onSharePortfolio, onViewAnalytics, holdings.length, isRefreshing, isPricesConnected])

  // Context-aware action suggestions
  const actionSuggestions = useMemo<ActionSuggestion[]>(() => [
    {
      id: 'diversify',
      title: 'Diversifiser porteføljen',
      description: 'Du har høy konsentrasjon i få aksjer',
      icon: Squares2X2Icon,
      color: 'text-yellow-600',
      action: () => onAddStock?.(),
      conditions: (portfolio, metrics) => {
        const topHolding = metrics.topHoldings[0]
        return topHolding && topHolding.weight > 30
      }
    },
    {
      id: 'rebalance',
      title: 'Rebalansering anbefalt',
      description: 'Noen posisjoner har vokst mye',
      icon: AdjustmentsHorizontalIcon,
      color: 'text-blue-600',
      action: () => onViewAnalytics?.(),
      conditions: (portfolio, metrics) => {
        return metrics.topHoldings.some((h: any) => h.weight > 25)
      }
    },
    {
      id: 'take-profit',
      title: 'Vurder gevinstrealisering',
      description: 'Du har aksjer med høy gevinst',
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      action: () => onViewAnalytics?.(),
      conditions: (portfolio, metrics) => {
        return holdings.some(h => h.gain_loss_percent > 50)
      }
    },
    {
      id: 'update-prices',
      title: 'Oppdater kurser',
      description: 'Prisene er ikke oppdatert',
      icon: ArrowPathIcon,
      color: 'text-red-600',
      action: handleRefresh,
      conditions: () => !isPricesConnected
    },
    {
      id: 'first-stock',
      title: 'Legg til din første aksje',
      description: 'Kom i gang med investering',
      icon: SparklesIcon,
      color: 'text-purple-600',
      action: () => onAddStock?.(),
      conditions: (portfolio, metrics) => holdings.length === 0
    }
  ], [holdings, isPricesConnected, onAddStock, onViewAnalytics])

  // Filter active suggestions
  const activeSuggestions = useMemo(() => {
    if (!showSuggestions || !portfolio || !metrics) return []
    
    return actionSuggestions.filter(suggestion => 
      suggestion.conditions(portfolio, metrics)
    ).slice(0, 2) // Show max 2 suggestions
  }, [actionSuggestions, portfolio, metrics, showSuggestions])

  // Handle refresh with loading state
  async function handleRefresh() {
    setIsRefreshing(true)
    
    try {
      await refresh()
      showActionFeedback('refresh')
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50])
      }
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const showActionFeedback = useCallback((actionId: string) => {
    setActionFeedback(prev => ({ ...prev, [actionId]: true }))
    setTimeout(() => {
      setActionFeedback(prev => ({ ...prev, [actionId]: false }))
    }, 1500)
  }, [])

  const handleActionClick = useCallback((action: QuickAction) => {
    if (action.disabled) return

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }

    action.action()
    showActionFeedback(action.id)
    
    if (isFabExpanded) {
      setIsFabExpanded(false)
    }
  }, [isFabExpanded, showActionFeedback])

  const toggleFab = useCallback(() => {
    setIsFabExpanded(!isFabExpanded)
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(isFabExpanded ? 50 : 100)
    }
  }, [isFabExpanded])

  const handleShowAllActions = useCallback(() => {
    const actionItems = quickActions.map(action => ({
      id: action.id,
      label: action.label,
      icon: action.icon,
      onClick: action.action,
      disabled: action.disabled,
      badge: action.badge
    }))

    showActionSheet({
      title: 'Hurtighandlinger',
      subtitle: 'Velg en handling å utføre',
      items: actionItems
    })
  }, [quickActions, showActionSheet])

  // Get FAB position styles
  const getFabPositionStyle = () => {
    switch (fabPosition) {
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      case 'top-right':
        return 'top-4 right-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  // Get action position for expanded FAB
  const getActionPosition = (index: number, total: number) => {
    const angle = (index / (total - 1)) * (Math.PI / 2) // 90 degrees spread
    const x = Math.cos(angle + Math.PI) * FAB_ACTIONS_RADIUS
    const y = Math.sin(angle + Math.PI) * FAB_ACTIONS_RADIUS
    
    return { x, y }
  }

  const primaryActions = quickActions.filter(a => a.priority === 'high').slice(0, 4)

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Context-aware suggestions */}
        {activeSuggestions.length > 0 && (
          <div className="mb-4 space-y-2">
            {activeSuggestions.map((suggestion) => {
              const Icon = suggestion.icon
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AnimatedCard 
                    className="p-3 border-l-4 border-blue-500 bg-blue-50 cursor-pointer"
                    onClick={suggestion.action}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={cn('h-5 w-5 mt-0.5', suggestion.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 text-sm">
                            {suggestion.title}
                          </p>
                          <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Quick Actions Grid */}
        <AnimatedCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Hurtighandlinger</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAllActions}
              className="text-blue-600"
            >
              Se alle
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {primaryActions.map((action) => {
              const Icon = action.icon
              const hasFeedback = actionFeedback[action.id]
              
              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    'relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200',
                    'touch-manipulation active:scale-95',
                    action.bgColor,
                    action.disabled && 'opacity-50 cursor-not-allowed',
                    'min-h-[80px]'
                  )}
                  whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: action.disabled ? 1 : 0.98 }}
                >
                  {/* Success feedback */}
                  <AnimatePresence>
                    {hasFeedback && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 bg-green-500 rounded-lg flex items-center justify-center"
                      >
                        <CheckIcon className="h-6 w-6 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Icon className={cn(
                    'h-6 w-6 mb-2',
                    action.color,
                    action.id === 'refresh' && isRefreshing && 'animate-spin'
                  )} />
                  
                  <span className={cn('text-xs font-medium', action.color)}>
                    {action.label}
                  </span>

                  {/* Badge */}
                  {action.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}

                  {/* Priority indicator */}
                  {action.priority === 'high' && (
                    <div className="absolute top-2 left-2">
                      <StarIcon className="h-3 w-3 text-yellow-300" />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isPricesConnected ? 'bg-green-500' : 'bg-yellow-500'
                )} />
                <span>{isPricesConnected ? 'Live kurser' : 'Offline modus'}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>
                  Oppdatert: {portfolio?.last_updated ? 
                    new Date(portfolio.last_updated).toLocaleTimeString('nb-NO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Aldri'
                  }
                </span>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Floating Action Button */}
      <div className={cn('fixed z-50', getFabPositionStyle())}>
        {/* Backdrop when expanded */}
        <AnimatePresence>
          {isFabExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 -z-10"
              onClick={toggleFab}
            />
          )}
        </AnimatePresence>

        {/* Expanded action buttons */}
        <AnimatePresence>
          {isFabExpanded && (
            <div className="absolute bottom-0 right-0">
              {primaryActions.map((action, index) => {
                const position = getActionPosition(index, primaryActions.length)
                const Icon = action.icon
                
                return (
                  <motion.button
                    key={action.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      x: position.x,
                      y: position.y
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20
                    }}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    className={cn(
                      'absolute bottom-0 right-0 w-12 h-12 rounded-full shadow-lg',
                      'flex items-center justify-center transition-colors',
                      'touch-manipulation',
                      action.bgColor,
                      action.disabled && 'opacity-50'
                    )}
                    style={{
                      bottom: 0,
                      right: 0,
                    }}
                  >
                    <Icon className={cn('h-5 w-5', action.color)} />
                  </motion.button>
                )
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={toggleFab}
          className={cn(
            'w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full',
            'shadow-lg flex items-center justify-center transition-colors',
            'touch-manipulation relative z-10'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isFabExpanded ? 45 : 0 }}
        >
          <PlusIcon className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Action Sheet */}
      <MobileActionSheet
        isOpen={isActionSheetOpen}
        onClose={hideActionSheet}
        title={config.title}
        subtitle={config.subtitle}
        items={config.items}
      />
    </>
  )
}