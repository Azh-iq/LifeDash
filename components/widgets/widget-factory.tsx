'use client'

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  WidgetInstance,
  WidgetFactoryOptions,
  WidgetValidationResult,
  BaseWidgetComponentProps,
  WidgetRegistration,
  WidgetPerformanceMetrics,
  WidgetThemeConfig,
  norwegianLabels,
} from './widget-types'
import { WidgetType, WidgetCategory, WidgetSize, WidgetConfig } from '@/lib/types/widget.types'
import { widgetRegistry, useWidgetRegistry, getWidgetTheme } from './widget-registry'
import { useWidgetStore, useWidgetActions, useWidgetPerformance } from './widget-store'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'
import { Widget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils/cn'

// Widget factory class
class WidgetFactory {
  private static instance: WidgetFactory
  private validationCache: Map<string, WidgetValidationResult> = new Map()
  private performanceTracker: Map<string, WidgetPerformanceMetrics> = new Map()

  private constructor() {}

  public static getInstance(): WidgetFactory {
    if (!WidgetFactory.instance) {
      WidgetFactory.instance = new WidgetFactory()
    }
    return WidgetFactory.instance
  }

  // Create a new widget instance
  public createWidget(options: WidgetFactoryOptions): WidgetInstance {
    const registration = widgetRegistry.get(options.type)
    if (!registration) {
      throw new Error(`Widget type ${options.type} is not registered`)
    }

    const id = uuidv4()
    const now = new Date()
    
    // Determine grid size based on widget size
    const gridSize = this.getGridSizeForWidgetSize(options.size || registration.recommendedSize)
    
    // Create widget instance
    const widget: WidgetInstance = {
      id,
      type: options.type,
      category: options.category || registration.category,
      size: options.size || registration.recommendedSize,
      position: {
        row: options.position?.row || 1,
        column: options.position?.column || 1,
        rowSpan: options.position?.rowSpan || gridSize.rows,
        columnSpan: options.position?.columnSpan || gridSize.columns,
      },
      props: this.createWidgetProps({
        id,
        type: options.type,
        category: options.category || registration.category,
        size: options.size || registration.recommendedSize,
        position: {
          row: options.position?.row || 1,
          column: options.position?.column || 1,
          rowSpan: options.position?.rowSpan || gridSize.rows,
          columnSpan: options.position?.columnSpan || gridSize.columns,
        },
        config: { ...registration.defaultConfig, ...options.config },
        title: options.title || registration.norwegianLabels.title,
        description: options.description || registration.norwegianLabels.description,
        userId: options.userId,
        portfolioId: options.portfolioId,
        stockSymbol: options.stockSymbol,
        theme: options.theme,
        mobileHidden: options.mobileHidden || false,
        tabletConfig: options.tabletConfig,
        mobileConfig: options.mobileConfig,
      }),
      registration,
      created: now,
      updated: now,
      isValid: true,
      validationErrors: [],
    }

    // Validate the widget
    const validation = this.validateWidget(widget)
    widget.isValid = validation.valid
    widget.validationErrors = validation.errors

    return widget
  }

  // Create widget props
  private createWidgetProps(baseProps: Omit<BaseWidgetComponentProps, 'onRefresh' | 'onExport' | 'onConfigure' | 'onDelete' | 'onMove' | 'onResize'>): BaseWidgetComponentProps {
    return {
      ...baseProps,
      onRefresh: this.createRefreshHandler(baseProps.id),
      onExport: this.createExportHandler(baseProps.id),
      onConfigure: this.createConfigureHandler(baseProps.id),
      onDelete: this.createDeleteHandler(baseProps.id),
      onMove: this.createMoveHandler(baseProps.id),
      onResize: this.createResizeHandler(baseProps.id),
    }
  }

  // Event handlers
  private createRefreshHandler(widgetId: string) {
    return async () => {
      try {
        const startTime = Date.now()
        // Implement refresh logic here
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate async operation
        const endTime = Date.now()
        
        // Track performance
        this.trackPerformance(widgetId, 'refresh', endTime - startTime)
      } catch (error) {
        console.error(`Error refreshing widget ${widgetId}:`, error)
        throw error
      }
    }
  }

  private createExportHandler(widgetId: string) {
    return async () => {
      try {
        const startTime = Date.now()
        // Implement export logic here
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate async operation
        const endTime = Date.now()
        
        // Track performance
        this.trackPerformance(widgetId, 'export', endTime - startTime)
      } catch (error) {
        console.error(`Error exporting widget ${widgetId}:`, error)
        throw error
      }
    }
  }

  private createConfigureHandler(widgetId: string) {
    return () => {
      // Implement configuration logic here
      console.log(`Configuring widget ${widgetId}`)
    }
  }

  private createDeleteHandler(widgetId: string) {
    return () => {
      // Implement delete logic here
      console.log(`Deleting widget ${widgetId}`)
    }
  }

  private createMoveHandler(widgetId: string) {
    return (newPosition: { row: number; column: number }) => {
      // Implement move logic here
      console.log(`Moving widget ${widgetId} to:`, newPosition)
    }
  }

  private createResizeHandler(widgetId: string) {
    return (newSize: { rowSpan: number; columnSpan: number }) => {
      // Implement resize logic here
      console.log(`Resizing widget ${widgetId} to:`, newSize)
    }
  }

  // Utility methods
  private getGridSizeForWidgetSize(size: WidgetSize): { rows: number; columns: number } {
    switch (size) {
      case 'SMALL':
        return { rows: 1, columns: 1 }
      case 'MEDIUM':
        return { rows: 2, columns: 2 }
      case 'LARGE':
        return { rows: 3, columns: 3 }
      case 'HERO':
        return { rows: 4, columns: 4 }
      default:
        return { rows: 2, columns: 2 }
    }
  }

  private validateWidget(widget: WidgetInstance): WidgetValidationResult {
    const cacheKey = `${widget.type}-${JSON.stringify(widget.props.config)}`
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!
    }

    const result = widgetRegistry.validate(widget.type, widget.props.config)
    this.validationCache.set(cacheKey, result)
    
    return result
  }

  private trackPerformance(widgetId: string, operation: string, duration: number) {
    const existing = this.performanceTracker.get(widgetId)
    const now = new Date()
    
    const metrics: WidgetPerformanceMetrics = {
      widgetId,
      type: 'CUSTOM_WIDGET',
      renderTime: operation === 'render' ? duration : existing?.renderTime || 0,
      mountTime: operation === 'mount' ? duration : existing?.mountTime || 0,
      updateCount: (existing?.updateCount || 0) + 1,
      memoryUsage: existing?.memoryUsage || 0,
      viewCount: existing?.viewCount || 0,
      interactionCount: operation === 'interaction' ? (existing?.interactionCount || 0) + 1 : existing?.interactionCount || 0,
      dataLoadTime: operation === 'dataLoad' ? duration : existing?.dataLoadTime || 0,
      dataUpdateCount: operation === 'dataUpdate' ? (existing?.dataUpdateCount || 0) + 1 : existing?.dataUpdateCount || 0,
      errorCount: existing?.errorCount || 0,
      created: existing?.created || now,
      lastUpdated: now,
    }
    
    this.performanceTracker.set(widgetId, metrics)
  }

  // Factory methods for different widget types
  public createHeroPortfolioChart(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'HERO_PORTFOLIO_CHART' })
  }

  public createCategoryMiniChart(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'CATEGORY_MINI_CHART' })
  }

  public createStockPerformanceChart(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'STOCK_PERFORMANCE_CHART' })
  }

  public createHoldingsTable(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'HOLDINGS_TABLE_RICH' })
  }

  public createMetricsGrid(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'METRICS_GRID' })
  }

  public createActivityFeed(options: Omit<WidgetFactoryOptions, 'type'>): WidgetInstance {
    return this.createWidget({ ...options, type: 'ACTIVITY_FEED' })
  }

  // Clear caches
  public clearCaches() {
    this.validationCache.clear()
    this.performanceTracker.clear()
  }
}

