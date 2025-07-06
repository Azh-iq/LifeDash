# Chart Data Server Actions

This directory contains server actions for fetching and processing chart data from the LifeDash database. All actions are designed with performance, security, and Norwegian market support in mind.

## Features

- **Portfolio Performance Tracking**: Historical snapshots with comprehensive metrics
- **Asset Allocation Analysis**: Breakdown by asset class, sector, industry, and geography
- **Multi-Portfolio Comparisons**: Side-by-side performance analysis with correlation matrices
- **Benchmark Integration**: Compare against market indices (SPY, OSEBX, etc.)
- **Norwegian Market Support**: Specialized functions for Oslo Børs and Nordic markets
- **Currency Conversion**: Multi-currency support with proper formatting
- **Caching Strategy**: Optimized caching with automatic invalidation
- **RLS Compliance**: Row-level security for data access control
- **Error Handling**: Comprehensive validation and error reporting

## File Structure

```
charts/
├── performance-data.ts    # Portfolio performance queries
├── allocation-data.ts     # Asset allocation calculations
├── comparison-data.ts     # Multi-portfolio comparisons
├── benchmark-data.ts      # Market benchmark data fetching
├── index.ts              # Export all chart actions
└── README.md             # This documentation
```

## Usage Examples

### Portfolio Performance Data

```typescript
import { getPortfolioPerformanceData } from '@/lib/actions/charts'

// Get 1-year performance data
const result = await getPortfolioPerformanceData({
  portfolioId: 'portfolio-uuid',
  period: '1Y',
  granularity: 'daily',
})

if (result.success && result.data) {
  const { data, summary } = result.data
  console.log(`Total Return: ${summary.totalReturnPercent}%`)
  console.log(`Sharpe Ratio: ${summary.sharpeRatio}`)

  // Use data for chart visualization
  const chartData = data.map(point => ({
    x: point.date,
    y: point.value,
  }))
}
```

### Asset Allocation Analysis

```typescript
import { getPortfolioAllocation } from '@/lib/actions/charts'

// Get current allocation breakdown
const result = await getPortfolioAllocation({
  portfolioId: 'portfolio-uuid',
  groupBy: 'asset_class',
  includeTargets: true,
})

if (result.success && result.data) {
  const { allocations, targets, summary } = result.data

  // Create pie chart data
  const pieData = allocations.map(allocation => ({
    label: allocation.category,
    value: allocation.percentage,
    color: allocation.color,
  }))

  // Check if rebalancing is recommended
  if (summary.rebalanceRecommended) {
    console.log('Portfolio rebalancing recommended')
  }
}
```

### Portfolio Comparison

```typescript
import { comparePortfolios } from '@/lib/actions/charts'

// Compare multiple portfolios
const result = await comparePortfolios({
  portfolioIds: ['portfolio-1', 'portfolio-2', 'portfolio-3'],
  period: '1Y',
  normalizeToBase: true,
})

if (result.success && result.data) {
  const { data, metrics, summary } = result.data

  console.log(`Best Performer: ${summary.bestPerformer}`)
  console.log(`Most Volatile: ${summary.mostVolatile}`)

  // Use data for line chart
  const lineChartData = data.map(point => ({
    date: point.date,
    ...point.portfolios,
  }))
}
```

### Benchmark Comparison

```typescript
import { compareWithBenchmarks } from '@/lib/actions/charts'

// Compare portfolio against market benchmarks
const result = await compareWithBenchmarks({
  portfolioId: 'portfolio-uuid',
  benchmarkSymbols: ['SPY', 'OSEBX', 'QQQ'],
  period: '1Y',
  includeAlpha: true,
  includeBeta: true,
})

if (result.success && result.data) {
  const { data, metrics } = result.data

  // Check alpha and beta
  const portfolioMetrics = metrics[0]
  console.log(`Alpha: ${portfolioMetrics.alpha}`)
  console.log(`Beta: ${portfolioMetrics.beta}`)
}
```

### Norwegian Market Data

```typescript
import { getNorwegianMarketData } from '@/lib/actions/charts'

// Get Norwegian market indices
const result = await getNorwegianMarketData('1Y')

if (result.success && result.data) {
  result.data.forEach(benchmark => {
    console.log(`${benchmark.name}: ${benchmark.metrics.dayChangePercent}%`)
  })
}
```

### Market Overview

```typescript
import { getMarketOverview } from '@/lib/actions/charts'

// Get Nordic market overview
const result = await getMarketOverview({
  region: 'NORDIC',
  assetClasses: ['INDEX', 'ETF'],
})

if (result.success && result.data) {
  const { indices, sectors, summary } = result.data

  console.log(`Market Sentiment: ${summary.marketSentiment}`)
  console.log(`Advancers: ${summary.advancers}`)
  console.log(`Decliners: ${summary.decliners}`)
}
```

