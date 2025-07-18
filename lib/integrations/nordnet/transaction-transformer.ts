// Nordnet Transaction Transformer
// Transforms Nordnet transaction data to internal database format

import {
  NordnetTransactionData,
  NordnetImportResult,
  NordnetPortfolioMapping,
  NordnetImportConfig,
} from './types'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { Database } from '@/lib/types/database.types'

interface TransactionRecord {
  id: string
  user_id: string
  account_id: string
  stock_id?: string
  external_id: string
  transaction_type: string
  date: string
  settlement_date?: string
  quantity: number
  price?: number
  total_amount: number
  commission: number
  other_fees: number
  currency: string
  exchange_rate: number
  description?: string
  notes?: string
  data_source: string
  import_batch_id: string
}

interface AccountRecord {
  id: string
  user_id: string
  portfolio_id: string
  platform_id: string
  name: string
  currency: string
  account_type: string
}

export class NordnetTransactionTransformer {
  private supabase: ReturnType<typeof createClient<Database>>
  private importBatchId: string
  private userId: string
  private platformId: string

  constructor(
    userId: string,
    platformId: string,
    supabaseClient: ReturnType<typeof createClient<Database>>
  ) {
    this.userId = userId
    this.platformId = platformId
    this.supabase = supabaseClient
    this.importBatchId = uuidv4()
  }

