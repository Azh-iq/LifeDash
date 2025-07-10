'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  CheckCircle,
  Info,
  Palette,
  BarChart3,
  Table,
  TrendingUp,
  Bell,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  X,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  type WidgetRegistration,
  type WidgetValidationResult,
  type ResponsiveWidgetConfig,
} from '../widget-types'
import {
  type WidgetConfig,
  type ChartWidgetConfig,
  type TableWidgetConfig,
  type MetricsWidgetConfig,
  type NewsWidgetConfig,
  type AlertsWidgetConfig,
  type WidgetSize,
  type WidgetCategory,
} from '@/lib/types/widget.types'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'

interface WidgetConfigFormsProps {
  registration: WidgetRegistration
  config: WidgetConfig
  responsiveConfig?: {
    mobile?: ResponsiveWidgetConfig
    tablet?: ResponsiveWidgetConfig
  }
  onConfigChange: (updates: Partial<WidgetConfig>) => void
  onResponsiveConfigChange?: (
    device: 'mobile' | 'tablet',
    updates: Partial<ResponsiveWidgetConfig>
  ) => void
  validation?: WidgetValidationResult | null
  formType: 'general' | 'specific' | 'appearance' | 'responsive'
  theme?: 'light' | 'dark' | 'dark-orange'
  portfolioId?: string
  stockSymbol?: string
  context?: 'dashboard' | 'portfolio' | 'stock'
}

interface ConfigFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'color'
    | 'range'
    | 'tags'
  options?: { value: any; label: string; description?: string }[]
  min?: number
  max?: number
  step?: number
  required?: boolean
  description?: string
  placeholder?: string
  validation?: WidgetValidationResult
  disabled?: boolean
  icon?: React.ReactNode
}

