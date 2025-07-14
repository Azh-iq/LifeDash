# API Specifications

## Universal Asset Management API

This document defines the REST API endpoints for the universal portfolio management system supporting stocks, cryptocurrencies, and alternative assets.

## Base URL & Authentication

```
Base URL: https://api.lifedash.no/v1
Authentication: Bearer token (Supabase JWT)
Content-Type: application/json
```

## Core Asset Management

### Assets Endpoints

#### GET /assets
Retrieve paginated list of assets with filtering and search.

**Query Parameters:**
```typescript
interface AssetQuery {
  asset_class?: 'STOCK' | 'CRYPTOCURRENCY' | 'ALTERNATIVE'
  asset_subtype?: string
  exchange?: string
  currency?: string
  country?: string
  search?: string        // Full-text search across symbol, name
  is_active?: boolean
  is_tradeable?: boolean
  limit?: number         // Default: 50, Max: 500
  offset?: number
  sort_by?: 'symbol' | 'name' | 'market_cap' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
```

**Response:**
```typescript
interface AssetListResponse {
  data: Asset[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  filters_applied: AssetQuery
}

interface Asset {
  id: string
  symbol: string
  name: string
  asset_class: 'STOCK' | 'CRYPTOCURRENCY' | 'ALTERNATIVE'
  asset_subtype: string
  primary_exchange: string
  primary_network?: string
  currency: string
  country_code?: string
  is_active: boolean
  is_tradeable: boolean
  external_ids: Record<string, string>
  metadata: Record<string, any>
  current_price?: number
  last_price_update?: string
  market_cap?: number
  data_sources: string[]
  created_at: string
  updated_at: string
}
```

#### GET /assets/:id
Retrieve detailed asset information including metadata.

**Response:**
```typescript
interface AssetDetailResponse {
  data: Asset & {
    securities_metadata?: SecuritiesMetadata
    crypto_metadata?: CryptoMetadata
    collectibles_metadata?: CollectiblesMetadata
  }
}
```

#### POST /assets
Create new asset (admin only).

**Request Body:**
```typescript
interface CreateAssetRequest {
  symbol: string
  name: string
  asset_class: 'STOCK' | 'CRYPTOCURRENCY' | 'ALTERNATIVE'
  asset_subtype: string
  primary_exchange: string
  primary_network?: string
  currency: string
  country_code?: string
  external_ids?: Record<string, string>
  metadata?: Record<string, any>
  securities_metadata?: Partial<SecuritiesMetadata>
  crypto_metadata?: Partial<CryptoMetadata>
  collectibles_metadata?: Partial<CollectiblesMetadata>
}
```

#### PUT /assets/:id
Update asset information (admin only).

#### DELETE /assets/:id
Soft delete asset (admin only).

### Asset Search

#### GET /assets/search
Advanced asset search with fuzzy matching and typeahead support.

**Query Parameters:**
```typescript
interface SearchQuery {
  q: string              // Search query
  asset_class?: string[]
  exchange?: string[]
  limit?: number         // Default: 10, Max: 50
  include_metadata?: boolean
  fuzzy?: boolean        // Enable fuzzy matching
}
```

**Response:**
```typescript
interface SearchResponse {
  data: Asset[]
  suggestions: string[]  // Alternative search terms
  total_matches: number
  search_time_ms: number
}
```

## Portfolio Management

### Portfolios

#### GET /portfolios
Get user's portfolios.

```typescript
interface PortfolioListResponse {
  data: Portfolio[]
}

interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  currency: string
  is_default: boolean
  is_public: boolean
  total_value?: number
  total_cost?: number
  unrealized_pnl?: number
  unrealized_pnl_percent?: number
  accounts: Account[]
  created_at: string
  updated_at: string
}
```

#### POST /portfolios
Create new portfolio.

#### PUT /portfolios/:id
Update portfolio settings.

#### DELETE /portfolios/:id
Delete portfolio and all associated data.

### Accounts

#### GET /portfolios/:portfolio_id/accounts
Get accounts within a portfolio.

#### POST /portfolios/:portfolio_id/accounts
Create new account.

```typescript
interface CreateAccountRequest {
  name: string
  platform: string
  account_type: 'BROKERAGE' | 'CRYPTO_EXCHANGE' | 'BANK' | 'RETIREMENT' | 'OTHER'
  currency: string
  is_active?: boolean
  platform_credentials?: {
    api_key?: string
    secret_key?: string
    oauth_token?: string
  }
}
```

