# Investment Portfolio Tracker Technical Specification

## 1. Executive Summary

### Project Overview

The Investment Portfolio Tracker is a comprehensive financial management system designed to aggregate, track, and analyze investment portfolios across multiple platforms and asset classes. The system prioritizes mobile-first design, real-time portfolio updates, and intelligent data management within free-tier constraints.

### Key Technical Decisions

- **Frontend**: NextJS 14+ with App Router for optimal performance and SEO
- **Styling**: TailwindCSS with custom design system for consistent mobile-first UI
- **Backend**: NextJS Server Actions combined with n8n workflows for automation
- **Database**: Supabase (PostgreSQL) with Row Level Security and real-time subscriptions
- **Authentication**: Supabase Auth with TOTP 2FA implementation
- **Deployment**: Vercel (frontend) with self-hosted n8n instance
- **Data Strategy**: Compressed JSONB storage with smart archiving for free-tier optimization

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  NextJS Frontend│────▶│ Server Actions  │────▶│    Supabase     │
│   (Vercel)      │     │   + Webhooks    │     │   PostgreSQL    │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                        ▲
                                 │                        │
                                 ▼                        │
                        ┌─────────────────┐              │
                        │                 │              │
                        │  n8n Workflows  │──────────────┘
                        │  (Self-hosted)  │
                        │                 │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌─────────────┐           ┌─────────────┐
            │Yahoo Finance│           │Currency APIs│
            └─────────────┘           └─────────────┘
```

### Technology Stack Summary

- **Frontend**: NextJS 14+, React 18+, TailwindCSS, Framer Motion, Recharts
- **Backend**: NextJS Server Actions, n8n 1.0+, Node.js 20+
- **Database**: Supabase (PostgreSQL 15+), Redis for caching
- **Authentication**: Supabase Auth, Speakeasy for TOTP
- **Infrastructure**: Vercel, ngrok/Traefik, Google Drive API
- **Development**: TypeScript 5+, ESLint, Prettier, Husky

## 2. System Architecture

### 2.1 Architecture Overview

The system follows a modern serverless architecture with clear separation of concerns:

```
Frontend Layer (NextJS on Vercel)
├── Server Components (Initial page loads)
├── Client Components (Interactive features)
├── Server Actions (API operations)
└── Middleware (Auth & routing)

Backend Processing Layer (n8n)
├── Scheduled Workflows (Price updates)
├── Event-driven Workflows (Imports)
├── Data Processing Pipelines
└── Backup & Maintenance Jobs

Data Layer (Supabase)
├── PostgreSQL Database
├── Row Level Security
├── Realtime Subscriptions
└── Edge Functions (Future)

