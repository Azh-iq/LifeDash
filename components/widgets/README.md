# LifeDash Widget Registry System

A comprehensive widget management system for the LifeDash investment portfolio application. This system provides a complete infrastructure for creating, managing, and rendering widgets with support for Norwegian localization, themes, and performance monitoring.

## Features

### Core Features
- **Widget Registry**: Central registry for all available widgets
- **Factory Pattern**: Standardized widget creation and instantiation
- **State Management**: Zustand-based state management for layouts and widgets
- **Drag & Drop**: Grid-based drag and drop widget positioning
- **Theme Integration**: Category-specific theming with LifeDash design system
- **Performance Monitoring**: Real-time performance tracking and metrics
- **Norwegian Localization**: Complete Norwegian language support
- **Responsive Design**: Mobile-first responsive widget layouts

### Widget Types (16 Total)

1. **HERO_PORTFOLIO_CHART** - Main portfolio performance chart
2. **CATEGORY_MINI_CHART** - Compact category charts
3. **STOCK_PERFORMANCE_CHART** - Detailed stock analysis charts
4. **HOLDINGS_TABLE_RICH** - Enhanced holdings table with micro-charts
5. **METRICS_GRID** - Key performance metrics display
6. **ACTIVITY_FEED** - Recent transactions and changes
7. **TOP_NAVIGATION_ENHANCED** - Enhanced navigation widget
8. **CATEGORY_SELECTOR** - Investment category switcher
9. **STOCK_DETAIL_CARD** - Detailed stock information
10. **TRANSACTION_HISTORY** - Complete transaction log
11. **PRICE_ALERTS** - Price alerts and notifications
12. **NEWS_FEED** - Financial news and market information
13. **PORTFOLIO_ALLOCATION** - Investment allocation visualization
14. **PERFORMANCE_METRICS** - Advanced performance analytics
15. **WATCHLIST** - Stock watchlist management
16. **CUSTOM_WIDGET** - User-defined custom widgets

## File Structure

```
components/widgets/
├── widget-types.ts          # TypeScript type definitions
├── widget-registry.tsx      # Central widget registry
├── widget-store.ts          # Zustand state management
├── widget-factory.tsx       # Widget creation system
├── widget-demo.tsx          # Demo and example usage
├── index.ts                 # Main exports
└── README.md               # This documentation
```

## Quick Start

### 1. Wrap your app with the Widget Registry Provider

```tsx
import { WidgetRegistryProvider } from '@/components/widgets'

function App() {
  return (
    <WidgetRegistryProvider>
      <YourApp />
    </WidgetRegistryProvider>
  )
}
```

### 2. Create and manage widgets

```tsx
import { 
  useWidgetFactory, 
  useWidgetActions, 
  useWidgets 
} from '@/components/widgets'

function Dashboard() {
  const { createAndAddWidget } = useWidgetFactory()
  const actions = useWidgetActions()
  const widgets = useWidgets()

  // Create a layout
  useEffect(() => {
    actions.createLayout('main-dashboard')
    actions.setActiveLayout('main-dashboard')
  }, [])

  // Add a widget
  const addPortfolioChart = () => {
    createAndAddWidget('main-dashboard', {
      type: 'HERO_PORTFOLIO_CHART',
      userId: 'user-123',
      portfolioId: 'portfolio-456',
      title: 'Portfolio Performance',
      size: 'HERO',
      position: { row: 1, column: 1 }
    })
  }

  return (
    <div>
      <button onClick={addPortfolioChart}>Add Portfolio Chart</button>
      <div className="grid grid-cols-2 gap-4">
        {widgets.map(widget => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  )
}
```

### 3. Use the widget catalog

```tsx
import { WidgetCatalog } from '@/components/widgets'

function WidgetPicker() {
  const handleWidgetSelect = (type) => {
    console.log('Selected widget:', type)
    // Handle widget selection
  }

  return (
    <WidgetCatalog 
      category="STOCKS" 
      onWidgetSelect={handleWidgetSelect} 
    />
  )
}
```

## API Reference

### Widget Registry

#### `useWidgetRegistry()`
Hook for accessing the widget registry.

```tsx
const { registry, state, search, validate } = useWidgetRegistry()
```

#### `widgetRegistry`
Direct access to the global widget registry.

```tsx
import { widgetRegistry } from '@/components/widgets'

const allWidgets = widgetRegistry.getAll()
const stocksWidgets = widgetRegistry.getByCategory('STOCKS')
```

### Widget Store

#### `useWidgetStore()`
Main widget store hook.

```tsx
const {
  layouts,
  activeLayoutId,
  selectedWidgets,
  editMode,
  addWidget,
  removeWidget,
  updateWidget
} = useWidgetStore()
```

#### Specialized Hooks

```tsx
const widgets = useWidgets() // Get widgets for active layout
const editMode = useEditMode()
const selectedWidgets = useSelectedWidgets()
const actions = useWidgetActions()
```

### Widget Factory

#### `useWidgetFactory()`
Hook for creating widgets.

```tsx
const { createWidget, createAndAddWidget } = useWidgetFactory()

const widget = createWidget({
  type: 'METRICS_GRID',
  userId: 'user-123',
  config: {
    metrics: ['total_value', 'day_change'],
    showSparklines: true
  }
})
```

#### Factory Methods

```tsx
const { 
  createHeroPortfolioChart,
  createCategoryMiniChart,
  createStockPerformanceChart,
  createHoldingsTable,
  createMetricsGrid,
  createActivityFeed 
} = useWidgetFactory()
```

