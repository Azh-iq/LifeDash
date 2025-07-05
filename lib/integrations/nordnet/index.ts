// Nordnet Integration Module
// Export all Nordnet CSV parsing and import functionality

// Core parser and types
export { NordnetCSVParser } from './csv-parser'
export { NordnetFieldMapper } from './field-mapping'
export { NordnetTransactionTransformer } from './transaction-transformer'

// Types and interfaces
export type {
  NordnetCSVRow,
  NordnetParseResult,
  NordnetFieldMapping,
  NordnetTransactionData,
  NordnetImportResult,
  NordnetValidationResult,
  NordnetPortfolioMapping,
  NordnetImportConfig,
  NordnetTransactionType,
  InternalTransactionType
} from './types'

// Constants and enums
export {
  NORDNET_TRANSACTION_TYPES,
  NORDNET_PORTFOLIO_PATTERNS,
  NORDNET_CURRENCIES,
  NORWEGIAN_CHARS,
  ISIN_PATTERN,
  NORDNET_DATE_FORMATS
} from './types'

// Test utilities (for development)
export { testNordnetParser, NordnetParserTester } from './test-parser'

// Utility functions
export class NordnetUtils {
  /**
   * Creates a complete Nordnet import configuration with sensible defaults
   */
  static createDefaultConfig(): NordnetImportConfig {
    return NordnetTransactionTransformer.generateDefaultConfig()
  }

  /**
   * Validates a file before attempting to parse it
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    return NordnetCSVParser.validateFile(file)
  }

  /**
   * Quick check if CSV text looks like Nordnet format
   */
  static looksLikeNordnetCSV(csvText: string): boolean {
    const lines = csvText.split('\n')
    if (lines.length < 2) return false

    const headers = lines[0].toLowerCase()
    const requiredHeaders = ['transaksjonstype', 'portefølje', 'beløp', 'valuta']
    
    return requiredHeaders.every(header => headers.includes(header))
  }

  /**
   * Estimates processing time based on file size
   */
  static estimateProcessingTime(rowCount: number): number {
    // Rough estimate: 1000 rows per second
    return Math.max(1, Math.ceil(rowCount / 1000))
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
   * Normalizes Norwegian text for search/comparison
   */
  static normalizeNorwegianText(text: string): string {
    return text
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'oe')
      .replace(/å/g, 'aa')
      .replace(/Æ/g, 'AE')
      .replace(/Ø/g, 'OE')
      .replace(/Å/g, 'AA')
      .toLowerCase()
      .trim()
  }

  /**
   * Extracts portfolio type from Nordnet portfolio name/ID
   */
  static inferPortfolioType(portfolioName: string): {
    type: string
    confidence: number
    description: string
  } {
    const name = portfolioName.toLowerCase()
    
    // IPS (Individual Pension Savings)
    if (name.includes('ips') || name.includes('pensjon')) {
      return {
        type: 'PENSION',
        confidence: 0.9,
        description: 'Individual Pension Savings (IPS)'
      }
    }
    
    // BSU (Housing Savings for Youth)
    if (name.includes('bsu') || name.includes('boligsparing')) {
      return {
        type: 'SAVINGS',
        confidence: 0.9,
        description: 'Housing Savings for Youth (BSU)'
      }
    }
    
    // ISK (Investment Savings Account)
    if (name.includes('isk') || name.includes('investeringssparing')) {
      return {
        type: 'TFSA',
        confidence: 0.8,
        description: 'Investment Savings Account (ISK)'
      }
    }
    
    // Regular savings
    if (name.includes('spare') || name.includes('saving')) {
      return {
        type: 'SAVINGS',
        confidence: 0.7,
        description: 'Savings Account'
      }
    }
    
    // Numeric ID - likely regular investment account
    if (/^\d+$/.test(portfolioName)) {
      return {
        type: 'TAXABLE',
        confidence: 0.6,
        description: 'Regular Investment Account'
      }
    }
    
    // Default
    return {
      type: 'TAXABLE',
      confidence: 0.5,
      description: 'Taxable Investment Account'
    }
  }