External Services
├── Yahoo Finance API
├── Currency APIs (Primary + Fallback)
├── Google Drive API
└── Email Services
```

### 2.2 Technology Stack

#### Frontend Technologies

**Framework: NextJS 14+ with App Router**

- Server-side rendering for performance
- API routes replaced by Server Actions
- Built-in image optimization
- Streaming and Suspense for loading states

**UI Library: React 18+**

- Server Components for reduced bundle size
- Concurrent features for better UX
- Strict mode for development

**Styling: TailwindCSS 3.4+**

- Custom design system configuration
- Mobile-first responsive design
- Dark mode support
- Component variants with CVA

**Animation: Framer Motion 11+**

- Page transitions
- Gesture animations
- Loading states
- Chart animations

**Data Visualization:**

- Recharts for main charts
- Custom SVG for specialized visualizations
- D3.js for complex interactions (lazy loaded)

#### Backend Technologies

**API Layer: NextJS Server Actions**

- Type-safe RPC-style APIs
- Automatic request validation
- Built-in CSRF protection
- Direct database access

**Automation: n8n 1.0+**

- Self-hosted for webhook reliability
- Visual workflow design
- Error handling and retry logic
- Integration with multiple services

**Runtime: Node.js 20+ LTS**

- Native ESM support
- Improved performance
- Better error handling

#### Database Technologies

**Primary Database: Supabase (PostgreSQL 15+)**

- Row Level Security for multi-tenancy
- JSONB for flexible data storage
- Partitioned tables for time-series data
- Generated columns for computed values

**Caching: Redis (via Upstash)**

- Session storage
- API response caching
- Rate limiting counters

**Real-time: Supabase Realtime**

- WebSocket connections
- Selective table replication
- Presence features for future use

#### Third-party Services

**Market Data: Yahoo Finance API**

- Rate-limited to respect terms
- Cached responses
- Fallback strategies

**Currency Data:**

- Primary: exchangerate-api.com
- Fallback: fixer.io free tier
- Historical rates preservation

**Storage: Google Drive API**

- Automated backups
- Export archive storage
- OAuth2 authentication

**Deployment & Infrastructure:**

- Vercel for frontend hosting
- ngrok or Traefik for n8n tunneling
- GitHub Actions for CI/CD
- Sentry for error tracking

## 3. Feature Specifications

### 3.1 Authentication & User Management

#### User Stories

- As a user, I want to securely access my portfolio with 2FA protection
- As a user, I want my sessions to persist but automatically expire for security
- As a user, I want to see an audit trail of important changes to my data

#### Technical Requirements

- Implement Supabase Auth with email/password authentication
- Add TOTP-based 2FA using speakeasy library
- Secure session management with 7-day refresh tokens
- Audit logging for data modifications and imports only
- Password requirements: 8+ chars, uppercase, lowercase, number, special char

#### Implementation Approach

```typescript
// Server Action for login with 2FA
export async function loginUser(
  email: string,
  password: string,
  totpCode?: string
) {
  // 1. Validate input
  const validation = validateLoginInput({ email, password })
  if (!validation.success) return { error: validation.error }

  // 2. Attempt Supabase auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (authError) return { error: 'Invalid credentials' }

  // 3. Check if 2FA is enabled
  const { data: user } = await supabase
    .from('user_settings')
    .select('totp_enabled, totp_secret')
    .eq('user_id', authData.user.id)
    .single()

  if (user?.totp_enabled) {
    if (!totpCode) return { requires2FA: true }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    })

    if (!verified) return { error: 'Invalid 2FA code' }
  }

  // 4. Create audit log entry
  await createAuditLog({
    user_id: authData.user.id,
    action: 'LOGIN',
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
  })

  return { success: true, session: authData.session }
}
```

#### API Endpoints (Server Actions)

- `loginUser(email, password, totpCode?)` - Authenticate with optional 2FA
- `registerUser(email, password)` - Create new account
- `enable2FA()` - Generate TOTP secret and QR code
- `verify2FA(code)` - Confirm 2FA setup
- `refreshSession()` - Extend session validity
- `logout()` - Invalidate session and clear tokens
- `resetPassword(email)` - Initiate password reset flow

### 3.2 Portfolio Management

#### User Stories

- As a user, I want to track investments across multiple platforms
- As a user, I want to see real-time portfolio value with automatic updates
- As a user, I want to organize investments by categories and platforms

#### Technical Requirements

- Support multiple portfolios per user
- Real-time price updates every 15 minutes
- Multi-currency support with P&L tracking
- Platform-specific fee tracking
- Hierarchical organization (Portfolio → Platform → Asset)

#### Implementation Approach

```typescript
// Real-time portfolio subscription
export function subscribeToPortfolioUpdates(portfolioId: string) {
  return supabase
    .channel(`portfolio:${portfolioId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'portfolio_values',
        filter: `portfolio_id=eq.${portfolioId}`,
      },
      payload => {
        // Update UI with new portfolio value
        updatePortfolioValue(payload.new)
      }
    )
    .subscribe()
}

// Server Action for adding platform
export async function addPlatform(data: PlatformInput) {
  const { data: platform, error } = await supabase
    .from('platforms')
    .insert({
      user_id: getCurrentUserId(),
      name: data.name,
      type: data.type,
      fees: {
        trading_fee: data.tradingFee,
        spread: data.spread,
        other_fees: data.otherFees,
      },
      api_credentials: await encryptCredentials(data.credentials),
    })
    .select()
    .single()

  if (error) return { error }

  // Trigger initial sync via n8n
  await triggerWebhook('platform-sync', { platformId: platform.id })

  return { success: true, platform }
}
```

### 3.3 Transaction Management

#### User Stories

- As a user, I want to import transactions from CSV files
- As a user, I want to manually add individual transactions
- As a user, I want to review and correct import errors

#### Technical Requirements

- CSV import with intelligent field mapping
- Duplicate transaction detection
- Multi-step import workflow with preview
- Support for multiple currencies and platforms
- Comprehensive validation and error handling

#### Implementation Approach

```typescript
// CSV Upload and Processing Flow
export async function uploadCSV(file: File) {
  // 1. Upload to temporary storage
  const uploadResult = await uploadToTemp(file)

  // 2. Trigger n8n webhook for processing
  const { data: jobId } = await fetch('/api/webhooks/csv-process', {
    method: 'POST',
    headers: {
      'X-Webhook-Signature': generateHMAC(uploadResult.fileId),
    },
    body: JSON.stringify({
      fileId: uploadResult.fileId,
      userId: getCurrentUserId(),
    }),
  })

  // 3. Return job ID for status tracking
  return { jobId, fileId: uploadResult.fileId }
}

// n8n Webhook Handler
export async function handleCSVWebhook(req: Request) {
  // Verify HMAC signature
  if (!verifyWebhookSignature(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { fileId, userId } = await req.json()

  // Process CSV in n8n
  // n8n will:
  // 1. Download file from temp storage
  // 2. Parse and validate CSV
  // 3. Map fields to transaction schema
  // 4. Store in staging table
  // 5. Callback with results

  return new Response('Processing started', { status: 202 })
}
```

### 3.4 Real-time Price Updates

#### User Stories

- As a user, I want to see current market prices updated every 15 minutes
- As a user, I want instant portfolio value recalculation when prices change
- As a user, I want to see visual indicators when prices are updating

#### Technical Requirements

- Scheduled price fetching every 15 minutes via n8n
- Batch processing for efficiency
- Instant portfolio recalculation via database triggers
- WebSocket updates to connected clients
- Rate limiting and error handling for API calls

#### Implementation Approach

```sql
-- Database trigger for instant P&L calculation
CREATE OR REPLACE FUNCTION calculate_portfolio_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Update holdings with new price
  UPDATE holdings h
  SET
    current_value = h.quantity * NEW.price,
    unrealized_pnl = (h.quantity * NEW.price) - h.cost_basis,
    last_updated = NOW()
  WHERE h.stock_symbol = NEW.symbol;

  -- Update portfolio totals
  UPDATE portfolios p
  SET
    total_value = (
      SELECT SUM(current_value)
      FROM holdings
      WHERE portfolio_id = p.id
    ),
    last_calculated = NOW()
  FROM holdings h
  WHERE h.portfolio_id = p.id
    AND h.stock_symbol = NEW.symbol;

  -- Notify subscribers
  PERFORM pg_notify(
    'portfolio_update',
    json_build_object(
      'symbol', NEW.symbol,
      'price', NEW.price,
      'timestamp', NEW.updated_at
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_update_trigger
AFTER INSERT OR UPDATE ON stock_prices
FOR EACH ROW
EXECUTE FUNCTION calculate_portfolio_value();
```

### 3.5 Analytics & Reporting

#### User Stories

- As a user, I want to see detailed performance metrics for my portfolio
- As a user, I want to understand my investment patterns and success rate
- As a user, I want to export my data for tax purposes

#### Technical Requirements

- Calculate advanced metrics (Sharpe ratio, win rate, max drawdown)
- Support multiple time periods and comparisons
- Provide AI-generated insights
- Enable data export in multiple formats
- Optimize queries for performance

#### Implementation Approach

```typescript
// Server Action for performance metrics
export async function getPortfolioMetrics(
  portfolioId: string,
  timeframe: TimeFrame
) {
  // Use materialized view for performance
  const { data: metrics } = await supabase.rpc('calculate_portfolio_metrics', {
    p_portfolio_id: portfolioId,
    p_start_date: getTimeframeStart(timeframe),
    p_end_date: new Date(),
  })

  // Calculate advanced metrics
  const enhancedMetrics = {
    ...metrics,
    sharpeRatio: calculateSharpeRatio(metrics.returns),
    maxDrawdown: calculateMaxDrawdown(metrics.valueHistory),
    winRate: metrics.profitableTrades / metrics.totalTrades,
    avgHoldingPeriod: calculateAvgHoldingPeriod(metrics.trades),
  }

  // Generate AI insights (via n8n workflow)
  const insights = await generateInsights(enhancedMetrics)

  return {
    metrics: enhancedMetrics,
    insights,
    lastUpdated: new Date(),
  }
}

// Efficient data export
export async function exportPortfolioData(
  portfolioId: string,
  format: 'csv' | 'json' | 'pdf'
) {
  // Stream data for large exports
  const stream = supabase
    .from('transactions')
    .select('*, stocks(symbol, name), platforms(name)')
    .eq('portfolio_id', portfolioId)
    .csv() // For CSV format

  // Process stream in chunks
  return processExportStream(stream, format)
}
```

## 4. Data Architecture

### 4.1 Data Models

#### Users

```sql
CREATE TABLE users (
  -- Managed by Supabase Auth
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT ENCRYPTED,
  display_currency TEXT DEFAULT 'USD',
  display_mode TEXT DEFAULT 'simple', -- 'simple' or 'detailed'
  theme TEXT DEFAULT 'dark',
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### Portfolios

```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_currency TEXT DEFAULT 'USD',
  total_value DECIMAL(20, 2) DEFAULT 0,
  total_cost_basis DECIMAL(20, 2) DEFAULT 0,
  realized_pnl DECIMAL(20, 2) DEFAULT 0,
  unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
  last_calculated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_user_portfolios (user_id),
  INDEX idx_portfolio_calc (last_calculated)
);
```

#### Stocks

```sql
CREATE TABLE stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT,
  currency TEXT NOT NULL,
  asset_type TEXT DEFAULT 'STOCK', -- STOCK, ETF, CRYPTO, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_stock_type (asset_type)
);