// React component for rendering widgets
interface WidgetRendererProps {
  widget: WidgetInstance
  className?: string
  onError?: (error: Error) => void
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, className, onError }) => {
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { recordRenderTime, recordInteraction } = useWidgetPerformance(widget.id)
  
  const handleRender = useCallback(() => {
    const startTime = Date.now()
    
    try {
      // Simulate render time tracking
      setTimeout(() => {
        const endTime = Date.now()
        recordRenderTime(endTime - startTime)
      }, 0)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setRenderError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [recordRenderTime, onError])

  const handleInteraction = useCallback(() => {
    recordInteraction()
  }, [recordInteraction])

  useEffect(() => {
    handleRender()
  }, [handleRender])

  if (!widget.isValid) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          Widget validation failed: {widget.validationErrors.join(', ')}
        </AlertDescription>
      </Alert>
    )
  }

  if (renderError) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          {norwegianLabels.error}: {renderError}
        </AlertDescription>
      </Alert>
    )
  }

  const WidgetComponent = widget.registration.component
  const themeConfig = getWidgetTheme(widget.category)

  return (
    <div 
      className={cn('widget-container', className)}
      onClick={handleInteraction}
      style={{
        gridRow: `${widget.position.row} / span ${widget.position.rowSpan}`,
        gridColumn: `${widget.position.column} / span ${widget.position.columnSpan}`,
      }}
    >
      <Widget
        title={widget.props.title || widget.registration.norwegianLabels.title}
        description={widget.props.description || widget.registration.norwegianLabels.description}
        category={widget.category}
        size={widget.size}
        loading={isLoading}
        error={renderError}
        onRefresh={widget.props.onRefresh}
        onExport={widget.props.onExport}
        onMenuClick={widget.props.onConfigure}
        refreshLabel={widget.registration.norwegianLabels.refreshLabel}
        exportLabel={widget.registration.norwegianLabels.exportLabel}
        menuLabel={widget.registration.norwegianLabels.configureLabel}
        className={cn('widget-instance', `widget-${widget.type.toLowerCase()}`)}
      >
        <WidgetComponent {...widget.props} />
      </Widget>
    </div>
  )
}

