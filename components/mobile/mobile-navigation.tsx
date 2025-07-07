'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'
import {
  MobileErrorBoundary,
  RenderErrorBoundary,
} from '@/components/ui/error-boundaries'
import {
  Home,
  PieChart,
  TrendingUp,
  TrendingDown,
  Settings,
  User,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  Share2,
  ExternalLink,
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  badge?: number
  disabled?: boolean
  deepLinkData?: {
    type: string
    id: string
    action?: string
  }
}

interface PortfolioNotification {
  id: string
  type: 'portfolio_update' | 'price_alert' | 'market_update'
  title: string
  message: string
  portfolioId: string
  read: boolean
  createdAt: string
}

interface PortfolioQuickAction {
  id: string
  label: string
  icon: React.ElementType
  onClick: () => void
  disabled?: boolean
  badge?: number
  color?: string
}

interface MobileNavigationProps {
  items?: NavItem[]
  showFab?: boolean
  showNotifications?: boolean
  notificationCount?: number
  onFabClick?: () => void
  onNotificationClick?: () => void
  className?: string
  activePortfolioId?: string
  portfolioNotifications?: PortfolioNotification[]
  quickActions?: PortfolioQuickAction[]
  onPortfolioChange?: (portfolioId: string) => void
  onSharePortfolio?: (portfolioId: string) => void
  enableDeepLinking?: boolean
  showPortfolioSwitcher?: boolean
}

// Cache for portfolio navigation items to avoid recreation
const portfolioNavItemsCache = new Map<string, NavItem[]>()

// Utility function to get portfolio-specific navigation items
const getPortfolioNavItems = (portfolioId: string): NavItem[] => {
  if (portfolioNavItemsCache.has(portfolioId)) {
    return portfolioNavItemsCache.get(portfolioId)!
  }

  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      deepLinkData: {
        type: 'portfolio',
        id: portfolioId,
        action: 'overview',
      },
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: PieChart,
      href: `/portfolio/${portfolioId}`,
      deepLinkData: {
        type: 'portfolio',
        id: portfolioId,
        action: 'details',
      },
    },
    {
      id: 'holdings',
      label: 'Holdings',
      icon: TrendingUp,
      href: `/portfolio/${portfolioId}/holdings`,
      deepLinkData: {
        type: 'portfolio',
        id: portfolioId,
        action: 'holdings',
      },
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      href: `/portfolio/${portfolioId}/performance`,
      deepLinkData: {
        type: 'portfolio',
        id: portfolioId,
        action: 'performance',
      },
    },
  ]

  portfolioNavItemsCache.set(portfolioId, items)
  return items
}

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: PieChart,
    href: '/investments',
  },
  {
    id: 'stocks',
    label: 'Stocks',
    icon: TrendingUp,
    href: '/investments/stocks',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '/profile',
  },
]

