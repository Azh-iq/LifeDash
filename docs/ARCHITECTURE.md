# LifeDash - Technical Architecture

## Overview

LifeDash follows a modern serverless architecture pattern with clear separation of concerns, real-time capabilities, and web-focused design principles. The system has evolved from a mobile-first portfolio app to a comprehensive life dashboard focusing on four key areas: Investments, Projects, Hobby, and Health. Built to scale efficiently while maintaining simplicity and cost-effectiveness.

## Architecture Principles

- **Serverless-First**: Leverage managed services for reduced operational overhead
- **Real-Time by Design**: WebSocket integration for live data updates
- **Web-Focused**: Desktop-optimized interfaces with responsive design for all devices
- **Life Dashboard Approach**: Comprehensive view of personal metrics across four life areas
- **Security-First**: Authentication, authorization, and data protection built-in
- **Type-Safe**: End-to-end TypeScript for reduced runtime errors
- **Performance-Optimized**: Efficient data loading and caching strategies

## High-Level System Architecture

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

## Frontend Architecture

### NextJS 14+ with App Router

**Technology Stack:**

- **Framework**: NextJS 14+ with App Router
- **Language**: TypeScript 5+ with strict mode
- **Styling**: TailwindCSS with custom design system
- **Animation**: Framer Motion for sophisticated interactions
- **Charts**: Recharts for data visualization
- **State Management**: React hooks + Supabase real-time subscriptions

**Component Architecture:**

```
app/
├── (auth)/                    # Authentication pages
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (dashboard)/              # Protected dashboard
│   ├── page.tsx             # Main life dashboard with 2x2 grid
│   ├── portfolios/          # Investment management
│   ├── analytics/           # Investment analytics
│   ├── stocks/              # Stock tracking
│   ├── settings/            # User preferences
│   └── layout.tsx
├── api/                      # API routes for webhooks
└── layout.tsx               # Root layout

components/
├── ui/                      # Base design system components
├── features/                # Feature-specific components
│   ├── dashboard/           # Life area cards (Investment, Project, Hobby, Health)
│   ├── portfolio/           # Portfolio management components
│   ├── import/              # CSV import workflow
│   └── auth/                # Authentication components
├── layouts/                 # Page layout components
└── shared/                  # Shared utility components
    ├── navigation/          # TopNavigation, Breadcrumbs
    ├── currency/            # Amount and difference displays
    ├── charts/              # Data visualization
    └── data-display/        # Tables, metrics, cards

lib/
├── actions/                 # Server Actions (API layer)
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
└── types/                   # TypeScript type definitions
```

**Key Architectural Decisions:**

1. **Server Components by Default**: Reduced client-side JavaScript bundle
2. **Server Actions for APIs**: Type-safe RPC-style API calls
3. **Real-time Subscriptions**: Supabase WebSocket integration
4. **Progressive Enhancement**: Works without JavaScript for basic functionality

### State Management Strategy

**Local State**: React hooks (`useState`, `useReducer`)
**Server State**: Server Actions + Supabase real-time subscriptions
**Global State**: React Context for auth and theme
**URL State**: NextJS router for shareable application state

**Example Real-time Hook:**

```typescript
export function usePortfolioRealtime(portfolioId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  useEffect(() => {
    const subscription = supabase
      .channel(`portfolio:${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `id=eq.${portfolioId}`,
        },
        payload => {
          setPortfolio(payload.new as Portfolio)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [portfolioId])

  return portfolio
}
```

## Backend Architecture

### Server Actions (API Layer)

**Philosophy**: Replace traditional REST APIs with type-safe Server Actions

**Benefits:**

- No API route definitions needed
- Automatic request/response validation
- Built-in CSRF protection
- Direct database access without serialization
- Streaming support for large datasets

**Example Server Action:**

```typescript
'use server'

