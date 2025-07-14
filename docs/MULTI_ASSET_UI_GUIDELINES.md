# Multi-Asset UI Guidelines

## Universal Portfolio Interface Design

This document defines the user interface design patterns, components, and visual guidelines for the universal portfolio management application supporting stocks, cryptocurrencies, and alternative assets.

## Design Principles

### 1. Asset-Agnostic Design
- **Unified Interface**: Same interaction patterns across all asset types
- **Contextual Information**: Asset-specific details shown when relevant
- **Progressive Disclosure**: Complex information revealed on demand

### 2. Visual Hierarchy
- **Asset Class Differentiation**: Color coding and iconography per asset type
- **Information Density**: Adaptive detail levels based on screen size and context
- **Scannable Layouts**: Quick visual parsing of portfolio data

### 3. Responsive & Adaptive
- **Mobile-First**: Touch-friendly interactions and condensed layouts
- **Desktop Enhancement**: Rich data visualization and multi-panel layouts
- **Accessibility**: WCAG 2.1 AA compliance throughout

## Asset Class Visual Identity

### Color Scheme

```scss
// Primary asset class colors
$stocks-primary: #3b82f6;      // Blue
$stocks-secondary: #1e40af;
$stocks-accent: #dbeafe;

$crypto-primary: #f59e0b;       // Amber
$crypto-secondary: #d97706;
$crypto-accent: #fef3c7;

$alternatives-primary: #ec4899;  // Pink
$alternatives-secondary: #be185d;
$alternatives-accent: #fce7f3;

$cash-primary: #10b981;         // Emerald
$cash-secondary: #047857;
$cash-accent: #d1fae5;

// Neutral colors
$neutral-50: #f8fafc;
$neutral-100: #f1f5f9;
$neutral-200: #e2e8f0;
$neutral-500: #64748b;
$neutral-700: #334155;
$neutral-900: #0f172a;
```

### Iconography

```typescript
// Asset class icons
const assetIcons = {
  stocks: 'TrendingUp',
  crypto: 'Coins',
  alternatives: 'Palette',
  real_estate: 'Home',
  commodities: 'Zap',
  cash: 'DollarSign'
}

// Asset subtype icons
const subtypeIcons = {
  // Stocks
  common_stock: 'Building',
  etf: 'Package',
  mutual_fund: 'PieChart',
  reit: 'Home',
  
  // Crypto
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  stablecoin: 'Shield',
  defi_token: 'Shuffle',
  nft: 'Image',
  
  // Alternatives
  art: 'Palette',
  collectibles: 'Star',
  wine: 'Wine',
  watch: 'Clock',
  precious_metals: 'Award'
}
```

## Layout Components

### Universal Portfolio Dashboard

```tsx
interface PortfolioDashboard {
  header: {
    totalValue: string
    dayChange: ChangeIndicator
    portfolioSelector: Dropdown
    currencySelector: Dropdown
  }
  
  mainGrid: {
    performanceChart: AssetClassChart
    allocationBreakdown: AllocationChart
    topHoldings: HoldingsTable
    recentActivity: ActivityFeed
  }
  
  quickActions: {
    addTransaction: Button
    syncAccounts: Button
    generateReport: Button
    viewAnalytics: Button
  }
}
```

### Asset Holdings Table

```tsx
interface HoldingsTable {
  columns: {
    asset: AssetCell           // Symbol, name, asset class badge
    quantity: NumberCell       // Formatted with asset-specific decimals
    currentPrice: PriceCell    // Live price with change indicator
    marketValue: CurrencyCell  // Total position value
    costBasis: CurrencyCell    // Average cost basis
    pnl: PnLCell              // Unrealized P&L with percentage
    dayChange: ChangeCell      // 24h change
    allocation: PercentageCell // Portfolio allocation
    actions: ActionsCell       // Buy, sell, details
  }
  
  grouping: {
    byAssetClass: boolean
    byAccount: boolean
    byPerformance: boolean
  }
  
  filtering: {
    assetClass: MultiSelect
    minValue: NumberInput
    hideZero: Checkbox
  }
}
```

### Universal Transaction Modal

```tsx
interface TransactionModal {
  assetSelection: {
    search: AssetSearchInput
    recentAssets: AssetGrid
    popularAssets: AssetGrid
  }
  
  transactionDetails: {
    type: TransactionTypeSelector
    quantity: QuantityInput     // Adaptive precision
    price: PriceInput          // Optional for deposits/withdrawals
    date: DatePicker
    account: AccountSelector
  }
  
  fees: {
    commission: CurrencyInput
    networkFees: CurrencyInput  // For crypto
    platformFees: CurrencyInput
    otherFees: CurrencyInput
  }
  
  advanced: {
    notes: TextArea
    tags: TagInput
    splitRatio: NumberInput     // For stock splits
    relatedTransaction: TransactionPicker
  }
}
```

## Asset-Specific Components

### Stock Detail Panel

