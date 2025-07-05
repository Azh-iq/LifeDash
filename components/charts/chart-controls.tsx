'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TimeRangeSelector } from './time-range-selector'

// Types
export interface ChartConfig {
  showGrid: boolean
  showLegend: boolean
  showArea: boolean
  showDataLabels: boolean
  showVolume: boolean
  showComparison: boolean
  chartType: 'line' | 'area' | 'bar' | 'candlestick'
  timeRange: string
  currency: string
  theme: 'light' | 'dark' | 'auto'
}

interface ChartControlsProps {
  config: ChartConfig
  onConfigChange: (config: Partial<ChartConfig>) => void
  className?: string
  compact?: boolean
  showTimeRange?: boolean
  showChartType?: boolean
  showToggleOptions?: boolean
  showExportOptions?: boolean
  disabled?: boolean
}

// Chart type options
const CHART_TYPES = [
  { value: 'line', label: 'Linje', icon: '📈' },
  { value: 'area', label: 'Område', icon: '📊' },
  { value: 'bar', label: 'Stolpe', icon: '📋' },
  { value: 'candlestick', label: 'Lysestake', icon: '🕯️' },
] as const

// Currency options
const CURRENCIES = [
  { value: 'NOK', label: 'NOK', symbol: 'kr' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GBP', label: 'GBP', symbol: '£' },
] as const

// Export options
const EXPORT_OPTIONS = [
  { value: 'png', label: 'PNG', description: 'Bilde' },
  { value: 'svg', label: 'SVG', description: 'Vektor' },
  { value: 'pdf', label: 'PDF', description: 'Dokument' },
  { value: 'csv', label: 'CSV', description: 'Data' },
] as const

export const ChartControls = ({
  config,
  onConfigChange,
  className,
  compact = false,
  showTimeRange = true,
  showChartType = true,
  showToggleOptions = true,
  showExportOptions = true,
  disabled = false,
}: ChartControlsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleConfigChange = (updates: Partial<ChartConfig>) => {
    onConfigChange(updates)
  }

  const handleExport = (format: string) => {
    // Export functionality would be implemented here
    console.log('Exporting chart as:', format)
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {showTimeRange && (
          <TimeRangeSelector
            selectedRange={config.timeRange}
            onRangeChange={(timeRange) => handleConfigChange({ timeRange })}
            size="sm"
            variant="tabs"
            disabled={disabled}
          />
        )}
        
        {showChartType && (
          <div className="flex items-center gap-1">
            {CHART_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={config.chartType === type.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleConfigChange({ chartType: type.value })}
                disabled={disabled}
                className="h-8 px-3 text-xs"
                title={type.label}
              >
                {type.icon}
              </Button>
            ))}
          </div>
        )}
        
        {showExportOptions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
            disabled={disabled}
            className="h-8 px-3 text-xs"
          >
            📥 Eksporter
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Time Range */}
          {showTimeRange && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tidsperiode
              </span>
              <TimeRangeSelector
                selectedRange={config.timeRange}
                onRangeChange={(timeRange) => handleConfigChange({ timeRange })}
                size="sm"
                disabled={disabled}
              />
            </div>
          )}

          {/* Chart Type */}
          {showChartType && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Diagramtype
              </span>
              <div className="flex items-center gap-1">
                {CHART_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={config.chartType === type.value ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleConfigChange({ chartType: type.value })}
                    disabled={disabled}
                    className="h-8 px-3 text-xs"
                    title={type.label}
                  >
                    {type.icon} {type.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Options */}
          {showToggleOptions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Vis rutenett
                </span>
                <Switch
                  checked={config.showGrid}
                  onCheckedChange={(showGrid) => handleConfigChange({ showGrid })}
                  disabled={disabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Vis legende
                </span>
                <Switch
                  checked={config.showLegend}
                  onCheckedChange={(showLegend) => handleConfigChange({ showLegend })}
                  disabled={disabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Vis område
                </span>
                <Switch
                  checked={config.showArea}
                  onCheckedChange={(showArea) => handleConfigChange({ showArea })}
                  disabled={disabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Vis dataledetekster
                </span>
                <Switch
                  checked={config.showDataLabels}
                  onCheckedChange={(showDataLabels) => handleConfigChange({ showDataLabels })}
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between h-8"
            >
              <span className="text-sm font-medium">Avanserte innstillinger</span>
              <svg 
                className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            
            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Vis volum
                  </span>
                  <Switch
                    checked={config.showVolume}
                    onCheckedChange={(showVolume) => handleConfigChange({ showVolume })}
                    disabled={disabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Vis sammenligning
                  </span>
                  <Switch
                    checked={config.showComparison}
                    onCheckedChange={(showComparison) => handleConfigChange({ showComparison })}
                    disabled={disabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Valuta
                  </span>
                  <div className="flex items-center gap-1">
                    {CURRENCIES.map((currency) => (
                      <Button
                        key={currency.value}
                        variant={config.currency === currency.value ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handleConfigChange({ currency: currency.value })}
                        disabled={disabled}
                        className="h-8 px-3 text-xs"
                      >
                        {currency.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options */}
          {showExportOptions && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Eksporter diagram
                </span>
              </div>
              <div className="flex items-center gap-2">
                {EXPORT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(option.value)}
                    disabled={disabled}
                    className="h-8 px-3 text-xs"
                    title={option.description}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick actions component for toolbar
export const ChartQuickActions = ({
  config,
  onConfigChange,
  className,
  disabled = false,
}: Pick<ChartControlsProps, 'config' | 'onConfigChange' | 'className' | 'disabled'>) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={config.showGrid ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onConfigChange({ showGrid: !config.showGrid })}
        disabled={disabled}
        className="h-8 px-3 text-xs"
        title="Vis/skjul rutenett"
      >
        🏗️
      </Button>
      
      <Button
        variant={config.showLegend ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onConfigChange({ showLegend: !config.showLegend })}
        disabled={disabled}
        className="h-8 px-3 text-xs"
        title="Vis/skjul legende"
      >
        📋
      </Button>
      
      <Button
        variant={config.showArea ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onConfigChange({ showArea: !config.showArea })}
        disabled={disabled}
        className="h-8 px-3 text-xs"
        title="Vis/skjul områdefyll"
      >
        📊
      </Button>
      
      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {/* Reset to defaults */}}
        disabled={disabled}
        className="h-8 px-3 text-xs"
        title="Tilbakestill til standard"
      >
        🔄
      </Button>
    </div>
  )
}

// Hook for managing chart configuration
export const useChartConfig = (initialConfig?: Partial<ChartConfig>) => {
  const [config, setConfig] = useState<ChartConfig>({
    showGrid: true,
    showLegend: true,
    showArea: true,
    showDataLabels: false,
    showVolume: false,
    showComparison: false,
    chartType: 'area',
    timeRange: '1M',
    currency: 'NOK',
    theme: 'auto',
    ...initialConfig,
  })

  const updateConfig = (updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const resetConfig = () => {
    setConfig({
      showGrid: true,
      showLegend: true,
      showArea: true,
      showDataLabels: false,
      showVolume: false,
      showComparison: false,
      chartType: 'area',
      timeRange: '1M',
      currency: 'NOK',
      theme: 'auto',
    })
  }

  return {
    config,
    updateConfig,
    resetConfig,
  }
}

export default ChartControls