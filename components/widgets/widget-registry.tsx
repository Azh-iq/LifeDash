'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  WidgetType, 
  WidgetCategory, 
  WidgetSize, 
  WidgetConfig,
  ChartWidgetConfig,
  TableWidgetConfig,
  MetricsWidgetConfig,
  NewsWidgetConfig,
  AlertsWidgetConfig,
} from '@/lib/types/widget.types'
import {
  WidgetRegistration,
  WidgetRegistryState,
  WidgetFilter,
  WidgetSearchResult,
  WidgetValidationResult,
  BaseWidgetComponentProps,
  norwegianLabels,
  WidgetComponent,
} from './widget-types'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'

// Placeholder widget components (these would be implemented separately)
const PlaceholderWidget: WidgetComponent = ({ title, loading, error, children }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <h3 className="font-semibold mb-2">{title}</h3>
      {loading && <p className="text-gray-500">Laster...</p>}
      {error && <p className="text-red-500">Feil: {error}</p>}
      {children || <p className="text-gray-400">Widget kommer snart...</p>}
    </div>
  )
}

// Widget registry class
class WidgetRegistry {
  private widgets: Map<WidgetType, WidgetRegistration> = new Map()
  private categories: Map<WidgetCategory, WidgetRegistration[]> = new Map()
  private initialized = false
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.initializeDefaultWidgets()
  }

  private initializeDefaultWidgets() {
    // Hero Portfolio Chart
    this.register({
      type: 'HERO_PORTFOLIO_CHART',
      displayName: 'Hovedportfølje Graf',
      description: 'Stor porteføljeytelse graf for dashboard',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        chartType: 'line',
        showVolume: true,
        showGrid: true,
        timeframe: '1M',
        showTechnicalIndicators: false,
        height: 400,
      } as ChartWidgetConfig,
      minSize: 'LARGE',
      maxSize: 'HERO',
      recommendedSize: 'HERO',
      minGridSize: { rows: 2, columns: 2 },
      maxGridSize: { rows: 4, columns: 4 },
      features: {
        exportable: true,
        configurable: true,
        realTimeUpdates: true,
        caching: true,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: true,
        requiresStock: false,
        requiresAccount: false,
        requiresInternetConnection: true,
      },
      norwegianLabels: {
        title: 'Porteføljeytelse',
        description: 'Oversikt over porteføljens utvikling over tid',
        configureLabel: 'Konfigurer graf',
        exportLabel: 'Eksporter grafdata',
        refreshLabel: 'Oppdater data',
        errorMessages: {
          loadFailed: 'Kunne ikke laste porteføljedata',
          noData: 'Ingen porteføljedata tilgjengelig',
          configError: 'Ugyldig grafkonfigurasjon',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'high',
        memoryUsage: 'medium',
        updateFrequency: 'frequent',
      },
    })

    // Category Mini Chart
    this.register({
      type: 'CATEGORY_MINI_CHART',
      displayName: 'Kategori Mini-graf',
      description: 'Kompakt graf for investeringskategorier',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        chartType: 'area',
        showVolume: false,
        showGrid: false,
        timeframe: '1W',
        height: 200,
      } as ChartWidgetConfig,
      minSize: 'SMALL',
      maxSize: 'MEDIUM',
      recommendedSize: 'SMALL',
      minGridSize: { rows: 1, columns: 1 },
      maxGridSize: { rows: 2, columns: 2 },
      features: {
        exportable: false,
        configurable: true,
        realTimeUpdates: true,
        caching: true,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: true,
        requiresStock: false,
        requiresAccount: false,
        requiresInternetConnection: true,
      },
      norwegianLabels: {
        title: 'Kategoriytelse',
        description: 'Miniaturversjon av kategoriytelse',
        configureLabel: 'Konfigurer mini-graf',
        exportLabel: 'Eksporter data',
        refreshLabel: 'Oppdater',
        errorMessages: {
          loadFailed: 'Kunne ikke laste kategoridata',
          noData: 'Ingen data for denne kategorien',
          configError: 'Ugyldig konfigurasjon',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'medium',
        memoryUsage: 'low',
        updateFrequency: 'frequent',
      },
    })

    // Stock Performance Chart
    this.register({
      type: 'STOCK_PERFORMANCE_CHART',
      displayName: 'Aksjeytelse Graf',
      description: 'Detaljert aksjeytelse med tekniske indikatorer',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        chartType: 'candlestick',
        showVolume: true,
        showGrid: true,
        showTechnicalIndicators: true,
        indicators: ['SMA', 'RSI'],
        timeframe: '3M',
        height: 400,
      } as ChartWidgetConfig,
      minSize: 'MEDIUM',
      maxSize: 'HERO',
      recommendedSize: 'LARGE',
      minGridSize: { rows: 2, columns: 2 },
      maxGridSize: { rows: 4, columns: 4 },
      features: {
        exportable: true,
        configurable: true,
        realTimeUpdates: true,
        caching: true,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: false,
        requiresStock: true,
        requiresAccount: false,
        requiresInternetConnection: true,
      },
      norwegianLabels: {
        title: 'Aksjeanalyse',
        description: 'Detaljert teknisk analyse av aksjen',
        configureLabel: 'Konfigurer indikatorer',
        exportLabel: 'Eksporter grafdata',
        refreshLabel: 'Oppdater kurs',
        errorMessages: {
          loadFailed: 'Kunne ikke laste aksjedata',
          noData: 'Ingen kursdata tilgjengelig',
          configError: 'Ugyldig indikatorinnstillinger',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'high',
        memoryUsage: 'medium',
        updateFrequency: 'realtime',
      },
    })

    // Holdings Table Rich
    this.register({
      type: 'HOLDINGS_TABLE_RICH',
      displayName: 'Detaljert Beholdningstabell',
      description: 'Omfattende beholdningstabell med mikro-grafer',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        columns: ['symbol', 'quantity', 'current_price', 'market_value', 'pnl', 'pnl_percent'],
        sortBy: 'market_value',
        sortDirection: 'desc',
        pageSize: 20,
        showPagination: true,
        showSearch: true,
        showFilters: true,
        compactMode: false,
      } as TableWidgetConfig,
      minSize: 'MEDIUM',
      maxSize: 'HERO',
      recommendedSize: 'LARGE',
      minGridSize: { rows: 2, columns: 2 },
      maxGridSize: { rows: 4, columns: 4 },
      features: {
        exportable: true,
        configurable: true,
        realTimeUpdates: true,
        caching: true,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: true,
        requiresStock: false,
        requiresAccount: false,
        requiresInternetConnection: true,
      },
      norwegianLabels: {
        title: 'Beholdninger',
        description: 'Detaljert oversikt over alle beholdninger',
        configureLabel: 'Konfigurer kolonner',
        exportLabel: 'Eksporter til CSV',
        refreshLabel: 'Oppdater priser',
        errorMessages: {
          loadFailed: 'Kunne ikke laste beholdninger',
          noData: 'Ingen beholdninger funnet',
          configError: 'Ugyldig tabellkonfigurasjon',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'high',
        memoryUsage: 'medium',
        updateFrequency: 'frequent',
      },
    })

    // Metrics Grid
    this.register({
      type: 'METRICS_GRID',
      displayName: 'Ytelsesmålinger',
      description: 'Nøkkelytelsesmålinger og statistikk',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        metrics: ['total_value', 'total_return', 'day_change', 'unrealized_pnl'],
        showPercentageChange: true,
        showSparklines: true,
        compactView: false,
        colorScheme: 'default',
      } as MetricsWidgetConfig,
      minSize: 'SMALL',
      maxSize: 'LARGE',
      recommendedSize: 'MEDIUM',
      minGridSize: { rows: 1, columns: 1 },
      maxGridSize: { rows: 2, columns: 3 },
      features: {
        exportable: true,
        configurable: true,
        realTimeUpdates: true,
        caching: true,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: true,
        requiresStock: false,
        requiresAccount: false,
        requiresInternetConnection: true,
      },
      norwegianLabels: {
        title: 'Nøkkeltall',
        description: 'Viktige ytelsesmålinger for porteføljen',
        configureLabel: 'Velg målinger',
        exportLabel: 'Eksporter målinger',
        refreshLabel: 'Oppdater tall',
        errorMessages: {
          loadFailed: 'Kunne ikke laste nøkkeltall',
          noData: 'Ingen data for beregning',
          configError: 'Ugyldig målingskonfigurasjon',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'medium',
        memoryUsage: 'low',
        updateFrequency: 'frequent',
      },
    })

    // Activity Feed
    this.register({
      type: 'ACTIVITY_FEED',
      displayName: 'Aktivitetsfeed',
      description: 'Nylige transaksjoner og endringer',
      category: 'STOCKS',
      component: PlaceholderWidget,
      defaultConfig: {
        maxItems: 10,
        showImages: false,
        showSummary: true,
        filterBySymbol: false,
      } as NewsWidgetConfig,
      minSize: 'SMALL',
      maxSize: 'LARGE',
      recommendedSize: 'MEDIUM',
      minGridSize: { rows: 1, columns: 1 },
      maxGridSize: { rows: 3, columns: 2 },
      features: {
        exportable: false,
        configurable: true,
        realTimeUpdates: true,
        caching: false,
        responsive: true,
      },
      dataRequirements: {
        requiresPortfolio: true,
        requiresStock: false,
        requiresAccount: false,
        requiresInternetConnection: false,
      },
      norwegianLabels: {
        title: 'Aktivitet',
        description: 'Siste aktivitet i porteføljen',
        configureLabel: 'Konfigurer feed',
        exportLabel: 'Eksporter aktivitet',
        refreshLabel: 'Oppdater feed',
        errorMessages: {
          loadFailed: 'Kunne ikke laste aktivitet',
          noData: 'Ingen aktivitet å vise',
          configError: 'Ugyldig feed-konfigurasjon',
        },
      },
      version: '1.0.0',
      compatibleVersions: ['1.0.0'],
      performance: {
        renderPriority: 'low',
        memoryUsage: 'low',
        updateFrequency: 'frequent',
      },
    })

    // Initialize remaining widgets with placeholder registrations
    const remainingWidgets: Array<{ type: WidgetType; name: string; desc: string; category: WidgetCategory; size: WidgetSize }> = [
      { type: 'TOP_NAVIGATION_ENHANCED', name: 'Utvidet Navigasjon', desc: 'Hovednavigasjon med funksjoner', category: 'STOCKS', size: 'LARGE' },
      { type: 'CATEGORY_SELECTOR', name: 'Kategorivelger', desc: 'Bytte mellom investeringstyper', category: 'STOCKS', size: 'SMALL' },
      { type: 'STOCK_DETAIL_CARD', name: 'Aksjedetaljer', desc: 'Detaljert aksjeinfo med faner', category: 'STOCKS', size: 'MEDIUM' },
      { type: 'TRANSACTION_HISTORY', name: 'Transaksjonshistorikk', desc: 'Fullstendig transaksjonslogg', category: 'STOCKS', size: 'LARGE' },
      { type: 'PRICE_ALERTS', name: 'Prisvarsler', desc: 'Prisvarsler og notifikasjoner', category: 'STOCKS', size: 'MEDIUM' },
      { type: 'NEWS_FEED', name: 'Nyhetsfeed', desc: 'Finansnyheter og markedsinformasjon', category: 'STOCKS', size: 'MEDIUM' },
      { type: 'PORTFOLIO_ALLOCATION', name: 'Porteføljeallokering', desc: 'Fordeling av investeringer', category: 'STOCKS', size: 'MEDIUM' },
      { type: 'PERFORMANCE_METRICS', name: 'Ytelsesmålinger', desc: 'Avanserte ytelsesmålinger', category: 'STOCKS', size: 'LARGE' },
      { type: 'WATCHLIST', name: 'Overvåkningsliste', desc: 'Aksjer og investeringer å følge', category: 'STOCKS', size: 'MEDIUM' },
      { type: 'CUSTOM_WIDGET', name: 'Tilpasset Widget', desc: 'Brukerdefinert widget', category: 'STOCKS', size: 'MEDIUM' },
    ]

    remainingWidgets.forEach(({ type, name, desc, category, size }) => {
      this.register({
        type,
        displayName: name,
        description: desc,
        category,
        component: PlaceholderWidget,
        defaultConfig: {},
        minSize: 'SMALL',
        maxSize: 'HERO',
        recommendedSize: size,
        minGridSize: { rows: 1, columns: 1 },
        maxGridSize: { rows: 4, columns: 4 },
        features: {
          exportable: false,
          configurable: true,
          realTimeUpdates: false,
          caching: false,
          responsive: true,
        },
        dataRequirements: {
          requiresPortfolio: false,
          requiresStock: false,
          requiresAccount: false,
          requiresInternetConnection: false,
        },
        norwegianLabels: {
          title: name,
          description: desc,
          configureLabel: 'Konfigurer',
          exportLabel: 'Eksporter',
          refreshLabel: 'Oppdater',
          errorMessages: {
            loadFailed: 'Kunne ikke laste widget',
            noData: 'Ingen data tilgjengelig',
            configError: 'Ugyldig konfigurasjon',
          },
        },
        version: '1.0.0',
        compatibleVersions: ['1.0.0'],
        performance: {
          renderPriority: 'medium',
          memoryUsage: 'low',
          updateFrequency: 'occasional',
        },
      })
    })

    this.updateCategories()
    this.initialized = true
    this.notifyListeners()
  }

  private updateCategories() {
    this.categories.clear()
    
    this.widgets.forEach((registration) => {
      const category = registration.category
      if (!this.categories.has(category)) {
        this.categories.set(category, [])
      }
      this.categories.get(category)!.push(registration)
    })
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  public register(registration: WidgetRegistration): void {
    if (this.widgets.has(registration.type)) {
      console.warn(`Widget ${registration.type} is already registered. Overwriting...`)
    }
    
    this.widgets.set(registration.type, registration)
    this.updateCategories()
    this.notifyListeners()
  }

  public unregister(type: WidgetType): boolean {
    const result = this.widgets.delete(type)
    if (result) {
      this.updateCategories()
      this.notifyListeners()
    }
    return result
  }

  public get(type: WidgetType): WidgetRegistration | undefined {
    return this.widgets.get(type)
  }

  public getAll(): WidgetRegistration[] {
    return Array.from(this.widgets.values())
  }

  public getByCategory(category: WidgetCategory): WidgetRegistration[] {
    return this.categories.get(category) || []
  }

  public getCategories(): WidgetCategory[] {
    return Array.from(this.categories.keys())
  }

  public search(filter: WidgetFilter): WidgetSearchResult[] {
    let results = this.getAll()
    
    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      results = results.filter(widget => filter.categories!.includes(widget.category))
    }
    
    // Filter by types
    if (filter.types && filter.types.length > 0) {
      results = results.filter(widget => filter.types!.includes(widget.type))
    }
    
    // Filter by sizes
    if (filter.sizes && filter.sizes.length > 0) {
      results = results.filter(widget => filter.sizes!.includes(widget.recommendedSize))
    }
    
    // Filter by features
    if (filter.features && filter.features.length > 0) {
      results = results.filter(widget => 
        filter.features!.some(feature => 
          widget.features[feature as keyof typeof widget.features]
        )
      )
    }
    
    // Text search
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase()
      results = results.filter(widget => 
        widget.displayName.toLowerCase().includes(searchTerm) ||
        widget.description.toLowerCase().includes(searchTerm) ||
        widget.norwegianLabels.title.toLowerCase().includes(searchTerm) ||
        widget.norwegianLabels.description.toLowerCase().includes(searchTerm)
      )
    }
    
    // Convert to search results with relevance scoring
    return results.map(registration => ({
      registration,
      relevanceScore: this.calculateRelevanceScore(registration, filter),
      matchedFields: this.getMatchedFields(registration, filter),
    })).sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private calculateRelevanceScore(registration: WidgetRegistration, filter: WidgetFilter): number {
    let score = 0
    
    // Base score
    score += 50
    
    // Category match
    if (filter.categories?.includes(registration.category)) {
      score += 30
    }
    
    // Type match
    if (filter.types?.includes(registration.type)) {
      score += 40
    }
    
    // Size match
    if (filter.sizes?.includes(registration.recommendedSize)) {
      score += 20
    }
    
    // Feature matches
    if (filter.features) {
      const featureMatches = filter.features.filter(feature => 
        registration.features[feature as keyof typeof registration.features]
      )
      score += featureMatches.length * 10
    }
    
    // Text search bonus
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase()
      if (registration.displayName.toLowerCase().includes(searchTerm)) score += 25
      if (registration.description.toLowerCase().includes(searchTerm)) score += 15
      if (registration.norwegianLabels.title.toLowerCase().includes(searchTerm)) score += 20
    }
    
    return score
  }

  private getMatchedFields(registration: WidgetRegistration, filter: WidgetFilter): string[] {
    const matched: string[] = []
    
    if (filter.categories?.includes(registration.category)) {
      matched.push('category')
    }
    
    if (filter.types?.includes(registration.type)) {
      matched.push('type')
    }
    
    if (filter.sizes?.includes(registration.recommendedSize)) {
      matched.push('size')
    }
    
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase()
      if (registration.displayName.toLowerCase().includes(searchTerm)) matched.push('displayName')
      if (registration.description.toLowerCase().includes(searchTerm)) matched.push('description')
      if (registration.norwegianLabels.title.toLowerCase().includes(searchTerm)) matched.push('norwegianTitle')
    }
    
    return matched
  }

  public validate(type: WidgetType, config: WidgetConfig): WidgetValidationResult {
    const registration = this.get(type)
    if (!registration) {
      return {
        valid: false,
        errors: [`Widget type ${type} is not registered`],
        warnings: [],
        suggestions: [],
      }
    }
    
    // Basic validation - in a real implementation, this would use JSON schema
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Validate required fields based on widget type
    if (type.includes('CHART')) {
      const chartConfig = config as ChartWidgetConfig
      if (!chartConfig.chartType) {
        errors.push('Chart type is required')
      }
      if (chartConfig.height && chartConfig.height < 100) {
        warnings.push('Chart height is very small')
      }
    }
    
    if (type.includes('TABLE')) {
      const tableConfig = config as TableWidgetConfig
      if (!tableConfig.columns || tableConfig.columns.length === 0) {
        errors.push('At least one column is required')
      }
      if (tableConfig.pageSize && tableConfig.pageSize > 100) {
        warnings.push('Large page size may impact performance')
      }
    }
    
    // Performance suggestions
    if (registration.performance.memoryUsage === 'high') {
      suggestions.push('Consider enabling caching for better performance')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getState(): WidgetRegistryState {
    return {
      widgets: new Map(this.widgets),
      categories: new Map(this.categories),
      initialized: this.initialized,
      loading: false,
      error: null,
    }
  }
}

// Global registry instance
const widgetRegistry = new WidgetRegistry()

// React context for widget registry
interface WidgetRegistryContextType {
  registry: WidgetRegistry
  state: WidgetRegistryState
  search: (filter: WidgetFilter) => WidgetSearchResult[]
  validate: (type: WidgetType, config: WidgetConfig) => WidgetValidationResult
  refresh: () => void
}

const WidgetRegistryContext = createContext<WidgetRegistryContextType | undefined>(undefined)

// Widget registry provider
interface WidgetRegistryProviderProps {
  children: ReactNode
}

export const WidgetRegistryProvider: React.FC<WidgetRegistryProviderProps> = ({ children }) => {
  const [state, setState] = useState<WidgetRegistryState>(widgetRegistry.getState())
  
  useEffect(() => {
    const unsubscribe = widgetRegistry.subscribe(() => {
      setState(widgetRegistry.getState())
    })
    
    return unsubscribe
  }, [])
  
  const search = (filter: WidgetFilter): WidgetSearchResult[] => {
    return widgetRegistry.search(filter)
  }
  
  const validate = (type: WidgetType, config: WidgetConfig): WidgetValidationResult => {
    return widgetRegistry.validate(type, config)
  }
  
  const refresh = () => {
    // Force re-render
    setState(widgetRegistry.getState())
  }
  
  return (
    <WidgetRegistryContext.Provider value={{
      registry: widgetRegistry,
      state,
      search,
      validate,
      refresh,
    }}>
      {children}
    </WidgetRegistryContext.Provider>
  )
}

// Hook to use widget registry
export const useWidgetRegistry = (): WidgetRegistryContextType => {
  const context = useContext(WidgetRegistryContext)
  if (!context) {
    throw new Error('useWidgetRegistry must be used within a WidgetRegistryProvider')
  }
  return context
}

// Export the global registry for direct access
export { widgetRegistry }

// Utility functions
export const getWidgetRegistration = (type: WidgetType): WidgetRegistration | undefined => {
  return widgetRegistry.get(type)
}

export const getAllWidgetRegistrations = (): WidgetRegistration[] => {
  return widgetRegistry.getAll()
}

export const getWidgetsByCategory = (category: WidgetCategory): WidgetRegistration[] => {
  return widgetRegistry.getByCategory(category)
}

export const searchWidgets = (filter: WidgetFilter): WidgetSearchResult[] => {
  return widgetRegistry.search(filter)
}

export const validateWidgetConfig = (type: WidgetType, config: WidgetConfig): WidgetValidationResult => {
  return widgetRegistry.validate(type, config)
}

// Widget theme utilities
export const getWidgetTheme = (category: WidgetCategory, theme: string = 'light') => {
  const investment = getInvestmentTheme(theme as any, category.toLowerCase() as any)
  return {
    primary: investment.primary,
    secondary: investment.secondary,
    gradient: investment.gradient,
    glow: investment.glow,
  }
}

// Widget size utilities
export const getWidgetGridSize = (size: WidgetSize): { rows: number; columns: number } => {
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

export const isWidgetSizeValid = (size: WidgetSize, minSize: WidgetSize, maxSize: WidgetSize): boolean => {
  const sizeOrder: WidgetSize[] = ['SMALL', 'MEDIUM', 'LARGE', 'HERO']
  const currentIndex = sizeOrder.indexOf(size)
  const minIndex = sizeOrder.indexOf(minSize)
  const maxIndex = sizeOrder.indexOf(maxSize)
  
  return currentIndex >= minIndex && currentIndex <= maxIndex
}
