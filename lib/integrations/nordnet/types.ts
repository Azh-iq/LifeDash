// Nordnet CSV Integration Types
// Defines TypeScript interfaces for Nordnet CSV parsing and data transformation

export interface NordnetCSVRow {
  // Core transaction fields from Nordnet CSV
  Id: string
  Bokføringsdag: string
  Handelsdag: string
  Oppgjørsdag: string
  Portefølje: string
  Transaksjonstype: string
  Verdipapir: string
  ISIN: string
  Antall: string
  Kurs: string
  Rente: string
  'Totale Avgifter': string
  Valuta: string
  Beløp: string
  Kjøpsverdi: string
  Resultat: string
  'Totalt antall': string
  Saldo: string
  Vekslingskurs: string
  Transaksjonstekst: string
  Makuleringsddato: string
  Sluttseddelnummer: string
  Verifikasjonsnummer: string
  Kurtasje: string
  Valutakurs: string
  'Innledende rente': string
  [key: string]: string // Allow for additional fields
}

export interface NordnetParseResult {
  headers: string[]
  rows: NordnetCSVRow[]
  totalRows: number
  errors: string[]
  warnings: string[]
  detectedEncoding: string
  detectedDelimiter: string
  hasNorwegianCharacters: boolean
  portfolios: string[] // Unique portfolio names found
  transactionTypes: string[] // Unique transaction types found
  currencies: string[] // Unique currencies found
  isinCodes: string[] // Unique ISIN codes found
}

export interface NordnetFieldMapping {
  // Nordnet field to internal field mapping
  csvField: keyof NordnetCSVRow
  internalField: string
  required: boolean
  dataType: 'string' | 'number' | 'date' | 'boolean'
  validator?: (value: string) => boolean
  transformer?: (value: string) => any
}

export interface NordnetTransactionData {
  // Transformed transaction data for internal use
  id: string
  booking_date: string
  trade_date: string
  settlement_date: string
  portfolio_name: string
  transaction_type: string
  security_name: string
  isin: string
  quantity: number
  price: number
  interest: number
  total_fees: number
  currency: string
  amount: number
  cost_basis: number
  realized_pnl: number
  total_quantity: number
  balance: number
  exchange_rate: number
  transaction_text: string
  cancellation_date: string
  settlement_number: string
  verification_number: string
  commission: number
  currency_rate: number
  initial_interest: number

  // Additional computed fields
  internal_transaction_type: string
  account_name: string
  needs_stock_lookup: boolean
  validation_errors: string[]
  validation_warnings: string[]
}

export interface NordnetImportResult {
  success: boolean
  parsedRows: number
  transformedRows: number
  createdAccounts: number
  createdTransactions: number
  skippedRows: number
  errors: string[]
  warnings: string[]
  importBatchId: string
  processedData: NordnetTransactionData[]
}

export interface NordnetValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface NordnetPortfolioMapping {
  csvPortfolioName: string
  internalAccountName: string
  accountType: string
  currency: string
  platformId: string
  createIfNotExists: boolean
}

export interface NordnetImportConfig {
  // Configuration for Nordnet CSV import
  encoding: 'utf-8' | 'utf-16' | 'iso-8859-1' | 'windows-1252'
  delimiter: string
  skipRows: number
  portfolioMappings: NordnetPortfolioMapping[]
  duplicateTransactionHandling: 'skip' | 'update' | 'error'
  createMissingStocks: boolean
  validateISIN: boolean
  strictMode: boolean
  dateFormat: string
  currencyConversion: boolean
}

// Transaction type mappings from Nordnet to internal types
export const NORDNET_TRANSACTION_TYPES = {
  // Buy/Sell operations
  KJØPT: 'BUY',
  SALG: 'SELL',

  // Money movements
  'Overføring via Trustly': 'DEPOSIT',
  UTBETALING: 'WITHDRAWAL',
  Innskudd: 'DEPOSIT',
  Uttak: 'WITHDRAWAL',

  // Fees and costs
  FORSIKRINGSKOSTNAD: 'FEE',
  Kurtasje: 'FEE',
  Avgift: 'FEE',
  Kostnad: 'FEE',

  // Dividends and interest
  'Utbetaling aksjelån': 'DIVIDEND',
  Aksjeutbytte: 'DIVIDEND',
  Renter: 'INTEREST',
  Rentegevinst: 'INTEREST',

  // Corporate actions
  Aksjesplitt: 'SPLIT',
  Sammenslåing: 'MERGER',
  Utskilling: 'SPINOFF',

  // Transfers
  'Overføring inn': 'TRANSFER_IN',
  'Overføring ut': 'TRANSFER_OUT',

  // Tax
  Skatt: 'TAX',
  Kildeskatt: 'TAX',

  // Other
  Reinvestering: 'REINVESTMENT',
  Tilbakeføring: 'WITHDRAWAL', // Reversal -> Withdrawal (closest match)
  Justering: 'FEE', // Adjustment -> Fee (closest match)
  
  // Additional common Nordnet transaction types
  'Valutaveksling': 'WITHDRAWAL', // Currency exchange
  'Månedssparing': 'BUY', // Monthly savings plan
  'Utbytte': 'DIVIDEND', // Alternative dividend term
  'KJØP': 'BUY', // Alternative buy term
  'SALG': 'SELL', // Alternative sell term
} as const

// Common Nordnet portfolio patterns
export const NORDNET_PORTFOLIO_PATTERNS = {
  // Numeric portfolio IDs
  NUMERIC_ID: /^\d{8,12}$/,

  // Named portfolios
  NAMED_PORTFOLIO: /^[A-ZÆØÅa-zæøå\s\-_]{3,50}$/,

  // Account types
  PENSION_ACCOUNT: /IPS|pensjon|pension/i,
  SAVINGS_ACCOUNT: /spare|BSU|saving/i,
  INVESTMENT_ACCOUNT: /investering|invest|aksje/i,

  // Currency patterns
  CURRENCY_PATTERN: /^[A-Z]{3}$/,
}

// Norwegian character handling
export const NORWEGIAN_CHARS = {
  æ: 'ae',
  ø: 'oe',
  å: 'aa',
  Æ: 'AE',
  Ø: 'OE',
  Å: 'AA',
} as const

// ISIN validation regex
export const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

// Date format patterns used by Nordnet
export const NORDNET_DATE_FORMATS = [
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  'DD/MM/YYYY',
  'DD-MM-YYYY',
] as const

// Currency codes commonly used in Nordnet
export const NORDNET_CURRENCIES = [
  'NOK',
  'SEK',
  'DKK',
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'JPY',
] as const

// Export all transaction types for type safety
export type NordnetTransactionType = keyof typeof NORDNET_TRANSACTION_TYPES
export type InternalTransactionType =
  (typeof NORDNET_TRANSACTION_TYPES)[NordnetTransactionType]
