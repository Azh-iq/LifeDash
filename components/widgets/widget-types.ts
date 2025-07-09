import { ReactNode, ComponentProps } from 'react'
import { type VariantProps } from 'class-variance-authority'
import {
  WidgetType,
  WidgetCategory,
  WidgetSize,
  WidgetConfig,
  WidgetLayoutTemplate,
  ResponsiveWidgetConfig,
  LayoutType,
} from '@/lib/types/widget.types'
import { widgetVariants, type WidgetProps } from '@/components/ui/widget'
import { getInvestmentTheme, type ThemeVariant } from '@/lib/themes/modern-themes'

// Base widget component props
export interface BaseWidgetComponentProps {
  // Core identification
  id: string
  type: WidgetType
  category: WidgetCategory
  size: WidgetSize
  
  // Layout positioning
  position: {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
  }
  
  // Configuration
  config: WidgetConfig
  
  // Display options
  title?: string
  description?: string
  showHeader?: boolean
  showFooter?: boolean
  
  // State management
  loading?: boolean
  error?: string | null
  
  // Responsive settings
  mobileHidden?: boolean
  tabletConfig?: ResponsiveWidgetConfig
  mobileConfig?: ResponsiveWidgetConfig
  
  // Theme
  theme?: ThemeVariant
  
  // Event handlers
  onRefresh?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
  onConfigure?: () => void
  onDelete?: () => void
  onMove?: (newPosition: { row: number; column: number }) => void
  onResize?: (newSize: { rowSpan: number; columnSpan: number }) => void
  
  // Data context
  portfolioId?: string
  stockSymbol?: string
  userId: string
}

// Widget component type
export type WidgetComponent = React.ComponentType<BaseWidgetComponentProps>

// Widget registration definition
export interface WidgetRegistration {
  // Basic info
  type: WidgetType
  displayName: string
  description: string
  category: WidgetCategory
  
  // Component
  component: WidgetComponent
  
  // Configuration
  defaultConfig: WidgetConfig
  configSchema?: Record<string, any> // JSON schema for validation
  
  // Size constraints
  minSize: WidgetSize
  maxSize: WidgetSize
  recommendedSize: WidgetSize
  
  // Grid constraints
  minGridSize: { rows: number; columns: number }
  maxGridSize: { rows: number; columns: number }
  
  // Features
  features: {
    exportable: boolean
    configurable: boolean
    realTimeUpdates: boolean
    caching: boolean
    responsive: boolean
  }
  
  // Data requirements
  dataRequirements: {
    requiresPortfolio: boolean
    requiresStock: boolean
    requiresAccount: boolean
    requiresInternetConnection: boolean
  }
  
  // Norwegian localization
  norwegianLabels: {
    title: string
    description: string
    configureLabel: string
    exportLabel: string
    refreshLabel: string
    errorMessages: {
      loadFailed: string
      noData: string
      configError: string
    }
  }
  
  // Version and compatibility
  version: string
  compatibleVersions: string[]
  
  // Performance hints
  performance: {
    renderPriority: 'high' | 'medium' | 'low'
    memoryUsage: 'high' | 'medium' | 'low'
    updateFrequency: 'realtime' | 'frequent' | 'occasional' | 'manual'
  }
}

// Widget factory options
export interface WidgetFactoryOptions {
  // Widget definition
  type: WidgetType
  
  // Configuration
  config?: Partial<WidgetConfig>
  
  // Positioning
  position?: {
    row: number
    column: number
    rowSpan?: number
    columnSpan?: number
  }
  
  // Customization
  title?: string
  description?: string
  category?: WidgetCategory
  size?: WidgetSize
  
  // Context
  portfolioId?: string
  stockSymbol?: string
  userId: string
  
  // Theme
  theme?: ThemeVariant
  
  // Responsive
  mobileHidden?: boolean
  tabletConfig?: ResponsiveWidgetConfig
  mobileConfig?: ResponsiveWidgetConfig
}

