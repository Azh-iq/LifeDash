// Universal types for broker API integrations
// Based on research of Plaid, Schwab, IBKR, and Nordnet APIs

export interface BrokerageAccount {
  id: string
  brokerId: string
  accountType: 'CASH' | 'MARGIN' | 'RETIREMENT' | 'CUSTODIAL'
  accountNumber: string
  displayName: string
  currency: string
  isActive: boolean
  institutionName: string
}

export interface BrokerageHolding {
  accountId: string
  symbol: string
  quantity: number
  marketValue: number
  costBasis?: number
  marketPrice: number
  currency: string
  assetClass: AssetClass
  institutionSecurityId?: string
  // Broker-specific fields
  metadata?: Record<string, any>
}

export interface BrokerageTransaction {
  id: string
  accountId: string
  symbol?: string
  type: TransactionType
  quantity?: number
  price?: number
  amount: number
  currency: string
  date: string // ISO date string
  fees?: number
  description: string
  // Broker-specific fields
  metadata?: Record<string, any>
}

export interface BrokerageSecurity {
  symbol: string
  name: string
  type: AssetClass
  exchange?: string
  currency: string
  isin?: string
  cusip?: string
  sedol?: string
  // Market data
  currentPrice?: number
  previousClosePrice?: number
  lastUpdated?: string
}

export enum AssetClass {
  EQUITY = 'EQUITY',
  FIXED_INCOME = 'FIXED_INCOME',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  COMMODITY = 'COMMODITY',
  REAL_ESTATE = 'REAL_ESTATE',
  CASH = 'CASH',
  OPTION = 'OPTION',
  FUND = 'FUND',
  ETF = 'ETF'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  FEE = 'FEE',
  TAX = 'TAX',
  SPLIT = 'SPLIT',
  TRANSFER = 'TRANSFER'
}

export interface BrokerageConnection {
  id: string
  userId: string
  brokerId: BrokerId
  connectionId: string // Broker-specific connection identifier
  displayName: string
  status: ConnectionStatus
  lastSyncedAt?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export enum BrokerId {
  PLAID = 'plaid',
  SCHWAB = 'schwab',
  INTERACTIVE_BROKERS = 'interactive_brokers',
  NORDNET = 'nordnet'
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

// Base interface that all broker clients must implement
export interface IBrokerageClient {
  readonly brokerId: BrokerId
  
  // Authentication
  authenticate(credentials: any): Promise<AuthResult>
  refreshAuth(connection: BrokerageConnection): Promise<AuthResult>
  
  // Account and holdings data
  getAccounts(connectionId: string): Promise<BrokerageAccount[]>
  getHoldings(connectionId: string, accountId?: string): Promise<BrokerageHolding[]>
  getTransactions(
    connectionId: string, 
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BrokerageTransaction[]>
  
  // Security lookup
  searchSecurities(query: string): Promise<BrokerageSecurity[]>
  getSecurityDetails(symbol: string): Promise<BrokerageSecurity | null>
  
  // Connection management
  testConnection(connectionId: string): Promise<boolean>
  disconnect(connectionId: string): Promise<void>
}

export interface AuthResult {
  success: boolean
  connectionId?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  error?: string
  redirectUrl?: string // For OAuth flows
}

export class BrokerageError extends Error {
  public code: string
  public details?: any
  public retryable: boolean

  constructor(code: string, message: string, details?: any, retryable: boolean = false) {
    super(message)
    this.name = 'BrokerageError'
    this.code = code
    this.details = details
    this.retryable = retryable
  }
}

// Configuration for each broker
export interface BrokerConfig {
  brokerId: BrokerId
  displayName: string
  description: string
  authType: 'OAUTH' | 'API_KEY' | 'SSH_KEY' | 'CREDENTIALS'
  requiredCredentials: string[]
  supportedCountries: string[]
  supportedAssetClasses: AssetClass[]
  rateLimits: {
    requestsPerSecond?: number
    requestsPerMinute?: number
    requestsPerDay?: number
  }
  features: {
    realTimeData: boolean
    historicalData: boolean
    tradingSupport: boolean
    multiCurrency: boolean
  }
}

// Portfolio aggregation types
export interface PortfolioSummary {
  totalValue: number
  totalCostBasis: number
  totalGainLoss: number
  totalGainLossPercent: number
  currency: string
  asOfDate: string
  accountSummaries: AccountSummary[]
  topHoldings: BrokerageHolding[]
  assetAllocation: AssetAllocation[]
}

export interface AccountSummary {
  accountId: string
  brokerId: BrokerId
  displayName: string
  totalValue: number
  costBasis: number
  gainLoss: number
  gainLossPercent: number
  currency: string
  lastUpdated: string
}

export interface AssetAllocation {
  assetClass: AssetClass
  value: number
  percentage: number
  currency: string
}

// Sync operation types
export interface SyncOperation {
  id: string
  userId: string
  connectionId: string
  brokerId: BrokerId
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  error?: string
  result?: SyncResult
}

export interface SyncResult {
  accountsProcessed: number
  holdingsProcessed: number
  transactionsProcessed: number
  errors: string[]
  warnings: string[]
}