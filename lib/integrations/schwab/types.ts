// Charles Schwab API Integration Types
// Defines TypeScript interfaces for Schwab API integration and data transformation

export interface SchwabAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  environment: 'sandbox' | 'production'
  baseUrl: string
}

export interface SchwabTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

export interface SchwabAccount {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: string
  primaryOwner: string
  closingBalances: {
    totalCash: number
    totalSecurities: number
    totalValue: number
    pendingDeposits: number
    availableFunds: number
    buyingPower: number
    dayTradingBuyingPower: number
    maintenanceRequirement: number
    marginBalance: number
    shortBalance: number
    regTCallAmount: number
  }
  currency: string
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  lastUpdated: string
  isDayTrader: boolean
  isClosingOnlyRestricted: boolean
  roundTrips: number
}

export interface SchwabPosition {
  symbol: string
  cusip: string
  description: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  dayPnL: number
  dayPnLPercent: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  instrument: {
    assetType:
      | 'EQUITY'
      | 'OPTION'
      | 'MUTUAL_FUND'
      | 'CASH_EQUIVALENT'
      | 'FIXED_INCOME'
      | 'CURRENCY'
    cusip: string
    symbol: string
    description: string
    netChange: number
    type: string
    fundamental?: {
      symbol: string
      high52: number
      low52: number
      dividendAmount: number
      dividendYield: number
      dividendDate: string
      peRatio: number
      pegRatio: number
      pbRatio: number
      prRatio: number
      pcfRatio: number
      grossMarginTTM: number
      grossMarginMRQ: number
      netProfitMarginTTM: number
      netProfitMarginMRQ: number
      operatingMarginTTM: number
      operatingMarginMRQ: number
      returnOnEquity: number
      returnOnAssets: number
      returnOnInvestment: number
      quickRatio: number
      currentRatio: number
      interestCoverage: number
      totalDebtToCapital: number
      ltDebtToEquity: number
      totalDebtToEquity: number
      epsTTM: number
      epsChangePercentTTM: number
      epsChangeYear: number
      epsChange: number
      revChangeYear: number
      revChangeTTM: number
      revChangeIn: number
      sharesOutstanding: number
      marketCapFloat: number
      marketCap: number
      bookValuePerShare: number
      shortIntToFloat: number
      shortIntDayToCover: number
      divGrowthRate3Year: number
      dividendPayAmount: number
      dividendPayDate: string
      beta: number
      vol1DayAvg: number
      vol10DayAvg: number
      vol3MonthAvg: number
    }
  }
  lastUpdated: string
}

export interface SchwabTransaction {
  transactionId: string
  accountId: string
  transactionDate: string
  settleDate: string
  type: string
  subAccount: string
  description: string
  transactionItem: {
    accountId: string
    amount: number
    price: number
    cost: number
    instruction:
      | 'BUY'
      | 'SELL'
      | 'DEPOSIT'
      | 'WITHDRAWAL'
      | 'TRANSFER'
      | 'DIVIDEND'
      | 'INTEREST'
      | 'FEE'
      | 'ADJUSTMENT'
    instrument: {
      assetType:
        | 'EQUITY'
        | 'OPTION'
        | 'MUTUAL_FUND'
        | 'CASH_EQUIVALENT'
        | 'FIXED_INCOME'
        | 'CURRENCY'
      cusip: string
      symbol: string
      description: string
      netChange: number
      type: string
    }
  }
  fees: {
    rFee: number
    additionalFee: number
    cdscFee: number
    regFee: number
    otherCharges: number
    commission: number
    optRegFee: number
    secFee: number
  }
  netAmount: number
  activityType: string
  transferItems?: Array<{
    instrument: {
      assetType: string
      cusip: string
      symbol: string
      description: string
    }
    amount: number
    cost: number
    price: number
    feeType: string
    positionEffect: string
  }>
}

export interface SchwabTransactionResponse {
  transactions: SchwabTransaction[]
  totalCount: number
  pageSize: number
  pageNumber: number
  hasMore: boolean
  nextPageUrl?: string
}

export interface SchwabAccountResponse {
  accounts: SchwabAccount[]
  totalCount: number
}

export interface SchwabPositionResponse {
  positions: SchwabPosition[]
  totalCount: number
}