// Widget creation result
export interface WidgetInstance {
  // Core properties
  id: string
  type: WidgetType
  category: WidgetCategory
  size: WidgetSize
  
  // Layout
  position: {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
  }
  
  // Component props
  props: BaseWidgetComponentProps
  
  // Registration reference
  registration: WidgetRegistration
  
  // Metadata
  created: Date
  updated: Date
  
  // Validation
  isValid: boolean
  validationErrors: string[]
}

// Widget validation result
export interface WidgetValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Widget drag and drop types
export interface WidgetDragData {
  widgetId: string
  type: WidgetType
  sourcePosition: { row: number; column: number }
  size: { rowSpan: number; columnSpan: number }
  dragType: 'move' | 'resize' | 'create'
}

export interface WidgetDropTarget {
  row: number
  column: number
  canAccept: boolean
  conflictsWith: string[]
}

// Widget layout grid types
export interface WidgetGridCell {
  row: number
  column: number
  occupied: boolean
  widgetId?: string
  canPlace: boolean
}

export interface WidgetGridLayout {
  rows: number
  columns: number
  cells: WidgetGridCell[][]
  widgets: Map<string, WidgetInstance>
}

// Widget theme integration
export interface WidgetThemeConfig {
  category: WidgetCategory
  theme: ThemeVariant
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    border: string
    text: string
  }
  gradients: {
    primary: string
    secondary: string
    surface: string
  }
  shadows: {
    widget: string
    hover: string
    focus: string
  }
}

// Widget performance tracking
export interface WidgetPerformanceMetrics {
  widgetId: string
  type: WidgetType
  
  // Rendering metrics
  renderTime: number
  mountTime: number
  updateCount: number
  
  // Memory usage
  memoryUsage: number
  
  // User interactions
  viewCount: number
  interactionCount: number
  
  // Data loading
  dataLoadTime: number
  dataUpdateCount: number
  
  // Error tracking
  errorCount: number
  lastError?: string
  
  // Timestamps
  created: Date
  lastUpdated: Date
}

// Widget configuration UI types
export interface WidgetConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'range'
  required: boolean
  defaultValue: any
  options?: { value: any; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  description?: string
  category?: string
}

export interface WidgetConfigSchema {
  fields: WidgetConfigField[]
  categories: string[]
  advanced: boolean
}

// Widget template types
export interface WidgetTemplate {
  id: string
  name: string
  description: string
  category: WidgetCategory
  widgets: WidgetLayoutTemplate[]
  previewImage?: string
  tags: string[]
  author: string
  version: string
  created: Date
  updated: Date
}

// Widget search and filtering
export interface WidgetFilter {
  categories?: WidgetCategory[]
  types?: WidgetType[]
  sizes?: WidgetSize[]
  features?: string[]
  searchTerm?: string
}

export interface WidgetSearchResult {
  registration: WidgetRegistration
  relevanceScore: number
  matchedFields: string[]
}

// Widget import/export types
export interface WidgetExportData {
  widget: WidgetInstance
  config: WidgetConfig
  dependencies: string[]
  exportedAt: Date
  version: string
}

export interface WidgetImportResult {
  success: boolean
  widget?: WidgetInstance
  errors: string[]
  warnings: string[]
}

// Widget analytics types
export interface WidgetAnalytics {
  widgetId: string
  type: WidgetType
  usage: {
    views: number
    interactions: number
    timeSpent: number
    lastAccessed: Date
  }
  performance: WidgetPerformanceMetrics
  errors: {
    count: number
    types: Record<string, number>
    lastError?: string
  }
}

// Widget state management types
export interface WidgetState {
  // Layout state
  layouts: Record<string, WidgetInstance[]> // layoutId -> widgets
  activeLayout: string | null
  
  // Selection state
  selectedWidgets: string[]
  
  // Edit state
  editMode: boolean
  draggedWidget: string | null
  
  // Configuration state
  configuringWidget: string | null
  
  // Loading state
  loading: boolean
  error: string | null
  
  // Performance state
  metrics: Record<string, WidgetPerformanceMetrics>
}

