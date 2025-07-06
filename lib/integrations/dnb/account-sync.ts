// DNB Account Synchronization
// Handles synchronization of account data and transactions from DNB API

import { DNBApiClient } from './api-client'
import {
  DNBAccount,
  DNBTransaction,
  DNBSyncConfig,
  DNBSyncResult,
  DNB_TRANSACTION_TYPES,
  DNB_ACCOUNT_TYPES,
  InternalDNBTransactionType,
} from './types'

export interface TransformedDNBAccount {
  id: string
  name: string
  account_number: string
  account_type: string
  currency: string
  balance: number
  available_balance: number
  credit_limit?: number
  interest_rate?: number
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  platform_account_id: string
  last_synced: string
  metadata: {
    product_name: string
    original_type: string
    dnb_account_id: string
  }
}

export interface TransformedDNBTransaction {
  id: string
  account_id: string
  external_transaction_id: string
  booking_date: string
  value_date: string
  amount: number
  currency: string
  description: string
  transaction_type: string
  internal_transaction_type: InternalDNBTransactionType
  category?: string
  merchant_name?: string
  merchant_category?: string
  card_number?: string
  reference?: string
  balance_after?: number
  metadata: {
    original_type: string
    dnb_transaction_id: string
  }
  created_at: string
  updated_at: string
}

export interface DNBSyncStatistics {
  accounts_found: number
  accounts_created: number
  accounts_updated: number
  transactions_found: number
  transactions_created: number
  transactions_updated: number
  transactions_skipped: number
  sync_duration_ms: number
  last_sync_date: string
  errors: string[]
  warnings: string[]
}

export class DNBAccountSync {
  private apiClient: DNBApiClient
  private syncConfig: DNBSyncConfig

  constructor(apiClient: DNBApiClient, config: DNBSyncConfig) {
    this.apiClient = apiClient
    this.syncConfig = config
  }

  /**
   * Perform complete account and transaction synchronization
   */
  public async performFullSync(): Promise<DNBSyncResult> {
    const startTime = Date.now()
    const stats: DNBSyncStatistics = {
      accounts_found: 0,
      accounts_created: 0,
      accounts_updated: 0,
      transactions_found: 0,
      transactions_created: 0,
      transactions_updated: 0,
      transactions_skipped: 0,
      sync_duration_ms: 0,
      last_sync_date: new Date().toISOString(),
      errors: [],
      warnings: [],
    }

    try {
      // Step 1: Sync accounts
      const accounts = await this.syncAccounts(stats)

      // Step 2: Sync transactions for each account
      for (const account of accounts) {
        await this.syncAccountTransactions(account, stats)
      }

      // Step 3: Calculate sync duration
      stats.sync_duration_ms = Date.now() - startTime

      return this.createSyncResult(stats, true)
    } catch (error) {
      stats.errors.push(`Full sync failed: ${error}`)
      stats.sync_duration_ms = Date.now() - startTime
      return this.createSyncResult(stats, false)
    }
  }

  /**
   * Sync account information from DNB API
   */
  private async syncAccounts(
    stats: DNBSyncStatistics
  ): Promise<TransformedDNBAccount[]> {
    try {
      const dnbAccounts = await this.apiClient.getAccounts()
      stats.accounts_found = dnbAccounts.length

      const transformedAccounts: TransformedDNBAccount[] = []

      for (const dnbAccount of dnbAccounts) {
        try {
          const transformedAccount = this.transformAccount(dnbAccount)

          // Here you would typically save to database
          // For now, we'll just track statistics
          const existingAccount = await this.findExistingAccount(
            transformedAccount.platform_account_id
          )

          if (existingAccount) {
            stats.accounts_updated++
          } else {
            stats.accounts_created++
          }

          transformedAccounts.push(transformedAccount)
        } catch (error) {
          stats.errors.push(
            `Failed to sync account ${dnbAccount.accountId}: ${error}`
          )
        }
      }

      return transformedAccounts
    } catch (error) {
      stats.errors.push(`Failed to fetch accounts from DNB API: ${error}`)
      return []
    }
  }

