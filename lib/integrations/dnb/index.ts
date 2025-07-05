// DNB Integration Module
// Export all DNB API integration functionality

// Core API client and sync
export { DNBApiClient } from './api-client'
export { DNBAccountSync, createDNBSync } from './account-sync'

// Types and interfaces
export type {
  DNBAuthConfig,
  DNBTokenResponse,
  DNBAccount,
  DNBTransaction,
  DNBTransactionResponse,
  DNBAccountResponse,
  DNBApiError,
  DNBAuthState,
  DNBSyncConfig,
  DNBSyncResult,
  DNBConnectionStatus,
  DNBTransactionType,
  InternalDNBTransactionType,
  DNBAccountType,
  DNBCategory
} from './types'

export type {
  TransformedDNBAccount,
  TransformedDNBTransaction,
  DNBSyncStatistics
} from './account-sync'

// Constants and enums
export {
  DNB_TRANSACTION_TYPES,
  DNB_API_ENDPOINTS,
  DNB_OAUTH_SCOPES,
  DNB_RATE_LIMITS,
  DNB_ACCOUNT_TYPES,
  DNB_CATEGORIES
} from './types'

// Utility functions
export class DNBUtils {
  /**
   * Creates a default DNB API configuration for Norwegian environment
   */
  static createDefaultConfig(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): DNBAuthConfig {
    const baseUrl = environment === 'production' 
      ? 'https://api.dnb.no'
      : 'https://api-sandbox.dnb.no'

    return {
      clientId,
      clientSecret,
      redirectUri,
      scope: ['read:accounts', 'read:transactions', 'read:balance', 'read:customer'],
      environment,
      baseUrl
    }
  }