const MobileNavItem = memo(
  ({
    item,
    isActive,
    onClick,
  }: {
    item: NavItem
    isActive: boolean
    onClick: () => void
  }) => {
    const Icon = item.icon

    return (
      <button
        onClick={onClick}
        disabled={item.disabled}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center p-2 transition-all duration-200',
          'touch-manipulation active:scale-95',
          isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600',
          item.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="relative">
          <Icon
            className={cn(
              'h-6 w-6 transition-transform duration-200',
              isActive && 'scale-110'
            )}
          />
          {item.badge && item.badge > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center p-0 text-xs"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </div>
        <span
          className={cn(
            'mt-1 max-w-full truncate text-xs font-medium',
            isActive ? 'text-blue-600' : 'text-gray-500'
          )}
        >
          {item.label}
        </span>
      </button>
    )
  }
)

MobileNavItem.displayName = 'MobileNavItem'

// Optimized memo component for navigation items
const MobileNavItemMemo = memo(
  ({
    item,
    pathname,
    portfolioBadges,
    onNavClick,
  }: {
    item: NavItem
    pathname: string
    portfolioBadges: { [key: string]: number }
    onNavClick: (item: NavItem) => void
  }) => {
    // Memoize badge calculation
    const itemWithBadge = useMemo(
      () => ({
        ...item,
        badge:
          item.badge ||
          portfolioBadges[item.id as keyof typeof portfolioBadges] ||
          0,
      }),
      [item, portfolioBadges]
    )

    // Memoize active state calculation
    const isActive = useMemo(() => {
      return pathname === item.href || pathname.startsWith(item.href + '/')
    }, [pathname, item.href])

    // Memoize click handler
    const handleClick = useCallback(() => {
      onNavClick(item)
    }, [item, onNavClick])

    return (
      <MobileNavItem
        item={itemWithBadge}
        isActive={isActive}
        onClick={handleClick}
      />
    )
  }
)

MobileNavItemMemo.displayName = 'MobileNavItemMemo'

const FloatingActionButton = memo(
  ({
    onClick,
    notificationCount = 0,
    showNotifications = false,
    onNotificationClick,
    quickActions = [],
    onSharePortfolio,
    showPortfolioActions = false,
  }: {
    onClick: () => void
    notificationCount?: number
    showNotifications?: boolean
    onNotificationClick?: () => void
    quickActions?: PortfolioQuickAction[]
    onSharePortfolio?: () => void
    showPortfolioActions?: boolean
  }) => {
    const [expanded, setExpanded] = useState(false)

    const handleMainClick = useCallback(() => {
      if (showNotifications) {
        setExpanded(!expanded)
      } else {
        onClick()
      }
    }, [showNotifications, expanded, onClick])

    const handleNotificationClick = useCallback(() => {
      onNotificationClick?.()
      setExpanded(false)
    }, [onNotificationClick])

    const handleAddClick = useCallback(() => {
      onClick()
      setExpanded(false)
    }, [onClick])

    return (
      <div className="relative">
        {/* Backdrop */}
        {expanded && (
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setExpanded(false)}
          />
        )}

        {/* Expanded menu */}
        {expanded && (
          <div className="absolute bottom-16 right-0 z-50 flex flex-col space-y-3">
            {/* Portfolio Share Button */}
            {showPortfolioActions && onSharePortfolio && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onSharePortfolio}
                className="shadow-lg"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            {/* Quick Actions */}
            {quickActions.map(action => {
              const ActionIcon = action.icon
              return (
                <Button
                  key={action.id}
                  size="sm"
                  variant="secondary"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="relative shadow-lg"
                  style={{ backgroundColor: action.color }}
                >
                  <ActionIcon className="h-4 w-4" />
                  {action.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center p-0 text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              )
            })}

            {/* Notifications */}
            {showNotifications && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleNotificationClick}
                className="relative shadow-lg"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center p-0 text-xs"
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Add Button */}
            <Button size="sm" onClick={handleAddClick} className="shadow-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main FAB */}
        <Button
          size="lg"
          onClick={handleMainClick}
          className={cn(
            'fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200',
            'touch-manipulation active:scale-95',
            expanded && 'rotate-45'
          )}
        >
          {expanded ? (
            <X className="h-6 w-6" />
          ) : showNotifications ? (
            <Menu className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

const MobileNavigation = memo(
  ({
    items = defaultNavItems,
    showFab = true,
    showNotifications = false,
    notificationCount = 0,
    onFabClick,
    onNotificationClick,
    className,
    activePortfolioId,
    portfolioNotifications = [],
    quickActions = [],
    onPortfolioChange,
    onSharePortfolio,
    enableDeepLinking = true,
    showPortfolioSwitcher = false,
  }: MobileNavigationProps) => {
    const pathname = usePathname()
    const router = useRouter()
    const { portfolios, loading: portfoliosLoading } = usePortfoliosState()
    const [showPortfolioMenu, setShowPortfolioMenu] = useState(false)
    const [unreadNotifications, setUnreadNotifications] = useState<
      PortfolioNotification[]
    >([])

    // Portfolio-specific navigation items - memoized
    const navigationItems = useMemo(() => {
      return activePortfolioId ? getPortfolioNavItems(activePortfolioId) : items
    }, [activePortfolioId, items])

    // Filter and manage notifications - memoized
    const filteredUnreadNotifications = useMemo(() => {
      return portfolioNotifications.filter(n => !n.read)
    }, [portfolioNotifications])

    useEffect(() => {
      setUnreadNotifications(filteredUnreadNotifications)
    }, [filteredUnreadNotifications])

    // Generate shareable portfolio link
    const generatePortfolioShareLink = useCallback((portfolioId: string) => {
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : ''
      return `${baseUrl}/portfolio/share/${portfolioId}`
    }, [])

    // Handle deep linking
    const handleDeepLink = useCallback(
      (item: NavItem) => {
        if (!enableDeepLinking || !item.deepLinkData) return

        const { type, id, action } = item.deepLinkData
        const params = new URLSearchParams({
          type,
          id,
          ...(action && { action }),
        })

        // Create deep link URL
        const deepLinkUrl = `${item.href}?${params.toString()}`
        router.push(deepLinkUrl)
      },
      [enableDeepLinking, router]
    )

    // Calculate portfolio-specific badges - memoized
    const portfolioBadges = useMemo(() => {
      if (!activePortfolioId) return {}

      const portfolioNotifs = portfolioNotifications.filter(
        n => n.portfolioId === activePortfolioId && !n.read
      )

      return {
        portfolio: portfolioNotifs.filter(n => n.type === 'portfolio_update')
          .length,
        holdings: portfolioNotifs.filter(n => n.type === 'price_alert').length,
        performance: portfolioNotifs.filter(n => n.type === 'market_update')
          .length,
      }
    }, [activePortfolioId, portfolioNotifications])

    const handleNavClick = useCallback(
      (item: NavItem) => {
        if (item.disabled) return

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }

        // Handle deep linking if enabled
        if (item.deepLinkData) {
          handleDeepLink(item)
        } else {
          router.push(item.href)
        }
      },
      [router, handleDeepLink]
    )

    const handlePortfolioSwitch = useCallback(
      (portfolioId: string) => {
        onPortfolioChange?.(portfolioId)
        setShowPortfolioMenu(false)

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      },
      [onPortfolioChange]
    )

    const handleSharePortfolio = useCallback(() => {
      if (!activePortfolioId) return

      if (navigator.share) {
        navigator.share({
          title: 'LifeDash Portefølje',
          text: 'Se min investeringsportefølje',
          url: generatePortfolioShareLink(activePortfolioId),
        })
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(
          generatePortfolioShareLink(activePortfolioId)
        )
      }

      onSharePortfolio?.(activePortfolioId)
    }, [activePortfolioId, generatePortfolioShareLink, onSharePortfolio])

    const handleNotificationClick = useCallback(() => {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }

      onNotificationClick?.()
    }, [onNotificationClick])

    const handleFabClick = useCallback(() => {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }

      onFabClick?.()
    }, [onFabClick])

    return (
      <>
        {/* Bottom Navigation Bar */}
        <RenderErrorBoundary>
          <div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 backdrop-blur-md',
              'safe-area-inset-bottom',
              className
            )}
          >
            <div className="flex items-center justify-between px-2 py-2">
              {navigationItems.map(item => {
                return (
                  <MobileNavItemMemo
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    portfolioBadges={portfolioBadges}
                    onNavClick={handleNavClick}
                  />
                )
              })}
            </div>

            {/* Portfolio Switcher */}
            {showPortfolioSwitcher && portfolios.length > 1 && (
              <RenderErrorBoundary>
                <div className="absolute left-0 right-0 top-0 -translate-y-full transform border-t border-gray-200 bg-white/95 p-2 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 overflow-x-auto">
                    {portfoliosLoading
                      ? // Loading skeleton for portfolio switcher
                        Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-8 w-24 animate-pulse rounded-md bg-gray-200"
                          />
                        ))
                      : portfolios.map(portfolio => {
                          const isActive = activePortfolioId === portfolio.id
                          const hasChange = portfolio.daily_change !== undefined

                          return (
                            <Button
                              key={portfolio.id}
                              variant={isActive ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                handlePortfolioSwitch(portfolio.id)
                              }
                              className="whitespace-nowrap"
                            >
                              {portfolio.name}
                              {hasChange && (
                                <span
                                  className={cn(
                                    'ml-1 text-xs',
                                    portfolio.daily_change >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  )}
                                >
                                  {portfolio.daily_change >= 0 ? '+' : ''}
                                  {portfolio.daily_change.toFixed(1)}%
                                </span>
                              )}
                            </Button>
                          )
                        })}
                  </div>
                </div>
              </RenderErrorBoundary>
            )}
          </div>
        </RenderErrorBoundary>

        {/* Floating Action Button */}
        {showFab && (
          <RenderErrorBoundary>
            <FloatingActionButton
              onClick={handleFabClick}
              showNotifications={showNotifications}
              notificationCount={filteredUnreadNotifications.length}
              onNotificationClick={handleNotificationClick}
              quickActions={quickActions}
              onSharePortfolio={handleSharePortfolio}
              showPortfolioActions={!!activePortfolioId}
            />
          </RenderErrorBoundary>
        )}
      </>
    )
  }
)