  /**
   * Sync transactions for a specific account
   */
  private async syncAccountTransactions(
    account: TransformedDNBAccount,
    stats: DNBSyncStatistics
  ): Promise<void> {
    try {
      const transactions = await this.apiClient.getTransactions(
        account.platform_account_id,
        {
          fromDate: this.syncConfig.fromDate,
          toDate: this.syncConfig.toDate,
          pageSize: this.syncConfig.pageSize,
        }
      )

      stats.transactions_found += transactions.transactions.length

      for (const dnbTransaction of transactions.transactions) {
        try {
          const transformedTransaction = this.transformTransaction(
            dnbTransaction,
            account.id
          )

          // Check if transaction already exists
          const existingTransaction = await this.findExistingTransaction(
            transformedTransaction.external_transaction_id
          )

          if (existingTransaction) {
            // Update if different
            if (
              this.shouldUpdateTransaction(
                existingTransaction,
                transformedTransaction
              )
            ) {
              stats.transactions_updated++
            } else {
              stats.transactions_skipped++
            }
          } else {
            // Create new transaction
            stats.transactions_created++
          }
        } catch (error) {
          stats.errors.push(
            `Failed to sync transaction ${dnbTransaction.transactionId}: ${error}`
          )
        }
      }
    } catch (error) {
      stats.errors.push(
        `Failed to sync transactions for account ${account.id}: ${error}`
      )
    }
  }

  /**
   * Transform DNB account to internal format
   */
  private transformAccount(dnbAccount: DNBAccount): TransformedDNBAccount {
    // Map DNB account type to internal type
    const accountType = this.mapAccountType(dnbAccount.accountType)

    return {
      id: `dnb_${dnbAccount.accountId}`,
      name: dnbAccount.accountName || `DNB ${accountType} Account`,
      account_number: dnbAccount.accountNumber,
      account_type: accountType,
      currency: dnbAccount.currency,
      balance: dnbAccount.balance,
      available_balance: dnbAccount.availableAmount,
      credit_limit: dnbAccount.creditLimit,
      interest_rate: dnbAccount.interestRate,
      status: dnbAccount.status,
      platform_account_id: dnbAccount.accountId,
      last_synced: new Date().toISOString(),
      metadata: {
        product_name: dnbAccount.productName,
        original_type: dnbAccount.accountType,
        dnb_account_id: dnbAccount.accountId,
      },
    }
  }