-- Partitioned table for price history
CREATE TABLE stock_prices (
  symbol TEXT REFERENCES stocks(symbol),
  timestamp TIMESTAMPTZ NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  volume BIGINT,
  source TEXT DEFAULT 'yahoo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (symbol, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE stock_prices_2025_01 PARTITION OF stock_prices
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Continue for each month...

-- Compressed historical prices for storage optimization
CREATE TABLE stock_prices_compressed (
  symbol TEXT REFERENCES stocks(symbol),
  date DATE NOT NULL,
  data JSONB NOT NULL, -- Compressed daily OHLCV data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (symbol, date)
);
```

#### Transactions

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id),
  stock_symbol TEXT REFERENCES stocks(symbol),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate DECIMAL(20, 8) DEFAULT 1,
  fees DECIMAL(20, 2) DEFAULT 0,
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  import_id UUID, -- Links to import batch
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_portfolio_transactions (portfolio_id, transaction_date DESC),
  INDEX idx_stock_transactions (stock_symbol, transaction_date DESC),
  INDEX idx_import_batch (import_id)
);
```

#### Holdings

```sql
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id),
  stock_symbol TEXT REFERENCES stocks(symbol),
  quantity DECIMAL(20, 8) NOT NULL,
  cost_basis DECIMAL(20, 2) NOT NULL,
  current_value DECIMAL(20, 2),
  unrealized_pnl DECIMAL(20, 2),
  first_purchase_date TIMESTAMPTZ,
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, platform_id, stock_symbol),
  INDEX idx_portfolio_holdings (portfolio_id)
);
```

#### Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_user_audit (user_id, created_at DESC),
  INDEX idx_entity_audit (entity_type, entity_id)
) PARTITION BY RANGE (created_at);

