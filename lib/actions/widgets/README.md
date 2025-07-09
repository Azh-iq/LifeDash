# LifeDash Widget System

A comprehensive, database-driven widget system for LifeDash that provides flexible, user-customizable layouts with category-specific theming and responsive design.

## Overview

The widget system enables users to create personalized dashboard layouts with drag-and-drop positioning, customizable configurations, and responsive behavior across different device types. It supports multiple widget types for different investment categories (stocks, crypto, art, other) with Norwegian localization.

## Architecture

### Database Schema

The widget system uses four main tables:

1. **`widget_layouts`** - Individual widget configurations and positioning
2. **`widget_preferences`** - User-specific global preferences
3. **`widget_templates`** - Pre-defined layout templates
4. **`widget_usage_analytics`** - Usage tracking and analytics

### Widget Types

```typescript
type WidgetType = 
  | 'HERO_PORTFOLIO_CHART'      // Main dashboard chart
  | 'CATEGORY_MINI_CHART'       // Category overview charts
  | 'STOCK_PERFORMANCE_CHART'   // Detailed stock charts
  | 'HOLDINGS_TABLE_RICH'       // Enhanced holdings table
  | 'METRICS_GRID'              // Key performance metrics
  | 'ACTIVITY_FEED'             // Recent transactions
  | 'TOP_NAVIGATION_ENHANCED'   // Main navigation
  | 'CATEGORY_SELECTOR'         // Investment type switching
  | 'STOCK_DETAIL_CARD'         // Stock detail modal
  | 'TRANSACTION_HISTORY'       // Transaction log
  | 'PRICE_ALERTS'              // Price alerts
  | 'NEWS_FEED'                 // Market news
  | 'PORTFOLIO_ALLOCATION'      // Asset allocation
  | 'PERFORMANCE_METRICS'       // Advanced metrics
  | 'WATCHLIST'                 // Monitored stocks
  | 'CUSTOM_WIDGET'             // User-defined
```

### Widget Categories

- **STOCKS** - Stock market investments (purple theme)
- **CRYPTO** - Cryptocurrency (orange theme)
- **ART** - Art investments (pink theme)
- **OTHER** - Other investment types (blue theme)

## Usage

### Database Actions

#### Widget Layouts

```typescript
import { 
  createWidgetLayout,
  updateWidgetLayout,
  deleteWidgetLayout,
  getUserWidgetLayouts,
  getDefaultWidgetLayout,
  setDefaultWidgetLayout,
  duplicateWidgetLayout,
  bulkUpdateWidgetLayouts
} from '@/lib/actions/widgets/layouts'

// Create a new widget layout
const result = await createWidgetLayout({
  layout_name: 'My Dashboard',
  layout_type: 'dashboard',
  widget_type: 'HERO_PORTFOLIO_CHART',
  widget_category: 'STOCKS',
  widget_size: 'HERO',
  grid_row: 1,
  grid_column: 1,
  grid_row_span: 2,
  grid_column_span: 2,
  widget_config: {
    chartType: 'line',
    showVolume: true,
    timeframe: '1M'
  }
})

// Get user's layouts
const layouts = await getUserWidgetLayouts('dashboard')
```

#### Widget Preferences

```typescript
import { 
  getUserWidgetPreferences,
  updateWidgetPreferences,
  updateCategoryPreferences,
  resetWidgetPreferences,
  togglePreference,
  updateTheme,
  updateChartPreferences,
  updateGridPreferences,
  updateLocalizationPreferences
} from '@/lib/actions/widgets/preferences'

// Get user preferences
const preferences = await getUserWidgetPreferences()

// Update theme
await updateTheme('dark')

// Update chart preferences
await updateChartPreferences('candlestick', 'dark', true, false)

// Toggle animation
await togglePreference('animation_enabled')
```

#### Widget Templates

```typescript
import { 
  getWidgetTemplates,
  getUserWidgetTemplates,
  createWidgetTemplate,
  updateWidgetTemplate,
  deleteWidgetTemplate,
  applyWidgetTemplate,
  createTemplateFromLayout,
  getPopularWidgetTemplates,
  searchWidgetTemplates
} from '@/lib/actions/widgets/templates'

// Get system templates
const templates = await getWidgetTemplates('dashboard', 'STOCKS', true)

// Apply a template
await applyWidgetTemplate(templateId, 'My Custom Layout')

// Create template from existing layout
await createTemplateFromLayout(
  'My Dashboard',
  'custom_template',
  'My Custom Template',
  'Template description'
)
```

#### Analytics