// Widget action types
export type WidgetAction = 
  | { type: 'ADD_WIDGET'; payload: { layoutId: string; widget: WidgetInstance } }
  | { type: 'REMOVE_WIDGET'; payload: { layoutId: string; widgetId: string } }
  | { type: 'UPDATE_WIDGET'; payload: { layoutId: string; widgetId: string; updates: Partial<WidgetInstance> } }
  | { type: 'MOVE_WIDGET'; payload: { layoutId: string; widgetId: string; position: { row: number; column: number } } }
  | { type: 'RESIZE_WIDGET'; payload: { layoutId: string; widgetId: string; size: { rowSpan: number; columnSpan: number } } }
  | { type: 'SELECT_WIDGET'; payload: { widgetId: string } }
  | { type: 'DESELECT_WIDGET'; payload: { widgetId: string } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_EDIT_MODE'; payload: { enabled: boolean } }
  | { type: 'SET_ACTIVE_LAYOUT'; payload: { layoutId: string } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'UPDATE_METRICS'; payload: { widgetId: string; metrics: WidgetPerformanceMetrics } }

// Widget event types
export interface WidgetEvent {
  type: 'widget:created' | 'widget:updated' | 'widget:deleted' | 'widget:moved' | 'widget:resized' | 'widget:error'
  widgetId: string
  layoutId: string
  timestamp: Date
  data?: any
}

export type WidgetEventHandler = (event: WidgetEvent) => void

// Widget registry types
export interface WidgetRegistryState {
  widgets: Map<WidgetType, WidgetRegistration>
  categories: Map<WidgetCategory, WidgetRegistration[]>
  initialized: boolean
  loading: boolean
  error: string | null
}

// Norwegian specific types
export interface NorwegianWidgetLabels {
  // Common labels
  loading: string
  error: string
  noData: string
  refresh: string
  configure: string
  export: string
  delete: string
  move: string
  resize: string
  
  // Widget categories
  stocks: string
  crypto: string
  art: string
  other: string
  
  // Widget sizes
  small: string
  medium: string
  large: string
  hero: string
  
  // Actions
  addWidget: string
  removeWidget: string
  editLayout: string
  saveLayout: string
  resetLayout: string
  
  // Validation messages
  invalidConfig: string
  unsupportedSize: string
  positionConflict: string
  missingData: string
  networkError: string
}

// Default Norwegian labels
export const norwegianLabels: NorwegianWidgetLabels = {
  loading: 'Laster...',
  error: 'Feil',
  noData: 'Ingen data',
  refresh: 'Oppdater',
  configure: 'Konfigurer',
  export: 'Eksporter',
  delete: 'Slett',
  move: 'Flytt',
  resize: 'Endre størrelse',
  
  stocks: 'Aksjer',
  crypto: 'Krypto',
  art: 'Kunst',
  other: 'Annet',
  
  small: 'Liten',
  medium: 'Medium',
  large: 'Stor',
  hero: 'Hero',
  
  addWidget: 'Legg til widget',
  removeWidget: 'Fjern widget',
  editLayout: 'Rediger layout',
  saveLayout: 'Lagre layout',
  resetLayout: 'Tilbakestill layout',
  
  invalidConfig: 'Ugyldig konfigurasjon',
  unsupportedSize: 'Ustøttet størrelse',
  positionConflict: 'Posisjonskonflikt',
  missingData: 'Mangler data',
  networkError: 'Nettverksfeil',
}

// Widget utility types
export type WidgetSizeMap = Record<WidgetSize, { rows: number; columns: number }>
export type WidgetCategoryMap = Record<WidgetCategory, { color: string; icon: ReactNode }>
export type WidgetTypeMap = Record<WidgetType, WidgetRegistration>

// Export all types for easy import
export type {
  WidgetType,
  WidgetCategory,
  WidgetSize,
  WidgetConfig,
  WidgetLayoutTemplate,
  ResponsiveWidgetConfig,
  LayoutType,
  WidgetProps,
  ThemeVariant,
}