// Widget catalog component
interface WidgetCatalogProps {
  category?: WidgetCategory
  onWidgetSelect?: (type: WidgetType) => void
  className?: string
}

export const WidgetCatalog: React.FC<WidgetCatalogProps> = ({ 
  category, 
  onWidgetSelect, 
  className 
}) => {
  const { state } = useWidgetRegistry()
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | null>(category || null)
  
  const widgets = useMemo(() => {
    if (selectedCategory) {
      return state.categories.get(selectedCategory) || []
    }
    return Array.from(state.widgets.values())
  }, [state.widgets, state.categories, selectedCategory])

  const categories = useMemo(() => {
    return Array.from(state.categories.keys())
  }, [state.categories])

  return (
    <div className={cn('widget-catalog', className)}>
      {/* Category filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Alle
        </Button>
        {categories.map(cat => {
          const theme = getWidgetTheme(cat)
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              style={{
                backgroundColor: selectedCategory === cat ? theme.primary : undefined,
                borderColor: theme.primary,
              }}
            >
              {norwegianLabels[cat.toLowerCase() as keyof typeof norwegianLabels]}
            </Button>
          )
        })}
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map(registration => {
          const theme = getWidgetTheme(registration.category)
          return (
            <Card 
              key={registration.type}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onWidgetSelect?.(registration.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {registration.displayName}
                  </CardTitle>
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: theme.primary, color: 'white' }}
                  >
                    {norwegianLabels[registration.category.toLowerCase() as keyof typeof norwegianLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {registration.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {norwegianLabels[registration.recommendedSize.toLowerCase() as keyof typeof norwegianLabels]}
                  </span>
                  <div className="flex gap-1">
                    {registration.features.exportable && (
                      <Badge variant="outline" className="text-xs">
                        Export
                      </Badge>
                    )}
                    {registration.features.realTimeUpdates && (
                      <Badge variant="outline" className="text-xs">
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Ingen widgets funnet for denne kategorien.</p>
        </div>
      )}
    </div>
  )
}

// Widget creation dialog
interface WidgetCreatorProps {
  type: WidgetType
  onWidgetCreate?: (widget: WidgetInstance) => void
  onCancel?: () => void
  userId: string
  portfolioId?: string
  stockSymbol?: string
}

export const WidgetCreator: React.FC<WidgetCreatorProps> = ({
  type,
  onWidgetCreate,
  onCancel,
  userId,
  portfolioId,
  stockSymbol,
}) => {
  const factory = useMemo(() => WidgetFactory.getInstance(), [])
  const registration = widgetRegistry.get(type)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState<WidgetSize>('MEDIUM')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!registration) {
    return (
      <Alert>
        <AlertDescription>
          Widget type {type} not found
        </AlertDescription>
      </Alert>
    )
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)
    
    try {
      const widget = factory.createWidget({
        type,
        title: title || registration.norwegianLabels.title,
        description: description || registration.norwegianLabels.description,
        size,
        userId,
        portfolioId,
        stockSymbol,
      })
      
      onWidgetCreate?.(widget)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Lag ny widget</CardTitle>
        <p className="text-sm text-gray-600">
          {registration.displayName} - {registration.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tittel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={registration.norwegianLabels.title}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Beskrivelse
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={registration.norwegianLabels.description}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Størrelse
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as WidgetSize)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="SMALL">Liten</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Stor</option>
            <option value="HERO">Hero</option>
          </select>
        </div>
        
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleCreate}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? 'Lager...' : 'Lag Widget'}
          </Button>
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={isCreating}
          >
            Avbryt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for using widget factory
export const useWidgetFactory = () => {
  const factory = useMemo(() => WidgetFactory.getInstance(), [])
  const actions = useWidgetActions()
  
  const createAndAddWidget = useCallback((layoutId: string, options: WidgetFactoryOptions) => {
    try {
      const widget = factory.createWidget(options)
      actions.addWidget(layoutId, widget)
      return widget
    } catch (error) {
      console.error('Failed to create widget:', error)
      throw error
    }
  }, [factory, actions])
  
  return {
    factory,
    createWidget: factory.createWidget.bind(factory),
    createAndAddWidget,
    createHeroPortfolioChart: factory.createHeroPortfolioChart.bind(factory),
    createCategoryMiniChart: factory.createCategoryMiniChart.bind(factory),
    createStockPerformanceChart: factory.createStockPerformanceChart.bind(factory),
    createHoldingsTable: factory.createHoldingsTable.bind(factory),
    createMetricsGrid: factory.createMetricsGrid.bind(factory),
    createActivityFeed: factory.createActivityFeed.bind(factory),
  }
}

// Export factory instance
export const widgetFactory = WidgetFactory.getInstance()
