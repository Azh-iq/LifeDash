// State components for portfolio views
export { EmptyPortfolioState } from './empty-portfolio-state'
export { ErrorPortfolioState } from './error-portfolio-state'
export { LoadingPortfolioState } from './loading-portfolio-state'
export { PartialDataState } from './partial-data-state'
export { MobilePortfolioView } from './mobile-portfolio-view'

// Re-export default exports for backwards compatibility
export { default as EmptyPortfolioStateDefault } from './empty-portfolio-state'
export { default as ErrorPortfolioStateDefault } from './error-portfolio-state'
export { default as LoadingPortfolioStateDefault } from './loading-portfolio-state'
export { default as PartialDataStateDefault } from './partial-data-state'
export { default as MobilePortfolioViewDefault } from './mobile-portfolio-view'

// Common types used across state components
export interface HoldingWithStock {
  id: string
  symbol: string
  companyName: string
  platform: string
  account: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  totalCost: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  currency: string
  lastUpdate: string
}

export interface PortfolioStats {
  totalValue: number
  todayChange: number
  todayChangePercent: number
  totalPositions: number
  platforms: string[]
}

export interface StateComponentProps {
  className?: string
  onRetry?: () => void
  onRefresh?: () => void
}

export interface LoadingStateProps extends StateComponentProps {
  type?: 'initial' | 'data' | 'prices' | 'full'
  message?: string
  showProgress?: boolean
  progress?: number
}

export interface ErrorStateProps extends StateComponentProps {
  error?: string
  title?: string
  subtitle?: string
  showRetry?: boolean
  retryLabel?: string
}

export interface EmptyStateProps extends StateComponentProps {
  title?: string
  subtitle?: string
  description?: string
  onSetupPlatform?: () => void
  onManualSetup?: () => void
  onGoToPortfolios?: () => void
}

export interface PartialDataStateProps extends StateComponentProps {
  missingData?: string[]
  availableData?: string[]
  onContinueAnyway?: () => void
  onRetrySetup?: () => void
}

export interface MobilePortfolioViewProps extends StateComponentProps {
  holdings: HoldingWithStock[]
  portfolioStats: PortfolioStats
  selectedAccount?: any
  isLoading?: boolean
  pricesLoading?: boolean
}

// Utility functions for state components
export const formatCurrency = (amount: number, currency: string = 'NOK', locale: string = 'no-NO') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num: number, locale: string = 'no-NO') => {
  return new Intl.NumberFormat(locale).format(num)
}

export const getChangeColor = (change: number) => {
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}

export const getChangeBgColor = (change: number) => {
  if (change > 0) return 'bg-green-50 border-green-200'
  if (change < 0) return 'bg-red-50 border-red-200'
  return 'bg-gray-50 border-gray-200'
}

export const sortHoldings = (
  holdings: HoldingWithStock[],
  sortBy: 'value' | 'pnl' | 'symbol' = 'value',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  return [...holdings].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    switch (sortBy) {
      case 'value':
        aValue = a.marketValue
        bValue = b.marketValue
        break
      case 'pnl':
        aValue = a.unrealizedPnlPercent
        bValue = b.unrealizedPnlPercent
        break
      case 'symbol':
        aValue = a.symbol
        bValue = b.symbol
        break
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

export const groupHoldingsByPlatform = (holdings: HoldingWithStock[]) => {
  return holdings.reduce((acc, holding) => {
    if (!acc[holding.platform]) {
      acc[holding.platform] = []
    }
    acc[holding.platform].push(holding)
    return acc
  }, {} as Record<string, HoldingWithStock[]>)
}