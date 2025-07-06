/**
 * Portfolio Components Library - LifeDash
 *
 * Comprehensive collection of portfolio management components with real-time updates,
 * advanced state management, and professional Norwegian financial UI.
 *
 * Features:
 * - Real-time portfolio state management
 * - Advanced holdings table with filtering and sorting
 * - Animated transaction history
 * - Quick action buttons with export functionality
 * - Responsive design with mobile-first approach
 * - Norwegian language and NOK currency formatting
 * - Professional investment theme with blue color scheme
 *
 * @author LifeDash Team
 * @version 1.0.0
 */

// =============================================================================
// CORE PORTFOLIO COMPONENTS
// =============================================================================

// Portfolio Header - Portfolio title, metadata, and navigation
export { default as PortfolioHeader } from './portfolio-header'
export type { PortfolioHeaderProps } from './portfolio-header'

// Portfolio Metrics - Key performance indicators and metrics
export { default as PortfolioMetrics } from './portfolio-metrics'
export type { PortfolioMetricsProps } from './portfolio-metrics'

// Portfolio Chart Section - Interactive performance charts
export { default as PortfolioChartSection } from './portfolio-chart-section'
export type { PortfolioChartSectionProps } from './portfolio-chart-section'

// Portfolio Sidebar - Navigation and secondary actions
export { default as PortfolioSidebar } from './portfolio-sidebar'
export type { PortfolioSidebarProps } from './portfolio-sidebar'

// =============================================================================
// NEW ADVANCED COMPONENTS
// =============================================================================

// Holdings Section - Advanced table with filtering, sorting, and search
export { default as HoldingsSection } from './holdings-section'

// Recent Activity - Animated transaction history display
export { default as RecentActivity } from './recent-activity'

// Quick Actions - Action buttons for common portfolio operations
export { default as QuickActions } from './quick-actions'

// =============================================================================
// COMPONENT COLLECTIONS
// =============================================================================

/**
 * Complete portfolio management UI collection
 */
export const PortfolioComponents = {
  // Layout and navigation
  Header: PortfolioHeader,
  Sidebar: PortfolioSidebar,

  // Data display and visualization
  Metrics: PortfolioMetrics,
  ChartSection: PortfolioChartSection,
  Holdings: HoldingsSection,
  Activity: RecentActivity,

  // Actions and controls
  QuickActions,
} as const

/**
 * Portfolio dashboard layout components
 */
export const PortfolioDashboard = {
  Header: PortfolioHeader,
  Metrics: PortfolioMetrics,
  Charts: PortfolioChartSection,
  Holdings: HoldingsSection,
  Activity: RecentActivity,
  Actions: QuickActions,
} as const

/**
 * Minimal portfolio view components
 */
export const PortfolioMinimal = {
  Header: PortfolioHeader,
  Metrics: PortfolioMetrics,
  Holdings: HoldingsSection,
  Actions: QuickActions,
} as const

// =============================================================================
// HOOKS AND STATE MANAGEMENT
// =============================================================================

// Re-export portfolio state management hooks
export {
  usePortfolioState,
  usePortfoliosState,
  type PortfolioWithMetrics,
  type HoldingWithMetrics,
  type UsePortfolioStateReturn,
  type UsePortfolioStateOptions,
} from '@/lib/hooks/use-portfolio-state'

export {
  useRealtimeUpdates,
  type PriceUpdate,
  type PortfolioUpdate,
  type HoldingUpdate,
  type RealtimeConnectionState,
  type UseRealtimeUpdatesReturn,
  type UseRealtimeUpdatesOptions,
} from '@/lib/hooks/use-realtime-updates'

export {
  useSmartRefresh,
  type UseSmartRefreshReturn,
  type UseSmartRefreshOptions,
  type RefreshConfig,
  type RefreshState,
} from '@/lib/hooks/use-smart-refresh'

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate portfolio performance metrics
 */
export function calculatePortfolioMetrics(holdings: HoldingWithMetrics[]) {
  const totalValue = holdings.reduce(
    (sum, holding) => sum + holding.current_value,
    0
  )
  const totalCost = holdings.reduce(
    (sum, holding) => sum + holding.quantity * holding.cost_basis,
    0
  )
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent =
    totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  const topHoldings = holdings
    .sort((a, b) => b.current_value - a.current_value)
    .slice(0, 5)

  const sectorAllocation: { [sector: string]: number } = {}
  holdings.forEach(holding => {
    const sector = holding.stocks?.sector || 'Ukjent'
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + holding.weight
  })

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    holdingsCount: holdings.length,
    topHoldings,
    sectorAllocation,
  }
}

/**
 * Format Norwegian currency
 */
