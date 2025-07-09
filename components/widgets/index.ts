// Widget registry system exports

// Core types
export * from './widget-types'

// Widget registry
export {
  WidgetRegistryProvider,
  useWidgetRegistry,
  widgetRegistry,
  getWidgetRegistration,
  getAllWidgetRegistrations,
  getWidgetsByCategory,
  searchWidgets,
  validateWidgetConfig,
  getWidgetTheme,
  getWidgetGridSize,
  isWidgetSizeValid,
} from './widget-registry'

// Widget store
export {
  useWidgetStore,
  useActiveLayout,
  useWidgets,
  useSelectedWidgets,
  useEditMode,
  useDragState,
  useWidgetMetrics,
  useGridLayout,
  useWidgetError,
  useWidgetLoading,
  useWidgetActions,
  useWidgetPerformance,
  useLayoutManager,
  useWidgetEvents,
  useGridUtils,
  useWidgetPreferences,
} from './widget-store'

// Widget factory
export {
  WidgetRenderer,
  WidgetCatalog,
  WidgetCreator,
  useWidgetFactory,
  widgetFactory,
} from './widget-factory'

// Re-export UI components
export {
  Widget,
  StockWidget,
  CryptoWidget,
  ArtWidget,
  WidgetContainer,
  widgetVariants,
  type WidgetProps,
} from '@/components/ui/widget'

// Utility functions
export const WIDGET_REGISTRY_VERSION = '1.0.0'

// Widget system information
export const getWidgetSystemInfo = () => {
  return {
    version: WIDGET_REGISTRY_VERSION,
    totalWidgets: widgetRegistry.getAll().length,
    categories: widgetRegistry.getCategories().length,
    initialized: widgetRegistry.getState().initialized,
  }
}

// Widget development utilities
export const createWidgetRegistration = (type: string, config: any) => {
  // Helper for creating widget registrations during development
  return {
    type,
    displayName: config.displayName || type,
    description: config.description || 'No description',
    category: config.category || 'STOCKS',
    ...config,
  }
}

// Widget performance utilities
export const getWidgetPerformanceReport = (widgetId?: string) => {
  // Get performance metrics for widgets
  const store = useWidgetStore.getState()
  if (widgetId) {
    return store.metrics[widgetId] || null
  }
  return store.metrics
}

// Widget validation utilities
export const validateWidgetLayout = (layoutId: string) => {
  // Validate entire widget layout
  const store = useWidgetStore.getState()
  const widgets = store.layouts[layoutId] || []
  
  const validationResults = widgets.map(widget => ({
    widgetId: widget.id,
    valid: widget.isValid,
    errors: widget.validationErrors,
  }))
  
  return {
    layoutId,
    totalWidgets: widgets.length,
    validWidgets: validationResults.filter(r => r.valid).length,
    invalidWidgets: validationResults.filter(r => !r.valid).length,
    results: validationResults,
  }
}

// Widget grid utilities
export const calculateOptimalGridSize = (widgets: any[]) => {
  // Calculate optimal grid size for a set of widgets
  let maxRow = 0
  let maxColumn = 0
  
  widgets.forEach(widget => {
    const endRow = widget.position.row + widget.position.rowSpan
    const endColumn = widget.position.column + widget.position.columnSpan
    maxRow = Math.max(maxRow, endRow)
    maxColumn = Math.max(maxColumn, endColumn)
  })
  
  return {
    rows: Math.max(4, maxRow),
    columns: Math.max(2, maxColumn),
  }
}

// Widget theme utilities
export const generateWidgetThemeCSS = (category: string, theme: string) => {
  // Generate CSS custom properties for widget themes
  const themeConfig = getWidgetTheme(category as any, theme)
  return {
    '--widget-primary': themeConfig.primary,
    '--widget-secondary': themeConfig.secondary,
    '--widget-gradient': themeConfig.gradient,
    '--widget-glow': themeConfig.glow,
  }
}

// Widget analytics utilities
export const getWidgetAnalytics = (layoutId: string) => {
  // Get analytics for widgets in a layout
  const store = useWidgetStore.getState()
  const widgets = store.layouts[layoutId] || []
  
  return {
    layoutId,
    totalWidgets: widgets.length,
    widgetsByCategory: widgets.reduce((acc, widget) => {
      acc[widget.category] = (acc[widget.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    widgetsBySize: widgets.reduce((acc, widget) => {
      acc[widget.size] = (acc[widget.size] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    widgetsByType: widgets.reduce((acc, widget) => {
      acc[widget.type] = (acc[widget.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalErrors: widgets.reduce((acc, widget) => acc + widget.validationErrors.length, 0),
  }
}

// Export constants
export const WIDGET_CONSTANTS = {
  VERSION: WIDGET_REGISTRY_VERSION,
  MIN_GRID_SIZE: { rows: 1, columns: 1 },
  MAX_GRID_SIZE: { rows: 10, columns: 4 },
  DEFAULT_GRID_SIZE: { rows: 4, columns: 2 },
  SUPPORTED_THEMES: ['light', 'dark', 'dark-orange'],
  SUPPORTED_CATEGORIES: ['STOCKS', 'CRYPTO', 'ART', 'OTHER'],
  SUPPORTED_SIZES: ['SMALL', 'MEDIUM', 'LARGE', 'HERO'],
}
