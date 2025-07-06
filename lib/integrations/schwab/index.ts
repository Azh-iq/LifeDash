// Charles Schwab Integration Module
// Export all Schwab API integration functionality

// Core API client and synchronization
export { SchwabApiClient } from './api-client'
export { SchwabAccountSync, SchwabDataTransformer } from './account-sync'

// Types and interfaces
export type {
  SchwabAuthConfig,
  SchwabTokenResponse,
  SchwabAccount,
  SchwabPosition,
  SchwabTransaction,
  SchwabTransactionResponse,
  SchwabAccountResponse,
  SchwabPositionResponse,
  SchwabQuote,
  SchwabMarketHours,
  SchwabPriceHistory,
  SchwabPriceHistoryParams,
  SchwabOptionsChain,
  SchwabOptionsChainParams,
  SchwabApiError,
  SchwabAuthState,
  SchwabSyncConfig,
  SchwabSyncResult,
  SchwabConnectionStatus,
  SchwabRateLimitInfo,
  SchwabTransactionType,
  InternalSchwabTransactionType,
  SchwabAccountType,
  SchwabAssetType,
  SchwabCategory,
  SchwabMarket,
  SchwabExchange,
  SchwabScope,
} from './types'

// Account sync specific types
export type {
  SchwabAccountSyncOptions,
  SchwabDataTransformation,
  SchwabSyncStats,
} from './account-sync'

// Constants and enums
export {
  SCHWAB_TRANSACTION_TYPES,
  SCHWAB_API_ENDPOINTS,
  SCHWAB_OAUTH_SCOPES,
  SCHWAB_RATE_LIMITS,
  SCHWAB_ACCOUNT_TYPES,
  SCHWAB_ASSET_TYPES,
  SCHWAB_MARKETS,
  SCHWAB_CATEGORIES,
  SCHWAB_EXCHANGES,
} from './types'

// Utility functions and helper classes
export class SchwabUtils {
  /**
   * Creates a complete Schwab integration configuration with sensible defaults
   */
  static createDefaultConfig(): SchwabAuthConfig {
    return {
      clientId: process.env.SCHWAB_CLIENT_ID || '',
      clientSecret: process.env.SCHWAB_CLIENT_SECRET || '',
      redirectUri:
        process.env.SCHWAB_REDIRECT_URI ||
        'http://localhost:3000/api/auth/schwab/callback',
      scope: ['read', 'AccountAccess.read', 'MarketData.read'],
      environment:
        (process.env.SCHWAB_ENVIRONMENT as 'sandbox' | 'production') ||
        'sandbox',
      baseUrl: process.env.SCHWAB_BASE_URL || 'https://api.schwabapi.com',
    }
  }