-- Monthly partitions for audit logs
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 4.2 Data Storage

#### Database Selection

Primary: Supabase (PostgreSQL) chosen for:

- Built-in authentication and RLS
- Real-time subscriptions
- Managed infrastructure
- Free tier suitable for MVP

#### Data Persistence Strategies

**Time-Series Data Optimization**

- Partitioned tables for price history
- Compressed JSONB for historical data
- Automatic archiving after 90 days
- Indexed materialized views for analytics

**Caching Strategy**

- Redis for frequently accessed data
- 15-minute cache for market prices
- 1-hour cache for portfolio calculations
- Session data with 7-day TTL

**Data Compression**

```sql
-- Function to compress daily price data
CREATE OR REPLACE FUNCTION compress_daily_prices()
RETURNS void AS $$
BEGIN
  INSERT INTO stock_prices_compressed (symbol, date, data)
  SELECT
    symbol,
    DATE(timestamp),
    jsonb_build_object(
      'o', MIN(price),
      'h', MAX(price),
      'l', MIN(price),
      'c', MAX(price),
      'v', SUM(volume)
    )
  FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days'
  GROUP BY symbol, DATE(timestamp)
  ON CONFLICT (symbol, date) DO NOTHING;

  -- Delete uncompressed data
  DELETE FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

#### Backup and Recovery

**Automated Backups**

- Supabase daily backups (built-in)
- Weekly Google Drive exports via n8n
- Transaction log shipping

**Recovery Procedures**

```typescript
// n8n workflow for backup
export async function performBackup() {
  // 1. Export critical data
  const data = await exportCriticalData()

  // 2. Compress data
  const compressed = await compressData(data)

  // 3. Upload to Google Drive
  const result = await uploadToGoogleDrive(compressed, {
    folder: 'portfolio-backups',
    filename: `backup-${new Date().toISOString()}.gz`,
  })

  // 4. Verify and log
  await verifyBackup(result)
  await logBackupCompletion(result)
}
```

## 5. API Specifications

### 5.1 Internal APIs (Server Actions)

#### Authentication APIs

```typescript
// Login with 2FA support
export async function loginUser(data: {
  email: string
  password: string
  totpCode?: string
}): Promise<{
  success?: boolean
  error?: string
  requires2FA?: boolean
  session?: Session
}>

// Register new user
export async function registerUser(data: {
  email: string
  password: string
}): Promise<{
  success?: boolean
  error?: string
  userId?: string
}>

// Enable 2FA
export async function enable2FA(): Promise<{
  secret: string
  qrCode: string
  backupCodes: string[]
}>

// Verify 2FA setup
export async function verify2FA(code: string): Promise<{
  success: boolean
  error?: string
}>
```

#### Portfolio Management APIs

```typescript
// Create portfolio
export async function createPortfolio(data: {
  name: string
  description?: string
  baseCurrency: string
}): Promise<{
  success?: boolean
  error?: string
  portfolio?: Portfolio
}>

// Get portfolio summary
export async function getPortfolioSummary(portfolioId: string): Promise<{
  portfolio: Portfolio
  holdings: Holding[]
  performance: PerformanceMetrics
  lastUpdated: Date
}>

// Update portfolio settings
export async function updatePortfolioSettings(
  portfolioId: string,
  settings: Partial<PortfolioSettings>
): Promise<{
  success: boolean
  error?: string
}>
```

#### Transaction Management APIs

```typescript
// Add transaction
export async function addTransaction(data: {
  portfolioId: string
  platformId: string
  stockSymbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  currency: string
  date: Date
  fees?: number
  notes?: string
}): Promise<{
  success?: boolean
  error?: string
  transaction?: Transaction
}>

// Import CSV
export async function importCSV(data: {
  fileId: string
  mappings: FieldMapping[]
  portfolioId: string
}): Promise<{
  jobId: string
  status: 'processing' | 'completed' | 'failed'
}>

// Get import status
export async function getImportStatus(jobId: string): Promise<{
  status: ImportStatus
  progress: number
  errors?: ImportError[]
  summary?: ImportSummary
}>
```

#### Analytics APIs

```typescript
// Get performance metrics
export async function getPerformanceMetrics(data: {
  portfolioId: string
  timeframe: TimeFrame
  metrics?: MetricType[]
}): Promise<{
  metrics: PerformanceMetrics
  charts: ChartData[]
  insights: Insight[]
}>