  /**
   * Ensures Nordnet platform exists in database
   */
  private async ensureNordnetPlatform(): Promise<string> {
    // Check if Nordnet platform exists
    const { data: existingPlatform } = await this.supabase
      .from('platforms')
      .select('id')
      .eq('name', 'nordnet')
      .single()

    if (existingPlatform) {
      return existingPlatform.id
    }

    // Create Nordnet platform if it doesn't exist
    const { data: newPlatform, error } = await this.supabase
      .from('platforms')
      .insert({
        name: 'nordnet',
        display_name: 'Nordnet',
        type: 'BROKER',
        website_url: 'https://www.nordnet.no',
        csv_import_supported: true,
        default_currency: 'NOK',
        supported_currencies: ['NOK', 'SEK', 'DKK', 'EUR', 'USD'],
        supported_asset_classes: ['STOCK', 'ETF', 'FUND', 'BOND'],
        stock_commission: 99.0,
        country_code: 'NO',
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create Nordnet platform: ${error.message}`)
    }

    return newPlatform.id
  }

  /**
   * Transforms and imports Nordnet transaction data
   */
  async transformAndImport(
    transactions: NordnetTransactionData[],
    config: NordnetImportConfig
  ): Promise<NordnetImportResult> {
    console.log('🔧 TransformAndImport starting with', transactions.length, 'transactions')
    
    // Ensure config has default values
    if (!config.portfolioMappings) {
      config.portfolioMappings = []
    }
    
    const result: NordnetImportResult = {
      success: false,
      parsedRows: transactions.length,
      transformedRows: 0,
      createdAccounts: 0,
      createdTransactions: 0,
      skippedRows: 0,
      errors: [],
      warnings: [],
      importBatchId: this.importBatchId,
      processedData: transactions,
    }

    // Log sample of transactions for debugging
    console.log('🔍 Sample transactions:', transactions.slice(0, 3).map(t => ({
      id: t.id,
      type: t.transaction_type,
      internal_type: t.internal_transaction_type,
      amount: t.amount,
      currency: t.currency,
      portfolio: t.portfolio_name,
      validation_errors: t.validation_errors?.length || 0,
      validation_warnings: t.validation_warnings?.length || 0
    })))

    try {
      // Step 0: Ensure Nordnet platform exists
      const platformId = await this.ensureNordnetPlatform()
      this.platformId = platformId  // Update platform ID

      // Step 1: Create/get accounts for portfolios
      const accountMap = await this.createOrGetAccounts(
        transactions,
        config,
        result
      )

      // Step 2: Lookup or create stocks
      const stockMap = await this.lookupOrCreateStocks(
        transactions,
        config,
        result
      )

      // Step 3: Transform transactions to database format
      const transformedTransactions = await this.transformTransactions(
        transactions,
        accountMap,
        stockMap,
        result
      )

      // Step 4: Import transactions to database
      await this.importTransactions(transformedTransactions, config, result)

      result.success = result.errors.length === 0
      result.transformedRows = transformedTransactions.length
    } catch (error) {
      console.error('Transaction Transformer Error:', error)

      let errorMessage = 'Import failed: Unknown error'
      if (error instanceof Error) {
        errorMessage = `Import failed: ${error.message}`
        console.error('Error stack:', error.stack)

        // Log additional error details for debugging
        if ('code' in error) {
          console.error('Error code:', (error as any).code)
        }
        if ('details' in error) {
          console.error('Error details:', (error as any).details)
        }
        if ('hint' in error) {
          console.error('Error hint:', (error as any).hint)
        }
      }

      result.errors.push(errorMessage)
      result.success = false
    }

    return result
  }

  /**
   * Creates or gets accounts for portfolios
   */
  private async createOrGetAccounts(
    transactions: NordnetTransactionData[],
    config: NordnetImportConfig,
    result: NordnetImportResult
  ): Promise<Map<string, string>> {
    const accountMap = new Map<string, string>()
    const uniquePortfolios = [
      ...new Set(transactions.map(t => t.portfolio_name)),
    ]

    for (const portfolioName of uniquePortfolios) {
      try {
        // Check if account already exists
        const { data: existingAccount, error: findError } = await this.supabase
          .from('accounts')
          .select('id')
          .eq('user_id', this.userId)
          .eq('platform_id', this.platformId)
          .eq('name', portfolioName)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          throw findError
        }

        if (existingAccount) {
          accountMap.set(portfolioName, existingAccount.id)
          continue
        }

        // Create new account
        const portfolioMapping = this.findPortfolioMapping(
          portfolioName,
          config.portfolioMappings
        )
        const accountType = this.determineAccountType(portfolioName)
        const currency = this.determineCurrency(transactions, portfolioName)

        // Get or create portfolio
        const portfolioId = await this.getOrCreatePortfolio(portfolioName)

        const accountRecord: Omit<AccountRecord, 'id'> = {
          user_id: this.userId,
          portfolio_id: portfolioId,
          platform_id: this.platformId,
          name: portfolioMapping?.internalAccountName || portfolioName,
          currency,
          account_type: portfolioMapping?.accountType || accountType,
        }

        const { data: newAccount, error: createError } = await this.supabase
          .from('accounts')
          .insert(accountRecord)
          .select('id')
          .single()

        if (createError) {
          console.error('Account creation error:', createError)
          console.error('Account data:', accountRecord)
          throw createError
        }

        accountMap.set(portfolioName, newAccount.id)
        result.createdAccounts++
      } catch (error) {
        result.errors.push(
          `Failed to create account for portfolio '${portfolioName}': ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return accountMap
  }

  /**
   * Gets or creates a portfolio for the account
   */
  private async getOrCreatePortfolio(portfolioName: string): Promise<string> {
    // Check if portfolio exists
    const { data: existingPortfolio } = await this.supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', this.userId)
      .eq('name', portfolioName)
      .single()

    if (existingPortfolio) {
      return existingPortfolio.id
    }

    // Create new portfolio
    const { data: newPortfolio, error: createError } = await this.supabase
      .from('portfolios')
      .insert({
        user_id: this.userId,
        name: portfolioName,
        description: `Imported from Nordnet CSV`,
        currency: 'NOK', // Default for Nordnet
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Portfolio creation error:', createError)
      console.error('Portfolio data:', {
        user_id: this.userId,
        name: portfolioName,
        description: `Imported from Nordnet CSV`,
        currency: 'NOK',
      })
      throw createError
    }

    return newPortfolio.id
  }

  /**
   * Looks up or creates stocks in the database
   */
  private async lookupOrCreateStocks(
    transactions: NordnetTransactionData[],
    config: NordnetImportConfig,
    result: NordnetImportResult
  ): Promise<Map<string, string>> {
    const stockMap = new Map<string, string>()

    // Get unique stocks that need lookup
    const stockTransactions = transactions.filter(
      t => t.needs_stock_lookup && t.isin
    )
    const uniqueStocks = new Map<
      string,
      { isin: string; name: string; currency: string }
    >()

    for (const transaction of stockTransactions) {
      if (transaction.isin && !uniqueStocks.has(transaction.isin)) {
        uniqueStocks.set(transaction.isin, {
          isin: transaction.isin,
          name: transaction.security_name || 'Unknown',
          currency: transaction.currency,
        })
      }
    }

    for (const [isin, stockInfo] of uniqueStocks) {
      try {
        // Check if stock already exists
        const { data: existingStock, error: findError } = await this.supabase
          .from('stocks')
          .select('id')
          .eq('isin', isin)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          throw findError
        }

        if (existingStock) {
          stockMap.set(isin, existingStock.id)
          continue
        }

        // Create new stock if allowed
        if (config.createMissingStocks) {
          const extractedSymbol = this.extractSymbolFromName(stockInfo.name)
          const stockRecord = {
            symbol: extractedSymbol || isin.slice(-6), // Fallback to last 6 chars of ISIN
            exchange: this.determineExchange(isin, stockInfo.currency),
            name: stockInfo.name.slice(0, 255), // Ensure name isn't too long
            company_name: stockInfo.name.slice(0, 255),
            isin,
            currency: stockInfo.currency,
            asset_class: 'STOCK' as const,
            data_source: 'CSV_IMPORT' as const,
          }

          console.log('🔍 Creating stock:', stockRecord)

          const { data: newStock, error: createError } = await this.supabase
            .from('stocks')
            .insert(stockRecord)
            .select('id')
            .single()

          if (createError) {
            console.error('❌ Stock creation error details:', {
              error: createError,
              code: createError.code,
              message: createError.message,
              details: createError.details,
              hint: createError.hint,
              stockRecord
            })
            throw new Error(`Database error: ${createError.message} (Code: ${createError.code})`)
          }

          console.log('✅ Stock created successfully:', newStock.id)
          stockMap.set(isin, newStock.id)
        } else {
          result.warnings.push(
            `Stock with ISIN ${isin} not found and creation is disabled`
          )
        }
      } catch (error) {
        result.errors.push(
          `Failed to lookup/create stock for ISIN '${isin}': ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return stockMap
  }

  /**
   * Transforms transactions to database format
   */
  private async transformTransactions(
    transactions: NordnetTransactionData[],
    accountMap: Map<string, string>,
    stockMap: Map<string, string>,
    result: NordnetImportResult
  ): Promise<TransactionRecord[]> {
    const transformedTransactions: TransactionRecord[] = []

    for (const transaction of transactions) {
      try {
        // Skip if validation errors
        if (transaction.validation_errors.length > 0) {
          result.skippedRows++
          result.errors.push(
            ...transaction.validation_errors.map(
              e => `Transaction ${transaction.id}: ${e}`
            )
          )
          continue
        }

        const accountId = accountMap.get(transaction.portfolio_name)
        if (!accountId) {
          result.skippedRows++
          result.errors.push(
            `No account found for portfolio: ${transaction.portfolio_name}`
          )
          continue
        }

        let stockId: string | undefined
        if (transaction.needs_stock_lookup && transaction.isin) {
          stockId = stockMap.get(transaction.isin)
          if (!stockId) {
            result.skippedRows++
            result.warnings.push(`No stock found for ISIN: ${transaction.isin}`)
            continue
          }
        }

        // Validate required fields before creating transaction record
        if (!transaction.internal_transaction_type) {
          result.skippedRows++
          result.errors.push(
            `Transaction ${transaction.id}: Missing internal transaction type`
          )
          continue
        }

        if (!transaction.booking_date) {
          result.skippedRows++
          result.errors.push(
            `Transaction ${transaction.id}: Missing booking date`
          )
          continue
        }

        if (transaction.amount === null || transaction.amount === undefined) {
          result.skippedRows++
          result.errors.push(`Transaction ${transaction.id}: Missing amount`)
          continue
        }

        if (!transaction.currency) {
          result.skippedRows++
          result.errors.push(`Transaction ${transaction.id}: Missing currency`)
          continue
        }

        const transformedTransaction: TransactionRecord = {
          id: uuidv4(),
          user_id: this.userId,
          account_id: accountId,
          stock_id: stockId,
          external_id: transaction.id || '',
          transaction_type: transaction.internal_transaction_type,
          date: transaction.booking_date,
          settlement_date: transaction.settlement_date || undefined,
          quantity: transaction.quantity || 0,
          price: transaction.price || undefined,
          total_amount: transaction.amount,
          commission: transaction.commission || 0,
          other_fees: Math.max(
            0,
            (transaction.total_fees || 0) - (transaction.commission || 0)
          ),
          currency: transaction.currency,
          exchange_rate: Math.max(0.0001, transaction.exchange_rate || 1.0), // Ensure positive
          description:
            transaction.transaction_text ||
            transaction.security_name ||
            'CSV Import',
          notes: this.generateNotes(transaction),
          data_source: 'CSV_IMPORT',
          import_batch_id: this.importBatchId,
        }

        transformedTransactions.push(transformedTransaction)
      } catch (error) {
        result.skippedRows++
        result.errors.push(
          `Failed to transform transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return transformedTransactions
  }

  /**
   * Imports transactions to the database
   */
  private async importTransactions(
    transactions: TransactionRecord[],
    config: NordnetImportConfig,
    result: NordnetImportResult
  ): Promise<void> {
    const batchSize = 100 // Process in batches to avoid timeout

    console.log(`🔍 Starting import of ${transactions.length} transactions in batches of ${batchSize}`)

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing batch ${batchNumber} with ${batch.length} transactions`)

      try {
        // Check for duplicates if configured
        if (config.duplicateTransactionHandling === 'skip') {
          console.log('🔍 Filtering duplicates...')
          const filteredBatch = await this.filterDuplicates(batch)
          
          if (filteredBatch.length === 0) {
            console.log(`⏭️ Batch ${batchNumber} skipped - all transactions are duplicates`)
            continue
          }

          console.log(`📝 Inserting ${filteredBatch.length} unique transactions (batch ${batchNumber})`)
          console.log('🔍 Sample transaction:', JSON.stringify(filteredBatch[0], null, 2))

          const { data, error } = await this.supabase
            .from('transactions')
            .insert(filteredBatch)
            .select('id')

          if (error) {
            console.error(`❌ Transaction batch ${batchNumber} insert error:`, {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            console.error('❌ Failed batch data (first 3):', filteredBatch.slice(0, 3))
            throw new Error(`Database error in batch ${batchNumber}: ${error.message} (Code: ${error.code})`)
          }

          console.log(`✅ Batch ${batchNumber} inserted successfully: ${data?.length || filteredBatch.length} transactions`)
          result.createdTransactions += filteredBatch.length
        } else {
          console.log(`📝 Inserting ${batch.length} transactions (batch ${batchNumber}, no duplicate filtering)`)
          
          const { data, error } = await this.supabase
            .from('transactions')
            .insert(batch)
            .select('id')

          if (error) {
            console.error(`❌ Transaction batch ${batchNumber} insert error (no duplicate filtering):`, {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            console.error('❌ Failed batch data (first 3):', batch.slice(0, 3))
            throw new Error(`Database error in batch ${batchNumber}: ${error.message} (Code: ${error.code})`)
          }

          console.log(`✅ Batch ${batchNumber} inserted successfully: ${data?.length || batch.length} transactions`)
          result.createdTransactions += batch.length
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Batch ${batchNumber} failed:`, error)
        result.errors.push(`Failed to import batch ${batchNumber}: ${errorMsg}`)
        
        // Continue with next batch instead of failing completely
        continue
      }
    }

    console.log(`🎉 Transaction import completed: ${result.createdTransactions} transactions created`)
  }

  /**
   * Filters out duplicate transactions
   */
  private async filterDuplicates(
    transactions: TransactionRecord[]
  ): Promise<TransactionRecord[]> {
    const externalIds = transactions.map(t => t.external_id)

    const { data: existingTransactions } = await this.supabase
      .from('transactions')
      .select('external_id')
      .in('external_id', externalIds)
      .eq('user_id', this.userId)

    const existingIds = new Set(
      existingTransactions?.map(t => t.external_id) || []
    )

    return transactions.filter(t => !existingIds.has(t.external_id))
  }

  /**
   * Helper methods
   */
  private findPortfolioMapping(
    portfolioName: string,
    mappings?: NordnetPortfolioMapping[]
  ): NordnetPortfolioMapping | undefined {
    if (!mappings || mappings.length === 0) return undefined
    return mappings.find(m => m.csvPortfolioName === portfolioName)
  }

  private determineAccountType(portfolioName: string): string {
    const name = portfolioName.toLowerCase()

    if (name.includes('ips') || name.includes('pensjon')) return 'PENSION'
    if (name.includes('spare') || name.includes('bsu')) return 'SAVINGS'
    if (name.includes('isk')) return 'TFSA'

    return 'TAXABLE' // Default
  }

  private determineCurrency(
    transactions: NordnetTransactionData[],
    portfolioName: string
  ): string {
    // Find most common currency for this portfolio
    const portfolioTransactions = transactions.filter(
      t => t.portfolio_name === portfolioName
    )
    const currencyCount = new Map<string, number>()

    for (const transaction of portfolioTransactions) {
      const currency = transaction.currency
      currencyCount.set(currency, (currencyCount.get(currency) || 0) + 1)
    }

    if (currencyCount.size === 0) return 'NOK' // Default for Nordnet

    // Return most common currency
    return Array.from(currencyCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
  }

  private extractSymbolFromName(name: string): string | null {
    // Extract ticker symbol from security name
    // This is a best-effort approach
    const patterns = [
      /\(([A-Z]{1,6})\)/, // Symbol in parentheses
      /([A-Z]{1,6})\s*-/, // Symbol before dash
      /^([A-Z]{1,6})\s/, // Symbol at start
    ]

    for (const pattern of patterns) {
      const match = name.match(pattern)
      if (match) return match[1]
    }

    // Fallback: use first word in uppercase if it looks like a symbol
    const firstWord = name.split(' ')[0].toUpperCase()
    if (firstWord.length >= 1 && firstWord.length <= 6 && /^[A-Z]+$/.test(firstWord)) {
      return firstWord
    }

    return null // No valid symbol found
  }

  private determineExchange(isin: string, currency: string): string {
    // Determine exchange based on ISIN country code and currency
    const countryCode = isin.slice(0, 2)
    
    switch (countryCode) {
      case 'US': return 'NASDAQ' // US stocks
      case 'CA': return 'TSX'    // Canadian stocks
      case 'GB': return 'LSE'    // UK stocks
      case 'DE': return 'XETRA'  // German stocks
      case 'FR': return 'EPA'    // French stocks
      case 'NL': return 'AMS'    // Dutch stocks
      case 'NO': return 'OSL'    // Norwegian stocks
      case 'SE': return 'STO'    // Swedish stocks
      case 'DK': return 'CPH'    // Danish stocks
      case 'FI': return 'HEL'    // Finnish stocks
      case 'CH': return 'SWX'    // Swiss stocks
      case 'IT': return 'MIL'    // Italian stocks
      case 'ES': return 'BME'    // Spanish stocks
      case 'AU': return 'ASX'    // Australian stocks
      case 'JP': return 'TYO'    // Japanese stocks
      case 'HK': return 'HKG'    // Hong Kong stocks
      case 'SG': return 'SGX'    // Singapore stocks
      default:
        // Fallback based on currency
        switch (currency) {
          case 'USD': return 'NASDAQ'
          case 'EUR': return 'XETRA'
          case 'GBP': return 'LSE'
          case 'CAD': return 'TSX'
          case 'NOK': return 'OSL'
          case 'SEK': return 'STO'
          case 'DKK': return 'CPH'
          default: return 'OTHER'
        }
    }
  }

  private generateNotes(transaction: NordnetTransactionData): string {
    const notes: string[] = []

    if (transaction.transaction_text) {
      notes.push(transaction.transaction_text)
    }

    if (transaction.verification_number) {
      notes.push(`Verification: ${transaction.verification_number}`)
    }

    if (transaction.settlement_number) {
      notes.push(`Settlement: ${transaction.settlement_number}`)
    }

    if (transaction.validation_warnings.length > 0) {
      notes.push(`Warnings: ${transaction.validation_warnings.join(', ')}`)
    }

    return notes.join(' | ')
  }

  /**
   * Static helper to generate default import configuration
   */
  static generateDefaultConfig(): NordnetImportConfig {
    return {
      encoding: 'utf-8',
      delimiter: '\t',
      skipRows: 0,
      portfolioMappings: [],
      duplicateTransactionHandling: 'skip',
      createMissingStocks: true,
      validateISIN: true,
      strictMode: false,
      dateFormat: 'YYYY-MM-DD',
      currencyConversion: false,
    }
  }

  /**
   * Validates import configuration
   */
  static validateConfig(config: NordnetImportConfig): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate encoding
    const validEncodings = ['utf-8', 'utf-16', 'iso-8859-1', 'windows-1252']
    if (!validEncodings.includes(config.encoding)) {
      errors.push(`Invalid encoding: ${config.encoding}`)
    }

    // Validate delimiter
    if (!config.delimiter || config.delimiter.length === 0) {
      errors.push('Delimiter cannot be empty')
    }

    // Validate skip rows
    if (config.skipRows < 0) {
      errors.push('Skip rows cannot be negative')
    }

    // Validate duplicate handling
    const validDuplicateHandling = ['skip', 'update', 'error']
    if (!validDuplicateHandling.includes(config.duplicateTransactionHandling)) {
      errors.push(
        `Invalid duplicate handling: ${config.duplicateTransactionHandling}`
      )
    }

    // Validate portfolio mappings
    for (const mapping of config.portfolioMappings) {
      if (!mapping.csvPortfolioName || !mapping.internalAccountName) {
        errors.push(
          'Portfolio mapping must have both CSV and internal account names'
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
