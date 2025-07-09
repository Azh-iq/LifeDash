import { Database } from './database.types'

// Database widget types
export type WidgetType = 
  | 'HERO_PORTFOLIO_CHART'
  | 'CATEGORY_MINI_CHART'
  | 'STOCK_PERFORMANCE_CHART'
  | 'HOLDINGS_TABLE_RICH'
  | 'METRICS_GRID'
  | 'ACTIVITY_FEED'
  | 'TOP_NAVIGATION_ENHANCED'
  | 'CATEGORY_SELECTOR'
  | 'STOCK_DETAIL_CARD'
  | 'TRANSACTION_HISTORY'
  | 'PRICE_ALERTS'
  | 'NEWS_FEED'
  | 'PORTFOLIO_ALLOCATION'
  | 'PERFORMANCE_METRICS'
  | 'WATCHLIST'
  | 'CUSTOM_WIDGET'

export type WidgetCategory = 'STOCKS' | 'CRYPTO' | 'ART' | 'OTHER'

export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'HERO'

export type LayoutType = 'dashboard' | 'portfolio' | 'stock' | 'custom'

export type ActionType = 'view' | 'interact' | 'refresh' | 'export' | 'configure'

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export type Theme = 'light' | 'dark' | 'system'

export type ChartType = 'line' | 'candlestick' | 'area' | 'bar'

export type ChartTheme = 'default' | 'dark' | 'minimal' | 'colorful'

export type CurrencyDisplay = 'NOK' | 'USD' | 'EUR'

export type NumberFormat = 'norwegian' | 'international'

export type DateFormat = 'dd.mm.yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy'

export type GridGap = 'sm' | 'md' | 'lg'

// Widget configuration interfaces
export interface BaseWidgetConfig {
  refreshInterval?: number
  showLoadingStates?: boolean
  showErrorStates?: boolean
  customTitle?: string
  customDescription?: string
  showHeader?: boolean
  showFooter?: boolean
  theme?: Theme
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  chartType?: ChartType
  chartTheme?: ChartTheme
  showVolume?: boolean
  showGrid?: boolean
  showTechnicalIndicators?: boolean
  indicators?: string[]
  timeframe?: string
  showLegend?: boolean
  height?: number
}

