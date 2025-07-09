# LifeDash Stock Widget Library

A comprehensive collection of stock-specific widgets for the LifeDash investment portfolio management platform. These widgets provide a complete solution for stock analysis, portfolio management, and investment tracking with Norwegian localization.

## 🎯 Overview

The stock widget library includes six core widgets that cover all aspects of stock analysis and portfolio management:

1. **StockChartWidget** - Interactive price charts with technical indicators
2. **NewsFeedWidget** - Real-time financial news and market information
3. **TransactionsWidget** - Complete transaction history with filtering
4. **FundamentalsWidget** - Key financial metrics and company information
5. **HoldingsWidget** - Portfolio holdings with P&L display
6. **PerformanceWidget** - Detailed performance analysis and risk metrics

## 🚀 Features

### Core Features
- **Norwegian Localization** - All text, dates, and numbers formatted for Norwegian users
- **Real-time Updates** - Live data integration with Finnhub API
- **Responsive Design** - Mobile-friendly widgets that adapt to different screen sizes
- **Theme Integration** - Consistent styling with LifeDash's purple theme
- **Export Capabilities** - CSV export functionality for data analysis
- **Error Handling** - Comprehensive error boundaries with user-friendly messages

### Technical Features
- **TypeScript Support** - Full type safety and excellent developer experience
- **Framer Motion** - Smooth animations and transitions
- **Recharts Integration** - Professional charts with customizable styling
- **shadcn/ui Components** - Modern, accessible UI components
- **Caching System** - Smart caching for improved performance
- **Widget Registry** - Centralized widget management system

## 📊 Widget Details

### 1. StockChartWidget

Interactive stock price charts with multiple view options and technical indicators.

**Features:**
- Multiple chart types (Area, Line, Candlestick)
- Time range selector (4h, D, W, M, 3M, YTD, 1Y)
- Technical indicators toggle
- Real-time price updates
- Hover tooltips with detailed information
- Price change indicators with color coding

**Usage:**
```tsx
import { StockChartWidget } from '@/components/widgets/stock'

<StockChartWidget
  symbol="AAPL"
  companyName="Apple Inc."
  data={chartData}
  currentPrice={150.25}
  priceChange={2.30}
  priceChangePercent={1.55}
  currency="USD"
  onTimeRangeChange={(range) => console.log('Time range changed:', range)}
  onRefresh={() => console.log('Refreshing chart data')}
/>
```

### 2. NewsFeedWidget

Real-time financial news feed with sentiment analysis and filtering.

**Features:**
- News sentiment analysis (Positive, Negative, Neutral)
- Category filtering (General, Business, Technology)
- Source badges with color coding
- Image support with error handling
- Search functionality
- Load more pagination
- Time-based sorting

**Usage:**
```tsx
import { NewsFeedWidget } from '@/components/widgets/stock'

<NewsFeedWidget
  symbol="AAPL"
  companyName="Apple Inc."
  news={newsData}
  onRefresh={() => console.log('Refreshing news')}
  onLoadMore={() => console.log('Loading more news')}
  hasMore={true}
/>
```

### 3. TransactionsWidget

Complete transaction history with advanced filtering and sorting.

**Features:**
- Transaction type badges (Buy, Sell, Dividend, Split, Spinoff)
- Multi-column sorting
- Account filtering
- Search functionality
- Export to CSV
- Summary statistics
- Norwegian broker support (Nordnet, DNB, Schwab)

**Usage:**
```tsx
import { TransactionsWidget } from '@/components/widgets/stock'

<TransactionsWidget
  symbol="AAPL"
  companyName="Apple Inc."
  transactions={transactionData}
  onRefresh={() => console.log('Refreshing transactions')}
  onExport={() => console.log('Exporting transactions')}
  onViewDetails={(transaction) => console.log('View details:', transaction)}
/>
```

### 4. FundamentalsWidget

Key financial metrics and company information with multiple views.

**Features:**
- Four view modes (Overview, Ratios, Market, Performance)
- Company profile information
- Financial ratio calculations
- Market metrics display
- Performance indicators
- Tooltips with metric explanations
- Color-coded metric cards

**Usage:**
```tsx
import { FundamentalsWidget } from '@/components/widgets/stock'

<FundamentalsWidget
  symbol="AAPL"
  companyName="Apple Inc."
  profile={companyProfile}
  financials={financialData}
  onRefresh={() => console.log('Refreshing fundamentals')}
/>
```

### 5. HoldingsWidget

Portfolio holdings display with P&L analysis and broker integration.

**Features:**
- Multi-broker support with color-coded badges
- P&L calculation with percentage display
- Position size visualization
- Quick actions (Buy More, Sell, View Details)
- Country flags for international stocks
- Progress bars for position performance
- Summary statistics

**Usage:**
```tsx
import { HoldingsWidget } from '@/components/widgets/stock'

<HoldingsWidget
  symbol="AAPL"
  companyName="Apple Inc."
  holdings={holdingsData}
  onRefresh={() => console.log('Refreshing holdings')}
  onViewDetails={(holding) => console.log('View details:', holding)}
  onBuyMore={(holding) => console.log('Buy more:', holding)}
  onSell={(holding) => console.log('Sell:', holding)}
/>
```

### 6. PerformanceWidget

Comprehensive performance analysis with risk metrics and charts.