export function formatNorwegianCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format Norwegian percentage
 */
export function formatNorwegianPercentage(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

/**
 * Get portfolio type label in Norwegian
 */
export function getPortfolioTypeLabel(type: string): string {
  switch (type) {
    case 'INVESTMENT':
      return 'Investering'
    case 'RETIREMENT':
      return 'Pensjon'
    case 'SAVINGS':
      return 'Sparing'
    case 'TRADING':
      return 'Trading'
    default:
      return type
  }
}

/**
 * Get portfolio type color scheme
 */
export function getPortfolioTypeColor(type: string): string {
  switch (type) {
    case 'INVESTMENT':
      return 'bg-blue-100 text-blue-800'
    case 'RETIREMENT':
      return 'bg-green-100 text-green-800'
    case 'SAVINGS':
      return 'bg-yellow-100 text-yellow-800'
    case 'TRADING':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Calculate holding weight in portfolio
 */
export function calculateHoldingWeight(
  holdingValue: number,
  totalPortfolioValue: number
): number {
  return totalPortfolioValue > 0
    ? (holdingValue / totalPortfolioValue) * 100
    : 0
}

/**
 * Determine if a holding is significant (>5% of portfolio)
 */
export function isSignificantHolding(weight: number): boolean {
  return weight >= 5
}

/**
 * Get holding performance color
 */
export function getHoldingPerformanceColor(gainLoss: number): string {
  if (gainLoss > 0) return 'text-green-600'
  if (gainLoss < 0) return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Format holding quantity for display
 */
export function formatHoldingQuantity(quantity: number): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(quantity)
}

/**
 * Generate portfolio summary text
 */
export function generatePortfolioSummary(
  portfolio: PortfolioWithMetrics
): string {
  const valueText = formatNorwegianCurrency(portfolio.total_value)
  const performanceText = formatNorwegianPercentage(
    portfolio.total_gain_loss_percent
  )
  const holdingsText = `${portfolio.holdings_count} beholdning${portfolio.holdings_count !== 1 ? 'er' : ''}`

  return `${portfolio.name}: ${valueText} (${performanceText}) med ${holdingsText}`
}

// =============================================================================
// COMPONENT CONFIGURATION
// =============================================================================

/**
 * Default portfolio component configuration
 */
export const DEFAULT_PORTFOLIO_CONFIG = {
  // Display options
  showMetrics: true,
  showCharts: true,
  showHoldings: true,
  showActivity: true,
  showQuickActions: true,

  // Table options
  holdingsPageSize: 25,
  activityPageSize: 10,
  showSmallHoldings: true,

  // Real-time options
  enableRealtime: true,
  refreshInterval: 30000,

  // Export options
  defaultExportFormat: 'csv',
  includeMetricsInExport: true,

  // Theme
  theme: 'light',
  currency: 'NOK',
  language: 'nb-NO',
} as const

/**
 * Portfolio component responsive breakpoints
 */
export const PORTFOLIO_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const

/**
 * Portfolio component animation settings
 */
export const PORTFOLIO_ANIMATIONS = {
  // Stagger timing
  staggerDelay: 0.1,

  // Duration settings
  fastDuration: 0.2,
  normalDuration: 0.3,
  slowDuration: 0.5,

  // Easing
  easeOut: [0.25, 0.46, 0.45, 0.94],
  easeInOut: [0.42, 0, 0.58, 1],

  // Scale settings
  hoverScale: 1.02,
  tapScale: 0.98,
} as const

// =============================================================================
// VERSION AND METADATA
// =============================================================================

export const PORTFOLIO_COMPONENTS_VERSION = '1.0.0'
export const PORTFOLIO_COMPONENTS_BUILD_DATE = new Date().toISOString()

/**
 * Portfolio components metadata
 */
export const PORTFOLIO_COMPONENTS_META = {
  name: 'LifeDash Portfolio Components',
  version: PORTFOLIO_COMPONENTS_VERSION,
  description: 'Professional Norwegian portfolio management components',
  author: 'LifeDash Team',
  license: 'Proprietary',
  features: [
    'Real-time portfolio state management',
    'Advanced holdings table with filtering and sorting',
    'Animated transaction history',
    'Quick action buttons with export functionality',
    'Responsive design with mobile-first approach',
    'Norwegian language and NOK currency formatting',
    'Professional investment theme with blue color scheme',
    'TypeScript support with comprehensive types',
    'Framer Motion animations',
    'Supabase integration with RLS policies',
  ],
  requirements: {
    react: '>=18.0.0',
    typescript: '>=4.9.0',
    tailwindcss: '>=3.0.0',
    framerMotion: '>=10.0.0',
    supabase: '>=2.0.0',
  },
} as const
