'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  ChevronLeftIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AnimatedCard,
  NumberCounter,
  CurrencyCounter,
  PercentageCounter,
} from '@/components/animated'
import MobileActionSheet, {
  useActionSheet,
} from '@/components/mobile/mobile-action-sheet'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { formatCurrency, formatPercentage } from '@/components/charts'
import { cn } from '@/lib/utils/cn'

interface MobilePortfolioHeaderProps {
  portfolioId: string
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  onExport?: () => void
  showCompactView?: boolean
  className?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

export default function MobilePortfolioHeader({
  portfolioId,
  onBack,
  onEdit,
  onDelete,
  onShare,
  onExport,
  showCompactView = false,
  className,
}: MobilePortfolioHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(showCompactView)
  const [shareSuccess, setShareSuccess] = useState(false)
  const {
    isOpen: isActionSheetOpen,
    config,
    showActionSheet,
    hideActionSheet,
  } = useActionSheet()

  const { portfolio, loading, error, metrics, isPricesConnected } =
    usePortfolioState(portfolioId)

  // Handle native share API
  const handleNativeShare = useCallback(async () => {
    const shareData = {
      title: `${portfolio?.name} - LifeDash`,
      text: `Se min investeringsportefølje: ${formatCurrency(metrics.totalValue)} (${formatPercentage(metrics.totalGainLossPercent)})`,
      url: `${window.location.origin}/portfolios/${portfolioId}/share`,
    }

    if (
      navigator.share &&
      'canShare' in navigator &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData)

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          handleFallbackShare()
        }
      }
    } else {
      handleFallbackShare()
    }
  }, [
    portfolio?.name,
    portfolioId,
    metrics.totalValue,
    metrics.totalGainLossPercent,
  ])

  // Fallback share method
  const handleFallbackShare = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/portfolios/${portfolioId}/share`
      await navigator.clipboard.writeText(shareUrl)

      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }

      onShare?.()
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [portfolioId, onShare])

  const handleBackClick = useCallback(() => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }

    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }, [onBack])

  const handleMenuClick = useCallback(() => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }

    const actionItems = [
      {
        id: 'edit',
        label: 'Rediger portefølje',
        icon: PencilIcon,
        onClick: () => onEdit?.(),
      },
      {
        id: 'share',
        label: 'Del portefølje',
        icon: ShareIcon,
        onClick: handleNativeShare,
      },
      {
        id: 'export',
        label: 'Eksporter data',
        icon: ArrowDownTrayIcon,
        onClick: () => onExport?.(),
      },
      {
        id: 'delete',
        label: 'Slett portefølje',
        icon: TrashIcon,
        onClick: () => onDelete?.(),
        destructive: true,
      },
    ]

    showActionSheet({
      title: 'Porteføljehandlinger',
      subtitle: portfolio?.name,
      items: actionItems,
    })
  }, [
    portfolio?.name,
    onEdit,
    onDelete,
    onExport,
    handleNativeShare,
    showActionSheet,
  ])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [isCollapsed])

  const getPortfolioTypeInfo = (type: string) => {
    switch (type) {
      case 'INVESTMENT':
        return { label: 'Investering', color: 'bg-blue-100 text-blue-800' }
      case 'RETIREMENT':
        return { label: 'Pensjon', color: 'bg-green-100 text-green-800' }
      case 'SAVINGS':
        return { label: 'Sparing', color: 'bg-yellow-100 text-yellow-800' }
      case 'TRADING':
        return { label: 'Trading', color: 'bg-purple-100 text-purple-800' }
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  // Breadcrumb for navigation context
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Mine porteføljer', href: '/investments' },
    { label: portfolio?.name || 'Laster...', isActive: true },
  ]

  if (loading) {
    return (
      <div className={cn('border-b border-gray-200 bg-white', className)}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
              <div>
                <div className="mb-1 h-6 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className={cn('border-b border-gray-200 bg-white', className)}>
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="-ml-2 p-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="text-sm text-red-600">
              {error || 'Fant ikke porteføljen'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const typeInfo = getPortfolioTypeInfo(portfolio.type)
  const isPositive = metrics.totalGainLoss >= 0

  return (
    <>
      <motion.div
        className={cn(
          'sticky top-0 z-30 border-b border-gray-200 bg-white',
          className
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main Header */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="-ml-2 touch-manipulation p-2"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>

              {/* Portfolio Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="truncate text-lg font-semibold text-gray-900">
                    {portfolio.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', typeInfo.color)}
                  >
                    {typeInfo.label}
                  </Badge>
                  {portfolio.is_public && (
                    <Badge variant="outline" className="text-xs">
                      Offentlig
                    </Badge>
                  )}
                </div>

                {/* Optimized Breadcrumb for Mobile */}
                <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
                  <span>Mine porteføljer</span>
                  <span>/</span>
                  <span className="truncate font-medium text-gray-900">
                    {portfolio.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {/* Quick Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNativeShare}
                className="touch-manipulation p-2"
              >
                {shareSuccess ? (
                  <CheckIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ShareIcon className="h-5 w-5" />
                )}
              </Button>

              {/* More Actions Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMenuClick}
                className="touch-manipulation p-2"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsible Portfolio Metrics */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 px-4 pb-4">
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {/* Total Value */}
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Totalverdi</div>
                    <div className="text-xl font-bold text-gray-900">
                      <CurrencyCounter
                        value={metrics.totalValue}
                        currency="NOK"
                      />
                    </div>
                    {isPricesConnected && (
                      <div className="mt-1 flex items-center">
                        <div className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-green-600">Live</span>
                      </div>
                    )}
                  </div>

                  {/* Gain/Loss */}
                  <div>
                    <div className="mb-1 text-xs text-gray-500">
                      Gevinst/Tap
                    </div>
                    <div
                      className={cn(
                        'flex items-center text-xl font-bold',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {isPositive ? (
                        <ArrowTrendingUpIcon className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="mr-1 h-4 w-4" />
                      )}
                      <CurrencyCounter
                        value={Math.abs(metrics.totalGainLoss)}
                        currency="NOK"
                        prefix={isPositive ? '+' : '-'}
                      />
                    </div>
                    <div
                      className={cn(
                        'mt-1 text-xs',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      <PercentageCounter
                        value={Math.abs(metrics.totalGainLossPercent)}
                        prefix={isPositive ? '+' : '-'}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="text-xs text-gray-500">
                    {metrics.holdingsCount} beholdning
                    {metrics.holdingsCount !== 1 ? 'er' : ''}
                  </div>

                  <div className="text-xs text-gray-500">
                    Oppdatert:{' '}
                    {new Date(portfolio.last_updated).toLocaleTimeString(
                      'nb-NO',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="touch-manipulation p-1"
          >
            {isCollapsed ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>

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