// Export data
export async function exportPortfolioData(data: {
  portfolioId: string
  format: 'csv' | 'json' | 'pdf'
  dateRange?: DateRange
  includeMetrics?: boolean
}): Promise<{
  downloadUrl: string
  expiresAt: Date
}>
```

### 5.2 External Integrations

#### n8n Webhook Integration

```typescript
// Webhook endpoint for n8n callbacks
export async function POST(request: Request) {
  // Verify HMAC signature
  const signature = request.headers.get('X-Webhook-Signature')
  const body = await request.text()

  if (!verifyHMAC(signature, body, process.env.WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const data = JSON.parse(body)

  switch (data.event) {
    case 'csv.processed':
      await handleCSVProcessed(data)
      break
    case 'price.updated':
      await handlePriceUpdate(data)
      break
    case 'backup.completed':
      await handleBackupCompleted(data)
      break
    default:
      return new Response('Unknown event', { status: 400 })
  }

  return new Response('OK', { status: 200 })
}
```

#### Yahoo Finance Integration (via n8n)

```javascript
// n8n workflow code for Yahoo Finance
const yahooFinance = {
  async getQuote(symbol) {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`)
    }

    const data = await response.json()
    return {
      symbol,
      price: data.chart.result[0].meta.regularMarketPrice,
      timestamp: new Date(data.chart.result[0].meta.regularMarketTime * 1000),
    }
  },

  async getBatchQuotes(symbols) {
    // Rate limiting: 2 requests per second
    const chunks = chunk(symbols, 10)
    const results = []

    for (const chunk of chunks) {
      const promises = chunk.map(symbol => this.getQuote(symbol))
      const chunkResults = await Promise.allSettled(promises)
      results.push(...chunkResults)
      await sleep(500) // Rate limit
    }

    return results
  },
}
```

#### Currency API Integration

```typescript
// Primary currency API
export const currencyAPI = {
  primary: {
    name: 'exchangerate-api.com',
    async getRates(base: string) {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${base}`
      )

      if (!response.ok) {
        throw new Error('Primary currency API failed')
      }

      const data = await response.json()
      return {
        base,
        rates: data.conversion_rates,
        timestamp: new Date(data.time_last_update_utc),
      }
    },
  },

  fallback: {
    name: 'fixer.io',
    async getRates(base: string) {
      const response = await fetch(
        `https://api.fixer.io/latest?base=${base}&access_key=${process.env.FIXER_API_KEY}`
      )

      if (!response.ok) {
        throw new Error('Fallback currency API failed')
      }

      const data = await response.json()
      return {
        base,
        rates: data.rates,
        timestamp: new Date(data.timestamp * 1000),
      }
    },
  },

  async getRatesWithFallback(base: string) {
    try {
      return await this.primary.getRates(base)
    } catch (error) {
      console.error('Primary API failed, using fallback:', error)
      return await this.fallback.getRates(base)
    }
  },
}
```

#### Google Drive Backup Integration

```typescript
// Google Drive backup service
export class GoogleDriveBackup {
  private auth: OAuth2Client
  private drive: drive_v3.Drive

  constructor() {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  async uploadBackup(data: Buffer, filename: string) {
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID],
    }

    const media = {
      mimeType: 'application/gzip',
      body: Readable.from(data),
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, createdTime',
    })

    return response.data
  }

  async cleanupOldBackups(retentionDays: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const response = await this.drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}' in parents and createdTime < '${cutoffDate.toISOString()}'`,
      fields: 'files(id, name)',
    })

    for (const file of response.data.files || []) {
      await this.drive.files.delete({ fileId: file.id! })
    }
  }
}
```

## 6. Security & Privacy

### 6.1 Authentication & Authorization

#### Authentication Mechanism

```typescript
// NextJS middleware for auth protection
export async function middleware(request: NextRequest) {
  const session = await getSession(request)

  // Public routes
  const publicRoutes = ['/login', '/register', '/reset-password']
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Protected routes require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check 2FA requirement
  if (session.requires2FA && !request.nextUrl.pathname.startsWith('/2fa')) {
    return NextResponse.redirect(new URL('/2fa', request.url))
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Authorization Strategy

```sql
-- Row Level Security Policies
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for all user-owned tables
```

#### Session Management

```typescript
// Session configuration
export const sessionConfig = {
  cookieName: 'portfolio-session',
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
}

// Refresh token rotation
export async function refreshSession(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error) {
    throw new Error('Session refresh failed')
  }

  // Rotate refresh token
  await invalidateOldToken(refreshToken)

  return {
    session: data.session,
    newRefreshToken: data.session?.refresh_token,
  }
}
```

### 6.2 Data Security

#### Encryption Strategies

```typescript
// Encryption utilities
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

#### PII Handling

```typescript
// PII data masking
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local.slice(0, 2) + '***'
  return `${maskedLocal}@${domain}`
}

export function maskApiKey(key: string): string {
  return key.slice(0, 4) + '...' + key.slice(-4)
}

// Audit log sanitization
export function sanitizeAuditData(data: any): any {
  const sensitive = ['password', 'api_key', 'secret', 'token']

  return Object.keys(data).reduce((acc, key) => {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      acc[key] = '[REDACTED]'
    } else if (key.includes('email')) {
      acc[key] = maskEmail(data[key])
    } else {
      acc[key] = data[key]
    }
    return acc
  }, {} as any)
}
```

#### Compliance Requirements

**GDPR Compliance:**

- User data export functionality
- Right to deletion implementation
- Consent management
- Data processing agreements

**Implementation:**

```typescript
// GDPR data export
export async function exportUserData(userId: string) {
  const data = await supabase.rpc('export_user_data', { user_id: userId })

  return {
    user: data.user,
    portfolios: data.portfolios,
    transactions: data.transactions,
    audit_logs: data.audit_logs,
    exported_at: new Date(),
  }
}

// Right to deletion
export async function deleteUserAccount(userId: string) {
  // Soft delete with 30-day grace period
  await supabase.rpc('soft_delete_user', { user_id: userId })

  // Schedule hard delete
  await scheduleHardDelete(userId, 30)
}
```

### 6.3 Application Security

#### Input Validation

```typescript
// Validation schemas using Zod
import { z } from 'zod'