  /**
   * Validates ISIN code format and checksum
   */
  static validateISIN(isin: string): { valid: boolean; error?: string } {
    if (!isin || isin.length !== 12) {
      return { valid: false, error: 'ISIN must be 12 characters long' }
    }

    if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) {
      return { valid: false, error: 'ISIN format is invalid' }
    }

    // Validate checksum using Luhn algorithm
    const code = isin.slice(0, 11)
    const checkDigit = parseInt(isin.slice(11))
    
    let sum = 0
    let isEven = false
    
    // Convert letters to numbers and apply Luhn algorithm
    for (let i = code.length - 1; i >= 0; i--) {
      let digit = code.charCodeAt(i)
      
      if (digit >= 65 && digit <= 90) {
        // Letter: A=10, B=11, ..., Z=35
        digit = digit - 55
        
        // Handle two-digit numbers
        const tens = Math.floor(digit / 10)
        const ones = digit % 10
        
        if (isEven) {
          sum += tens + (ones * 2 > 9 ? ones * 2 - 9 : ones * 2)
        } else {
          sum += (tens * 2 > 9 ? tens * 2 - 9 : tens * 2) + ones
        }
        isEven = !isEven
      } else {
        // Digit
        digit = digit - 48
        if (isEven) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
      }
      
      isEven = !isEven
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10
    
    if (calculatedCheckDigit !== checkDigit) {
      return { valid: false, error: 'ISIN checksum is invalid' }
    }
    
    return { valid: true }
  }

  /**
   * Generates import summary statistics
   */
  static generateImportSummary(transformedData: NordnetTransactionData[]): {
    totalTransactions: number
    transactionTypes: Record<string, number>
    portfolios: Record<string, number>
    currencies: Record<string, number>
    dateRange: { start: string; end: string } | null
    totalAmount: Record<string, number>
    validationSummary: {
      valid: number
      warnings: number
      errors: number
    }
  } {
    const summary = {
      totalTransactions: transformedData.length,
      transactionTypes: {} as Record<string, number>,
      portfolios: {} as Record<string, number>,
      currencies: {} as Record<string, number>,
      dateRange: null as { start: string; end: string } | null,
      totalAmount: {} as Record<string, number>,
      validationSummary: { valid: 0, warnings: 0, errors: 0 }
    }

    let earliestDate: string | null = null
    let latestDate: string | null = null

    for (const transaction of transformedData) {
      // Count transaction types
      if (transaction.internal_transaction_type) {
        summary.transactionTypes[transaction.internal_transaction_type] = 
          (summary.transactionTypes[transaction.internal_transaction_type] || 0) + 1
      }

      // Count portfolios
      if (transaction.portfolio_name) {
        summary.portfolios[transaction.portfolio_name] = 
          (summary.portfolios[transaction.portfolio_name] || 0) + 1
      }

      // Count currencies and amounts
      if (transaction.currency) {
        summary.currencies[transaction.currency] = 
          (summary.currencies[transaction.currency] || 0) + 1
        
        if (transaction.amount) {
          summary.totalAmount[transaction.currency] = 
            (summary.totalAmount[transaction.currency] || 0) + Math.abs(transaction.amount)
        }
      }

      // Track date range
      if (transaction.booking_date) {
        if (!earliestDate || transaction.booking_date < earliestDate) {
          earliestDate = transaction.booking_date
        }
        if (!latestDate || transaction.booking_date > latestDate) {
          latestDate = transaction.booking_date
        }
      }

      // Count validation results
      if (transaction.validation_errors.length > 0) {
        summary.validationSummary.errors++
      } else if (transaction.validation_warnings.length > 0) {
        summary.validationSummary.warnings++
      } else {
        summary.validationSummary.valid++
      }
    }

    if (earliestDate && latestDate) {
      summary.dateRange = { start: earliestDate, end: latestDate }
    }

    return summary
  }
}