export async function createPortfolio(formData: FormData) {
  // 1. Validate input with Zod
  const validated = portfolioSchema.parse(Object.fromEntries(formData))

  // 2. Get authenticated user
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // 3. Database operation
  const { data, error } = await supabase
    .from('portfolios')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create portfolio')

  // 4. Revalidate cache
  revalidatePath('/portfolios')

  return data
}
```

### n8n Automation Layer

**Purpose**: Handle background processing, external API integrations, and scheduled tasks

**Key Workflows:**

1. **Price Updates**: Fetch market data every 15 minutes
2. **CSV Processing**: Parse and validate uploaded files
3. **Backup Management**: Automated data backups to Google Drive
4. **Data Synchronization**: Keep external platform data in sync

**Webhook Integration:**

```typescript
// Webhook handler for n8n callbacks
export async function POST(request: Request) {
  const signature = request.headers.get('X-Webhook-Signature')
  const body = await request.text()

  // Verify HMAC signature
  if (!verifySignature(signature, body)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { event, data } = JSON.parse(body)

  switch (event) {
    case 'price.updated':
      await handlePriceUpdate(data)
      break
    case 'csv.processed':
      await handleCSVProcessed(data)
      break
    default:
      return new Response('Unknown event', { status: 400 })
  }

  return new Response('OK')
}
```

## Database Architecture

### Supabase PostgreSQL

**Key Features:**

- Row Level Security (RLS) for multi-tenancy
- Real-time subscriptions via WebSockets
- Built-in authentication and authorization
- JSONB for flexible schema design
- Partitioned tables for time-series data

**Schema Design Principles:**

1. **Normalized Structure**: Reduce data redundancy
2. **Audit Trail**: Track all important changes
3. **Performance Optimization**: Strategic indexing and partitioning
4. **Data Compression**: JSONB for historical price data

### Core Tables

**Users & Authentication:**

```sql
-- Managed by Supabase Auth
auth.users

-- Extended user settings
user_settings (
  user_id UUID REFERENCES auth.users(id),
  totp_enabled BOOLEAN,
  display_currency TEXT,
  theme TEXT,
  notifications JSONB
)
```

**Portfolio Management:**

```sql
portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  base_currency TEXT,
  total_value DECIMAL(20, 2),
  created_at TIMESTAMPTZ
)

holdings (
  portfolio_id UUID REFERENCES portfolios(id),
  stock_symbol TEXT REFERENCES stocks(symbol),
  quantity DECIMAL(20, 8),
  cost_basis DECIMAL(20, 2),
  current_value DECIMAL(20, 2)
)
```

**Transaction Data:**

```sql
transactions (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id),
  stock_symbol TEXT REFERENCES stocks(symbol),
  transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 8),
  transaction_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

**Market Data (Partitioned):**

```sql
-- Partitioned by timestamp for performance
stock_prices (
  symbol TEXT REFERENCES stocks(symbol),
  timestamp TIMESTAMPTZ,
  price DECIMAL(20, 8),
  volume BIGINT,
  PRIMARY KEY (symbol, timestamp)
) PARTITION BY RANGE (timestamp);

-- Compressed historical data
stock_prices_compressed (
  symbol TEXT,
  date DATE,
  data JSONB -- Contains OHLCV data
)
```

### Row Level Security (RLS)

**User Data Isolation:**

```sql
-- Portfolio access policy
CREATE POLICY "Users can access own portfolios" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- Transaction access policy
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );
```

### Real-time Subscriptions

**Portfolio Value Updates:**

```sql
-- Database trigger for real-time updates
CREATE OR REPLACE FUNCTION notify_portfolio_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'portfolio_update',
    json_build_object(
      'portfolio_id', NEW.id,
      'total_value', NEW.total_value,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_update_trigger
  AFTER UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION notify_portfolio_change();
```

## Security Architecture

### Authentication & Authorization

**Multi-layered Security:**

1. **Supabase Auth**: Email/password with JWT tokens
2. **TOTP 2FA**: Time-based one-time passwords using Speakeasy
3. **Session Management**: Secure HTTP-only cookies
4. **Row Level Security**: Database-level access control

**Authentication Flow:**

```typescript
// Login with 2FA
export async function authenticate(
  email: string,
  password: string,
  totpCode?: string
) {
  // 1. Primary authentication
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error: 'Invalid credentials' }

  // 2. Check 2FA requirement
  const user = await getUserSettings(authData.user.id)
  if (user.totp_enabled) {
    if (!totpCode) return { requires2FA: true }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      token: totpCode,
      window: 2,
    })

    if (!verified) return { error: 'Invalid 2FA code' }
  }

  return { success: true, session: authData.session }
}
```

### Data Protection

**Encryption at Rest:**

- Database: Supabase managed encryption
- API Keys: AES-256-GCM encryption
- File Storage: Encrypted storage buckets

**Encryption in Transit:**

- HTTPS/TLS 1.3 for all communications
- WebSocket Secure (WSS) for real-time data
- Certificate pinning for API calls

**Input Validation:**

```typescript
// Comprehensive validation with Zod
export const transactionSchema = z.object({
  portfolioId: z.string().uuid(),
  stockSymbol: z.string().regex(/^[A-Z]{1,5}$/),
  quantity: z.number().positive().max(1000000),
  price: z.number().positive().max(1000000),
  date: z.date().max(new Date()),
})
```

## Integration Architecture

### External API Management

**Yahoo Finance Integration:**

