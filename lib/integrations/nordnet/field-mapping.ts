// Nordnet Field Mapping
// Intelligent mapping logic for Nordnet CSV fields to internal database structure

import {
  NordnetCSVRow,
  NordnetFieldMapping,
  NordnetTransactionData,
  NORDNET_TRANSACTION_TYPES,
  ISIN_PATTERN,
  NORDNET_DATE_FORMATS,
} from './types'

export class NordnetFieldMapper {
  /**
   * Default field mappings for Nordnet CSV to internal structure
   */
  static readonly DEFAULT_MAPPINGS: NordnetFieldMapping[] = [
    {
      csvField: 'Id',
      internalField: 'id',
      required: true,
      dataType: 'string',
      validator: (value: string) => value.length > 0 && /^\d+$/.test(value),
    },
    {
      csvField: 'Bokføringsdag',
      internalField: 'booking_date',
      required: true,
      dataType: 'date',
      transformer: (value: string) => this.parseNordnetDate(value),
    },
    {
      csvField: 'Handelsdag',
      internalField: 'trade_date',
      required: false,
      dataType: 'date',
      transformer: (value: string) => this.parseNordnetDate(value),
    },
    {
      csvField: 'Oppgjørsdag',
      internalField: 'settlement_date',
      required: false,
      dataType: 'date',
      transformer: (value: string) => this.parseNordnetDate(value),
    },
    {
      csvField: 'Portefølje',
      internalField: 'portfolio_name',
      required: true,
      dataType: 'string',
      validator: (value: string) => value.length > 0,
    },
    {
      csvField: 'Transaksjonstype',
      internalField: 'transaction_type',
      required: true,
      dataType: 'string',
      validator: (value: string) => value.length > 0,
      transformer: (value: string) =>
        NORDNET_TRANSACTION_TYPES[
          value as keyof typeof NORDNET_TRANSACTION_TYPES
        ] || value,
    },
    {
      csvField: 'Verdipapir',
      internalField: 'security_name',
      required: false,
      dataType: 'string',
    },
    {
      csvField: 'ISIN',
      internalField: 'isin',
      required: false,
      dataType: 'string',
      validator: (value: string) => !value || ISIN_PATTERN.test(value),
    },
    {
      csvField: 'Antall',
      internalField: 'quantity',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Kurs',
      internalField: 'price',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Rente',
      internalField: 'interest',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Totale Avgifter',
      internalField: 'total_fees',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Valuta',
      internalField: 'currency',
      required: true,
      dataType: 'string',
      validator: (value: string) => /^[A-Z]{3}$/.test(value),
    },
    {
      csvField: 'Beløp',
      internalField: 'amount',
      required: true,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Kjøpsverdi',
      internalField: 'cost_basis',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Resultat',
      internalField: 'realized_pnl',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Totalt antall',
      internalField: 'total_quantity',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Saldo',
      internalField: 'balance',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Vekslingskurs',
      internalField: 'exchange_rate',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Transaksjonstekst',
      internalField: 'transaction_text',
      required: false,
      dataType: 'string',
    },
    {
      csvField: 'Makuleringsddato',
      internalField: 'cancellation_date',
      required: false,
      dataType: 'date',
      transformer: (value: string) => this.parseNordnetDate(value),
    },
    {
      csvField: 'Sluttseddelnummer',
      internalField: 'settlement_number',
      required: false,
      dataType: 'string',
    },
    {
      csvField: 'Verifikasjonsnummer',
      internalField: 'verification_number',
      required: false,
      dataType: 'string',
    },
    {
      csvField: 'Kurtasje',
      internalField: 'commission',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Valutakurs',
      internalField: 'currency_rate',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
    {
      csvField: 'Innledende rente',
      internalField: 'initial_interest',
      required: false,
      dataType: 'number',
      transformer: (value: string) => this.parseNordnetNumber(value),
    },
  ]

  /**
   * Parses Nordnet date format to ISO string
   */
  private static parseNordnetDate(dateString: string): string | null {
    if (!dateString || dateString.trim() === '') {
      return null
    }

    // Try different date formats
    const formats = [
      // ISO format: YYYY-MM-DD
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // European format: DD.MM.YYYY
      /^(\d{2})\.(\d{2})\.(\d{4})$/,
      // European format: DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      // European format: DD-MM-YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/,
    ]

    for (const format of formats) {
      const match = dateString.match(format)
      if (match) {
        let year: number, month: number, day: number

        if (format === formats[0]) {
          // ISO format
          ;[, year, month, day] = match.map(Number)
        } else {
          // European formats
          ;[, day, month, year] = match.map(Number)
        }

        // Validate date components
        if (
          year < 1900 ||
          year > 2100 ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > 31
        ) {
          continue
        }

        try {
          const date = new Date(year, month - 1, day)
          if (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          ) {
            return date.toISOString().split('T')[0]
          }
        } catch {
          continue
        }
      }
    }

    console.warn(`Unable to parse date: ${dateString}`)
    return null
  }

  /**
   * Parses Nordnet number format to JavaScript number
   */
  private static parseNordnetNumber(numberString: string): number | null {
    if (!numberString || numberString.trim() === '') {
      return null
    }

    // Remove common thousand separators and replace decimal comma with dot
    let cleanNumber = numberString
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^\d,.-]/g, '') // Keep only digits, comma, dot, and minus
      .replace(/,(\d{3})/g, '$1') // Remove thousand separators (comma followed by 3 digits)
      .replace(/\.(\d{3})/g, '$1') // Remove thousand separators (dot followed by 3 digits)
      .replace(/,(\d{1,2})$/, '.$1') // Replace decimal comma with dot

