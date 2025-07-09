'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Eye, Save, X, RotateCcw, Palette, Layout, TrendingUp, Bell, Download } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  WidgetRegistration,
  WidgetConfigField,
  WidgetConfigSchema,
  BaseWidgetComponentProps,
} from '@/components/widgets/widget-types'
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
import { cn } from '@/lib/utils/cn'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'
import { updateWidgetPreferences } from '@/lib/actions/widgets/preferences'

interface WidgetConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: WidgetRegistration | null
  currentConfig?: WidgetConfig
  onSave?: (config: WidgetConfig) => void
  onPreview?: (config: WidgetConfig) => void
  userId: string
  portfolioId?: string
}

// Widget configuration form components
const ChartConfigForm: React.FC<{
  config: ChartWidgetConfig
  onChange: (config: ChartWidgetConfig) => void
}> = ({ config, onChange }) => {
  const updateConfig = useCallback((updates: Partial<ChartWidgetConfig>) => {
    onChange({ ...config, ...updates })
  }, [config, onChange])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="chartType">Graftype</Label>
          <Select value={config.chartType} onValueChange={(value) => updateConfig({ chartType: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Linje</SelectItem>
              <SelectItem value="candlestick">Lysestake</SelectItem>
              <SelectItem value="area">Område</SelectItem>
              <SelectItem value="bar">Stolpe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="chartTheme">Tema</Label>
          <Select value={config.chartTheme} onValueChange={(value) => updateConfig({ chartTheme: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Standard</SelectItem>
              <SelectItem value="dark">Mørk</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="colorful">Fargerik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showVolume">Vis volum</Label>
          <Switch
            id="showVolume"
            checked={config.showVolume}
            onCheckedChange={(checked) => updateConfig({ showVolume: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showGrid">Vis rutenett</Label>
          <Switch
            id="showGrid"
            checked={config.showGrid}
            onCheckedChange={(checked) => updateConfig({ showGrid: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showTechnicalIndicators">Vis tekniske indikatorer</Label>
          <Switch
            id="showTechnicalIndicators"
            checked={config.showTechnicalIndicators}
            onCheckedChange={(checked) => updateConfig({ showTechnicalIndicators: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showLegend">Vis forklaring</Label>
          <Switch
            id="showLegend"
            checked={config.showLegend}
            onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="height">Høyde: {config.height}px</Label>
        <Slider
          id="height"
          min={200}
          max={800}
          step={50}
          value={[config.height || 400]}
          onValueChange={([value]) => updateConfig({ height: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeframe">Tidsramme</Label>
        <Select value={config.timeframe} onValueChange={(value) => updateConfig({ timeframe: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1D">1 dag</SelectItem>
            <SelectItem value="1W">1 uke</SelectItem>
            <SelectItem value="1M">1 måned</SelectItem>
            <SelectItem value="3M">3 måneder</SelectItem>
            <SelectItem value="6M">6 måneder</SelectItem>
            <SelectItem value="1Y">1 år</SelectItem>
            <SelectItem value="5Y">5 år</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.showTechnicalIndicators && (
        <div className="space-y-2">
          <Label htmlFor="indicators">Tekniske indikatorer</Label>
          <div className="grid grid-cols-2 gap-2">
            {['RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume', 'Stochastic'].map((indicator) => (
              <div key={indicator} className="flex items-center space-x-2">
                <Switch
                  id={indicator}
                  checked={config.indicators?.includes(indicator)}
                  onCheckedChange={(checked) => {
                    const indicators = config.indicators || []
                    if (checked) {
                      updateConfig({ indicators: [...indicators, indicator] })
                    } else {
                      updateConfig({ indicators: indicators.filter(i => i !== indicator) })
                    }
                  }}
                />
                <Label htmlFor={indicator} className="text-sm">{indicator}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const TableConfigForm: React.FC<{
  config: TableWidgetConfig
  onChange: (config: TableWidgetConfig) => void
}> = ({ config, onChange }) => {
  const updateConfig = useCallback((updates: Partial<TableWidgetConfig>) => {
    onChange({ ...config, ...updates })
  }, [config, onChange])

  const availableColumns = [
    'symbol', 'name', 'quantity', 'price', 'change', 'value', 'cost_basis', 'pnl', 'pnl_percent', 'broker'
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Synlige kolonner</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableColumns.map((column) => (
            <div key={column} className="flex items-center space-x-2">
              <Switch
                id={column}
                checked={config.columns?.includes(column)}
                onCheckedChange={(checked) => {
                  const columns = config.columns || availableColumns
                  if (checked) {
                    updateConfig({ columns: [...columns, column] })
                  } else {
                    updateConfig({ columns: columns.filter(c => c !== column) })
                  }
                }}
              />
              <Label htmlFor={column} className="text-sm capitalize">{column.replace('_', ' ')}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sortBy">Sorter etter</Label>
          <Select value={config.sortBy} onValueChange={(value) => updateConfig({ sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableColumns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortDirection">Sorteringsretning</Label>
          <Select value={config.sortDirection} onValueChange={(value) => updateConfig({ sortDirection: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Stigende</SelectItem>
              <SelectItem value="desc">Synkende</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageSize">Rader per side: {config.pageSize}</Label>
        <Slider
          id="pageSize"
          min={5}
          max={50}
          step={5}
          value={[config.pageSize || 10]}
          onValueChange={([value]) => updateConfig({ pageSize: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showPagination">Vis sideinndeling</Label>
          <Switch
            id="showPagination"
            checked={config.showPagination}
            onCheckedChange={(checked) => updateConfig({ showPagination: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showSearch">Vis søk</Label>
          <Switch
            id="showSearch"
            checked={config.showSearch}
            onCheckedChange={(checked) => updateConfig({ showSearch: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showFilters">Vis filtre</Label>
          <Switch
            id="showFilters"
            checked={config.showFilters}
            onCheckedChange={(checked) => updateConfig({ showFilters: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="compactMode">Kompakt modus</Label>
          <Switch
            id="compactMode"
            checked={config.compactMode}
            onCheckedChange={(checked) => updateConfig({ compactMode: checked })}
          />
        </div>
      </div>
    </div>
  )
}

const MetricsConfigForm: React.FC<{
  config: MetricsWidgetConfig
  onChange: (config: MetricsWidgetConfig) => void
}> = ({ config, onChange }) => {
  const updateConfig = useCallback((updates: Partial<MetricsWidgetConfig>) => {
    onChange({ ...config, ...updates })
  }, [config, onChange])

  const availableMetrics = [
    'total_value', 'total_cost', 'total_pnl', 'total_pnl_percent', 'daily_change', 'daily_change_percent',
    'best_performer', 'worst_performer', 'dividend_yield', 'portfolio_beta'
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Synlige målinger</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableMetrics.map((metric) => (
            <div key={metric} className="flex items-center space-x-2">
              <Switch
                id={metric}
                checked={config.metrics?.includes(metric)}
                onCheckedChange={(checked) => {
                  const metrics = config.metrics || availableMetrics
                  if (checked) {
                    updateConfig({ metrics: [...metrics, metric] })
                  } else {
                    updateConfig({ metrics: metrics.filter(m => m !== metric) })
                  }
                }}
              />
              <Label htmlFor={metric} className="text-sm">{metric.replace('_', ' ')}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorScheme">Fargeskjema</Label>
        <Select value={config.colorScheme} onValueChange={(value) => updateConfig({ colorScheme: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Standard</SelectItem>
            <SelectItem value="colorful">Fargerik</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showPercentageChange">Vis prosentendring</Label>
          <Switch
            id="showPercentageChange"
            checked={config.showPercentageChange}
            onCheckedChange={(checked) => updateConfig({ showPercentageChange: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showSparklines">Vis minigrafer</Label>
          <Switch
            id="showSparklines"
            checked={config.showSparklines}
            onCheckedChange={(checked) => updateConfig({ showSparklines: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="compactView">Kompakt visning</Label>
          <Switch
            id="compactView"
            checked={config.compactView}
            onCheckedChange={(checked) => updateConfig({ compactView: checked })}
          />
        </div>
      </div>
    </div>
  )
}

const NewsConfigForm: React.FC<{
  config: NewsWidgetConfig
  onChange: (config: NewsWidgetConfig) => void
}> = ({ config, onChange }) => {
  const updateConfig = useCallback((updates: Partial<NewsWidgetConfig>) => {
    onChange({ ...config, ...updates })
  }, [config, onChange])

  const availableSources = [
    'E24', 'DN', 'Finansavisen', 'Reuters', 'Bloomberg', 'MarketWatch', 'Yahoo Finance', 'CNBC'
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Nyhetskilder</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableSources.map((source) => (
            <div key={source} className="flex items-center space-x-2">
              <Switch
                id={source}
                checked={config.sources?.includes(source)}
                onCheckedChange={(checked) => {
                  const sources = config.sources || availableSources
                  if (checked) {
                    updateConfig({ sources: [...sources, source] })
                  } else {
                    updateConfig({ sources: sources.filter(s => s !== source) })
                  }
                }}
              />
              <Label htmlFor={source} className="text-sm">{source}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxItems">Maksimalt antall artikler: {config.maxItems}</Label>
        <Slider
          id="maxItems"
          min={5}
          max={50}
          step={5}
          value={[config.maxItems || 10]}
          onValueChange={([value]) => updateConfig({ maxItems: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showImages">Vis bilder</Label>
          <Switch
            id="showImages"
            checked={config.showImages}
            onCheckedChange={(checked) => updateConfig({ showImages: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showSummary">Vis sammendrag</Label>
          <Switch
            id="showSummary"
            checked={config.showSummary}
            onCheckedChange={(checked) => updateConfig({ showSummary: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="filterBySymbol">Filtrer etter symbol</Label>
          <Switch
            id="filterBySymbol"
            checked={config.filterBySymbol}
            onCheckedChange={(checked) => updateConfig({ filterBySymbol: checked })}
          />
        </div>
      </div>
    </div>
  )
}

const AlertsConfigForm: React.FC<{
  config: AlertsWidgetConfig
  onChange: (config: AlertsWidgetConfig) => void
}> = ({ config, onChange }) => {
  const updateConfig = useCallback((updates: Partial<AlertsWidgetConfig>) => {
    onChange({ ...config, ...updates })
  }, [config, onChange])

  const availableAlertTypes = [
    'price_alert', 'volume_alert', 'news_alert', 'dividend_alert', 'earnings_alert', 'sector_alert'
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Varseltyper</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableAlertTypes.map((alertType) => (
            <div key={alertType} className="flex items-center space-x-2">
              <Switch
                id={alertType}
                checked={config.alertTypes?.includes(alertType)}
                onCheckedChange={(checked) => {
                  const alertTypes = config.alertTypes || availableAlertTypes
                  if (checked) {
                    updateConfig({ alertTypes: [...alertTypes, alertType] })
                  } else {
                    updateConfig({ alertTypes: alertTypes.filter(t => t !== alertType) })
                  }
                }}
              />
              <Label htmlFor={alertType} className="text-sm">{alertType.replace('_', ' ')}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxItems">Maksimalt antall varsler: {config.maxItems}</Label>
        <Slider
          id="maxItems"
          min={5}
          max={50}
          step={5}
          value={[config.maxItems || 10]}
          onValueChange={([value]) => updateConfig({ maxItems: value })}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showNotifications">Vis notifikasjoner</Label>
          <Switch
            id="showNotifications"
            checked={config.showNotifications}
            onCheckedChange={(checked) => updateConfig({ showNotifications: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="autoMarkAsRead">Marker som lest automatisk</Label>
          <Switch
            id="autoMarkAsRead"
            checked={config.autoMarkAsRead}
            onCheckedChange={(checked) => updateConfig({ autoMarkAsRead: checked })}
          />
        </div>
      </div>
    </div>
  )
}

export const WidgetConfigurationModal: React.FC<WidgetConfigurationModalProps> = ({
  open,
  onOpenChange,
  registration,
  currentConfig,
  onSave,
  onPreview,
  userId,
  portfolioId,
}) => {
  const [config, setConfig] = useState<WidgetConfig>(currentConfig || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const theme = useMemo(() => {
    if (!registration) return getInvestmentTheme('light', 'stocks')
    return getInvestmentTheme('light', registration.category.toLowerCase() as any)
  }, [registration])

  // Initialize config when registration changes
  useEffect(() => {
    if (registration) {
      setConfig(currentConfig || registration.defaultConfig)
      setHasChanges(false)
    }
  }, [registration, currentConfig])

  // Track changes
  useEffect(() => {
    if (registration) {
      const originalConfig = currentConfig || registration.defaultConfig
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig))
    }
  }, [config, registration, currentConfig])

  const handleConfigChange = useCallback((newConfig: WidgetConfig) => {
    setConfig(newConfig)
  }, [])

  const handleSave = useCallback(async () => {
    if (!registration) return

    setSaving(true)
    try {
      await onSave?.(config)
      setHasChanges(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save widget configuration:', error)
    } finally {
      setSaving(false)
    }
  }, [config, registration, onSave, onOpenChange])

  const handlePreview = useCallback(() => {
    if (!registration) return
    setPreviewMode(true)
    onPreview?.(config)
  }, [config, registration, onPreview])

  const handleReset = useCallback(() => {
    if (!registration) return
    setConfig(registration.defaultConfig)
  }, [registration])

  const renderConfigForm = () => {
    if (!registration) return null

    const commonProps = {
      config,
      onChange: handleConfigChange,
    }

    switch (registration.type) {
      case 'HERO_PORTFOLIO_CHART':
      case 'CATEGORY_MINI_CHART':
      case 'STOCK_PERFORMANCE_CHART':
        return <ChartConfigForm {...commonProps} config={config as ChartWidgetConfig} />
      case 'HOLDINGS_TABLE_RICH':
        return <TableConfigForm {...commonProps} config={config as TableWidgetConfig} />
      case 'METRICS_GRID':
      case 'PERFORMANCE_METRICS':
        return <MetricsConfigForm {...commonProps} config={config as MetricsWidgetConfig} />
      case 'NEWS_FEED':
        return <NewsConfigForm {...commonProps} config={config as NewsWidgetConfig} />
      case 'PRICE_ALERTS':
        return <AlertsConfigForm {...commonProps} config={config as AlertsWidgetConfig} />
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customTitle">Egendefinert tittel</Label>
              <Input
                id="customTitle"
                value={config.customTitle || ''}
                onChange={(e) => handleConfigChange({ ...config, customTitle: e.target.value })}
                placeholder="Skriv inn egendefinert tittel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customDescription">Egendefinert beskrivelse</Label>
              <Input
                id="customDescription"
                value={config.customDescription || ''}
                onChange={(e) => handleConfigChange({ ...config, customDescription: e.target.value })}
                placeholder="Skriv inn egendefinert beskrivelse"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showHeader">Vis topp</Label>
                <Switch
                  id="showHeader"
                  checked={config.showHeader !== false}
                  onCheckedChange={(checked) => handleConfigChange({ ...config, showHeader: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showFooter">Vis bunn</Label>
                <Switch
                  id="showFooter"
                  checked={config.showFooter !== false}
                  onCheckedChange={(checked) => handleConfigChange({ ...config, showFooter: checked })}
                />
              </div>
            </div>
          </div>
        )
    }
  }

  if (!registration) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  registration.category === 'STOCKS' && 'bg-purple-100 text-purple-600',
                  registration.category === 'CRYPTO' && 'bg-amber-100 text-amber-600',
                  registration.category === 'ART' && 'bg-pink-100 text-pink-600',
                  registration.category === 'OTHER' && 'bg-emerald-100 text-emerald-600',
                )}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Konfigurer {registration.displayName}
                  </DialogTitle>
                  <DialogDescription>
                    {registration.description}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Ikke lagret
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tilbakestill
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="configuration" className="h-full">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="configuration" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Konfigurasjon
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Utseende
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Avansert
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="configuration" className="p-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Widget-innstillinger</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {renderConfigForm()}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appearance" className="p-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utseende og tema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Tema</Label>
                        <Select value={config.theme} onValueChange={(value) => handleConfigChange({ ...config, theme: value as any })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Lys</SelectItem>
                            <SelectItem value="dark">Mørk</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showLoadingStates">Vis lasting</Label>
                          <Switch
                            id="showLoadingStates"
                            checked={config.showLoadingStates !== false}
                            onCheckedChange={(checked) => handleConfigChange({ ...config, showLoadingStates: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showErrorStates">Vis feilmeldinger</Label>
                          <Switch
                            id="showErrorStates"
                            checked={config.showErrorStates !== false}
                            onCheckedChange={(checked) => handleConfigChange({ ...config, showErrorStates: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="p-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Avanserte innstillinger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="refreshInterval">Oppdateringsintervall (sekunder): {config.refreshInterval}</Label>
                        <Slider
                          id="refreshInterval"
                          min={30}
                          max={3600}
                          step={30}
                          value={[config.refreshInterval || 300]}
                          onValueChange={([value]) => handleConfigChange({ ...config, refreshInterval: value })}
                          className="w-full"
                        />
                      </div>

                      <Alert>
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          Lavere oppdateringsintervall kan påvirke ytelsen og bruke mer data.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <DialogFooter className="p-6 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!hasChanges}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Forhåndsvis
                </Button>
                {previewMode && (
                  <Badge variant="outline" className="text-xs">
                    Forhåndsvisning aktiv
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={cn(
                    registration.category === 'STOCKS' && 'bg-purple-600 hover:bg-purple-700',
                    registration.category === 'CRYPTO' && 'bg-amber-600 hover:bg-amber-700',
                    registration.category === 'ART' && 'bg-pink-600 hover:bg-pink-700',
                    registration.category === 'OTHER' && 'bg-emerald-600 hover:bg-emerald-700',
                  )}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lagre
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WidgetConfigurationModal