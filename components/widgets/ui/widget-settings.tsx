'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  X, 
  Save, 
  RotateCcw, 
  Eye, 
  Palette, 
  Sliders, 
  Layout, 
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Check,
} from 'lucide-react'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ModernButton, 
  ModernCard, 
  ModernLoading, 
  ModernTooltip 
} from './modern-ui-components'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { 
  useWidgetStore,
  useWidgetActions,
  useActiveLayout,
} from '@/components/widgets/widget-store'
import { 
  WidgetRegistration,
  WidgetInstance,
  WidgetConfigField,
  WidgetConfigSchema,
  BaseWidgetComponentProps,
} from '@/components/widgets/widget-types'
import { 
  WidgetConfig,
  ChartWidgetConfig,
  TableWidgetConfig,
  MetricsWidgetConfig,
  NewsWidgetConfig,
  AlertsWidgetConfig,
  WidgetSize,
  WidgetCategory,
} from '@/lib/types/widget.types'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'
import { cn } from '@/lib/utils/cn'

// Norwegian labels
const categoryLabels: Record<WidgetCategory, string> = {
  STOCKS: 'Aksjer',
  CRYPTO: 'Krypto',
  ART: 'Kunst',
  OTHER: 'Annet',
}

const sizeLabels: Record<WidgetSize, string> = {
  SMALL: 'Liten',
  MEDIUM: 'Medium',
  LARGE: 'Stor',
  HERO: 'Hero',
}

// Device icons
const deviceIcons = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

interface WidgetSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: WidgetInstance | null
  onSave?: (widget: WidgetInstance, config: WidgetConfig) => void
  onPreview?: (widget: WidgetInstance, config: WidgetConfig) => void
  onReset?: (widget: WidgetInstance) => void
}

interface ConfigFieldProps {
  field: WidgetConfigField
  value: any
  onChange: (value: any) => void
  error?: string
}