### Holdings

#### GET /portfolios/:portfolio_id/holdings
Get current holdings across all accounts in portfolio.

**Query Parameters:**
```typescript
interface HoldingsQuery {
  account_id?: string
  asset_class?: string[]
  min_value?: number
  sort_by?: 'value' | 'pnl' | 'pnl_percent' | 'symbol'
  sort_order?: 'asc' | 'desc'
  include_zero?: boolean  // Include zero-quantity holdings
}
```

**Response:**
```typescript
interface HoldingsResponse {
  data: Holding[]
  summary: {
    total_value: number
    total_cost: number
    total_pnl: number
    total_pnl_percent: number
    asset_allocation: Record<string, number>
  }
}

interface Holding {
  id: string
  user_id: string
  account_id: string
  asset_id: string
  asset: Asset
  account: Account
  quantity: number
  average_cost: number
  total_cost: number
  current_price?: number
  market_value?: number
  unrealized_pnl?: number
  unrealized_pnl_percent?: number
  day_change?: number
  day_change_percent?: number
  first_acquired?: string
  last_transaction?: string
  position_metadata?: Record<string, any>
  updated_at: string
}
```

#### POST /portfolios/:portfolio_id/holdings
Create or update holding (usually via transaction).

### Transactions

#### GET /portfolios/:portfolio_id/transactions
Get transaction history.

**Query Parameters:**
```typescript
interface TransactionQuery {
  account_id?: string
  asset_id?: string
  transaction_type?: TransactionType[]
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  sort_order?: 'asc' | 'desc'
}

type TransactionType = 
  | 'BUY' | 'SELL' 
  | 'DIVIDEND' | 'INTEREST' 
  | 'DEPOSIT' | 'WITHDRAWAL'
  | 'TRANSFER_IN' | 'TRANSFER_OUT'
  | 'SPLIT' | 'MERGER' | 'SPINOFF'
  | 'STAKING_REWARD' | 'MINING_REWARD'
  | 'SWAP' | 'BRIDGE'
  | 'FEE' | 'TAX'
```

**Response:**
```typescript
interface TransactionListResponse {
  data: Transaction[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  summary: {
    total_invested: number
    total_divested: number
    total_fees: number
    net_cash_flow: number
  }
}

interface Transaction {
  id: string
  user_id: string
  account_id: string
  asset_id?: string
  asset?: Asset
  account: Account
  external_id?: string
  order_id?: string
  transaction_type: TransactionType
  date: string
  time?: string
  settlement_date?: string
  quantity: number
  price?: number
  total_amount: number
  commission: number
  network_fees: number
  platform_fees: number
  other_fees: number
  total_fees: number
  currency: string
  exchange_rate: number
  transaction_metadata?: Record<string, any>
  description?: string
  notes?: string
  tags?: string[]
  related_transaction_id?: string
  corporate_action_type?: string
  data_source: 'MANUAL' | 'CSV_IMPORT' | 'API_SYNC'
  is_verified: boolean
  verification_date?: string
  created_at: string
  updated_at: string
}
```

#### POST /portfolios/:portfolio_id/transactions
Create new transaction.

```typescript
interface CreateTransactionRequest {
  account_id: string
  asset_id?: string
  transaction_type: TransactionType
  date: string
  time?: string
  quantity: number
  price?: number
  total_amount: number
  commission?: number
  network_fees?: number
  platform_fees?: number
  other_fees?: number
  currency: string
  description?: string
  notes?: string
  tags?: string[]
}
```

#### PUT /transactions/:id
Update transaction.

#### DELETE /transactions/:id
Delete transaction.

## Market Data

### Prices

#### GET /assets/:id/prices
Get historical price data.

**Query Parameters:**
```typescript
interface PriceQuery {
  interval: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | '2y' | '5y' | 'max'
  granularity: 'daily' | 'weekly' | 'monthly'
  from?: string          // ISO date
  to?: string            // ISO date
  adjusted?: boolean     // Include split/dividend adjustments
}
```

**Response:**
```typescript
interface PriceHistoryResponse {
  data: PriceData[]
  metadata: {
    symbol: string
    interval: string
    granularity: string
    currency: string
    data_source: string
    last_updated: string
  }
}

interface PriceData {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjusted_close?: number
  volume?: number
  split_factor?: number
  dividend_amount?: number
}
```

#### GET /assets/:id/quote
Get real-time quote.