export const transactionSchema = z.object({
  portfolioId: z.string().uuid(),
  platformId: z.string().uuid(),
  stockSymbol: z.string().regex(/^[A-Z]{1,5}$/),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive().max(1000000),
  price: z.number().positive().max(1000000),
  currency: z.string().length(3),
  date: z.date().max(new Date()),
  fees: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
})

// Server action with validation
export async function addTransaction(input: unknown) {
  const validation = transactionSchema.safeParse(input)

  if (!validation.success) {
    return { error: validation.error.flatten() }
  }

  // Additional business logic validation
  if (validation.data.type === 'SELL') {
    const hasShares = await checkAvailableShares(
      validation.data.portfolioId,
      validation.data.stockSymbol,
      validation.data.quantity
    )

    if (!hasShares) {
      return { error: 'Insufficient shares for sale' }
    }
  }

  // Process transaction...
}
```

#### OWASP Compliance

```typescript
// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// Rate limiting
export const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})
```

#### Vulnerability Management

```typescript
// Webhook signature verification
export function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false

  const hmac = createHmac('sha256', secret)
  const digest = hmac.update(body).digest('hex')

  // Constant time comparison to prevent timing attacks
  return timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// SQL injection prevention (using parameterized queries)
export async function safeQuery(query: string, params: any[]) {
  // Supabase automatically parameterizes queries
  return supabase.rpc('execute_query', {
    query_template: query,
    parameters: params,
  })
}
```

## 7. User Interface Specifications

### 7.1 Design System

#### Visual Design Principles

- **Bold Simplicity**: Clean interfaces with clear visual hierarchy
- **Mobile-First**: Touch-optimized with responsive layouts
- **Data-Focused**: Information density balanced with readability
- **Consistent Motion**: Physics-based animations for natural feel
- **Accessibility**: WCAG 2.1 AA compliance throughout

#### Component Library Structure

```
/components
├── /ui                    # Base UI components
│   ├── /button
│   ├── /card
│   ├── /input
│   ├── /modal
│   └── /toast
├── /features             # Feature-specific components
│   ├── /auth
│   ├── /portfolio
│   ├── /transactions
│   └── /analytics
├── /layouts              # Page layouts
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   └── MobileLayout.tsx
└── /shared              # Shared components
    ├── /charts
    ├── /tables
    └── /forms
```

### 7.2 Design Foundations

#### 7.2.1 Color System

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          dark: '#1A1D29',
          light: '#FFFFFF',
        },
        // Secondary Colors
        secondary: {
          blue: '#4169E1',
          gray: '#8B91A7',
        },
        // Accent Colors
        accent: {
          green: '#00C853',
          red: '#F44336',
          amber: '#FFA726',
          purple: '#7C4DFF',
        },
        // Functional Colors
        success: '#00C853',
        error: '#F44336',
        warning: '#FFA726',
        info: '#2196F3',
        // Background Colors
        background: {
          primary: '#0F1115',
          secondary: '#1A1D29',
          tertiary: '#242837',
          light: '#F8F9FA',
        },
      },
    },
  },
}
```

#### 7.2.2 Typography

```css
/* Base typography styles */
@layer base {
  /* Display styles */
  .display-large {
    @apply text-5xl font-bold leading-[56px] tracking-[-0.5px];
  }

  .display-medium {
    @apply text-4xl font-bold leading-[44px] tracking-[-0.3px];
  }

  /* Heading styles */
  h1 {
    @apply text-[32px] font-bold leading-[40px] tracking-[-0.3px];
  }

  h2 {
    @apply text-2xl font-semibold leading-8 tracking-[-0.2px];
  }

  h3 {
    @apply text-xl font-semibold leading-7 tracking-[-0.1px];
  }

  /* Data text styles */
  .data-large {
    @apply font-mono text-2xl font-medium leading-7 tracking-normal;
  }

  .data-medium {
    @apply font-mono text-lg font-normal leading-6 tracking-normal;
  }

  .data-small {
    @apply font-mono text-sm font-normal leading-[18px] tracking-normal;
  }
}
```

#### 7.2.3 Spacing & Layout

```typescript
// Spacing scale
export const spacing = {
  micro: '4px', // 1
  tiny: '8px', // 2
  small: '12px', // 3
  default: '16px', // 4
  medium: '20px', // 5
  large: '24px', // 6
  xl: '32px', // 8
  xxl: '48px', // 12
}

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Container widths
export const containers = {
  sm: '100%',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}
```

#### 7.2.4 Interactive Elements

```typescript
// Button component with all states
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'medium', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          {
            primary: 'bg-secondary-blue text-white hover:bg-secondary-blue/90 active:bg-secondary-blue/80',
            secondary: 'bg-transparent border-1.5 border-secondary-gray text-secondary-gray hover:bg-secondary-gray/10',
            ghost: 'bg-transparent text-secondary-blue hover:bg-secondary-blue/8',
          }[variant],
          // Sizes
          {
            small: 'h-10 px-4 text-sm',
            medium: 'h-12 px-6 text-base',
            large: 'h-14 px-8 text-lg',
          }[size],
          className
        )}
        {...props}
      />
    );
  }
);
```

#### 7.2.5 Component Specifications