```tsx
interface StockDetailPanel {
  header: {
    symbol: string
    companyName: string
    exchange: string
    sector: Badge
    price: LivePriceDisplay
  }
  
  tabs: {
    overview: {
      chart: PriceChart
      keyMetrics: MetricsGrid
      news: NewsFeed
    }
    
    fundamentals: {
      financials: FinancialTable
      ratios: RatiosGrid
      estimates: EstimatesTable
    }
    
    holdings: {
      transactions: TransactionHistory
      performance: PerformanceChart
      costBasis: TaxLotTable
    }
  }
}
```

### Crypto Asset Panel

```tsx
interface CryptoDetailPanel {
  header: {
    symbol: string
    name: string
    network: NetworkBadge
    price: LivePriceDisplay
    marketCap: CurrencyDisplay
  }
  
  tabs: {
    overview: {
      chart: PriceChart
      metrics: CryptoMetrics    // Volume, supply, etc.
      news: NewsFeed
    }
    
    defi: {
      stakingRewards: RewardsTable
      liquidityPools: PoolsTable
      yieldFarming: YieldTable
    }
    
    holdings: {
      transactions: TransactionHistory
      addresses: AddressTracker
      performance: PerformanceChart
    }
  }
}
```

### Alternative Asset Panel

```tsx
interface AlternativeDetailPanel {
  header: {
    name: string
    category: CategoryBadge
    artist: string
    estimatedValue: CurrencyDisplay
  }
  
  tabs: {
    overview: {
      images: ImageGallery
      details: PropertyGrid
      provenance: ProvenanceTimeline
    }
    
    valuation: {
      appraisals: AppraisalHistory
      marketComps: ComparablesSales
      priceHistory: ValueChart
    }
    
    ownership: {
      transactions: TransactionHistory
      storage: StorageDetails
      insurance: InsuranceDetails
    }
  }
}
```

## Responsive Design Patterns

### Mobile Layout (< 768px)

```tsx
interface MobileLayout {
  navigation: {
    type: 'bottom-tabs'
    tabs: ['Portfolio', 'Holdings', 'Activity', 'More']
  }
  
  dashboard: {
    layout: 'single-column'
    cards: ['Total Value', 'Asset Allocation', 'Top Holdings']
    expandable: true
  }
  
  holdings: {
    format: 'compact-cards'
    grouping: 'asset-class'
    swipeActions: ['Buy', 'Sell', 'Details']
  }
  
  transactions: {
    modal: 'fullscreen'
    steps: 'wizard-style'
    inputs: 'large-touch-targets'
  }
}
```

### Tablet Layout (768px - 1024px)

```tsx
interface TabletLayout {
  navigation: {
    type: 'side-drawer'
    collapsible: true
  }
  
  dashboard: {
    layout: 'two-column-grid'
    charts: 'medium-size'
    tables: 'scrollable'
  }
  
  holdings: {
    format: 'condensed-table'
    columns: 'priority-based'
    actions: 'hover-reveal'
  }
}
```

### Desktop Layout (> 1024px)

```tsx
interface DesktopLayout {
  navigation: {
    type: 'persistent-sidebar'
    width: '240px'
  }
  
  dashboard: {
    layout: 'grid-system'
    widgets: 'draggable-resizable'
    panels: 'multi-column'
  }
  
  holdings: {
    format: 'full-table'
    columns: 'all-visible'
    actions: 'inline-buttons'
  }
  
  details: {
    format: 'side-panel'
    charts: 'interactive'
    data: 'comprehensive'
  }
}
```

## Data Visualization Guidelines

### Performance Charts

```typescript
interface ChartConfiguration {
  // Time period selector
  periods: ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']
  
  // Chart types
  types: {
    line: 'default'          // Price over time
    candlestick: 'stocks'    // OHLC data
    area: 'portfolio'        // Portfolio value
    bar: 'volume'           // Trading volume
  }
  
  // Asset class specific styling
  styling: {
    stocks: {
      colors: ['#3b82f6', '#1e40af']
      indicators: ['MA20', 'MA50', 'Volume']
    }
    
    crypto: {
      colors: ['#f59e0b', '#d97706']
      indicators: ['RSI', 'MACD', 'Volume']
    }
    
    alternatives: {
      colors: ['#ec4899', '#be185d']
      indicators: ['Appreciation', 'Market Comps']
    }
  }
}
```

### Allocation Charts

```typescript
interface AllocationVisualization {
  // Pie chart for high-level allocation
  pieChart: {
    segments: AssetClass[]
    colors: AssetClassColors
    labels: 'percentage'
    interactive: true
  }
  
  // Treemap for detailed breakdown
  treemap: {
    levels: ['asset_class', 'sector', 'individual_holdings']
    sizing: 'market_value'
    coloring: 'performance'
  }
  
  // Sankey diagram for flow analysis
  sankeyDiagram: {
    flows: ['cash_to_investments', 'rebalancing', 'dividends']
    timeframe: 'configurable'
  }
}
```

## Interaction Patterns

### Search & Discovery

