// DNB API Integration Types
// Defines TypeScript interfaces for DNB API integration and data transformation

export interface DNBAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  environment: 'sandbox' | 'production'
  baseUrl: string
}

export interface DNBTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface DNBAccount {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: string
  currency: string
  balance: number
  availableAmount: number
  creditLimit?: number
  interestRate?: number
  productName: string
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  lastUpdated: string
}

export interface DNBTransaction {
  transactionId: string
  accountId: string
  bookingDate: string
  valueDate: string
  amount: number
  currency: string
  description: string
  transactionType: string
  category?: string
  merchantName?: string
  merchantCategory?: string
  cardNumber?: string
  reference?: string
  balance?: number
  externalId?: string
}

export interface DNBTransactionResponse {
  transactions: DNBTransaction[]
  totalCount: number
  pageSize: number
  pageNumber: number
  hasMore: boolean
  nextPageUrl?: string
}

export interface DNBAccountResponse {
  accounts: DNBAccount[]
  totalCount: number
}

export interface DNBApiError {
  error: string
  error_description: string
  error_code?: string
  statusCode: number
  timestamp: string
}

export interface DNBAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  userId: string | null
  lastRefresh: number | null
}

export interface DNBSyncConfig {
  accountIds: string[]
  fromDate: string
  toDate: string
  pageSize: number
  includeBalance: boolean
  categories: string[]
  autoSync: boolean
  syncInterval: number // minutes
}

export interface DNBSyncResult {
  success: boolean
  accountsSynced: number
  transactionsSynced: number
  newTransactions: number
  updatedTransactions: number
  errors: string[]
  warnings: string[]
  lastSyncTime: string
  nextSyncTime: string
}

export interface DNBConnectionStatus {
  connected: boolean
  lastSync: string | null
  nextSync: string | null
  status: 'connected' | 'disconnected' | 'error' | 'expired'
  error?: string
  accountCount: number
  transactionCount: number
}

// Transaction type mappings from DNB to internal types
export const DNB_TRANSACTION_TYPES = {
  // Card transactions
  CARD_PAYMENT: 'PURCHASE',
  CARD_WITHDRAWAL: 'WITHDRAWAL',
  CARD_REFUND: 'REFUND',

  // Transfers
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  INTERNAL_TRANSFER: 'TRANSFER',

  // Direct debits and standing orders
  DIRECT_DEBIT: 'DIRECT_DEBIT',
  STANDING_ORDER: 'STANDING_ORDER',

  // Bank fees
  BANK_FEE: 'FEE',
  ACCOUNT_FEE: 'FEE',
  OVERDRAFT_FEE: 'FEE',

  // Interest
  INTEREST_CREDIT: 'INTEREST',
  INTEREST_DEBIT: 'INTEREST',

  // Salary and benefits
  SALARY: 'SALARY',
  PENSION: 'PENSION',
  BENEFITS: 'BENEFITS',

  // Loan payments
  LOAN_PAYMENT: 'LOAN_PAYMENT',
  MORTGAGE_PAYMENT: 'MORTGAGE_PAYMENT',

  // Other
  CASH_DEPOSIT: 'DEPOSIT',
  CASH_WITHDRAWAL: 'WITHDRAWAL',
  CHECK_PAYMENT: 'CHECK',
  CORRECTION: 'ADJUSTMENT',
  UNKNOWN: 'OTHER',
} as const

// DNB API endpoints
export const DNB_API_ENDPOINTS = {
  AUTH: '/auth/oauth/token',
  ACCOUNTS: '/accounts',
  TRANSACTIONS: '/accounts/{accountId}/transactions',
  BALANCE: '/accounts/{accountId}/balance',
  CUSTOMER: '/customer/info',
  REFRESH: '/auth/oauth/refresh',
} as const

// DNB OAuth scopes
export const DNB_OAUTH_SCOPES = [
  'read:accounts',
  'read:transactions',
  'read:balance',
  'read:customer',
] as const

// DNB API rate limits
export const DNB_RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 1000,
  REQUESTS_PER_DAY: 10000,
} as const

// DNB account types
export const DNB_ACCOUNT_TYPES = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT_CARD: 'CREDIT_CARD',
  LOAN: 'LOAN',
  INVESTMENT: 'INVESTMENT',
  PENSION: 'PENSION',
} as const

// Common DNB transaction categories
export const DNB_CATEGORIES = [
  'GROCERIES',
  'TRANSPORT',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'EDUCATION',
  'SHOPPING',
  'RESTAURANTS',
  'FUEL',
  'INSURANCE',
  'HOUSING',
  'INCOME',
  'TRANSFER',
  'INVESTMENT',
  'OTHER',
] as const

// Export all transaction types for type safety
export type DNBTransactionType = keyof typeof DNB_TRANSACTION_TYPES
export type InternalDNBTransactionType =
  (typeof DNB_TRANSACTION_TYPES)[DNBTransactionType]
export type DNBAccountType = keyof typeof DNB_ACCOUNT_TYPES
export type DNBCategory = (typeof DNB_CATEGORIES)[number]