  /**
   * Creates a default sync configuration
   */
  static createDefaultSyncConfig(): DNBSyncConfig {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      accountIds: [], // Empty means all accounts
      fromDate: thirtyDaysAgo.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0],
      pageSize: 100,
      includeBalance: true,
      categories: [],
      autoSync: false,
      syncInterval: 60 // 1 hour
    }
  }

  /**
   * Validates DNB API credentials
   */
  static validateConfig(config: DNBAuthConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.clientId) errors.push('Client ID is required')
    if (!config.clientSecret) errors.push('Client Secret is required')
    if (!config.redirectUri) errors.push('Redirect URI is required')
    if (!config.baseUrl) errors.push('Base URL is required')
    
    // Validate redirect URI format
    try {
      new URL(config.redirectUri)
    } catch {
      errors.push('Redirect URI must be a valid URL')
    }

    // Validate base URL format
    try {
      new URL(config.baseUrl)
    } catch {
      errors.push('Base URL must be a valid URL')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Formats Norwegian currency amounts
   */
  static formatNorwegianCurrency(amount: number, currency: string = 'NOK'): string {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Normalizes Norwegian bank account numbers
   */
  static normalizeAccountNumber(accountNumber: string): string {
    // Remove all non-digit characters
    const digits = accountNumber.replace(/\D/g, '')
    
    // Norwegian account numbers are typically 11 digits
    if (digits.length === 11) {
      // Format as XXXX.XX.XXXXX
      return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
    }
    
    return accountNumber // Return original if not standard format
  }

  /**
   * Validates Norwegian account number using modulo-11 check
   */
  static validateNorwegianAccountNumber(accountNumber: string): { valid: boolean; error?: string } {
    const digits = accountNumber.replace(/\D/g, '')
    
    if (digits.length !== 11) {
      return { valid: false, error: 'Norwegian account numbers must be 11 digits' }
    }

    // Modulo-11 validation
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0
    
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * weights[i]
    }
    
    const remainder = sum % 11
    const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 11 : 11 - remainder
    
    if (checkDigit === 11 || parseInt(digits[10]) !== checkDigit) {
      return { valid: false, error: 'Invalid account number checksum' }
    }
    
    return { valid: true }
  }

  /**
   * Categorizes transactions based on description and merchant
   */
  static categorizeTransaction(
    description: string, 
    merchantName?: string, 
    merchantCategory?: string
  ): string {
    const desc = description.toLowerCase()
    const merchant = merchantName?.toLowerCase() || ''
    const category = merchantCategory?.toLowerCase() || ''

    // Grocery stores
    if (desc.includes('rema') || desc.includes('ica') || desc.includes('kiwi') || 
        desc.includes('meny') || desc.includes('coop') || category.includes('grocery')) {
      return 'GROCERIES'
    }

    // Transportation
    if (desc.includes('ruter') || desc.includes('nsb') || desc.includes('vy') ||
        desc.includes('drivstoff') || desc.includes('bensin') || category.includes('transport')) {
      return 'TRANSPORT'
    }

    // Utilities
    if (desc.includes('strøm') || desc.includes('vann') || desc.includes('internett') ||
        desc.includes('telenor') || desc.includes('telia') || category.includes('utilities')) {
      return 'UTILITIES'
    }

    // Restaurants
    if (desc.includes('restaurant') || desc.includes('café') || desc.includes('bar') ||
        category.includes('restaurant') || category.includes('food')) {
      return 'RESTAURANTS'
    }

    // Shopping
    if (desc.includes('elkjøp') || desc.includes('expert') || desc.includes('amazon') ||
        category.includes('retail') || category.includes('shopping')) {
      return 'SHOPPING'
    }

    // Healthcare
    if (desc.includes('apotek') || desc.includes('legevakt') || desc.includes('tannlege') ||
        category.includes('healthcare') || category.includes('medical')) {
      return 'HEALTHCARE'
    }

    // Entertainment
    if (desc.includes('kino') || desc.includes('netflix') || desc.includes('spotify') ||
        category.includes('entertainment')) {
      return 'ENTERTAINMENT'
    }

    // Income
    if (desc.includes('lønn') || desc.includes('salary') || desc.includes('inntekt')) {
      return 'INCOME'
    }

    // Housing
    if (desc.includes('husleie') || desc.includes('boliglån') || desc.includes('rent')) {
      return 'HOUSING'
    }

    return 'OTHER'
  }

  /**
   * Calculates account performance metrics
   */
  static calculateAccountMetrics(transactions: any[]): {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    avgTransactionAmount: number
    transactionCount: number
    categoryBreakdown: Record<string, number>
  } {
    const metrics = {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      avgTransactionAmount: 0,
      transactionCount: transactions.length,
      categoryBreakdown: {} as Record<string, number>
    }

    for (const transaction of transactions) {
      const amount = transaction.amount || 0
      const category = transaction.category || 'OTHER'

      if (amount > 0) {
        metrics.totalIncome += amount
      } else {
        metrics.totalExpenses += Math.abs(amount)
      }

      metrics.netCashFlow += amount

      // Category breakdown
      if (!metrics.categoryBreakdown[category]) {
        metrics.categoryBreakdown[category] = 0
      }
      metrics.categoryBreakdown[category] += Math.abs(amount)
    }

    metrics.avgTransactionAmount = metrics.transactionCount > 0 
      ? metrics.netCashFlow / metrics.transactionCount 
      : 0

    return metrics
  }

  /**
   * Estimates data sync time based on account and transaction count
   */
  static estimateSyncTime(accountCount: number, estimatedTransactions: number): {
    estimatedMinutes: number
    description: string
  } {
    // Rough estimates based on API limits and processing
    const transactionsPerMinute = 500 // Conservative estimate
    const accountSetupTime = accountCount * 0.5 // 30 seconds per account
    const transactionTime = estimatedTransactions / transactionsPerMinute

    const totalMinutes = Math.ceil(accountSetupTime + transactionTime)

    let description = ''
    if (totalMinutes < 2) {
      description = 'Very quick sync'
    } else if (totalMinutes < 5) {
      description = 'Quick sync'
    } else if (totalMinutes < 15) {
      description = 'Moderate sync time'
    } else {
      description = 'Longer sync - please be patient'
    }

    return {
      estimatedMinutes: totalMinutes,
      description
    }
  }

  /**
   * Generates sync summary report
   */
  static generateSyncSummary(result: DNBSyncResult): string {
    const lines = [
      `DNB Sync ${result.success ? 'Completed Successfully' : 'Failed'}`,
      `─────────────────────────────────`,
      `Accounts synced: ${result.accountsSynced}`,
      `Transactions synced: ${result.transactionsSynced}`,
      `New transactions: ${result.newTransactions}`,
      `Updated transactions: ${result.updatedTransactions}`,
      ''
    ]

    if (result.errors.length > 0) {
      lines.push('❌ Errors:')
      result.errors.forEach(error => lines.push(`  • ${error}`))
      lines.push('')
    }

    if (result.warnings.length > 0) {
      lines.push('⚠️  Warnings:')
      result.warnings.forEach(warning => lines.push(`  • ${warning}`))
      lines.push('')
    }

    lines.push(`Last sync: ${result.lastSyncTime}`)
    if (result.nextSyncTime) {
      lines.push(`Next sync: ${result.nextSyncTime}`)
    }

    return lines.join('\n')
  }
}

/**
 * Factory function to create complete DNB integration
 */
export function createDNBClient(config: DNBAuthConfig): DNBApiClient {
  const validation = DNBUtils.validateConfig(config)
  if (!validation.valid) {
    throw new Error(`Invalid DNB configuration: ${validation.errors.join(', ')}`)
  }
  
  return new DNBApiClient(config)
}

/**
 * Quick setup function for Norwegian DNB integration
 */
export function setupDNBIntegration(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  environment: 'sandbox' | 'production' = 'sandbox'
): {
  client: DNBApiClient
  config: DNBAuthConfig
  defaultSyncConfig: DNBSyncConfig
} {
  const config = DNBUtils.createDefaultConfig(clientId, clientSecret, redirectUri, environment)
  const client = createDNBClient(config)
  const defaultSyncConfig = DNBUtils.createDefaultSyncConfig()

  return {
    client,
    config,
    defaultSyncConfig
  }
}