// Individual config field component
const ConfigField: React.FC<ConfigFieldProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue}
            className={cn(error && 'border-red-500')}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            placeholder={field.defaultValue?.toString()}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(error && 'border-red-500')}
          />
        )
      
      case 'boolean':
        return (
          <Switch
            checked={value !== undefined ? value : field.defaultValue}
            onCheckedChange={onChange}
          />
        )
      
      case 'select':
        return (
          <Select value={value || field.defaultValue} onValueChange={onChange}>
            <SelectTrigger className={cn(error && 'border-red-500')}>
              <SelectValue placeholder="Velg..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Switch
                  id={option.value}
                  checked={value?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValue = value || []
                    if (checked) {
                      onChange([...newValue, option.value])
                    } else {
                      onChange(newValue.filter((v: any) => v !== option.value))
                    }
                  }}
                />
                <Label htmlFor={option.value} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )
      
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              value={value || field.defaultValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-8 p-0 border-0 cursor-pointer"
            />
            <Input
              type="text"
              value={value || field.defaultValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className={cn('flex-1', error && 'border-red-500')}
            />
          </div>
        )
      
      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              value={value || field.defaultValue}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{field.validation?.min || 0}</span>
              <span className="font-medium">{value || field.defaultValue}</span>
              <span>{field.validation?.max || 100}</span>
            </div>
          </div>
        )
      
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue}
            className={cn(error && 'border-red-500')}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.key} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{field.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {renderField()}
      {error && (
        <div className="flex items-center space-x-1 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Mock config schema generator
const generateConfigSchema = (widget: WidgetInstance): WidgetConfigSchema => {
  const baseFields: WidgetConfigField[] = [
    {
      key: 'title',
      label: 'Tittel',
      type: 'text',
      required: false,
      defaultValue: widget.props.title,
      category: 'Grunnleggende',
      description: 'Tilpass tittelen som vises i widget-headeren',
    },
    {
      key: 'description',
      label: 'Beskrivelse',
      type: 'text',
      required: false,
      defaultValue: widget.props.description,
      category: 'Grunnleggende',
      description: 'Valgfri beskrivelse under tittelen',
    },
    {
      key: 'showHeader',
      label: 'Vis header',
      type: 'boolean',
      required: false,
      defaultValue: true,
      category: 'Utseende',
      description: 'Vis eller skjul widget-headeren',
    },
    {
      key: 'showFooter',
      label: 'Vis footer',
      type: 'boolean',
      required: false,
      defaultValue: false,
      category: 'Utseende',
      description: 'Vis eller skjul widget-footeren',
    },
  ]

  // Add widget-specific fields based on type
  if (widget.type.includes('CHART')) {
    baseFields.push(
      {
        key: 'chartType',
        label: 'Graftype',
        type: 'select',
        required: true,
        defaultValue: 'line',
        category: 'Graf',
        options: [
          { value: 'line', label: 'Linje' },
          { value: 'area', label: 'Område' },
          { value: 'bar', label: 'Søyle' },
          { value: 'candlestick', label: 'Lysestake' },
        ],
        description: 'Velg hvordan dataene skal visualiseres',
      },
      {
        key: 'showGrid',
        label: 'Vis rutenett',
        type: 'boolean',
        required: false,
        defaultValue: true,
        category: 'Graf',
        description: 'Vis rutenettlinjer i grafen',
      },
      {
        key: 'height',
        label: 'Høyde',
        type: 'range',
        required: false,
        defaultValue: 300,
        category: 'Layout',
        validation: { min: 200, max: 800 },
        description: 'Grafens høyde i piksler',
      },
      {
        key: 'showVolume',
        label: 'Vis volum',
        type: 'boolean',
        required: false,
        defaultValue: false,
        category: 'Data',
        description: 'Vis volumdata under grafen',
      },
      {
        key: 'timeframe',
        label: 'Tidsramme',
        type: 'select',
        required: false,
        defaultValue: '1M',
        category: 'Data',
        options: [
          { value: '1D', label: '1 dag' },
          { value: '1W', label: '1 uke' },
          { value: '1M', label: '1 måned' },
          { value: '3M', label: '3 måneder' },
          { value: '1Y', label: '1 år' },
        ],
        description: 'Standard tidsperiode for dataene',
      }
    )
  }

  if (widget.type.includes('TABLE')) {
    baseFields.push(
      {
        key: 'pageSize',
        label: 'Antall rader',
        type: 'number',
        required: false,
        defaultValue: 10,
        category: 'Tabell',
        validation: { min: 5, max: 100 },
        description: 'Antall rader som vises per side',
      },
      {
        key: 'showPagination',
        label: 'Vis paginering',
        type: 'boolean',
        required: false,
        defaultValue: true,
        category: 'Tabell',
        description: 'Vis paginering for store tabeller',
      },
      {
        key: 'showSearch',
        label: 'Vis søkefelt',
        type: 'boolean',
        required: false,
        defaultValue: true,
        category: 'Tabell',
        description: 'Vis søkefelt over tabellen',
      },
      {
        key: 'compactMode',
        label: 'Kompakt visning',
        type: 'boolean',
        required: false,
        defaultValue: false,
        category: 'Tabell',
        description: 'Reduser mellomrom mellom rader',
      }
    )
  }

  return {
    fields: baseFields,
    categories: ['Grunnleggende', 'Utseende', 'Layout', 'Data', 'Graf', 'Tabell'],
    advanced: false,
  }
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({
  open,
  onOpenChange,
  widget,
  onSave,
  onPreview,
  onReset,
}) => {
  const { updateWidget } = useWidgetActions()
  const activeLayoutId = useActiveLayout()
  const [config, setConfig] = useState<WidgetConfig>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Grunnleggende': true,
    'Utseende': false,
    'Layout': false,
    'Data': false,
    'Graf': false,
    'Tabell': false,
  })

  // Generate config schema
  const configSchema = useMemo(() => {
    return widget ? generateConfigSchema(widget) : null
  }, [widget])

  // Initialize config when widget changes
  useEffect(() => {
    if (widget) {
      setConfig(widget.props.config || {})
      setHasChanges(false)
      setErrors({})
    }
  }, [widget])

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    if (!configSchema) return {}
    
    const grouped: Record<string, WidgetConfigField[]> = {}
    configSchema.fields.forEach(field => {
      const category = field.category || 'Annet'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(field)
    })
    
    return grouped
  }, [configSchema])

  // Handle field change
  const handleFieldChange = useCallback((key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }, [errors])

  // Validate config
  const validateConfig = useCallback(() => {
    if (!configSchema) return true
    
    const newErrors: Record<string, string> = {}
    
    configSchema.fields.forEach(field => {
      const value = config[field.key]
      
      // Check required fields
      if (field.required && (!value || value === '')) {
        newErrors[field.key] = 'Dette feltet er påkrevd'
      }
      
      // Check validation rules
      if (field.validation && value !== undefined && value !== '') {
        const { min, max, pattern } = field.validation
        
        if (field.type === 'number') {
          const numValue = parseFloat(value)
          if (min !== undefined && numValue < min) {
            newErrors[field.key] = `Verdien må være minst ${min}`
          }
          if (max !== undefined && numValue > max) {
            newErrors[field.key] = `Verdien kan ikke være mer enn ${max}`
          }
        }
        
        if (field.type === 'text' && pattern) {
          const regex = new RegExp(pattern)
          if (!regex.test(value)) {
            newErrors[field.key] = field.validation.message || 'Ugyldig format'
          }
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [config, configSchema])

  // Handle save
  const handleSave = useCallback(() => {
    if (!widget || !activeLayoutId) return
    
    if (!validateConfig()) {
      return
    }
    
    const updatedWidget = {
      ...widget,
      props: {
        ...widget.props,
        config,
        title: config.title || widget.props.title,
        description: config.description || widget.props.description,
        showHeader: config.showHeader !== undefined ? config.showHeader : widget.props.showHeader,
        showFooter: config.showFooter !== undefined ? config.showFooter : widget.props.showFooter,
      },
      updated: new Date(),
    }
    
    updateWidget(activeLayoutId, widget.id, updatedWidget)
    onSave?.(updatedWidget, config)
    setHasChanges(false)
  }, [widget, activeLayoutId, config, validateConfig, updateWidget, onSave])

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!widget) return
    
    const previewWidget = {
      ...widget,
      props: {
        ...widget.props,
        config,
        title: config.title || widget.props.title,
        description: config.description || widget.props.description,
        showHeader: config.showHeader !== undefined ? config.showHeader : widget.props.showHeader,
        showFooter: config.showFooter !== undefined ? config.showFooter : widget.props.showFooter,
      },
    }
    
    onPreview?.(previewWidget, config)
  }, [widget, config, onPreview])

  // Handle reset
  const handleReset = useCallback(() => {
    if (!widget) return
    
    setConfig(widget.registration.defaultConfig)
    setHasChanges(true)
    setErrors({})
    onReset?.(widget)
  }, [widget, onReset])

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }, [])

  if (!widget) return null

  const theme = getInvestmentTheme('light', widget.category.toLowerCase() as any)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  widget.category === 'STOCKS' && 'bg-purple-100 text-purple-600',
                  widget.category === 'CRYPTO' && 'bg-amber-100 text-amber-600',
                  widget.category === 'ART' && 'bg-pink-100 text-pink-600',
                  widget.category === 'OTHER' && 'bg-emerald-100 text-emerald-600',
                )}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <SheetTitle>Widget-innstillinger</SheetTitle>
                  <SheetDescription>
                    {widget.registration.displayName}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {categoryLabels[widget.category]}
                </Badge>
                <Badge variant="outline">
                  {sizeLabels[widget.size]}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Widget info */}
                <ModernCard glassmorphism={true}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Widget-informasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{widget.registration.displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Kategori:</span>
                      <span className="font-medium">{categoryLabels[widget.category]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Størrelse:</span>
                      <span className="font-medium">{sizeLabels[widget.size]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Versjon:</span>
                      <span className="font-medium">v{widget.registration.version}</span>
                    </div>
                  </CardContent>
                </ModernCard>

                {/* Preview mode selector */}
                <ModernCard glassmorphism={true}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Forhåndsvisning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
                        const Icon = deviceIcons[mode]
                        return (
                          <ModernButton
                            key={mode}
                            variant={previewMode === mode ? 'primary' : 'secondary'}
                            size="sm"
                            glassmorphism={true}
                            onClick={() => setPreviewMode(mode)}
                            className="flex items-center space-x-1"
                          >
                            <Icon className="w-4 h-4" />
                            <span className="capitalize">{mode}</span>
                          </ModernButton>
                        )
                      })}
                    </div>
                  </CardContent>
                </ModernCard>

                {/* Configuration fields */}
                <ModernCard glassmorphism={true}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Konfigurasjonsalternativer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(fieldsByCategory).map(([category, fields]) => (
                      <Collapsible
                        key={category}
                        open={expandedCategories[category]}
                        onOpenChange={() => toggleCategory(category)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between h-8 px-2 text-sm font-medium"
                          >
                            {category}
                            {expandedCategories[category] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-2">
                          {fields.map((field) => (
                            <ConfigField
                              key={field.key}
                              field={field}
                              value={config[field.key]}
                              onChange={(value) => handleFieldChange(field.key, value)}
                              error={errors[field.key]}
                            />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CardContent>
                </ModernCard>

                {/* Features */}
                <ModernCard glassmorphism={true}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Funksjoner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          widget.registration.features.realTimeUpdates ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <span className={cn(
                          widget.registration.features.realTimeUpdates ? 'text-gray-900' : 'text-gray-500'
                        )}>
                          Sanntidsoppdatering
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          widget.registration.features.exportable ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <span className={cn(
                          widget.registration.features.exportable ? 'text-gray-900' : 'text-gray-500'
                        )}>
                          Eksporterbar
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          widget.registration.features.caching ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <span className={cn(
                          widget.registration.features.caching ? 'text-gray-900' : 'text-gray-500'
                        )}>
                          Caching
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          widget.registration.features.responsive ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <span className={cn(
                          widget.registration.features.responsive ? 'text-gray-900' : 'text-gray-500'
                        )}>
                          Responsiv
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </ModernCard>

                {/* Validation errors */}
                {Object.keys(errors).length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Valideringsfeil</AlertTitle>
                    <AlertDescription>
                      Vennligst rett opp feilene før du lagrer endringene.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <SheetFooter className="p-6 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <ModernButton
                  variant="secondary"
                  size="sm"
                  glassmorphism={true}
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tilbakestill
                </ModernButton>
                <ModernButton
                  variant="secondary"
                  size="sm"
                  glassmorphism={true}
                  onClick={handlePreview}
                  disabled={Object.keys(errors).length > 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Forhåndsvis
                </ModernButton>
              </div>
              <div className="flex items-center space-x-2">
                <ModernButton
                  variant="secondary"
                  size="sm"
                  glassmorphism={true}
                  onClick={() => onOpenChange(false)}
                >
                  Avbryt
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="sm"
                  glassmorphism={true}
                  onClick={handleSave}
                  disabled={!hasChanges || Object.keys(errors).length > 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lagre
                </ModernButton>
              </div>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default WidgetSettings