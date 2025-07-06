# Portfolio Chart Components

Comprehensive chart components for the LifeDash investment platform using Recharts library.

## Components

### 1. PortfolioPerformanceChart

Main portfolio performance chart with time-series data visualization.

**Features:**

- Line and area chart modes
- Norwegian currency formatting (NOK)
- Interactive tooltips with detailed data
- Performance metrics display
- Time period filtering integration
- Responsive design with mobile optimization

**Usage:**

```tsx
import { PortfolioPerformanceChart } from '@/components/charts'
;<PortfolioPerformanceChart
  data={portfolioData}
  title="Portfolio Performance"
  height={400}
  showArea={true}
  showGrid={true}
  timeRange="1M"
/>
```

### 2. AssetAllocationChart

Pie, donut, and bar charts for asset allocation visualization.

**Features:**

- Multiple chart types (pie, donut, bar)
- Interactive tooltips
- Asset breakdown list
- Norwegian currency formatting
- Color-coded allocation display

**Usage:**

```tsx
import { AssetAllocationChart } from '@/components/charts'
;<AssetAllocationChart
  data={allocationData}
  title="Asset Allocation"
  chartType="donut"
  height={300}
/>
```

### 3. TimeRangeSelector

Time period selector component with preset ranges.

**Features:**

- Predefined time ranges (1W, 1M, 3M, 6M, 1Y, ALL)
- Button and tab variants
- Compact mobile variant
- Norwegian labels and descriptions

**Usage:**

```tsx
import { TimeRangeSelector, useTimeRange } from '@/components/charts'

const { selectedRange, setSelectedRange } = useTimeRange()

<TimeRangeSelector
  selectedRange={selectedRange}
  onRangeChange={setSelectedRange}
  variant="buttons"
/>
```

### 4. ChartControls

Comprehensive chart configuration and control panel.

**Features:**

- Chart type selection
- Toggle options (grid, legend, area, etc.)
- Time range integration
- Export functionality
- Advanced settings
- Compact and full variants

**Usage:**

```tsx
import { ChartControls, useChartConfig } from '@/components/charts'

const { config, updateConfig } = useChartConfig()

<ChartControls
  config={config}
  onConfigChange={updateConfig}
  showExportOptions={true}
/>
```

### 5. PerformanceComparisonChart

Multi-portfolio/benchmark comparison chart.

**Features:**

- Multiple portfolio comparison
- Benchmark integration
- Performance statistics
- Normalized percentage view
- Interactive legend
- Portfolio metrics display

**Usage:**

```tsx
import {
  PerformanceComparisonChart,
  createPortfolioComparison,
  createBenchmarkComparison
} from '@/components/charts'

const comparisons = [
  createPortfolioComparison('portfolio1', 'My Portfolio', data1, '#1e40af'),
  createBenchmarkComparison('OSEBX', benchmarkData, '#6b7280')
]

<PerformanceComparisonChart
  comparisons={comparisons}
  title="Portfolio vs Benchmark"
  height={400}
/>
```

## Utilities and Hooks

### useTimeRange()

Hook for managing time range selection:

```tsx
const { selectedRange, setSelectedRange, getDateRange } = useTimeRange('1M')
```

### useChartConfig()

Hook for managing chart configuration:

```tsx
const { config, updateConfig, resetConfig } = useChartConfig()
```

### Formatting Functions

- `formatCurrency(value, currency)` - Format currency values
- `formatPercentage(value)` - Format percentage values
- `formatCompactNumber(value)` - Format large numbers (1.2M, 850K)

## Styling and Theming

### Color Palette

The charts use a blue investment theme consistent with the LifeDash brand:

- Primary: `#1e40af` (Deep blue)
- Secondary: `#3b82f6` (Blue)
- Accent: `#60a5fa` (Light blue)
- Success: `#059669` (Green)
- Warning: `#ea580c` (Orange)
- Error: `#ef4444` (Red)

### Norwegian Locale

All components use Norwegian locale formatting:

- Currency: NOK with proper thousand separators
- Dates: Norwegian date format
- Numbers: Norwegian number formatting

## Data Format

### Portfolio Data

```typescript
interface PortfolioDataPoint {
  date: string
  value: number
  change: number
  changePercent: number
  timestamp: number
}
```

### Asset Allocation Data

```typescript
interface AssetAllocation {
  name: string
  value: number
  percentage: number
  color: string
  category?: string
}
```

### Performance Comparison Data

```typescript
interface PerformanceComparison {
  id: string
  name: string
  color: string
  data: PerformanceDataPoint[]
  currentValue?: number
  totalReturn?: number
  totalReturnPercent?: number
  isVisible?: boolean
  isBenchmark?: boolean
}
```

## Dependencies

- **recharts**: Chart library
- **@radix-ui/react-\***: UI primitives
- **class-variance-authority**: CSS variant management
- **tailwindcss**: Styling framework

## Configuration Presets

The components come with predefined configuration presets:

- `minimal`: Clean, minimal charts
- `standard`: Default configuration
- `detailed`: Full feature set enabled
- `comparison`: Optimized for portfolio comparison

## Responsive Design

All charts are responsive and optimized for:

- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)

Charts automatically adjust:

- Height based on screen size
- Margins and padding
- Font sizes and element spacing
- Touch-friendly interactions on mobile

## Export Functionality

Charts support export to:

- PNG (raster image)
- SVG (vector graphics)
- PDF (document)
- CSV (raw data)

## Performance Considerations

- Charts use React.memo() for performance optimization
- Data is memoized to prevent unnecessary re-renders
- Efficient tooltip rendering
- Optimized for large datasets (1000+ data points)

## Examples

See `example.tsx` for comprehensive usage examples of all components.