    // Handle negative numbers
    const isNegative = cleanNumber.includes('-')
    cleanNumber = cleanNumber.replace('-', '')

    try {
      const number = parseFloat(cleanNumber)
      if (isNaN(number)) {
        return null
      }
      return isNegative ? -number : number
    } catch {
      console.warn(`Unable to parse number: ${numberString}`)
      return null
    }
  }

  /**
   * Transforms a Nordnet CSV row to internal transaction data
   */
  static transformRow(
    row: NordnetCSVRow,
    mappings: NordnetFieldMapping[] = this.DEFAULT_MAPPINGS
  ): NordnetTransactionData {
    const result: Partial<NordnetTransactionData> = {}
    const validationErrors: string[] = []
    const validationWarnings: string[] = []

    // Apply field mappings
    for (const mapping of mappings) {
      const value = row[mapping.csvField]

      if (mapping.required && (!value || value.trim() === '')) {
        validationErrors.push(
          `Required field '${mapping.csvField}' is missing or empty`
        )
        continue
      }

      if (value && value.trim() !== '') {
        // Apply validator if present
        if (mapping.validator && !mapping.validator(value)) {
          validationErrors.push(
            `Invalid value for '${mapping.csvField}': ${value}`
          )
          continue
        }

        // Apply transformer if present
        let transformedValue: any = value
        if (mapping.transformer) {
          try {
            transformedValue = mapping.transformer(value)
          } catch (error) {
            validationErrors.push(
              `Error transforming '${mapping.csvField}': ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            continue
          }
        }

        // Type conversion
        switch (mapping.dataType) {
          case 'number':
            if (typeof transformedValue === 'string') {
              const numValue = this.parseNordnetNumber(transformedValue)
              if (numValue === null && mapping.required) {
                validationErrors.push(
                  `Cannot convert '${mapping.csvField}' to number: ${transformedValue}`
                )
              } else {
                result[mapping.internalField as keyof NordnetTransactionData] =
                  numValue
              }
            } else {
              result[mapping.internalField as keyof NordnetTransactionData] =
                transformedValue
            }
            break

          case 'date':
            if (typeof transformedValue === 'string') {
              const dateValue = this.parseNordnetDate(transformedValue)
              if (dateValue === null && mapping.required) {
                validationErrors.push(
                  `Cannot convert '${mapping.csvField}' to date: ${transformedValue}`
                )
              } else {
                result[mapping.internalField as keyof NordnetTransactionData] =
                  dateValue
              }
            } else {
              result[mapping.internalField as keyof NordnetTransactionData] =
                transformedValue
            }
            break

          case 'boolean':
            const boolValue = this.parseBoolean(transformedValue)
            result[mapping.internalField as keyof NordnetTransactionData] =
              boolValue
            break

          default:
            result[mapping.internalField as keyof NordnetTransactionData] =
              transformedValue
        }
      }
    }

    // Add computed fields
    result.internal_transaction_type = this.determineInternalTransactionType(
      result.transaction_type as string
    )
    result.account_name = this.generateAccountName(
      result.portfolio_name as string
    )
    result.needs_stock_lookup = this.needsStockLookup(
      result.transaction_type as string
    )
    result.validation_errors = validationErrors
    result.validation_warnings = validationWarnings

    // Add additional validations
    this.addBusinessLogicValidations(
      result,
      validationErrors,
      validationWarnings
    )

    return result as NordnetTransactionData
  }

  /**
   * Parses boolean values from string
   */
  private static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      return ['true', '1', 'yes', 'y', 'ja', 'j'].includes(lower)
    }
    return false
  }

  /**
   * Determines the internal transaction type from Nordnet transaction type
   */
  private static determineInternalTransactionType(nordnetType: string): string {
    const mapped = NORDNET_TRANSACTION_TYPES[
      nordnetType as keyof typeof NORDNET_TRANSACTION_TYPES
    ]
    
    if (mapped) {
      return mapped
    }
    
    // Fallback logic for unmapped transaction types
    const typeLower = nordnetType.toLowerCase()
    
    // Check for common patterns
    if (typeLower.includes('kjøp') || typeLower.includes('buy')) return 'BUY'
    if (typeLower.includes('salg') || typeLower.includes('sell')) return 'SELL'
    if (typeLower.includes('utbytte') || typeLower.includes('dividend')) return 'DIVIDEND'
    if (typeLower.includes('rente') || typeLower.includes('interest')) return 'INTEREST'
    if (typeLower.includes('avgift') || typeLower.includes('fee')) return 'FEE'
    if (typeLower.includes('skatt') || typeLower.includes('tax')) return 'TAX'
    if (typeLower.includes('innskudd') || typeLower.includes('deposit')) return 'DEPOSIT'
    if (typeLower.includes('uttak') || typeLower.includes('withdrawal')) return 'WITHDRAWAL'
    
    // Default fallback - treat as fee/adjustment
    console.warn(`Unknown transaction type: "${nordnetType}", defaulting to FEE`)
    return 'FEE'
  }

  /**
   * Generates account name from portfolio name
   */
  private static generateAccountName(portfolioName: string): string {
    if (!portfolioName) return 'Unknown Account'

    // Check if it's a numeric portfolio ID
    if (/^\d+$/.test(portfolioName)) {
      return `Nordnet Account ${portfolioName}`
    }

    // Return as-is if it's already a descriptive name
    return portfolioName
  }

  /**
   * Determines if a transaction needs stock lookup
   */
  private static needsStockLookup(transactionType: string): boolean {
    const stockTransactionTypes = [
      'BUY',
      'SELL',
      'DIVIDEND',
      'SPLIT',
      'MERGER',
      'SPINOFF',
    ]
    return stockTransactionTypes.includes(transactionType)
  }

  /**
   * Adds business logic validations
   */
  private static addBusinessLogicValidations(
    transaction: Partial<NordnetTransactionData>,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate quantity for buy/sell transactions
    if (
      ['BUY', 'SELL'].includes(transaction.internal_transaction_type as string)
    ) {
      if (!transaction.quantity || transaction.quantity <= 0) {
        errors.push('Buy/Sell transactions must have positive quantity')
      }

      if (!transaction.price || transaction.price <= 0) {
        errors.push('Buy/Sell transactions must have positive price')
      }
    }

    // Validate amount consistency
    if (transaction.quantity && transaction.price) {
      const expectedAmount = Math.abs(transaction.quantity * transaction.price)
      const actualAmount = Math.abs(transaction.amount || 0)
      const tolerance = expectedAmount * 0.01 // 1% tolerance

      if (Math.abs(expectedAmount - actualAmount) > tolerance) {
        warnings.push(
          `Amount (${actualAmount}) doesn't match quantity × price (${expectedAmount})`
        )
      }
    }

    // Validate ISIN for stock transactions
    if (transaction.needs_stock_lookup && transaction.isin) {
      if (!ISIN_PATTERN.test(transaction.isin)) {
        errors.push(`Invalid ISIN format: ${transaction.isin}`)
      }
    }

    // Validate currency
    if (transaction.currency && !/^[A-Z]{3}$/.test(transaction.currency)) {
      errors.push(`Invalid currency format: ${transaction.currency}`)
    }

    // Validate dates
    if (transaction.booking_date && transaction.trade_date) {
      const bookingDate = new Date(transaction.booking_date)
      const tradeDate = new Date(transaction.trade_date)

      if (bookingDate < tradeDate) {
        warnings.push('Booking date is before trade date')
      }
    }
  }

  /**
   * Automatically detects field mappings based on CSV headers
   */
  static autoDetectMappings(headers: string[]): NordnetFieldMapping[] {
    const detectedMappings: NordnetFieldMapping[] = []

    // Create a mapping of lowercase headers to original headers
    const headerMap = new Map<string, string>()
    headers.forEach(header => {
      headerMap.set(header.toLowerCase().trim(), header)
    })

    // Try to match each default mapping
    for (const defaultMapping of this.DEFAULT_MAPPINGS) {
      const csvFieldLower = defaultMapping.csvField.toLowerCase()

      // Direct match
      if (headerMap.has(csvFieldLower)) {
        detectedMappings.push({
          ...defaultMapping,
          csvField: headerMap.get(csvFieldLower)! as keyof NordnetCSVRow,
        })
        continue
      }

      // Fuzzy match
      for (const [headerLower, originalHeader] of headerMap) {
        if (
          headerLower.includes(csvFieldLower) ||
          csvFieldLower.includes(headerLower)
        ) {
          detectedMappings.push({
            ...defaultMapping,
            csvField: originalHeader as keyof NordnetCSVRow,
          })
          break
        }
      }
    }

    return detectedMappings
  }

  /**
   * Validates field mappings
   */
  static validateMappings(
    mappings: NordnetFieldMapping[],
    headers: string[]
  ): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check that all mapped fields exist in headers
    for (const mapping of mappings) {
      if (!headers.includes(mapping.csvField as string)) {
        errors.push(
          `Mapped field '${mapping.csvField}' not found in CSV headers`
        )
      }
    }

    // Check that all required mappings are present
    const requiredMappings = this.DEFAULT_MAPPINGS.filter(m => m.required)
    for (const requiredMapping of requiredMappings) {
      const hasMapping = mappings.some(
        m => m.internalField === requiredMapping.internalField
      )
      if (!hasMapping) {
        errors.push(
          `Required mapping for '${requiredMapping.internalField}' is missing`
        )
      }
    }

    // Check for duplicate mappings
    const usedFields = new Set<string>()
    for (const mapping of mappings) {
      if (usedFields.has(mapping.internalField)) {
        errors.push(
          `Duplicate mapping for internal field '${mapping.internalField}'`
        )
      }
      usedFields.add(mapping.internalField)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generates mapping suggestions based on field names
   */
  static generateMappingSuggestions(headers: string[]): Array<{
    csvField: string
    suggestedInternalField: string
    confidence: number
  }> {
    const suggestions: Array<{
      csvField: string
      suggestedInternalField: string
      confidence: number
    }> = []

    // Keywords for field matching
    const fieldKeywords = {
      id: ['id', 'identifier', 'number'],
      date: ['date', 'dato', 'dag'],
      type: ['type', 'typ', 'art'],
      security: ['security', 'verdipapir', 'instrument'],
      isin: ['isin', 'code', 'symbol'],
      quantity: ['quantity', 'antall', 'antal', 'amount'],
      price: ['price', 'kurs', 'rate'],
      currency: ['currency', 'valuta', 'curr'],
      fee: ['fee', 'avgift', 'cost', 'gebyr'],
      portfolio: ['portfolio', 'portefølje', 'account', 'konto'],
    }

    for (const header of headers) {
      const headerLower = header.toLowerCase()

      for (const [fieldType, keywords] of Object.entries(fieldKeywords)) {
        for (const keyword of keywords) {
          if (headerLower.includes(keyword)) {
            const confidence = keyword.length / headerLower.length
            suggestions.push({
              csvField: header,
              suggestedInternalField: fieldType,
              confidence,
            })
            break
          }
        }
      }
    }

    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }
}