```typescript
// Design tokens
export const tokens = {
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      responsive: 'cubic-bezier(0.2, 0, 0, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
}
```

### 7.3 User Experience Flows

#### Authentication Flow

```typescript
// Login page component
export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <Logo className="w-16 h-16 mx-auto mb-4" />
            <h1 className="display-medium">Welcome back</h1>
          </div>

          {!requires2FA ? (
            <LoginForm onSuccess={() => setRequires2FA(true)} />
          ) : (
            <TwoFactorForm />
          )}

          <Divider className="my-6" text="or" />

          <Button variant="secondary" fullWidth asChild>
            <Link href="/register">Create Account</Link>
          </Button>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}
```

#### Dashboard Navigation

```typescript
// Mobile-first navigation
export function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/portfolio', icon: TrendingUp, label: 'Portfolio' },
    { href: '/transactions', icon: Receipt, label: 'Transactions' },
    { href: '/analytics', icon: ChartBar, label: 'Analytics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-white/10 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <item.icon
                  className={cn(
                    'w-6 h-6',
                    isActive ? 'text-secondary-blue' : 'text-secondary-gray'
                  )}
                />
              </motion.div>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-secondary-blue mt-1"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

#### Error States

```typescript
// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error('Error boundary caught:', error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-secondary-gray mb-6">
          We're sorry for the inconvenience. Please try again.
        </p>
        <Button onClick={resetErrorBoundary} className="w-full">
          Try again
        </Button>
      </Card>
    </div>
  );
}
```

## 8. Infrastructure & Deployment

### 8.1 Infrastructure Requirements

#### Hosting Environment

**Frontend: Vercel Pro plan**

- Automatic scaling
- Global CDN
- Edge functions support
- Analytics included

**Database: Supabase Free Tier**

- 500MB storage limit
- 2GB bandwidth
- Unlimited API requests
- 500MB file storage

**Automation: Self-hosted n8n**

- VPS requirements: 2 vCPU, 4GB RAM
- Docker deployment
- ngrok or Traefik for tunneling

#### Server Requirements

```yaml
# docker-compose.yml for n8n
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - '5678:5678'
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=${WEBHOOK_URL}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./backups:/backups
    networks:
      - n8n_network

  postgres:
    image: postgres:15
    container_name: n8n_postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n_network:
    driver: bridge
```

#### Network Architecture

```
Internet
    │
    ├── Vercel Edge Network
    │   └── NextJS Application
    │
    ├── Supabase Cloud
    │   ├── PostgreSQL Database
    │   └── Realtime Server
    │
    └── Self-hosted Infrastructure
        ├── ngrok/Traefik (HTTPS tunnel)
        └── n8n Workflows
            ├── Yahoo Finance API
            ├── Currency APIs
            └── Google Drive API
```

### 8.2 Deployment Strategy

#### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### Environment Management

```typescript
// Environment configuration
const environments = {
  development: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    n8n: {
      webhookUrl: 'http://localhost:5678/webhook',
      apiKey: process.env.N8N_API_KEY,
    },
  },
  staging: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING,
    },
    n8n: {
      webhookUrl: process.env.N8N_WEBHOOK_URL_STAGING,
      apiKey: process.env.N8N_API_KEY_STAGING,
    },
  },
  production: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD,
    },
    n8n: {
      webhookUrl: process.env.N8N_WEBHOOK_URL_PROD,
      apiKey: process.env.N8N_API_KEY_PROD,
    },
  },
}

export const config =
  environments[process.env.NODE_ENV] || environments.development
```

#### Deployment Procedures

```bash
#!/bin/bash
# deploy.sh - Production deployment script

set -e

echo "🚀 Starting production deployment..."

# 1. Run pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run test:ci
npm run build

# 2. Database migrations
echo "🗄️ Running database migrations..."
npx supabase db push --linked

# 3. Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel --prod

# 4. Update n8n workflows
echo "🔄 Updating n8n workflows..."
./scripts/update-n8n-workflows.sh

# 5. Verify deployment
echo "✅ Verifying deployment..."
./scripts/verify-deployment.sh