export interface SchwabQuote {
  symbol: string
  assetType:
    | 'EQUITY'
    | 'OPTION'
    | 'MUTUAL_FUND'
    | 'CASH_EQUIVALENT'
    | 'FIXED_INCOME'
    | 'CURRENCY'
  assetMainType: string
  cusip: string
  description: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  lastPrice: number
  lastSize: number
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  netChange: number
  totalVolume: number
  tradeTimeInLong: number
  quoteTimeInLong: number
  mark: number
  exchange: string
  exchangeName: string
  marginable: boolean
  shortable: boolean
  volatility: number
  digits: number
  '52WkHigh': number
  '52WkLow': number
  nAV: number
  peRatio: number
  divAmount: number
  divYield: number
  divDate: string
  securityStatus: string
  regularMarketLastPrice: number
  regularMarketLastSize: number
  regularMarketNetChange: number
  regularMarketTradeTimeInLong: number
  netPercentChangeInDouble: number
  markChangeInDouble: number
  markPercentChangeInDouble: number
  regularMarketPercentChangeInDouble: number
  delayed: boolean
}

export interface SchwabMarketHours {
  category: string
  date: string
  exchange: string
  isOpen: boolean
  marketType: string
  product: string
  productName: string
  sessionHours: {
    preMarket: Array<{
      start: string
      end: string
    }>
    regularMarket: Array<{
      start: string
      end: string
    }>
    postMarket: Array<{
      start: string
      end: string
    }>
  }
}

export interface SchwabApiError {
  error: string
  error_description: string
  error_code?: string
  statusCode: number
  timestamp: string
  message?: string
}

export interface SchwabAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  userId: string | null
  lastRefresh: number | null
  scope: string[]
}

export interface SchwabSyncConfig {
  accountIds: string[]
  fromDate: string
  toDate: string
  pageSize: number
  includePositions: boolean
  includeTransactions: boolean
  includeOptions: boolean
  transactionTypes: string[]
  autoSync: boolean
  syncInterval: number // minutes
  priceUpdateInterval: number // minutes
}

export interface SchwabSyncResult {
  success: boolean
  accountsSynced: number
  transactionsSynced: number
  positionsSynced: number
  newTransactions: number
  updatedTransactions: number
  newPositions: number
  updatedPositions: number
  errors: string[]
  warnings: string[]
  lastSyncTime: string
  nextSyncTime: string
  dataStats: {
    totalValue: number
    totalCash: number
    totalSecurities: number
    positionCount: number
    transactionCount: number
  }
}

export interface SchwabConnectionStatus {
  connected: boolean
  lastSync: string | null
  nextSync: string | null
  status: 'connected' | 'disconnected' | 'error' | 'expired' | 'rate_limited'
  error?: string
  accountCount: number
  transactionCount: number
  positionCount: number
  rateLimitStatus: {
    remainingRequests: number
    resetTime: string
    currentUsage: number
  }
}

export interface SchwabRateLimitInfo {
  limit: number
  remaining: number
  reset: number
  used: number
  window: number
}

// Transaction type mappings from Schwab to internal types
export const SCHWAB_TRANSACTION_TYPES = {
  // Equity transactions
  BUY: 'BUY',
  SELL: 'SELL',
  SELL_SHORT: 'SELL_SHORT',
  BUY_TO_COVER: 'BUY_TO_COVER',

  // Options transactions
  BUY_TO_OPEN: 'BUY_TO_OPEN',
  SELL_TO_OPEN: 'SELL_TO_OPEN',
  BUY_TO_CLOSE: 'BUY_TO_CLOSE',
  SELL_TO_CLOSE: 'SELL_TO_CLOSE',

  // Cash transactions
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  INTERNAL_TRANSFER: 'TRANSFER',

  // Income transactions
  DIVIDEND: 'DIVIDEND',
  INTEREST: 'INTEREST',
  BOND_INTEREST: 'BOND_INTEREST',
  CAPITAL_GAINS: 'CAPITAL_GAINS',

  // Corporate actions
  STOCK_SPLIT: 'STOCK_SPLIT',
  STOCK_DIVIDEND: 'STOCK_DIVIDEND',
  SPIN_OFF: 'SPIN_OFF',
  MERGER: 'MERGER',
  RIGHTS: 'RIGHTS',
  TENDER: 'TENDER',

  // Fees and adjustments
  FEE: 'FEE',
  COMMISSION: 'COMMISSION',
  ADJUSTMENT: 'ADJUSTMENT',
  CORRECTION: 'CORRECTION',
  TAX_WITHHOLDING: 'TAX_WITHHOLDING',

  // Other
  UNKNOWN: 'OTHER',
} as const