  /**
   * Transform DNB transaction to internal format
   */
  private transformTransaction(
    dnbTransaction: DNBTransaction,
    accountId: string
  ): TransformedDNBTransaction {
    const internalType = this.mapTransactionType(dnbTransaction.transactionType)

    return {
      id: `dnb_${dnbTransaction.transactionId}`,
      account_id: accountId,
      external_transaction_id: dnbTransaction.transactionId,
      booking_date: dnbTransaction.bookingDate,
      value_date: dnbTransaction.valueDate,
      amount: dnbTransaction.amount,
      currency: dnbTransaction.currency,
      description: dnbTransaction.description,
      transaction_type: dnbTransaction.transactionType,
      internal_transaction_type: internalType,
      category: dnbTransaction.category,
      merchant_name: dnbTransaction.merchantName,
      merchant_category: dnbTransaction.merchantCategory,
      card_number: dnbTransaction.cardNumber,
      reference: dnbTransaction.reference,
      balance_after: dnbTransaction.balance,
      metadata: {
        original_type: dnbTransaction.transactionType,
        dnb_transaction_id: dnbTransaction.transactionId,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Map DNB account type to internal account type
   */
  private mapAccountType(dnbAccountType: string): string {
    const upperType = dnbAccountType.toUpperCase()

    if (upperType.includes('CHECKING') || upperType.includes('BRUKSKONTO')) {
      return 'CHECKING'
    }
    if (upperType.includes('SAVINGS') || upperType.includes('SPARE')) {
      return 'SAVINGS'
    }
    if (upperType.includes('CREDIT') || upperType.includes('KREDITTKORT')) {
      return 'CREDIT_CARD'
    }
    if (upperType.includes('LOAN') || upperType.includes('LÅN')) {
      return 'LOAN'
    }
    if (upperType.includes('INVESTMENT') || upperType.includes('INVESTERING')) {
      return 'INVESTMENT'
    }
    if (upperType.includes('PENSION') || upperType.includes('PENSJON')) {
      return 'PENSION'
    }

    return 'CHECKING' // Default
  }

  /**
   * Map DNB transaction type to internal transaction type
   */
  private mapTransactionType(
    dnbTransactionType: string
  ): InternalDNBTransactionType {
    const upperType = dnbTransactionType.toUpperCase()

    // Check for exact matches first
    for (const [dnbType, internalType] of Object.entries(
      DNB_TRANSACTION_TYPES
    )) {
      if (upperType.includes(dnbType)) {
        return internalType
      }
    }

    // Fallback logic for Norwegian terms
    if (upperType.includes('KORTBETALING') || upperType.includes('BETALING')) {
      return 'PURCHASE'
    }
    if (upperType.includes('UTTAK') || upperType.includes('WITHDRAWAL')) {
      return 'WITHDRAWAL'
    }
    if (upperType.includes('INNSKUDD') || upperType.includes('DEPOSIT')) {
      return 'DEPOSIT'
    }
    if (upperType.includes('OVERFØRING')) {
      return 'TRANSFER'
    }
    if (upperType.includes('LØNN') || upperType.includes('SALARY')) {
      return 'SALARY'
    }
    if (upperType.includes('RENTER') || upperType.includes('INTEREST')) {
      return 'INTEREST'
    }
    if (upperType.includes('GEBYR') || upperType.includes('AVGIFT')) {
      return 'FEE'
    }

    return 'OTHER' // Default fallback
  }

  /**
   * Find existing account by platform account ID
   */
  private async findExistingAccount(
    platformAccountId: string
  ): Promise<any | null> {
    // This would typically query your database
    // For now, return null to indicate no existing account
    return null
  }

  /**
   * Find existing transaction by external transaction ID
   */
  private async findExistingTransaction(
    externalTransactionId: string
  ): Promise<any | null> {
    // This would typically query your database
    // For now, return null to indicate no existing transaction
    return null
  }

  /**
   * Determine if transaction should be updated
   */
  private shouldUpdateTransaction(
    existing: any,
    updated: TransformedDNBTransaction
  ): boolean {
    // Compare key fields to determine if update is needed
    return (
      existing.amount !== updated.amount ||
      existing.description !== updated.description ||
      existing.balance_after !== updated.balance_after
    )
  }

  /**
   * Create sync result from statistics
   */
  private createSyncResult(
    stats: DNBSyncStatistics,
    success: boolean
  ): DNBSyncResult {
    return {
      success,
      accountsSynced: stats.accounts_found,
      transactionsSynced: stats.transactions_found,
      newTransactions: stats.transactions_created,
      updatedTransactions: stats.transactions_updated,
      errors: stats.errors,
      warnings: stats.warnings,
      lastSyncTime: stats.last_sync_date,
      nextSyncTime: new Date(
        Date.now() + this.syncConfig.syncInterval * 60000
      ).toISOString(),
    }
  }

  /**
   * Update sync configuration
   */
  public updateConfig(newConfig: Partial<DNBSyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...newConfig }
  }

  /**
   * Get current sync configuration
   */
  public getConfig(): DNBSyncConfig {
    return { ...this.syncConfig }
  }
}

/**
 * Factory function to create DNB sync instance
 */
export function createDNBSync(
  apiClient: DNBApiClient,
  config: DNBSyncConfig
): DNBAccountSync {
  return new DNBAccountSync(apiClient, config)
}