```typescript
interface AssetSearch {
  // Universal search input
  searchInput: {
    placeholder: 'Search stocks, crypto, art...'
    autocomplete: true
    filters: AssetClassFilter[]
    recentSearches: true
  }
  
  // Results display
  results: {
    grouping: 'by_asset_class'
    highlighting: 'matched_terms'
    metadata: 'exchange_price_change'
    actions: ['Add to Watchlist', 'Quick Buy']
  }
  
  // Advanced filters
  filters: {
    assetClass: MultiSelect
    exchange: MultiSelect
    priceRange: RangeSlider
    marketCap: RangeSlider
    sector: MultiSelect
  }
}
```

### Quick Actions

```typescript
interface QuickActions {
  // Context-aware action buttons
  contextActions: {
    portfolio: ['Add Cash', 'Buy Asset', 'Rebalance']
    holding: ['Buy More', 'Sell', 'Set Alert']
    transaction: ['Edit', 'Duplicate', 'Delete']
  }
  
  // Bulk operations
  bulkActions: {
    selection: 'checkbox-based'
    operations: ['Update Prices', 'Export', 'Tag', 'Delete']
    confirmation: 'summary-modal'
  }
  
  // Shortcuts
  keyboard: {
    'Cmd+N': 'New Transaction'
    'Cmd+F': 'Search Assets'
    'Cmd+Shift+S': 'Sync Accounts'
  }
}
```

## Animation & Transitions

### Performance Indicators

```css
/* Live price updates */
.price-update {
  animation: pulse-green 0.5s ease-in-out;
}

.price-update.negative {
  animation: pulse-red 0.5s ease-in-out;
}

/* Portfolio value changes */
.portfolio-change {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading states */
.loading-skeleton {
  animation: shimmer 1.5s infinite;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
}
```

### State Transitions

```typescript
interface AnimationStates {
  loading: {
    duration: '1.5s'
    type: 'skeleton-shimmer'
    elements: ['table-rows', 'chart-areas', 'card-content']
  }
  
  dataUpdate: {
    duration: '0.3s'
    type: 'fade-in'
    stagger: '0.1s'
  }
  
  stateChange: {
    duration: '0.2s'
    type: 'smooth-transition'
    properties: ['color', 'background', 'transform']
  }
}
```

## Accessibility Guidelines

### Keyboard Navigation

```typescript
interface KeyboardSupport {
  tableNavigation: {
    'Arrow Keys': 'Navigate cells'
    'Tab': 'Move to next interactive element'
    'Enter': 'Activate selected item'
    'Escape': 'Close modal/dropdown'
  }
  
  formControls: {
    'Tab': 'Move between fields'
    'Shift+Tab': 'Move to previous field'
    'Enter': 'Submit form'
    'Escape': 'Cancel/close'
  }
  
  shortcuts: {
    'Alt+H': 'Go to holdings'
    'Alt+T': 'View transactions'
    'Alt+A': 'Add new transaction'
  }
}
```

### Screen Reader Support

```typescript
interface A11ySupport {
  // ARIA labels for dynamic content
  liveRegions: {
    priceUpdates: 'aria-live="polite"'
    portfolioValue: 'aria-live="polite"'
    alerts: 'aria-live="assertive"'
  }
  
  // Descriptive labels
  dataLabels: {
    priceChange: 'Price change: up 2.5% to $150.25'
    allocation: 'Apple represents 15.2% of your portfolio'
    performance: 'Portfolio up 8.3% year to date'
  }
  
  // Focus management
  focusManagement: {
    modalOpen: 'focus-first-input'
    modalClose: 'return-to-trigger'
    pageNavigation: 'focus-main-content'
  }
}
```

## Theme System

### Light/Dark Mode Support

```scss
// CSS custom properties for theming
:root {
  --color-background: #{$neutral-50};
  --color-surface: white;
  --color-text-primary: #{$neutral-900};
  --color-text-secondary: #{$neutral-500};
  
  --color-stocks: #{$stocks-primary};
  --color-crypto: #{$crypto-primary};
  --color-alternatives: #{$alternatives-primary};
}

[data-theme="dark"] {
  --color-background: #{$neutral-900};
  --color-surface: #{$neutral-800};
  --color-text-primary: #{$neutral-100};
  --color-text-secondary: #{$neutral-400};
}
```

### High Contrast Mode

```scss
@media (prefers-contrast: high) {
  :root {
    --color-stocks: #0066cc;
    --color-crypto: #cc6600;
    --color-alternatives: #cc0066;
    
    --border-width: 2px;
    --focus-outline: 3px solid currentColor;
  }
}
```

## Performance Guidelines

### Component Optimization

```typescript
interface PerformancePatterns {
  // Virtual scrolling for large lists
  virtualScrolling: {
    threshold: 100        // Items before virtualization
    itemHeight: 'variable'
    overscan: 5
  }
  
  // Lazy loading for heavy components
  lazyLoading: {
    charts: 'intersection-observer'
    images: 'loading="lazy"'
    modals: 'dynamic-import'
  }
  
  // Memoization patterns
  memoization: {
    calculations: 'useMemo'
    callbacks: 'useCallback'
    components: 'React.memo'
  }
}
```

This comprehensive UI guideline ensures consistent, accessible, and performant user interfaces across all asset types while maintaining the flexibility to handle the unique requirements of each asset class.