**Response:**
```typescript
interface QuoteResponse {
  data: {
    symbol: string
    price: number
    change: number
    change_percent: number
    volume?: number
    market_cap?: number
    currency: string
    exchange: string
    last_updated: string
    market_status: 'open' | 'closed' | 'pre_market' | 'after_hours'
  }
}
```

## Analytics & Reports

### Portfolio Analytics

#### GET /portfolios/:id/performance
Get portfolio performance metrics.

**Query Parameters:**
```typescript
interface PerformanceQuery {
  period: '1d' | '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all'
  benchmark?: string     // Asset ID or index symbol
  currency?: string      // Convert to specific currency
}
```

**Response:**
```typescript
interface PerformanceResponse {
  data: {
    period: string
    total_return: number
    total_return_percent: number
    annualized_return?: number
    volatility?: number
    sharpe_ratio?: number
    max_drawdown?: number
    beta?: number
    alpha?: number
    benchmark_return?: number
    daily_returns: DailyReturn[]
  }
}

interface DailyReturn {
  date: string
  portfolio_value: number
  daily_return: number
  daily_return_percent: number
  benchmark_return?: number
}
```

#### GET /portfolios/:id/allocation
Get asset allocation breakdown.

**Response:**
```typescript
interface AllocationResponse {
  data: {
    by_asset_class: AllocationBreakdown[]
    by_sector: AllocationBreakdown[]
    by_geography: AllocationBreakdown[]
    by_currency: AllocationBreakdown[]
    by_account: AllocationBreakdown[]
    top_holdings: Holding[]
  }
}

interface AllocationBreakdown {
  category: string
  value: number
  percentage: number
  count: number
}
```

### Tax Reports

#### GET /portfolios/:id/tax-report
Generate tax report for specified period.

**Query Parameters:**
```typescript
interface TaxReportQuery {
  tax_year: number
  jurisdiction: 'US' | 'NO' | 'EU' | 'UK'
  report_type: 'gains_losses' | 'dividends' | 'interest' | 'full'
}
```

**Response:**
```typescript
interface TaxReportResponse {
  data: {
    tax_year: number
    jurisdiction: string
    short_term_gains: TaxLot[]
    long_term_gains: TaxLot[]
    dividend_income: DividendIncome[]
    interest_income: InterestIncome[]
    summary: {
      total_short_term_gain: number
      total_long_term_gain: number
      total_dividend_income: number
      total_interest_income: number
      net_gain_loss: number
    }
  }
}
```

## Platform Integrations

### Brokers

#### GET /integrations/brokers
List available broker integrations.

#### POST /integrations/brokers/:platform/connect
Initiate OAuth connection to broker.

#### POST /integrations/brokers/:platform/sync
Sync data from connected broker.

### Crypto Exchanges

#### GET /integrations/crypto
List available crypto exchange integrations.

#### POST /integrations/crypto/:exchange/connect
Connect to crypto exchange.

#### POST /integrations/crypto/:exchange/sync
Sync crypto holdings and transactions.

## Import/Export

### CSV Import

#### POST /portfolios/:id/import/csv
Import transactions from CSV file.

**Request:**
```typescript
interface CSVImportRequest {
  file: File                    // CSV file
  mapping: FieldMapping        // Column mappings
  account_id: string
  dry_run?: boolean           // Preview without importing
}

interface FieldMapping {
  date: string
  symbol: string
  transaction_type: string
  quantity: string
  price: string
  // ... other field mappings
}
```

#### GET /portfolios/:id/export/csv
Export portfolio data to CSV.

**Query Parameters:**
```typescript
interface ExportQuery {
  data_type: 'transactions' | 'holdings' | 'performance'
  date_from?: string
  date_to?: string
  format: 'csv' | 'xlsx' | 'pdf'
}
```

## Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    request_id: string
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_REQUIRED` - Missing or invalid auth token
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_API_ERROR` - Third-party service error
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limiting

- **Public endpoints**: 100 requests/minute per IP
- **Authenticated endpoints**: 1000 requests/minute per user
- **Heavy operations** (sync, reports): 10 requests/minute per user

## Webhooks

### Portfolio Events

```typescript
interface WebhookEvent {
  event_type: 'holding.updated' | 'transaction.created' | 'price.updated'
  portfolio_id: string
  data: Record<string, any>
  timestamp: string
}
```

This comprehensive API specification provides the foundation for building a robust universal portfolio management system with support for all major asset classes.