const ConfigField: React.FC<ConfigFieldProps> = ({
  label,
  value,
  onChange,
  type,
  options = [],
  min,
  max,
  step = 1,
  required = false,
  description,
  placeholder,
  validation,
  disabled = false,
  icon,
}) => {
  const [tags, setTags] = useState<string[]>(Array.isArray(value) ? value : [])
  const [newTag, setNewTag] = useState('')

  const hasError = validation && !validation.valid
  const hasWarning = validation && validation.warnings.length > 0

  const handleTagAdd = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      onChange(updatedTags)
      setNewTag('')
    }
  }, [newTag, tags, onChange])

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      const updatedTags = tags.filter(tag => tag !== tagToRemove)
      setTags(updatedTags)
      onChange(updatedTags)
    },
    [tags, onChange]
  )

  const renderField = () => {
    switch (type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={e => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <Label className="text-sm">
              {value ? 'Aktivert' : 'Deaktivert'}
            </Label>
          </div>
        )

      case 'select':
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn(hasError && 'border-red-500')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        return (
          <div className="space-y-3">
            {options.map(option => (
              <div key={option.value} className="flex items-start space-x-3">
                <Switch
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={checked => {
                    const currentArray = Array.isArray(value) ? value : []
                    if (checked) {
                      onChange([...currentArray, option.value])
                    } else {
                      onChange(currentArray.filter(v => v !== option.value))
                    }
                  }}
                  disabled={disabled}
                />
                <div className="flex-1">
                  <Label className="text-sm font-medium">{option.label}</Label>
                  {option.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case 'color':
        return (
          <div className="flex items-center space-x-3">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={e => onChange(e.target.value)}
              disabled={disabled}
              className="h-10 w-16 p-1"
            />
            <Input
              type="text"
              value={value || '#000000'}
              onChange={e => onChange(e.target.value)}
              placeholder="Hex-farge"
              disabled={disabled}
              className="flex-1"
            />
          </div>
        )

      case 'range':
        return (
          <div className="space-y-3">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value || 0}
              onChange={e => onChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{min}</span>
              <span className="font-medium">{value}</span>
              <span>{max}</span>
            </div>
          </div>
        )

      case 'tags':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Legg til tag..."
                onKeyPress={e => e.key === 'Enter' && handleTagAdd()}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleTagAdd}
                disabled={!newTag.trim() || disabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleTagRemove(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      <Label
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          hasError && 'text-red-500',
          hasWarning && 'text-yellow-500'
        )}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
        {hasError && <AlertCircle className="h-4 w-4" />}
        {hasWarning && <AlertCircle className="h-4 w-4" />}
      </Label>

      {renderField()}

      {description && (
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          {description}
        </p>
      )}

      {validation && (
        <div className="space-y-1">
          {validation.errors.map((error, i) => (
            <p key={i} className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          ))}
          {validation.warnings.map((warning, i) => (
            <p
              key={i}
              className="flex items-center gap-1 text-xs text-yellow-500"
            >
              <AlertCircle className="h-3 w-3" />
              {warning}
            </p>
          ))}
          {validation.suggestions.map((suggestion, i) => (
            <p
              key={i}
              className="flex items-center gap-1 text-xs text-blue-500"
            >
              <CheckCircle className="h-3 w-3" />
              {suggestion}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export const WidgetConfigForms: React.FC<WidgetConfigFormsProps> = ({
  registration,
  config,
  responsiveConfig,
  onConfigChange,
  onResponsiveConfigChange,
  validation,
  formType,
  theme = 'light',
  portfolioId,
  stockSymbol,
  context = 'dashboard',
}) => {
  const categoryTheme = useMemo(() => {
    return getInvestmentTheme(theme, registration.category.toLowerCase() as any)
  }, [registration.category, theme])

  const renderGeneralForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Grunnleggende innstillinger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Egendefinert tittel"
            value={config.customTitle}
            onChange={value => onConfigChange({ customTitle: value })}
            type="text"
            placeholder={registration.displayName}
            description="Overstyr standard widget-tittel"
          />

          <ConfigField
            label="Egendefinert beskrivelse"
            value={config.customDescription}
            onChange={value => onConfigChange({ customDescription: value })}
            type="text"
            placeholder={registration.description}
            description="Valgfri beskrivelse som vises i widget"
          />

          <Separator />

          <ConfigField
            label="Vis header"
            value={config.showHeader}
            onChange={value => onConfigChange({ showHeader: value })}
            type="boolean"
            description="Vis widget-header med tittel og kontroller"
          />

          <ConfigField
            label="Vis footer"
            value={config.showFooter}
            onChange={value => onConfigChange({ showFooter: value })}
            type="boolean"
            description="Vis widget-footer med tilleggsinfo"
          />

          <ConfigField
            label="Vis lastingstilstander"
            value={config.showLoadingStates}
            onChange={value => onConfigChange({ showLoadingStates: value })}
            type="boolean"
            description="Vis animasjoner under lasting av data"
          />

          <ConfigField
            label="Vis feiltilstander"
            value={config.showErrorStates}
            onChange={value => onConfigChange({ showErrorStates: value })}
            type="boolean"
            description="Vis feilmeldinger når data ikke kan lastes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Oppdateringsinnstillinger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Oppdateringsfrekvens"
            value={config.refreshInterval}
            onChange={value => onConfigChange({ refreshInterval: value })}
            type="select"
            options={[
              {
                value: 0,
                label: 'Manuell',
                description: 'Kun oppdater manuelt',
              },
              { value: 30, label: '30 sekunder', description: 'Høy frekvens' },
              { value: 60, label: '1 minutt', description: 'Moderat frekvens' },
              { value: 300, label: '5 minutter', description: 'Lav frekvens' },
              {
                value: 900,
                label: '15 minutter',
                description: 'Svært lav frekvens',
              },
            ]}
            description="Hvor ofte widget skal oppdatere data automatisk"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderChartForm = (chartConfig: ChartWidgetConfig) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Grafkonfigurasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Graftype"
            value={chartConfig.chartType}
            onChange={value => onConfigChange({ chartType: value })}
            type="select"
            options={[
              {
                value: 'line',
                label: 'Linje',
                description: 'Kontinuerlig linje',
              },
              {
                value: 'area',
                label: 'Område',
                description: 'Fylt område under linje',
              },
              {
                value: 'bar',
                label: 'Stolpe',
                description: 'Vertikale stolper',
              },
              {
                value: 'candlestick',
                label: 'Lysestake',
                description: 'OHLC-data',
              },
            ]}
            required
            validation={validation}
            icon={<BarChart3 className="h-4 w-4" />}
          />

          <ConfigField
            label="Fargetema"
            value={chartConfig.chartTheme}
            onChange={value => onConfigChange({ chartTheme: value })}
            type="select"
            options={[
              { value: 'default', label: 'Standard' },
              { value: 'dark', label: 'Mørk' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'colorful', label: 'Fargerik' },
            ]}
            icon={<Palette className="h-4 w-4" />}
          />

          <ConfigField
            label="Vis volum"
            value={chartConfig.showVolume}
            onChange={value => onConfigChange({ showVolume: value })}
            type="boolean"
            description="Vis handelsvolum under hovedgrafen"
          />

          <ConfigField
            label="Vis rutenett"
            value={chartConfig.showGrid}
            onChange={value => onConfigChange({ showGrid: value })}
            type="boolean"
            description="Vis hjelpeguider i bakgrunnen"
          />

          <ConfigField
            label="Vis tegnforklaring"
            value={chartConfig.showLegend}
            onChange={value => onConfigChange({ showLegend: value })}
            type="boolean"
            description="Vis tegnforklaring for grafens elementer"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dimensjoner og tidsramme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Tidsramme"
            value={chartConfig.timeframe}
            onChange={value => onConfigChange({ timeframe: value })}
            type="select"
            options={[
              { value: '1D', label: '1 dag' },
              { value: '1W', label: '1 uke' },
              { value: '1M', label: '1 måned' },
              { value: '3M', label: '3 måneder' },
              { value: '6M', label: '6 måneder' },
              { value: '1Y', label: '1 år' },
              { value: '2Y', label: '2 år' },
              { value: '5Y', label: '5 år' },
            ]}
            description="Standard tidsperiode for grafen"
          />

          <ConfigField
            label="Høyde"
            value={chartConfig.height}
            onChange={value => onConfigChange({ height: value })}
            type="range"
            min={200}
            max={800}
            step={50}
            description="Grafens høyde i piksler"
          />
        </CardContent>
      </Card>

      {chartConfig.showTechnicalIndicators !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tekniske indikatorer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfigField
              label="Aktiver tekniske indikatorer"
              value={chartConfig.showTechnicalIndicators}
              onChange={value =>
                onConfigChange({ showTechnicalIndicators: value })
              }
              type="boolean"
              description="Vis teknisk analyse på grafen"
            />

            {chartConfig.showTechnicalIndicators && (
              <ConfigField
                label="Velg indikatorer"
                value={chartConfig.indicators}
                onChange={value => onConfigChange({ indicators: value })}
                type="multiselect"
                options={[
                  {
                    value: 'SMA',
                    label: 'Simple Moving Average',
                    description: 'Enkel glidende gjennomsnitt',
                  },
                  {
                    value: 'EMA',
                    label: 'Exponential Moving Average',
                    description: 'Eksponentiell glidende gjennomsnitt',
                  },
                  {
                    value: 'RSI',
                    label: 'Relative Strength Index',
                    description: 'Relativ styrkeindeks',
                  },
                  {
                    value: 'MACD',
                    label: 'MACD',
                    description: 'Moving Average Convergence Divergence',
                  },
                  {
                    value: 'BB',
                    label: 'Bollinger Bands',
                    description: 'Bollinger-bånd',
                  },
                  {
                    value: 'STOCH',
                    label: 'Stochastic Oscillator',
                    description: 'Stokastisk oscillator',
                  },
                ]}
                description="Velg hvilke tekniske indikatorer som skal vises"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderTableForm = (tableConfig: TableWidgetConfig) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tabellkonfigurasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Kolonner"
            value={tableConfig.columns}
            onChange={value => onConfigChange({ columns: value })}
            type="multiselect"
            options={[
              { value: 'symbol', label: 'Symbol', description: 'Aksjekode' },
              { value: 'name', label: 'Navn', description: 'Selskapsnavn' },
              {
                value: 'quantity',
                label: 'Antall',
                description: 'Antall aksjer',
              },
              {
                value: 'current_price',
                label: 'Aktuell pris',
                description: 'Siste markedspris',
              },
              {
                value: 'market_value',
                label: 'Markedsverdi',
                description: 'Total posisjon',
              },
              {
                value: 'cost_basis',
                label: 'Kostbasis',
                description: 'Innkjøpspris',
              },
              {
                value: 'pnl',
                label: 'Gevinst/Tap',
                description: 'Absolutt gevinst eller tap',
              },
              {
                value: 'pnl_percent',
                label: 'Gevinst/Tap %',
                description: 'Prosent gevinst eller tap',
              },
              {
                value: 'day_change',
                label: 'Daglig endring',
                description: 'Endring i dag',
              },
              { value: 'broker', label: 'Megler', description: 'Meglerkonto' },
            ]}
            required
            validation={validation}
            description="Velg hvilke kolonner som skal vises i tabellen"
          />

          <Separator />

          <ConfigField
            label="Sorter etter"
            value={tableConfig.sortBy}
            onChange={value => onConfigChange({ sortBy: value })}
            type="select"
            options={[
              { value: 'symbol', label: 'Symbol' },
              { value: 'name', label: 'Navn' },
              { value: 'market_value', label: 'Markedsverdi' },
              { value: 'pnl', label: 'Gevinst/Tap' },
              { value: 'pnl_percent', label: 'Gevinst/Tap %' },
              { value: 'day_change', label: 'Daglig endring' },
            ]}
            description="Standard sorteringskolonne"
          />

          <ConfigField
            label="Sorteringsretning"
            value={tableConfig.sortDirection}
            onChange={value => onConfigChange({ sortDirection: value })}
            type="select"
            options={[
              { value: 'asc', label: 'Stigende' },
              { value: 'desc', label: 'Synkende' },
            ]}
            description="Standard sorteringsretning"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Navigasjon og visning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Elementer per side"
            value={tableConfig.pageSize}
            onChange={value => onConfigChange({ pageSize: value })}
            type="number"
            min={5}
            max={100}
            step={5}
            description="Antall rader som vises per side"
          />

          <ConfigField
            label="Vis paginering"
            value={tableConfig.showPagination}
            onChange={value => onConfigChange({ showPagination: value })}
            type="boolean"
            description="Vis sidenummer og navigasjon"
          />

          <ConfigField
            label="Vis søkefunksjon"
            value={tableConfig.showSearch}
            onChange={value => onConfigChange({ showSearch: value })}
            type="boolean"
            description="Vis søkefelt for tabellen"
          />

          <ConfigField
            label="Vis filtre"
            value={tableConfig.showFilters}
            onChange={value => onConfigChange({ showFilters: value })}
            type="boolean"
            description="Vis avanserte filtreringsalternativer"
          />

          <ConfigField
            label="Kompakt modus"
            value={tableConfig.compactMode}
            onChange={value => onConfigChange({ compactMode: value })}
            type="boolean"
            description="Mindre radavstand for mer kompakt visning"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderMetricsForm = (metricsConfig: MetricsWidgetConfig) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Nøkkeltalskonfigurasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Valgte målinger"
            value={metricsConfig.metrics}
            onChange={value => onConfigChange({ metrics: value })}
            type="multiselect"
            options={[
              {
                value: 'total_value',
                label: 'Total verdi',
                description: 'Samlet porteføljeverdi',
              },
              {
                value: 'total_return',
                label: 'Total avkastning',
                description: 'Samlet gevinst/tap',
              },
              {
                value: 'day_change',
                label: 'Daglig endring',
                description: 'Endring i dag',
              },
              {
                value: 'unrealized_pnl',
                label: 'Urealisert gevinst/tap',
                description: 'Papirgevinst/-tap',
              },
              {
                value: 'realized_pnl',
                label: 'Realisert gevinst/tap',
                description: 'Solgt gevinst/tap',
              },
              {
                value: 'cash_balance',
                label: 'Kontantsaldo',
                description: 'Tilgjengelig kontanter',
              },
              {
                value: 'allocation',
                label: 'Allokering',
                description: 'Aktivafordeling',
              },
            ]}
            required
            validation={validation}
            description="Velg hvilke nøkkeltall som skal vises"
          />

          <Separator />

          <ConfigField
            label="Vis prosentendring"
            value={metricsConfig.showPercentageChange}
            onChange={value => onConfigChange({ showPercentageChange: value })}
            type="boolean"
            description="Vis prosentvis endring i tillegg til absoluttverdi"
          />

          <ConfigField
            label="Vis sparklines"
            value={metricsConfig.showSparklines}
            onChange={value => onConfigChange({ showSparklines: value })}
            type="boolean"
            description="Vis små trendgrafer for hver måling"
          />

          <ConfigField
            label="Kompakt visning"
            value={metricsConfig.compactView}
            onChange={value => onConfigChange({ compactView: value })}
            type="boolean"
            description="Mer kompakt layout med mindre avstand"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Farger og tema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Fargeskjema"
            value={metricsConfig.colorScheme}
            onChange={value => onConfigChange({ colorScheme: value })}
            type="select"
            options={[
              {
                value: 'default',
                label: 'Standard',
                description: 'Standard fargepalett',
              },
              {
                value: 'colorful',
                label: 'Fargerik',
                description: 'Mer fargerik palett',
              },
              {
                value: 'minimal',
                label: 'Minimal',
                description: 'Dempet fargepalett',
              },
            ]}
            description="Velg fargepalett for målinger"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderNewsForm = (newsConfig: NewsWidgetConfig) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Nyhetsinnstillinger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Antall artikler"
            value={newsConfig.maxItems}
            onChange={value => onConfigChange({ maxItems: value })}
            type="number"
            min={1}
            max={50}
            description="Maksimalt antall nyhetsartikler som vises"
          />

          <ConfigField
            label="Vis bilder"
            value={newsConfig.showImages}
            onChange={value => onConfigChange({ showImages: value })}
            type="boolean"
            description="Vis miniatyrbilder for nyhetsartikler"
          />

          <ConfigField
            label="Vis sammendrag"
            value={newsConfig.showSummary}
            onChange={value => onConfigChange({ showSummary: value })}
            type="boolean"
            description="Vis kort sammendrag av hver artikkel"
          />

          <ConfigField
            label="Filtrer etter symbol"
            value={newsConfig.filterBySymbol}
            onChange={value => onConfigChange({ filterBySymbol: value })}
            type="boolean"
            description="Vis kun nyheter relatert til valgte aksjer"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Nyhetskilder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Aktive kilder"
            value={newsConfig.sources}
            onChange={value => onConfigChange({ sources: value })}
            type="multiselect"
            options={[
              {
                value: 'finnhub',
                label: 'Finnhub',
                description: 'Finansnyheter og markedsdata',
              },
              {
                value: 'yahoo',
                label: 'Yahoo Finance',
                description: 'Globale finansnyheter',
              },
              {
                value: 'bloomberg',
                label: 'Bloomberg',
                description: 'Profesjonelle markedsnyheter',
              },
              {
                value: 'reuters',
                label: 'Reuters',
                description: 'Internasjonale finansnyheter',
              },
              {
                value: 'dn',
                label: 'Dagens Næringsliv',
                description: 'Norske finansnyheter',
              },
              {
                value: 'e24',
                label: 'E24',
                description: 'Norsk økonomi og finans',
              },
            ]}
            description="Velg hvilke nyhetskilder som skal brukes"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderAlertsForm = (alertsConfig: AlertsWidgetConfig) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Varselinnstillinger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Varseltyper"
            value={alertsConfig.alertTypes}
            onChange={value => onConfigChange({ alertTypes: value })}
            type="multiselect"
            options={[
              {
                value: 'price_alerts',
                label: 'Prisvarsler',
                description: 'Varsler når priser når målnivåer',
              },
              {
                value: 'volume_alerts',
                label: 'Volumvarsler',
                description: 'Varsler ved uvanlig handelsvolum',
              },
              {
                value: 'news_alerts',
                label: 'Nyhetsvarsler',
                description: 'Varsler ved viktige nyheter',
              },
              {
                value: 'portfolio_alerts',
                label: 'Porteføljevarsler',
                description: 'Varsler om porteføljeendringer',
              },
              {
                value: 'market_alerts',
                label: 'Markedsvarsler',
                description: 'Varsler om markedshendelser',
              },
            ]}
            description="Velg hvilke typer varsler som skal vises"
          />

          <ConfigField
            label="Maksimalt antall varsler"
            value={alertsConfig.maxItems}
            onChange={value => onConfigChange({ maxItems: value })}
            type="number"
            min={1}
            max={100}
            description="Maksimalt antall varsler som vises samtidig"
          />

          <ConfigField
            label="Vis notifikasjoner"
            value={alertsConfig.showNotifications}
            onChange={value => onConfigChange({ showNotifications: value })}
            type="boolean"
            description="Vis desktop-notifikasjoner for nye varsler"
          />

          <ConfigField
            label="Automatisk markering som lest"
            value={alertsConfig.autoMarkAsRead}
            onChange={value => onConfigChange({ autoMarkAsRead: value })}
            type="boolean"
            description="Marker varsler som lest automatisk etter visning"
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderAppearanceForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Utseende og farger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            label="Tema"
            value={config.theme}
            onChange={value => onConfigChange({ theme: value })}
            type="select"
            options={[
              { value: 'light', label: 'Lys', description: 'Lyst tema' },
              { value: 'dark', label: 'Mørk', description: 'Mørkt tema' },
              {
                value: 'system',
                label: 'System',
                description: 'Følg systeminnstillinger',
              },
            ]}
            description="Velg fargetema for widget"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Primærfarge</Label>
              <div
                className="flex h-12 w-full items-center justify-center rounded border font-medium text-white"
                style={{ backgroundColor: categoryTheme?.primary }}
              >
                {categoryTheme?.primary}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sekundærfarge</Label>
              <div
                className="flex h-12 w-full items-center justify-center rounded border font-medium text-white"
                style={{ backgroundColor: categoryTheme?.secondary }}
              >
                {categoryTheme?.secondary}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Kommende funksjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Palette className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="mb-2 text-lg font-medium">
              Mer tilpasning kommer snart
            </p>
            <p className="text-sm">
              Avanserte utseende-innstillinger som skrifttyper, animasjoner og
              egendefinerte farger vil være tilgjengelige i fremtidige
              versjoner.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderResponsiveForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Responsiv konfigurasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Konfigurer hvordan widgeten oppfører seg på forskjellige enheter.
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                <h4 className="font-medium">Tablet (768px - 1024px)</h4>
              </div>

              <ConfigField
                label="Skjul på tablet"
                value={responsiveConfig?.tablet?.hidden}
                onChange={value =>
                  onResponsiveConfigChange?.('tablet', { hidden: value })
                }
                type="boolean"
                description="Skjul widget på tablet-enheter"
              />

              <ConfigField
                label="Tablet-størrelse"
                value={responsiveConfig?.tablet?.size}
                onChange={value =>
                  onResponsiveConfigChange?.('tablet', { size: value })
                }
                type="select"
                options={[
                  { value: 'SMALL', label: 'Liten' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'LARGE', label: 'Stor' },
                ]}
                description="Widgetstørrelse på tablet"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <h4 className="font-medium">Mobil (&lt; 768px)</h4>
              </div>

              <ConfigField
                label="Skjul på mobil"
                value={responsiveConfig?.mobile?.hidden}
                onChange={value =>
                  onResponsiveConfigChange?.('mobile', { hidden: value })
                }
                type="boolean"
                description="Skjul widget på mobile enheter"
              />

              <ConfigField
                label="Mobil-størrelse"
                value={responsiveConfig?.mobile?.size}
                onChange={value =>
                  onResponsiveConfigChange?.('mobile', { size: value })
                }
                type="select"
                options={[
                  { value: 'SMALL', label: 'Liten' },
                  { value: 'MEDIUM', label: 'Medium' },
                ]}
                description="Widgetstørrelse på mobil"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Responsiv forhåndsvisning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <div className="mb-4 flex items-center justify-center gap-4">
              <Monitor className="h-8 w-8 opacity-50" />
              <Tablet className="h-8 w-8 opacity-50" />
              <Smartphone className="h-8 w-8 opacity-50" />
            </div>
            <p className="mb-2 text-lg font-medium">
              Responsiv forhåndsvisning
            </p>
            <p className="text-sm">
              Bruk "Forhåndsvis"-fanen for å se hvordan widgeten ser ut på
              forskjellige enheter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSpecificForm = () => {
    if (registration.type.includes('CHART')) {
      return renderChartForm(config as ChartWidgetConfig)
    }
    if (registration.type.includes('TABLE')) {
      return renderTableForm(config as TableWidgetConfig)
    }
    if (registration.type.includes('METRICS')) {
      return renderMetricsForm(config as MetricsWidgetConfig)
    }
    if (
      registration.type.includes('NEWS') ||
      registration.type.includes('ACTIVITY')
    ) {
      return renderNewsForm(config as NewsWidgetConfig)
    }
    if (
      registration.type.includes('ALERTS') ||
      registration.type.includes('PRICE_ALERTS')
    ) {
      return renderAlertsForm(config as AlertsWidgetConfig)
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ingen spesifikke innstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="mb-2 text-lg font-medium">
              Ingen tilgjengelige innstillinger
            </p>
            <p className="text-sm">
              Denne widget-typen har ingen spesifikke konfigurasjonsalternativer
              utover de grunnleggende innstillingene.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  switch (formType) {
    case 'general':
      return renderGeneralForm()
    case 'specific':
      return renderSpecificForm()
    case 'appearance':
      return renderAppearanceForm()
    case 'responsive':
      return renderResponsiveForm()
    default:
      return null
  }
}

export default WidgetConfigForms