## Caching Strategy

All chart actions implement intelligent caching to optimize performance:

```typescript
import { getCachedPortfolioPerformanceData } from '@/lib/actions/charts'

// This will use cached data if available and fresh
const result = await getCachedPortfolioPerformanceData({
  portfolioId: 'portfolio-uuid',
  period: '1M',
})

// Check if data was served from cache
if (result.metadata?.cached) {
  console.log('Data served from cache')
}
```

### Cache Configuration

- **Performance Data**: 5 minutes TTL
- **Allocation Data**: 10 minutes TTL
- **Benchmark Data**: 5 minutes TTL
- **Comparison Data**: 10 minutes TTL

## Error Handling

All actions return a consistent result structure:

```typescript
interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    cached?: boolean
    calculatedAt?: string
    dataPoints?: number
  }
}
```

Handle errors gracefully:

```typescript
const result = await getPortfolioPerformanceData(params)

if (!result.success) {
  console.error('Chart data error:', result.error)
  // Handle error state in UI
  return
}

// Use result.data safely
const chartData = result.data
```

## Database Tables Used

The chart actions query these database tables:

- `portfolio_snapshots_enhanced` - Daily portfolio value snapshots
- `account_performance_history` - Account-level performance tracking
- `asset_allocation_history` - Historical asset allocation data
- `benchmark_data` - Market benchmark prices and metrics
- `performance_metrics` - Calculated performance metrics
- `portfolios` - Portfolio metadata and access control

## Time Period Support

All actions support these time periods:

- `1D` - Last 24 hours
- `1W` - Last 7 days
- `1M` - Last 30 days
- `3M` - Last 90 days
- `6M` - Last 180 days
- `1Y` - Last 365 days
- `YTD` - Year to date
- `ITD` - Inception to date
- `ALL` - All available data

## Currency Support

Multi-currency support with proper formatting:

```typescript
import { formatCurrency } from '@/lib/actions/charts'

const formatted = formatCurrency(1234.56, 'NOK', 2)
console.log(formatted) // "NOK 1,234.56"
```

Supported currencies include:

- USD, EUR, GBP, JPY, CAD, AUD
- NOK, SEK, DKK (Nordic currencies)
- And many more...

## Performance Optimization

### Database Indexing

The chart actions are optimized with proper database indexes:

- `portfolio_snapshots_enhanced(portfolio_id, snapshot_date)`
- `asset_allocation_history(portfolio_id, allocation_date, asset_class)`
- `benchmark_data(benchmark_symbol, price_date)`
- `performance_metrics(entity_type, entity_id, period_type)`

### Query Optimization

- Use specific column selection to minimize data transfer
- Implement proper date range filtering
- Leverage database functions for calculations
- Use materialized views for complex aggregations

### Caching Layers

1. **Database Level**: Materialized views for expensive calculations
2. **Application Level**: Next.js `unstable_cache` for server actions
3. **CDN Level**: Static assets and computed results

## Security Considerations

### Row Level Security (RLS)

All queries respect RLS policies:

```sql
-- Example RLS policy for portfolio snapshots
CREATE POLICY "Users can view accessible portfolio snapshots"
ON portfolio_snapshots_enhanced
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM portfolios p
    WHERE p.id = portfolio_id
    AND (p.user_id = auth.uid() OR p.is_public = true)
  )
);
```

### Input Validation

All user inputs are validated with Zod schemas:

```typescript
const portfolioPerformanceSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),
  period: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ITD', 'ALL']),
  // ... other validations
})
```

### Access Control

- Portfolio access verified before data queries
- Public portfolios accessible to all authenticated users
- Private portfolios only accessible to owners
- Admin users can access all data with service role

## Contributing

When adding new chart actions:

1. Follow the existing patterns for validation, error handling, and caching
2. Include comprehensive TypeScript types
3. Add proper database indexes for new queries
4. Implement RLS policies for data security
5. Update this documentation with examples
6. Add unit tests for critical functions

## Testing

Test chart actions with different scenarios:

```typescript
// Test with invalid portfolio ID
const invalidResult = await getPortfolioPerformanceData({
  portfolioId: 'invalid-uuid',
  period: '1Y',
})
expect(invalidResult.success).toBe(false)

// Test with valid data
const validResult = await getPortfolioPerformanceData({
  portfolioId: validPortfolioId,
  period: '1Y',
})
expect(validResult.success).toBe(true)
expect(validResult.data).toBeDefined()
```

## Monitoring and Logging

All chart actions include comprehensive logging:

- Query performance metrics
- Error tracking with stack traces
- Cache hit/miss ratios
- User access patterns

Monitor these metrics in production to optimize performance and identify issues early.