## Widget Configuration

### Chart Widgets

```tsx
const chartConfig = {
  chartType: 'line' | 'candlestick' | 'area' | 'bar',
  showVolume: boolean,
  showGrid: boolean,
  showTechnicalIndicators: boolean,
  indicators: ['SMA', 'RSI', 'MACD'],
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y',
  height: number
}
```

### Table Widgets

```tsx
const tableConfig = {
  columns: ['symbol', 'quantity', 'current_price', 'pnl'],
  sortBy: 'market_value',
  sortDirection: 'desc' | 'asc',
  pageSize: 20,
  showPagination: true,
  showSearch: true,
  showFilters: true,
  compactMode: false
}
```

### Metrics Widgets

```tsx
const metricsConfig = {
  metrics: ['total_value', 'total_return', 'day_change'],
  showPercentageChange: true,
  showSparklines: true,
  compactView: false,
  colorScheme: 'default' | 'colorful' | 'minimal'
}
```

## Theme Integration

### Category Themes

```tsx
import { getWidgetTheme } from '@/components/widgets'

const stocksTheme = getWidgetTheme('STOCKS')
const cryptoTheme = getWidgetTheme('CRYPTO')
const artTheme = getWidgetTheme('ART')
const otherTheme = getWidgetTheme('OTHER')
```

### Custom Theming

```tsx
const customTheme = {
  primary: '#6366f1',
  secondary: '#a855f7',
  gradient: 'from-indigo-500 to-purple-500',
  glow: 'shadow-indigo-500/30'
}
```

## Performance Monitoring

### Performance Tracking

```tsx
import { useWidgetPerformance } from '@/components/widgets'

const { metrics, recordRenderTime, recordInteraction } = useWidgetPerformance(widgetId)

// Track render performance
const startTime = Date.now()
// ... render widget
recordRenderTime(Date.now() - startTime)

// Track user interactions
recordInteraction()
```

### Analytics

```tsx
import { getWidgetAnalytics } from '@/components/widgets'

const analytics = getWidgetAnalytics('layout-id')
console.log('Widget breakdown:', analytics.widgetsByCategory)
```

## Validation

### Widget Validation

```tsx
import { validateWidgetConfig } from '@/components/widgets'

const validation = validateWidgetConfig('HERO_PORTFOLIO_CHART', config)
if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}
```

### Layout Validation

```tsx
import { validateWidgetLayout } from '@/components/widgets'

const validation = validateWidgetLayout('layout-id')
console.log('Layout status:', validation.validWidgets, validation.invalidWidgets)
```

## Norwegian Localization

### Built-in Labels

```tsx
import { norwegianLabels } from '@/components/widgets'

console.log(norwegianLabels.loading) // "Laster..."
console.log(norwegianLabels.error) // "Feil"
console.log(norwegianLabels.stocks) // "Aksjer"
```

### Custom Widget Labels

```tsx
const registration = {
  // ... other config
  norwegianLabels: {
    title: 'Min Widget',
    description: 'Beskrivelse av widget',
    configureLabel: 'Konfigurer',
    exportLabel: 'Eksporter',
    refreshLabel: 'Oppdater',
    errorMessages: {
      loadFailed: 'Kunne ikke laste data',
      noData: 'Ingen data tilgjengelig',
      configError: 'Ugyldig konfigurasjon'
    }
  }
}
```

## Advanced Usage

### Custom Widget Registration

```tsx
import { widgetRegistry } from '@/components/widgets'

const CustomWidget = ({ title, config }) => {
  return <div>{title}</div>
}

widgetRegistry.register({
  type: 'CUSTOM_ANALYTICS',
  displayName: 'Custom Analytics',
  description: 'Custom analytics widget',
  category: 'STOCKS',
  component: CustomWidget,
  defaultConfig: {},
  minSize: 'MEDIUM',
  maxSize: 'HERO',
  recommendedSize: 'LARGE',
  // ... other configuration
})
```

### Event System

```tsx
import { useWidgetEvents } from '@/components/widgets'

const { addEventListener, removeEventListener, dispatchEvent } = useWidgetEvents()

useEffect(() => {
  const handleWidgetCreated = (event) => {
    console.log('Widget created:', event.widgetId)
  }
  
  addEventListener('widget:created', handleWidgetCreated)
  
  return () => {
    removeEventListener('widget:created', handleWidgetCreated)
  }
}, [])
```

### Layout Management

```tsx
import { useLayoutManager } from '@/components/widgets'

const {
  createLayout,
  deleteLayout,
  duplicateLayout,
  exportLayout,
  importLayout
} = useLayoutManager()

// Export layout
const exportedData = await exportLayout('layout-id')

// Import layout
await importLayout('new-layout-id', exportedData)
```

## Best Practices

### 1. Widget Design
- Keep widgets focused on a single responsibility
- Use appropriate sizing (SMALL for simple metrics, HERO for complex charts)
- Implement proper loading and error states
- Follow Norwegian localization guidelines

### 2. Performance
- Use React.memo for expensive widget components
- Implement proper cleanup in useEffect hooks
- Cache expensive calculations
- Monitor widget performance metrics

### 3. Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Support screen readers

### 4. Testing
- Test widget registration and validation
- Test responsive behavior
- Test error handling
- Test performance under load

## Contributing

To add a new widget type:

1. Add the widget type to `widget-types.ts`
2. Register the widget in `widget-registry.tsx`
3. Create the widget component
4. Add appropriate configuration schema
5. Update documentation
6. Add tests

## License

This widget system is part of the LifeDash project and follows the same license terms.