**Features:**
- Multiple analysis views (Returns, Comparison, Metrics, Risk)
- Performance charts with benchmark comparison
- Risk analysis with distribution charts
- Sharpe ratio and other risk metrics
- Profit/loss distribution
- Win rate analysis
- Drawdown analysis

**Usage:**
```tsx
import { PerformanceWidget } from '@/components/widgets/stock'

<PerformanceWidget
  symbol="AAPL"
  companyName="Apple Inc."
  performanceData={performanceData}
  metrics={performanceMetrics}
  benchmarkName="S&P 500"
  currency="USD"
  onRefresh={() => console.log('Refreshing performance')}
/>
```

## 🎨 Styling and Theming

All widgets follow the LifeDash design system with consistent styling:

- **Primary Colors**: Purple (`#6366f1`) and variants
- **Success/Loss Colors**: Green (`#10b981`) and Red (`#ef4444`)
- **Norwegian Formatting**: Currency, dates, and numbers in Norwegian locale
- **Responsive Design**: Mobile-first approach with breakpoints
- **Dark Mode Support**: Full dark mode compatibility

## 🔧 Configuration

### Widget Registry Integration

All widgets are configured for use with the LifeDash widget registry:

```tsx
import { STOCK_WIDGET_CONFIGS, getStockWidgetConfig } from '@/components/widgets/stock'

// Get widget configuration
const chartConfig = getStockWidgetConfig('STOCK_CHART')
```

### Norwegian Labels

Comprehensive Norwegian translations are provided:

```tsx
import { getStockWidgetLabels } from '@/components/widgets/stock'

// Get all labels
const labels = getStockWidgetLabels()

// Get specific section labels
const chartLabels = getStockWidgetLabels('stockChart')
```

## 📱 Responsive Design

All widgets are designed to work seamlessly across devices:

- **Mobile**: Single-column layout with touch-friendly controls
- **Tablet**: Two-column layout with optimized spacing
- **Desktop**: Multi-column layout with full feature set

## 🔌 Data Integration

### Finnhub API Integration

Widgets integrate with the Finnhub API for real-time data:

```tsx
import { fetchRealStockPrice, fetchCompanyNews } from '@/lib/utils/finnhub-api'

// Fetch stock price
const priceData = await fetchRealStockPrice('AAPL')

// Fetch company news
const newsData = await fetchCompanyNews('AAPL', '2024-01-01', '2024-01-31')
```

### Database Integration

Widgets connect to the LifeDash database schema:

```sql
-- Core tables used by widgets
user_profiles → portfolios → accounts → transactions
                     ↓
                   stocks
```

## 🧪 Testing

### Unit Tests

Each widget includes comprehensive unit tests:

```bash
# Run tests for stock widgets
npm test -- --testPathPattern="widgets/stock"
```

### Integration Tests

End-to-end tests ensure widgets work with real data:

```bash
# Run integration tests
npm run test:integration
```

## 📊 Performance

### Optimization Features

- **Smart Caching**: TTL-based cache with automatic cleanup
- **Lazy Loading**: Components load only when needed
- **Debounced Updates**: Prevents excessive API calls
- **Memory Management**: Proper cleanup and abort controllers

### Performance Metrics

- **Initial Load**: < 200ms for cached data
- **API Calls**: Rate-limited to 60 calls/minute
- **Memory Usage**: < 50MB per widget
- **Bundle Size**: < 100KB per widget (gzipped)

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Usage

```tsx
import { StockChartWidget } from '@/components/widgets/stock'

function MyStockPage() {
  return (
    <div className="p-6">
      <StockChartWidget
        symbol="AAPL"
        companyName="Apple Inc."
        data={chartData}
        currentPrice={150.25}
        priceChange={2.30}
        priceChangePercent={1.55}
      />
    </div>
  )
}
```

## 📝 API Reference

### Common Props

All widgets share these common props:

```tsx
interface CommonWidgetProps {
  symbol: string              // Stock symbol (e.g., "AAPL")
  companyName: string         // Company name (e.g., "Apple Inc.")
  loading?: boolean           // Loading state
  error?: string | null       // Error message
  onRefresh?: () => void      // Refresh callback
  className?: string          // Additional CSS classes
}
```

### Data Types

Common data types used across widgets:

```tsx
interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  currency: string
  timestamp: string
}

interface Transaction {
  id: string
  date: string
  type: 'buy' | 'sell' | 'dividend'
  symbol: string
  quantity: number
  price: number
  fees: number
  account: string
}
```

## 🤝 Contributing

### Development Guidelines

1. **Norwegian First**: All user-facing text must be in Norwegian
2. **Accessibility**: Follow WCAG 2.1 AA guidelines
3. **Performance**: Maintain < 200ms load times
4. **Testing**: Write comprehensive tests for all features
5. **Documentation**: Update documentation for all changes

### Code Style

- **TypeScript**: Use strict mode with proper typing
- **Formatting**: Use Prettier with Norwegian locale
- **Components**: Follow the existing widget patterns
- **Naming**: Use descriptive Norwegian names for UI elements

## 📄 License

This widget library is part of the LifeDash platform and follows the same license terms.

## 📞 Support

For questions or support regarding the stock widget library:

1. Check the existing documentation
2. Review the component source code
3. Check the test files for usage examples
4. Contact the LifeDash development team

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained by**: LifeDash Development Team