// Schwab API endpoints
export const SCHWAB_API_ENDPOINTS = {
  // Authentication
  AUTH: '/v1/oauth/token',
  REFRESH: '/v1/oauth/token',
  REVOKE: '/v1/oauth/revoke',

  // Accounts
  ACCOUNTS: '/trader/v1/accounts',
  ACCOUNT_NUMBERS: '/trader/v1/accounts/accountNumbers',
  ACCOUNT_DETAILS: '/trader/v1/accounts/{accountId}',

  // Positions
  POSITIONS: '/trader/v1/accounts/{accountId}/positions',

  // Transactions
  TRANSACTIONS: '/trader/v1/accounts/{accountId}/transactions',
  TRANSACTION_DETAILS:
    '/trader/v1/accounts/{accountId}/transactions/{transactionId}',

  // Market Data
  QUOTES: '/marketdata/v1/quotes',
  QUOTE_SINGLE: '/marketdata/v1/{symbol}/quotes',
  PRICE_HISTORY: '/marketdata/v1/pricehistory',
  MARKET_HOURS: '/marketdata/v1/markets/{market}/hours',
  INSTRUMENTS: '/marketdata/v1/instruments',

  // Options
  OPTIONS_CHAINS: '/marketdata/v1/chains',
  OPTIONS_EXPIRATION: '/marketdata/v1/expirationchain',

  // Movers
  MOVERS: '/marketdata/v1/movers/{index}',

  // User preferences
  USER_PREFERENCES: '/trader/v1/userpreference',
} as const

// Schwab OAuth scopes
export const SCHWAB_OAUTH_SCOPES = [
  'read',
  'trade',
  'MarketData.read',
  'AccountAccess.read',
  'AccountAccess.write',
] as const

// Schwab API rate limits (requests per minute)
export const SCHWAB_RATE_LIMITS = {
  // Trading API limits
  ACCOUNT_REQUESTS_PER_MINUTE: 60,
  TRANSACTION_REQUESTS_PER_MINUTE: 60,
  POSITION_REQUESTS_PER_MINUTE: 60,

  // Market Data API limits (much stricter)
  MARKET_DATA_REQUESTS_PER_MINUTE: 120,
  QUOTE_REQUESTS_PER_MINUTE: 300,
  PRICE_HISTORY_REQUESTS_PER_MINUTE: 60,

  // Daily limits
  TOTAL_REQUESTS_PER_DAY: 10000,
  MARKET_DATA_REQUESTS_PER_DAY: 50000,

  // Burst limits
  BURST_REQUESTS_PER_SECOND: 10,

  // Back-off periods (in seconds)
  RATE_LIMIT_BACKOFF: 60,
  ERROR_BACKOFF: 30,
  RETRY_BACKOFF: 5,
} as const

// Schwab account types
export const SCHWAB_ACCOUNT_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  JOINT: 'JOINT',
  CORPORATE: 'CORPORATE',
  TRUST: 'TRUST',
  IRA: 'IRA',
  ROTH_IRA: 'ROTH_IRA',
  ROLLOVER_IRA: 'ROLLOVER_IRA',
  SEP_IRA: 'SEP_IRA',
  SIMPLE_IRA: 'SIMPLE_IRA',
  TRADITIONAL_401K: 'TRADITIONAL_401K',
  ROTH_401K: 'ROTH_401K',
  CUSTODIAL: 'CUSTODIAL',
  EDUCATION: 'EDUCATION',
  HSA: 'HSA',
} as const

// Schwab asset types
export const SCHWAB_ASSET_TYPES = {
  EQUITY: 'EQUITY',
  OPTION: 'OPTION',
  MUTUAL_FUND: 'MUTUAL_FUND',
  CASH_EQUIVALENT: 'CASH_EQUIVALENT',
  FIXED_INCOME: 'FIXED_INCOME',
  CURRENCY: 'CURRENCY',
  FUTURES: 'FUTURES',
  FOREX: 'FOREX',
  INDEX: 'INDEX',
  ETF: 'ETF',
  CRYPTOCURRENCY: 'CRYPTOCURRENCY',
} as const

// Schwab market categories
export const SCHWAB_MARKETS = {
  EQUITY: 'equity',
  OPTION: 'option',
  FUTURE: 'future',
  BOND: 'bond',
  FOREX: 'forex',
} as const