- Rate limiting: 2 requests per second
- Caching: 15-minute TTL for price data
- Fallback: Multiple data sources
- Error handling: Exponential backoff

**Currency API Integration:**

- Primary: exchangerate-api.com
- Fallback: fixer.io
- Historical rates: Preserved for accurate P&L calculation

**Google Drive Backup:**

- OAuth2 authentication
- Automated weekly backups
- 30-day retention policy
- Encrypted archives

### Webhook Security

**HMAC Signature Verification:**

```typescript
export function verifyWebhookSignature(
  signature: string,
  body: string
): boolean {
  const hmac = createHmac('sha256', process.env.WEBHOOK_SECRET)
  const digest = hmac.update(body).digest('hex')

  return timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}
```

## Performance Architecture

### Caching Strategy

**Multi-level Caching:**

1. **Browser Cache**: Static assets and API responses
2. **CDN Cache**: Global content delivery via Vercel Edge
3. **Application Cache**: Redis for frequently accessed data
4. **Database Cache**: PostgreSQL shared buffers and query cache

**Cache Implementation:**

```typescript
// Redis caching for expensive operations
export async function getPortfolioMetrics(portfolioId: string) {
  const cacheKey = `portfolio:metrics:${portfolioId}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Calculate metrics
  const metrics = await calculateMetrics(portfolioId)

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(metrics))

  return metrics
}
```

### Database Optimization

**Query Optimization:**

- Strategic indexing on frequently queried columns
- Materialized views for complex analytics
- Query plan analysis and optimization
- Connection pooling via Supabase

**Data Archiving:**

```sql
-- Automatic archiving of old price data
CREATE OR REPLACE FUNCTION archive_old_prices()
RETURNS void AS $$
BEGIN
  -- Move data older than 90 days to compressed storage
  INSERT INTO stock_prices_compressed (symbol, date, data)
  SELECT
    symbol,
    DATE(timestamp),
    jsonb_build_object(
      'open', first_value(price) OVER w,
      'high', max(price) OVER w,
      'low', min(price) OVER w,
      'close', last_value(price) OVER w,
      'volume', sum(volume) OVER w
    )
  FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days'
  WINDOW w AS (
    PARTITION BY symbol, DATE(timestamp)
    ORDER BY timestamp
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  );

  -- Delete archived data
  DELETE FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

## Deployment Architecture

### Infrastructure Stack

**Frontend Hosting: Vercel**

- Global CDN with edge locations
- Automatic scaling based on traffic
- Built-in analytics and monitoring
- Zero-downtime deployments

**Database: Supabase Cloud**

- Managed PostgreSQL with automatic backups
- Real-time subscriptions
- Row Level Security
- Global edge network

**Automation: Self-hosted n8n**

- Docker containerization
- Reverse proxy via Traefik/ngrok
- Persistent volume for workflows
- Health monitoring and auto-restart

### CI/CD Pipeline

**Automated Deployment:**

```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        run: vercel deploy --prod

      - name: Run health checks
        run: ./scripts/health-check.sh
```

### Monitoring & Observability

**Error Tracking: Sentry**

- Real-time error monitoring
- Performance tracking
- User session replay
- Custom alerts and notifications

**Logging Strategy:**

- Structured logging with correlation IDs
- Log aggregation and analysis
- Sensitive data filtering
- Retention policies

**Health Monitoring:**

```typescript
// Comprehensive health checks
export async function healthCheck() {
  return {
    database: await checkDatabase(),
    external_apis: await checkExternalAPIs(),
    cache: await checkCache(),
    disk_space: await checkDiskSpace(),
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
  }
}
```

## Scalability Considerations

### Current Capacity

**Supabase Free Tier Limits:**

- 500MB database storage
- 2GB bandwidth per month
- Unlimited API requests
- 500MB file storage

**Optimization Strategies:**

- Data compression and archiving
- Efficient query patterns
- Caching layers
- Image optimization

### Future Scaling Path

**Database Scaling:**

1. **Vertical Scaling**: Upgrade to Supabase Pro ($25/month)
2. **Read Replicas**: Distribute read queries
3. **Connection Pooling**: Handle more concurrent users
4. **Data Partitioning**: Split large tables by date/user

**Application Scaling:**

1. **Edge Functions**: Move compute closer to users
2. **CDN Optimization**: Aggressive caching strategies
3. **Code Splitting**: Reduce bundle sizes
4. **Service Workers**: Offline functionality

**Infrastructure Scaling:**

1. **Multiple Regions**: Deploy to multiple geographic regions
2. **Load Balancing**: Distribute traffic across instances
3. **Auto Scaling**: Automatic capacity adjustment
4. **Microservices**: Split monolith into specialized services

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Living Document - Updated as architecture evolves