echo "🎉 Deployment complete!"
```

#### Rollback Strategy

```typescript
// Rollback procedures
export const rollbackProcedures = {
  frontend: {
    steps: [
      'Identify the last working deployment in Vercel dashboard',
      'Click "Promote to Production" on the previous deployment',
      'Verify the rollback by checking the deployment URL',
      'Monitor error rates and user reports',
    ],
    estimatedTime: '2-5 minutes',
  },

  database: {
    steps: [
      'Access Supabase dashboard',
      'Navigate to Database > Backups',
      'Select the appropriate backup point',
      'Initiate restoration process',
      'Update connection strings if needed',
      'Verify data integrity',
    ],
    estimatedTime: '15-30 minutes',
  },

  n8n: {
    steps: [
      'SSH into n8n server',
      'Stop n8n container: docker-compose stop n8n',
      'Restore workflow backup: ./scripts/restore-workflows.sh',
      'Start n8n container: docker-compose start n8n',
      'Verify webhook endpoints',
    ],
    estimatedTime: '5-10 minutes',
  },
}
```

#### Configuration Management

```typescript
// config/index.ts - Centralized configuration
export const appConfig = {
  // API Configuration
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Cache Configuration
  cache: {
    priceCacheTTL: 15 * 60 * 1000, // 15 minutes
    portfolioCacheTTL: 60 * 60 * 1000, // 1 hour
    currencyCacheTTL: 30 * 60 * 1000, // 30 minutes
  },

  // Rate Limiting
  rateLimit: {
    yahooFinance: {
      requests: 2,
      interval: 1000, // 2 requests per second
    },
    currencyAPI: {
      requests: 100,
      interval: 60 * 60 * 1000, // 100 per hour
    },
  },

  // Feature Flags
  features: {
    enable2FA: true,
    enableCryptoTracking: false,
    enableTaxReporting: false,
    enableAIInsights: true,
  },

  // Monitoring
  monitoring: {
    sentryDSN: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || 'info',
    enablePerformanceMonitoring: true,
  },
}
```

### 8.3 Monitoring & Maintenance

#### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    app: 'healthy',
    database: 'unknown',
    cache: 'unknown',
    external: {
      n8n: 'unknown',
      yahooFinance: 'unknown',
    },
  }

  try {
    // Check database
    const dbCheck = await supabase.from('health_check').select('*').limit(1)
    checks.database = dbCheck.error ? 'unhealthy' : 'healthy'

    // Check cache
    const cacheCheck = await redis.ping()
    checks.cache = cacheCheck === 'PONG' ? 'healthy' : 'unhealthy'

    // Check n8n
    const n8nCheck = await fetch(`${config.n8n.webhookUrl}/health`)
    checks.external.n8n = n8nCheck.ok ? 'healthy' : 'unhealthy'

    // Check Yahoo Finance
    const yahooCheck = await testYahooFinanceAPI()
    checks.external.yahooFinance = yahooCheck ? 'healthy' : 'unhealthy'
  } catch (error) {
    console.error('Health check error:', error)
  }

  const overallHealth = Object.values(checks).every(status =>
    typeof status === 'string' ? status === 'healthy' : true
  )

  return NextResponse.json(
    {
      status: overallHealth ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: overallHealth ? 200 : 503 }
  )
}
```

#### Error Tracking

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies
      }
      return event
    },
  })
}

// Error logging helper
export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application error:', error)

  Sentry.captureException(error, {
    extra: context,
    tags: {
      section: context?.section || 'unknown',
    },
  })
}
```

#### Performance Monitoring

```typescript
// lib/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTimer(operation: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric(operation, duration)
    }
  }

  recordMetric(operation: string, value: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    const values = this.metrics.get(operation)!
    values.push(value)

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift()
    }

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${value}ms`)
      Sentry.captureMessage(`Slow operation: ${operation}`, 'warning', {
        extra: { duration: value },
      })
    }
  }

  getStats(operation: string) {
    const values = this.metrics.get(operation) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)],
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### 8.4 Backup & Disaster Recovery

#### Backup Strategy

```typescript
// scripts/backup.ts
export class BackupService {
  async performFullBackup() {
    const timestamp = new Date().toISOString()
    const backupId = `backup-${timestamp}`

    try {
      // 1. Export database
      const dbExport = await this.exportDatabase()

      // 2. Export user files
      const filesExport = await this.exportUserFiles()

      // 3. Export n8n workflows
      const workflowsExport = await this.exportN8nWorkflows()

      // 4. Create backup archive
      const archive = await this.createArchive({
        database: dbExport,
        files: filesExport,
        workflows: workflowsExport,
        metadata: {
          backupId,
          timestamp,
          version: process.env.APP_VERSION,
        },
      })

      // 5. Upload to Google Drive
      const uploadResult = await this.uploadToGoogleDrive(archive, backupId)

      // 6. Verify backup
      await this.verifyBackup(uploadResult.fileId)

      // 7. Clean up old backups
      await this.cleanupOldBackups()

      return { success: true, backupId, location: uploadResult.fileId }
    } catch (error) {
      await this.notifyBackupFailure(error)
      throw error
    }
  }

  async exportDatabase() {
    const { data, error } = await supabase.rpc('export_all_data').csv()

    if (error) throw error

    return data
  }

  async restoreFromBackup(backupId: string) {
    // Implementation for disaster recovery
    const backup = await this.downloadBackup(backupId)

    // Restore in correct order
    await this.restoreDatabase(backup.database)
    await this.restoreFiles(backup.files)
    await this.restoreWorkflows(backup.workflows)

    // Verify restoration
    await this.verifyRestoration()
  }
}
```

### 8.5 Project Structure

```
portfolio-tracker/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── test.yml
│       └── backup.yml
├── app/                          # NextJS app directory
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── portfolio/
│   │   ├── transactions/
│   │   ├── analytics/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── webhooks/
│   │   ├── health/
│   │   └── cron/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Base UI components
│   ├── features/                 # Feature components
│   ├── layouts/                  # Layout components
│   └── shared/                   # Shared components
├── lib/
│   ├── actions/                  # Server actions
│   ├── db/                       # Database utilities
│   ├── auth/                     # Auth utilities
│   ├── utils/                    # General utilities
│   └── types/                    # TypeScript types
├── hooks/                        # Custom React hooks
├── styles/                       # Global styles
├── public/                       # Static assets
├── config/                       # Configuration files
├── scripts/                      # Build/deploy scripts
├── n8n/                         # n8n workflow exports
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── functions/               # Edge functions
│   └── seed.sql                 # Seed data
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```