  /**
   * Creates a default sync configuration
   */
  static createDefaultSyncConfig(): SchwabSyncConfig {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      accountIds: [],
      fromDate: thirtyDaysAgo.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0],
      pageSize: 100,
      includePositions: true,
      includeTransactions: true,
      includeOptions: false,
      transactionTypes: [],
      autoSync: false,
      syncInterval: 60, // minutes
      priceUpdateInterval: 15, // minutes
    }
  }

  /**
   * Creates default account sync options
   */
  static createDefaultSyncOptions(): SchwabAccountSyncOptions {
    return {
      syncPositions: true,
      syncTransactions: true,
      syncHistoricalData: false,
      updatePrices: true,
      calculatePerformance: true,
      batchSize: 100,
      maxRetries: 3,
    }
  }

  /**
   * Validates Schwab API configuration
   */
  static validateConfig(config: SchwabAuthConfig): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!config.clientId) {
      errors.push('Client ID is required')
    }

    if (!config.clientSecret) {
      errors.push('Client Secret is required')
    }

    if (!config.redirectUri) {
      errors.push('Redirect URI is required')
    } else {
      try {
        new URL(config.redirectUri)
      } catch {
        errors.push('Redirect URI must be a valid URL')
      }
    }

    if (!config.scope || config.scope.length === 0) {
      errors.push('At least one OAuth scope is required')
    }

    if (!config.baseUrl) {
      errors.push('Base URL is required')
    } else {
      try {
        new URL(config.baseUrl)
      } catch {
        errors.push('Base URL must be a valid URL')
      }
    }

    if (!['sandbox', 'production'].includes(config.environment)) {
      errors.push('Environment must be either "sandbox" or "production"')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Formats currency amounts for display
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * Formats percentage values
   */
  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  /**
   * Formats large numbers with appropriate suffixes
   */
  static formatLargeNumber(value: number): string {
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B'
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M'
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(1) + 'K'
    }
    return value.toString()
  }

  /**
   * Validates a stock symbol format
   */
  static validateSymbol(symbol: string): { valid: boolean; error?: string } {
    if (!symbol || symbol.length === 0) {
      return { valid: false, error: 'Symbol cannot be empty' }
    }

    if (symbol.length > 10) {
      return {
        valid: false,
        error: 'Symbol cannot be longer than 10 characters',
      }
    }

    if (!/^[A-Z]+$/.test(symbol)) {
      return {
        valid: false,
        error: 'Symbol must contain only uppercase letters',
      }
    }

    return { valid: true }
  }

  /**
   * Validates a CUSIP format
   */
  static validateCUSIP(cusip: string): { valid: boolean; error?: string } {
    if (!cusip || cusip.length !== 9) {
      return { valid: false, error: 'CUSIP must be 9 characters long' }
    }

    if (!/^[0-9A-Z]{8}[0-9]$/.test(cusip)) {
      return { valid: false, error: 'CUSIP format is invalid' }
    }

    // Validate CUSIP checksum
    const weights = [1, 2, 3, 4, 5, 6, 7, 8]
    let sum = 0

    for (let i = 0; i < 8; i++) {
      const char = cusip[i]
      let value: number

      if (char >= '0' && char <= '9') {
        value = parseInt(char)
      } else {
        value = char.charCodeAt(0) - 55 // A=10, B=11, ..., Z=35
      }

      sum += value * weights[i]
    }

    const checkDigit = parseInt(cusip[8])
    const calculatedCheckDigit = (10 - (sum % 10)) % 10

    if (checkDigit !== calculatedCheckDigit) {
      return { valid: false, error: 'CUSIP checksum is invalid' }
    }

    return { valid: true }
  }

  /**
   * Determines if the market is currently open
   */
  static isMarketOpen(marketHours?: SchwabMarketHours): boolean {
    if (!marketHours) return false

    const now = new Date()
    const currentTime = now.getTime()

    // Check regular market hours
    for (const session of marketHours.sessionHours.regularMarket) {
      const start = new Date(session.start).getTime()
      const end = new Date(session.end).getTime()

      if (currentTime >= start && currentTime <= end) {
        return true
      }
    }

    return false
  }

  /**
   * Calculates the next market open time
   */
  static getNextMarketOpen(marketHours?: SchwabMarketHours): Date | null {
    if (!marketHours) return null

    const now = new Date()
    const currentTime = now.getTime()
    let nextOpen: Date | null = null

    // Check regular market hours
    for (const session of marketHours.sessionHours.regularMarket) {
      const start = new Date(session.start)

      if (start.getTime() > currentTime) {
        if (!nextOpen || start < nextOpen) {
          nextOpen = start
        }
      }
    }

    return nextOpen
  }

  /**
   * Calculates portfolio diversity metrics
   */
  static calculatePortfolioDiversity(positions: SchwabPosition[]): {
    totalValue: number
    assetAllocation: Record<string, number>
    sectorAllocation: Record<string, number>
    topHoldings: Array<{ symbol: string; percentage: number }>
    diversityScore: number
  } {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
    const assetAllocation: Record<string, number> = {}
    const sectorAllocation: Record<string, number> = {}
    const holdings: Array<{ symbol: string; percentage: number }> = []

    for (const position of positions) {
      const percentage = (position.marketValue / totalValue) * 100

      // Asset allocation
      const assetType = position.instrument.assetType
      assetAllocation[assetType] =
        (assetAllocation[assetType] || 0) + percentage

      // Holdings
      holdings.push({
        symbol: position.symbol,
        percentage,
      })
    }

    // Sort holdings by percentage
    holdings.sort((a, b) => b.percentage - a.percentage)
    const topHoldings = holdings.slice(0, 10)

    // Calculate diversity score (simplified Herfindahl-Hirschman Index)
    const hhi = holdings.reduce(
      (sum, holding) => sum + Math.pow(holding.percentage, 2),
      0
    )
    const diversityScore = Math.max(0, 100 - hhi / 100)

    return {
      totalValue,
      assetAllocation,
      sectorAllocation,
      topHoldings,
      diversityScore,
    }
  }

  /**
   * Estimates trading costs for a transaction
   */
  static estimateTradingCosts(
    symbol: string,
    quantity: number,
    price: number,
    assetType: SchwabAssetType = 'EQUITY'
  ): {
    commission: number
    regulatoryFees: number
    totalCost: number
  } {
    let commission = 0
    let regulatoryFees = 0

    const tradeValue = quantity * price

    switch (assetType) {
      case 'EQUITY':
        // Schwab typically has $0 commission for online stock trades
        commission = 0
        // SEC fee: $0.00008 per dollar of principal
        regulatoryFees = tradeValue * 0.00008
        break

      case 'OPTION':
        // Options: $0.65 per contract
        commission = quantity * 0.65
        regulatoryFees = tradeValue * 0.00008
        break

      case 'MUTUAL_FUND':
        // Most mutual funds have $0 commission
        commission = 0
        regulatoryFees = 0
        break

      default:
        commission = 0
        regulatoryFees = 0
    }

    return {
      commission,
      regulatoryFees,
      totalCost: commission + regulatoryFees,
    }
  }

  /**
   * Generates import summary statistics for sync results
   */
  static generateSyncSummary(syncResult: SchwabSyncResult): {
    successRate: number
    totalDataPoints: number
    syncEfficiency: number
    errorRate: number
    recommendations: string[]
  } {
    const totalDataPoints =
      syncResult.accountsSynced +
      syncResult.transactionsSynced +
      syncResult.positionsSynced
    const successfulDataPoints = totalDataPoints - syncResult.errors.length
    const successRate =
      totalDataPoints > 0 ? (successfulDataPoints / totalDataPoints) * 100 : 0
    const errorRate =
      totalDataPoints > 0
        ? (syncResult.errors.length / totalDataPoints) * 100
        : 0

    // Calculate sync efficiency based on new vs updated data
    const newDataPoints = syncResult.newTransactions + syncResult.newPositions
    const updatedDataPoints =
      syncResult.updatedTransactions + syncResult.updatedPositions
    const syncEfficiency =
      totalDataPoints > 0
        ? (newDataPoints / (newDataPoints + updatedDataPoints)) * 100
        : 0

    const recommendations: string[] = []

    if (successRate < 95) {
      recommendations.push(
        'Consider investigating sync errors to improve reliability'
      )
    }

    if (syncResult.errors.length > 0) {
      recommendations.push(
        'Review error logs to identify common failure patterns'
      )
    }

    if (syncResult.warnings.length > 5) {
      recommendations.push(
        'High number of warnings detected - review sync configuration'
      )
    }

    if (syncEfficiency < 50) {
      recommendations.push(
        'Consider optimizing sync frequency to reduce redundant updates'
      )
    }

    return {
      successRate,
      totalDataPoints,
      syncEfficiency,
      errorRate,
      recommendations,
    }
  }
}

// Export convenience functions for quick integration
export const createSchwabClient = (
  config?: Partial<SchwabAuthConfig>
): SchwabApiClient => {
  const defaultConfig = SchwabUtils.createDefaultConfig()
  const finalConfig = { ...defaultConfig, ...config }
  return new SchwabApiClient(finalConfig)
}

export const createSchwabSync = (
  client: SchwabApiClient,
  config?: Partial<SchwabSyncConfig>
): SchwabAccountSync => {
  const defaultConfig = SchwabUtils.createDefaultSyncConfig()
  const finalConfig = { ...defaultConfig, ...config }
  return new SchwabAccountSync(client, finalConfig)
}

// Export default configuration objects
export const DEFAULT_SCHWAB_CONFIG = SchwabUtils.createDefaultConfig()
export const DEFAULT_SYNC_CONFIG = SchwabUtils.createDefaultSyncConfig()
export const DEFAULT_SYNC_OPTIONS = SchwabUtils.createDefaultSyncOptions()