```typescript
import { 
  trackWidgetUsage,
  getUserWidgetUsage,
  getWidgetUsageSummary,
  getWidgetPerformanceMetrics,
  getWidgetUsageTrends,
  cleanupOldUsageData
} from '@/lib/actions/widgets/analytics'

// Track widget usage
await trackWidgetUsage({
  widget_type: 'HERO_PORTFOLIO_CHART',
  action_type: 'view',
  duration_seconds: 45,
  interaction_count: 3
})

// Get usage summary
const summary = await getWidgetUsageSummary(30)
```

### TypeScript Types

```typescript
import type {
  WidgetLayoutRow,
  WidgetPreferencesRow,
  WidgetTemplateRow,
  WidgetConfig,
  CategoryPreferences,
  WidgetLayoutTemplate
} from '@/lib/types/widget.types'
```

## Configuration

### Widget Configuration

Each widget type supports specific configuration options:

```typescript
// Chart Widget Configuration
interface ChartWidgetConfig {
  chartType?: 'line' | 'candlestick' | 'area' | 'bar'
  chartTheme?: 'default' | 'dark' | 'minimal' | 'colorful'
  showVolume?: boolean
  showGrid?: boolean
  showTechnicalIndicators?: boolean
  indicators?: string[]
  timeframe?: string
  showLegend?: boolean
  height?: number
}

// Table Widget Configuration
interface TableWidgetConfig {
  columns?: string[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showFilters?: boolean
  compactMode?: boolean
}
```

### Responsive Configuration

Widgets support responsive overrides for tablet and mobile:

```typescript
interface ResponsiveWidgetConfig {
  size?: WidgetSize
  gridRowSpan?: number
  gridColumnSpan?: number
  hidden?: boolean
  config?: Partial<WidgetConfig>
}
```

### User Preferences

Global preferences affect all widgets:

```typescript
interface WidgetPreferencesRow {
  default_theme: 'light' | 'dark' | 'system'
  animation_enabled: boolean
  auto_refresh_enabled: boolean
  auto_refresh_interval: number
  grid_columns: number
  grid_gap: 'sm' | 'md' | 'lg'
  compact_mode: boolean
  chart_type: 'line' | 'candlestick' | 'area' | 'bar'
  chart_theme: 'default' | 'dark' | 'minimal' | 'colorful'
  show_volume: boolean
  show_grid: boolean
  currency_display: 'NOK' | 'USD' | 'EUR'
  number_format: 'norwegian' | 'international'
  date_format: 'dd.mm.yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy'
  // ... notification and privacy settings
}
```

## System Templates

The system includes pre-defined templates:

### Dashboard Templates

- **`default_dashboard`** - Standard dashboard with hero chart and metrics
- **`compact_dashboard`** - Compact layout for smaller screens
- **`minimal_dashboard`** - Clean, minimal design
- **`crypto_dashboard`** - Cryptocurrency-focused layout
- **`mobile_optimized`** - Mobile-first design

### Portfolio Templates

- **`detailed_portfolio`** - Comprehensive portfolio view
- **`advanced_analytics`** - Advanced performance metrics

### Stock Templates

- **`stock_analysis`** - Technical analysis with charts and metrics

## Grid System

The widget system uses a flexible grid layout:

- **Maximum grid size**: 10 rows × 4 columns
- **Widget sizes**: SMALL (1×1), MEDIUM (2×2), LARGE (3×3), HERO (4×4)
- **Responsive breakpoints**: Desktop, tablet, mobile
- **Gap options**: sm, md, lg

## Security

### Row Level Security (RLS)

All widget tables use RLS policies:

```sql
-- Users can only access their own widgets
CREATE POLICY "Users can manage own widget layouts" 
ON widget_layouts FOR ALL USING (auth.uid() = user_id);

-- System templates are publicly readable
CREATE POLICY "Widget templates are publicly readable" 
ON widget_templates FOR SELECT USING (is_active = true);
```

### Data Validation

- Grid position validation prevents overlapping widgets
- Template validation ensures valid widget configurations
- Usage analytics are automatically cleaned up after 90 days

## Norwegian Localization

The widget system is fully localized for Norwegian users:

- **Widget names**: Norwegian display names
- **Date formats**: dd.mm.yyyy default
- **Currency**: NOK default
- **Number format**: Norwegian formatting (1.234,56)
- **Accessibility**: Norwegian ARIA labels

## Performance

### Optimization Features

- **Intelligent caching**: 2-minute TTL for live data
- **Lazy loading**: Widgets load on demand
- **Batch updates**: Bulk operations for layout changes
- **Analytics cleanup**: Automatic old data removal
- **Optimistic updates**: Immediate UI feedback

### Database Indexes

All tables include optimized indexes:

```sql
-- Grid layout queries
CREATE INDEX idx_widget_layouts_user_portfolio_active 
ON widget_layouts(user_id, portfolio_id, is_active);

-- Usage analytics queries
CREATE INDEX idx_widget_usage_user_date 
ON widget_usage_analytics(user_id, created_at DESC);

-- JSONB configuration queries
CREATE INDEX idx_widget_layouts_config_gin 
ON widget_layouts USING GIN(widget_config);
```