MobileNavigation.displayName = 'MobileNavigation'

export default MobileNavigation

// Top Navigation Bar for Mobile
export const MobileTopBar = memo(
  ({
    title,
    showBack = false,
    showSearch = false,
    showMenu = false,
    onBackClick,
    onSearchClick,
    onMenuClick,
    rightContent,
    className,
    loading = false,
  }: {
    title: string
    showBack?: boolean
    showSearch?: boolean
    showMenu?: boolean
    onBackClick?: () => void
    onSearchClick?: () => void
    onMenuClick?: () => void
    rightContent?: React.ReactNode
    className?: string
    loading?: boolean
  }) => {
    const handleBackClick = useCallback(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      onBackClick?.()
    }, [onBackClick])

    const handleSearchClick = useCallback(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      onSearchClick?.()
    }, [onSearchClick])

    const handleMenuClick = useCallback(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      onMenuClick?.()
    }, [onMenuClick])

    return (
      <div
        className={cn(
          'fixed left-0 right-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md',
          'safe-area-inset-top',
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="p-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
            )}
            {showMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMenuClick}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {loading ? (
              <div className="h-6 w-32 animate-pulse rounded-md bg-gray-200" />
            ) : (
              <h1 className="truncate text-xl font-semibold">{title}</h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
            ) : (
              <>
                {showSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSearchClick}
                    className="p-2"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
                {rightContent}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
)

MobileTopBar.displayName = 'MobileTopBar'

// Portfolio-specific Mobile Top Bar
export const MobilePortfolioTopBar = memo(
  ({
    portfolioName,
    portfolioValue,
    portfolioChange,
    portfolioChangePercent,
    showBack = true,
    showShare = true,
    showMenu = false,
    onBackClick,
    onShareClick,
    onMenuClick,
    className,
    currency = 'NOK',
    loading = false,
  }: {
    portfolioName: string
    portfolioValue: number
    portfolioChange?: number
    portfolioChangePercent?: number
    showBack?: boolean
    showShare?: boolean
    showMenu?: boolean
    onBackClick?: () => void
    onShareClick?: () => void
    onMenuClick?: () => void
    className?: string
    currency?: string
    loading?: boolean
  }) => {
    const formatCurrency = useMemo(() => {
      return (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      }
    }, [currency])

    const formatPercent = useCallback((value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    }, [])

    return (
      <div
        className={cn(
          'fixed left-0 right-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md',
          'safe-area-inset-top',
          className
        )}
      >
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackClick}
                  className="p-2"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>
              )}
              {showMenu && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMenuClick}
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200" />
              ) : (
                showShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShareClick}
                    className="p-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="text-center">
            {loading ? (
              <>
                <div className="mx-auto mb-1 h-5 w-40 animate-pulse rounded-md bg-gray-200" />
                <div className="mx-auto mb-1 h-8 w-48 animate-pulse rounded-md bg-gray-200" />
                <div className="mx-auto h-4 w-32 animate-pulse rounded-md bg-gray-200" />
              </>
            ) : (
              <>
                <h1 className="mb-1 text-lg font-semibold">{portfolioName}</h1>
                <div className="mb-1 text-2xl font-bold">
                  {formatCurrency(portfolioValue)}
                </div>
                {portfolioChange !== undefined &&
                  portfolioChangePercent !== undefined && (
                    <div
                      className={cn(
                        'flex items-center justify-center space-x-1 text-sm font-medium',
                        portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {portfolioChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{formatCurrency(portfolioChange)}</span>
                      <span>({formatPercent(portfolioChangePercent)})</span>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
)

MobilePortfolioTopBar.displayName = 'MobilePortfolioTopBar'