// Common Schwab transaction categories for portfolio management
export const SCHWAB_CATEGORIES = [
  'EQUITY_PURCHASE',
  'EQUITY_SALE',
  'DIVIDEND_INCOME',
  'INTEREST_INCOME',
  'CAPITAL_GAINS',
  'OPTIONS_TRADING',
  'MUTUAL_FUNDS',
  'ETFS',
  'BONDS',
  'CASH_MANAGEMENT',
  'FEES_AND_COMMISSIONS',
  'TRANSFERS',
  'DEPOSITS',
  'WITHDRAWALS',
  'CORPORATE_ACTIONS',
  'TAX_TRANSACTIONS',
  'OTHER',
] as const

// US market exchanges supported by Schwab
export const SCHWAB_EXCHANGES = {
  NYSE: 'New York Stock Exchange',
  NASDAQ: 'NASDAQ',
  AMEX: 'American Stock Exchange',
  CBOE: 'Chicago Board Options Exchange',
  CME: 'Chicago Mercantile Exchange',
  NYMEX: 'New York Mercantile Exchange',
  CBOT: 'Chicago Board of Trade',
  OTC: 'Over-the-Counter',
  PINK: 'Pink Sheets',
  OTCBB: 'OTCBB',
} as const

// Export all transaction types for type safety
export type SchwabTransactionType = keyof typeof SCHWAB_TRANSACTION_TYPES
export type InternalSchwabTransactionType =
  (typeof SCHWAB_TRANSACTION_TYPES)[SchwabTransactionType]
export type SchwabAccountType = keyof typeof SCHWAB_ACCOUNT_TYPES
export type SchwabAssetType = keyof typeof SCHWAB_ASSET_TYPES
export type SchwabCategory = (typeof SCHWAB_CATEGORIES)[number]
export type SchwabMarket = keyof typeof SCHWAB_MARKETS
export type SchwabExchange = keyof typeof SCHWAB_EXCHANGES
export type SchwabScope = (typeof SCHWAB_OAUTH_SCOPES)[number]

// Price history parameters
export interface SchwabPriceHistoryParams {
  symbol: string
  periodType: 'day' | 'month' | 'year' | 'ytd'
  period?: number
  frequencyType: 'minute' | 'daily' | 'weekly' | 'monthly'
  frequency?: number
  startDate?: number
  endDate?: number
  needExtendedHoursData?: boolean
}

export interface SchwabPriceHistory {
  candles: Array<{
    open: number
    high: number
    low: number
    close: number
    volume: number
    datetime: number
  }>
  symbol: string
  empty: boolean
}

// Options chain parameters
export interface SchwabOptionsChainParams {
  symbol: string
  contractType?: 'CALL' | 'PUT' | 'ALL'
  strikeCount?: number
  includeQuotes?: boolean
  strategy?:
    | 'SINGLE'
    | 'ANALYTICAL'
    | 'COVERED'
    | 'VERTICAL'
    | 'CALENDAR'
    | 'STRANGLE'
    | 'STRADDLE'
    | 'BUTTERFLY'
    | 'CONDOR'
    | 'DIAGONAL'
    | 'COLLAR'
    | 'ROLL'
  interval?: number
  strike?: number
  range?: 'ITM' | 'NTM' | 'OTM' | 'SAK' | 'SBK' | 'SNK' | 'ALL'
  fromDate?: string
  toDate?: string
  volatility?: number
  underlyingPrice?: number
  interestRate?: number
  daysToExpiration?: number
  expMonth?:
    | 'JAN'
    | 'FEB'
    | 'MAR'
    | 'APR'
    | 'MAY'
    | 'JUN'
    | 'JUL'
    | 'AUG'
    | 'SEP'
    | 'OCT'
    | 'NOV'
    | 'DEC'
    | 'ALL'
  optionType?: 'S' | 'NS' | 'ALL'
}

export interface SchwabOptionsChain {
  symbol: string
  status: string
  underlying: {
    ask: number
    askSize: number
    bid: number
    bidSize: number
    change: number
    close: number
    delayed: boolean
    description: string
    exchangeName: string
    fiftyTwoWeekHigh: number
    fiftyTwoWeekLow: number
    highPrice: number
    last: number
    lowPrice: number
    mark: number
    markChange: number
    markPercentChange: number
    openPrice: number
    percentChange: number
    quoteTime: number
    symbol: string
    totalVolume: number
    tradeTime: number
  }
  strategy: string
  interval: number
  isDelayed: boolean
  isIndex: boolean
  daysToExpiration: number
  interestRate: number
  underlyingPrice: number
  volatility: number
  callExpDateMap: Record<string, Record<string, any>>
  putExpDateMap: Record<string, Record<string, any>>
}