## Migration Guide

### Database Setup

1. Run migrations in order:
   ```bash
   # Widget system schema
   psql -f supabase/migrations/017_widget_layouts.sql
   
   # System templates
   psql -f supabase/migrations/018_widget_system_templates.sql
   ```

2. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'widget%';
   ```

### Default Setup

New users automatically get default widget layouts when they create preferences:

```sql
-- Triggered automatically
SELECT apply_default_widget_template_for_user(user_id);
```

### Data Migration

For existing users, apply default templates:

```sql
-- Apply default dashboard for all existing users
INSERT INTO widget_layouts (user_id, ...)
SELECT user_id, ... FROM widget_templates 
WHERE template_name = 'default_dashboard';
```

## Development

### Adding New Widget Types

1. Add to enum in migration:
   ```sql
   ALTER TYPE widget_type ADD VALUE 'NEW_WIDGET_TYPE';
   ```

2. Update TypeScript types:
   ```typescript
   // Add to WidgetType union in widget.types.ts
   export type WidgetType = 
     | 'EXISTING_WIDGET'
     | 'NEW_WIDGET_TYPE'
   ```

3. Add to widget constants:
   ```typescript
   export const WIDGET_TYPES = {
     NEW_WIDGET_TYPE: {
       displayName: 'New Widget',
       description: 'Description in Norwegian',
       category: 'STOCKS'
     }
   }
   ```

### Creating Custom Templates

```typescript
const customTemplate: WidgetTemplateInsert = {
  template_name: 'my_custom_template',
  template_type: 'dashboard',
  category: 'STOCKS',
  display_name: 'My Custom Template',
  description: 'Custom template description',
  widgets_config: [
    {
      widget_type: 'HERO_PORTFOLIO_CHART',
      widget_category: 'STOCKS',
      widget_size: 'HERO',
      grid_row: 1,
      grid_column: 1,
      grid_row_span: 2,
      grid_column_span: 2,
      widget_config: { /* custom config */ },
      title: 'Portfolio Chart',
      show_header: true,
      show_footer: false,
      mobile_hidden: false
    }
  ]
}

await createWidgetTemplate(customTemplate)
```

## API Reference

### Functions

#### Layout Management
- `createWidgetLayout(data)` - Create new widget layout
- `updateWidgetLayout(id, updates)` - Update existing layout
- `deleteWidgetLayout(id)` - Delete layout
- `getUserWidgetLayouts(type?, portfolio?, stock?, activeOnly?)` - Get user layouts
- `getDefaultWidgetLayout(type, portfolio?, stock?)` - Get default layout
- `setDefaultWidgetLayout(id)` - Set layout as default
- `duplicateWidgetLayout(id, newName)` - Duplicate layout
- `bulkUpdateWidgetLayouts(updates)` - Bulk update layouts

#### Preferences Management
- `getUserWidgetPreferences()` - Get user preferences
- `updateWidgetPreferences(updates)` - Update preferences
- `updateCategoryPreferences(category, prefs)` - Update category preferences
- `resetWidgetPreferences()` - Reset to defaults
- `togglePreference(pref)` - Toggle boolean preference
- `updateTheme(theme)` - Update theme
- `updateChartPreferences(...)` - Update chart settings
- `updateGridPreferences(...)` - Update grid settings
- `updateLocalizationPreferences(...)` - Update localization

#### Template Management
- `getWidgetTemplates(type?, category?, systemOnly?)` - Get templates
- `getUserWidgetTemplates()` - Get user templates
- `createWidgetTemplate(data)` - Create template
- `updateWidgetTemplate(id, updates)` - Update template
- `deleteWidgetTemplate(id)` - Delete template
- `applyWidgetTemplate(id, name, portfolio?, stock?)` - Apply template
- `createTemplateFromLayout(...)` - Create from layout
- `getPopularWidgetTemplates(limit?)` - Get popular templates
- `searchWidgetTemplates(query, type?, category?)` - Search templates

#### Analytics
- `trackWidgetUsage(data)` - Track usage
- `getUserWidgetUsage(start?, end?, type?, action?)` - Get usage data
- `getWidgetUsageSummary(days?)` - Get usage summary
- `getWidgetPerformanceMetrics(type, days?)` - Get performance metrics
- `getWidgetUsageTrends(days?)` - Get usage trends
- `cleanupOldUsageData(daysToKeep?)` - Clean old data

### Error Handling

All functions return standardized response objects:

```typescript
interface WidgetResponse {
  success: boolean
  data?: any
  error?: string
}
```

Common error scenarios:
- Authentication required
- Validation errors
- Access denied
- Not found
- Database errors

## License

Part of the LifeDash project. See main project license for details.