export interface TableWidgetConfig extends BaseWidgetConfig {
  columns?: string[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showFilters?: boolean
  compactMode?: boolean
}

export interface MetricsWidgetConfig extends BaseWidgetConfig {
  metrics?: string[]
  showPercentageChange?: boolean
  showSparklines?: boolean
  compactView?: boolean
  colorScheme?: 'default' | 'colorful' | 'minimal'
}

export interface NewsWidgetConfig extends BaseWidgetConfig {
  sources?: string[]
  maxItems?: number
  showImages?: boolean
  showSummary?: boolean
  filterBySymbol?: boolean
}

export interface AlertsWidgetConfig extends BaseWidgetConfig {
  alertTypes?: string[]
  showNotifications?: boolean
  autoMarkAsRead?: boolean
  maxItems?: number
}

export type WidgetConfig = 
  | ChartWidgetConfig
  | TableWidgetConfig
  | MetricsWidgetConfig
  | NewsWidgetConfig
  | AlertsWidgetConfig
  | BaseWidgetConfig

// Responsive configuration interfaces
export interface ResponsiveWidgetConfig {
  size?: WidgetSize
  gridRowSpan?: number
  gridColumnSpan?: number
  hidden?: boolean
  config?: Partial<WidgetConfig>
}

export interface CategoryPreferences {
  stocks?: {
    defaultChartType?: ChartType
    showVolume?: boolean
    showTechnicalIndicators?: boolean
    defaultTimeframe?: string
  }
  crypto?: {
    defaultChartType?: ChartType
    showVolume?: boolean
    showMarketCap?: boolean
    defaultTimeframe?: string
  }
  art?: {
    showPriceHistory?: boolean
    showProvenance?: boolean
    defaultView?: string
  }
  other?: {
    defaultView?: string
    showCustomFields?: boolean
  }
}

// Database row types
export interface WidgetLayoutRow {
  id: string
  user_id: string
  portfolio_id?: string
  stock_symbol?: string
  layout_name: string
  layout_type: LayoutType
  is_default: boolean
  is_active: boolean
  widget_type: WidgetType
  widget_category: WidgetCategory
  widget_size: WidgetSize
  grid_row: number
  grid_column: number
  grid_row_span: number
  grid_column_span: number
  widget_config: WidgetConfig
  title?: string
  description?: string
  show_header: boolean
  show_footer: boolean
  mobile_hidden: boolean
  tablet_config?: ResponsiveWidgetConfig
  mobile_config?: ResponsiveWidgetConfig
  created_at: string
  updated_at: string
}

export interface WidgetPreferencesRow {
  id: string
  user_id: string
  default_theme: Theme
  animation_enabled: boolean
  auto_refresh_enabled: boolean
  auto_refresh_interval: number
  category_preferences: CategoryPreferences
  grid_columns: number
  grid_gap: GridGap
  compact_mode: boolean
  chart_type: ChartType
  chart_theme: ChartTheme
  show_volume: boolean
  show_grid: boolean
  currency_display: CurrencyDisplay
  number_format: NumberFormat
  date_format: DateFormat
  price_alerts_enabled: boolean
  news_alerts_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  share_portfolio_enabled: boolean
  public_profile_enabled: boolean
  analytics_enabled: boolean
  advanced_features_enabled: boolean
  beta_features_enabled: boolean
  created_at: string
  updated_at: string
}

export interface WidgetTemplateRow {
  id: string
  template_name: string
  template_type: LayoutType
  category: WidgetCategory
  display_name: string
  description?: string
  preview_image_url?: string
  widgets_config: WidgetLayoutTemplate[]
  is_system_template: boolean
  is_active: boolean
  created_by?: string
  usage_count: number
  version: number
  created_at: string
  updated_at: string
}

export interface WidgetUsageAnalyticsRow {
  id: string
  user_id: string
  widget_layout_id?: string
  widget_type: WidgetType
  action_type: ActionType
  portfolio_id?: string
  stock_symbol?: string
  session_id?: string
  duration_seconds?: number
  interaction_count: number
  device_type?: DeviceType
  browser_type?: string
  created_at: string
}

// Insert and update types
export interface WidgetLayoutInsert {
  user_id: string
  portfolio_id?: string
  stock_symbol?: string
  layout_name: string
  layout_type: LayoutType
  is_default?: boolean
  is_active?: boolean
  widget_type: WidgetType
  widget_category?: WidgetCategory
  widget_size?: WidgetSize
  grid_row: number
  grid_column: number
  grid_row_span?: number
  grid_column_span?: number
  widget_config?: WidgetConfig
  title?: string
  description?: string
  show_header?: boolean
  show_footer?: boolean
  mobile_hidden?: boolean
  tablet_config?: ResponsiveWidgetConfig
  mobile_config?: ResponsiveWidgetConfig
}

export interface WidgetLayoutUpdate {
  layout_name?: string
  layout_type?: LayoutType
  is_default?: boolean
  is_active?: boolean
  widget_type?: WidgetType
  widget_category?: WidgetCategory
  widget_size?: WidgetSize
  grid_row?: number
  grid_column?: number
  grid_row_span?: number
  grid_column_span?: number
  widget_config?: WidgetConfig
  title?: string
  description?: string
  show_header?: boolean
  show_footer?: boolean
  mobile_hidden?: boolean
  tablet_config?: ResponsiveWidgetConfig
  mobile_config?: ResponsiveWidgetConfig
}

export interface WidgetPreferencesInsert {
  user_id: string
  default_theme?: Theme
  animation_enabled?: boolean
  auto_refresh_enabled?: boolean
  auto_refresh_interval?: number
  category_preferences?: CategoryPreferences
  grid_columns?: number
  grid_gap?: GridGap
  compact_mode?: boolean
  chart_type?: ChartType
  chart_theme?: ChartTheme
  show_volume?: boolean
  show_grid?: boolean
  currency_display?: CurrencyDisplay
  number_format?: NumberFormat
  date_format?: DateFormat
  price_alerts_enabled?: boolean
  news_alerts_enabled?: boolean
  email_notifications?: boolean
  push_notifications?: boolean
  share_portfolio_enabled?: boolean
  public_profile_enabled?: boolean
  analytics_enabled?: boolean
  advanced_features_enabled?: boolean
  beta_features_enabled?: boolean
}

export interface WidgetPreferencesUpdate {
  default_theme?: Theme
  animation_enabled?: boolean
  auto_refresh_enabled?: boolean
  auto_refresh_interval?: number
  category_preferences?: CategoryPreferences
  grid_columns?: number
  grid_gap?: GridGap
  compact_mode?: boolean
  chart_type?: ChartType
  chart_theme?: ChartTheme
  show_volume?: boolean
  show_grid?: boolean
  currency_display?: CurrencyDisplay
  number_format?: NumberFormat
  date_format?: DateFormat
  price_alerts_enabled?: boolean
  news_alerts_enabled?: boolean
  email_notifications?: boolean
  push_notifications?: boolean
  share_portfolio_enabled?: boolean
  public_profile_enabled?: boolean
  analytics_enabled?: boolean
  advanced_features_enabled?: boolean
  beta_features_enabled?: boolean
}

export interface WidgetTemplateInsert {
  template_name: string
  template_type: LayoutType
  category?: WidgetCategory
  display_name: string
  description?: string
  preview_image_url?: string
  widgets_config: WidgetLayoutTemplate[]
  is_system_template?: boolean
  is_active?: boolean
  created_by?: string
  version?: number
}

export interface WidgetUsageAnalyticsInsert {
  user_id: string
  widget_layout_id?: string
  widget_type: WidgetType
  action_type: ActionType
  portfolio_id?: string
  stock_symbol?: string
  session_id?: string
  duration_seconds?: number
  interaction_count?: number
  device_type?: DeviceType
  browser_type?: string
}

// Template configuration types
export interface WidgetLayoutTemplate {
  widget_type: WidgetType
  widget_category: WidgetCategory
  widget_size: WidgetSize
  grid_row: number
  grid_column: number
  grid_row_span: number
  grid_column_span: number
  widget_config: WidgetConfig
  title?: string
  description?: string
  show_header: boolean
  show_footer: boolean
  mobile_hidden: boolean
  tablet_config?: ResponsiveWidgetConfig
  mobile_config?: ResponsiveWidgetConfig
}

// API response types
export interface WidgetLayoutResponse {
  success: boolean
  data?: WidgetLayoutRow[]
  error?: string
}

export interface WidgetPreferencesResponse {
  success: boolean
  data?: WidgetPreferencesRow
  error?: string
}

export interface WidgetTemplateResponse {
  success: boolean
  data?: WidgetTemplateRow[]
  error?: string
}

export interface WidgetUsageResponse {
  success: boolean
  data?: WidgetUsageAnalyticsRow[]
  error?: string
}

// Hook types
export interface UseWidgetLayoutsOptions {
  layoutType?: LayoutType
  portfolioId?: string
  stockSymbol?: string
  activeOnly?: boolean
}

export interface UseWidgetLayoutsResult {
  layouts: WidgetLayoutRow[]
  loading: boolean
  error: string | null
  refreshLayouts: () => Promise<void>
  createLayout: (layout: WidgetLayoutInsert) => Promise<void>
  updateLayout: (id: string, updates: WidgetLayoutUpdate) => Promise<void>
  deleteLayout: (id: string) => Promise<void>
  duplicateLayout: (id: string, newName: string) => Promise<void>
  setAsDefault: (id: string) => Promise<void>
}

export interface UseWidgetPreferencesResult {
  preferences: WidgetPreferencesRow | null
  loading: boolean
  error: string | null
  updatePreferences: (updates: WidgetPreferencesUpdate) => Promise<void>
  resetPreferences: () => Promise<void>
}

export interface UseWidgetTemplatesOptions {
  templateType?: LayoutType
  category?: WidgetCategory
  systemOnly?: boolean
}

export interface UseWidgetTemplatesResult {
  templates: WidgetTemplateRow[]
  loading: boolean
  error: string | null
  applyTemplate: (templateId: string, layoutName: string) => Promise<void>
  createTemplate: (template: WidgetTemplateInsert) => Promise<void>
}

// Utility types
export interface WidgetGridPosition {
  row: number
  column: number
  rowSpan: number
  columnSpan: number
}

export interface WidgetGridLayout {
  [key: string]: WidgetGridPosition
}

export interface WidgetValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Constants
export const WIDGET_TYPES: Record<WidgetType, { displayName: string; description: string; category: WidgetCategory }> = {
  HERO_PORTFOLIO_CHART: {
    displayName: 'Hovedportfølje Graf',
    description: 'Stor porteføljeytelse graf for dashboard',
    category: 'STOCKS'
  },
  CATEGORY_MINI_CHART: {
    displayName: 'Kategori Mini-graf',
    description: 'Kompakt graf for investeringskategorier',
    category: 'STOCKS'
  },
  STOCK_PERFORMANCE_CHART: {
    displayName: 'Aksjeytelse Graf',
    description: 'Detaljert aksjeytelse med tekniske indikatorer',
    category: 'STOCKS'
  },
  HOLDINGS_TABLE_RICH: {
    displayName: 'Detaljert Beholdningstabell',
    description: 'Omfattende beholdningstabell med mikro-grafer',
    category: 'STOCKS'
  },
  METRICS_GRID: {
    displayName: 'Ytelsesmålinger',
    description: 'Nøkkelytelsesmålinger og statistikk',
    category: 'STOCKS'
  },
  ACTIVITY_FEED: {
    displayName: 'Aktivitetsfeed',
    description: 'Nylige transaksjoner og endringer',
    category: 'STOCKS'
  },
  TOP_NAVIGATION_ENHANCED: {
    displayName: 'Utvidet Navigasjon',
    description: 'Hovednavigasjon med funksjoner',
    category: 'STOCKS'
  },
  CATEGORY_SELECTOR: {
    displayName: 'Kategorivelger',
    description: 'Bytte mellom investeringstyper',
    category: 'STOCKS'
  },
  STOCK_DETAIL_CARD: {
    displayName: 'Aksjedetaljer',
    description: 'Detaljert aksjeinfo med faner',
    category: 'STOCKS'
  },
  TRANSACTION_HISTORY: {
    displayName: 'Transaksjonshistorikk',
    description: 'Fullstendig transaksjonslogg',
    category: 'STOCKS'
  },
  PRICE_ALERTS: {
    displayName: 'Prisvarsler',
    description: 'Prisvarsler og notifikasjoner',
    category: 'STOCKS'
  },
  NEWS_FEED: {
    displayName: 'Nyhetsfeed',
    description: 'Finansnyheter og markedsinformasjon',
    category: 'STOCKS'
  },
  PORTFOLIO_ALLOCATION: {
    displayName: 'Porteføljeallokering',
    description: 'Fordeling av investeringer',
    category: 'STOCKS'
  },
  PERFORMANCE_METRICS: {
    displayName: 'Ytelsesmålinger',
    description: 'Avanserte ytelsesmålinger',
    category: 'STOCKS'
  },
  WATCHLIST: {
    displayName: 'Overvåkningsliste',
    description: 'Aksjer og investeringer å følge',
    category: 'STOCKS'
  },
  CUSTOM_WIDGET: {
    displayName: 'Tilpasset Widget',
    description: 'Brukerdefinert widget',
    category: 'STOCKS'
  }
}

export const WIDGET_SIZES: Record<WidgetSize, { displayName: string; gridSize: string }> = {
  SMALL: { displayName: 'Liten', gridSize: '1x1' },
  MEDIUM: { displayName: 'Medium', gridSize: '2x2' },
  LARGE: { displayName: 'Stor', gridSize: '3x3' },
  HERO: { displayName: 'Hero', gridSize: '4x4' }
}

export const WIDGET_CATEGORIES: Record<WidgetCategory, { displayName: string; color: string }> = {
  STOCKS: { displayName: 'Aksjer', color: '#6366f1' },
  CRYPTO: { displayName: 'Krypto', color: '#f59e0b' },
  ART: { displayName: 'Kunst', color: '#ec4899' },
  OTHER: { displayName: 'Annet', color: '#10b981' }
}

export const DEFAULT_GRID_COLUMNS = 2
export const MAX_GRID_COLUMNS = 4
export const MAX_GRID_ROWS = 10
export const DEFAULT_AUTO_REFRESH_INTERVAL = 300 // 5 minutes
export const MIN_AUTO_REFRESH_INTERVAL = 30 // 30 seconds
export const MAX_AUTO_REFRESH_INTERVAL = 3600 // 1 hour