'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Settings,
  Eye,
  Save,
  RotateCcw,
  Palette,
  Sliders,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  CheckCircle,
  Layout,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type WidgetRegistration,
  type WidgetConfig,
  type WidgetValidationResult,
  type WidgetType,
  type WidgetSize,
  type ResponsiveWidgetConfig,
  useWidgetRegistry,
} from '../widget-registry'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'
import { WidgetConfigForms } from './widget-config-forms'

interface WidgetConfigModalProps {
  open: boolean
  onClose: () => void
  onSave: (
    config: WidgetConfig,
    responsiveConfig?: {
      mobile?: ResponsiveWidgetConfig
      tablet?: ResponsiveWidgetConfig
    }
  ) => void
  registration: WidgetRegistration | null
  initialConfig?: WidgetConfig
  initialResponsiveConfig?: {
    mobile?: ResponsiveWidgetConfig
    tablet?: ResponsiveWidgetConfig
  }
  widgetId?: string
  theme?: 'light' | 'dark' | 'dark-orange'
  portfolioId?: string
  stockSymbol?: string
  context?: 'dashboard' | 'portfolio' | 'stock'
}

interface ConfigPreview {
  title: string
  description: string
  features: string[]
  config: WidgetConfig
}

interface ValidationSummary {
  valid: boolean
  errorCount: number
  warningCount: number
  suggestionCount: number
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  open,
  onClose,
  onSave,
  registration,
  initialConfig,
  initialResponsiveConfig,
  widgetId,
  theme = 'light',
  portfolioId,
  stockSymbol,
  context = 'dashboard',
}) => {
  const { validate } = useWidgetRegistry()

  // State management
  const [config, setConfig] = useState<WidgetConfig>(initialConfig || {})
  const [responsiveConfig, setResponsiveConfig] = useState<{
    mobile?: ResponsiveWidgetConfig
    tablet?: ResponsiveWidgetConfig
  }>(initialResponsiveConfig || {})
  const [activeTab, setActiveTab] = useState('general')
  const [validation, setValidation] = useState<WidgetValidationResult | null>(
    null
  )
  const [previewMode, setPreviewMode] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop')
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Theme and styling
  const categoryTheme = useMemo(() => {
    if (!registration) return null
    return getInvestmentTheme(theme, registration.category.toLowerCase() as any)
  }, [registration, theme])

  // Initialize config when modal opens
  useEffect(() => {
    if (open && registration) {
      const baseConfig = initialConfig || registration.defaultConfig
      const baseResponsiveConfig = initialResponsiveConfig || {}

      setConfig(baseConfig)
      setResponsiveConfig(baseResponsiveConfig)
      setActiveTab('general')
      setHasChanges(false)
    }
  }, [open, registration, initialConfig, initialResponsiveConfig])

  // Validate config changes
  useEffect(() => {
    if (registration) {
      const result = validate(registration.type, config)
      setValidation(result)
    }
  }, [config, registration, validate])

  // Track changes
  useEffect(() => {
    if (registration) {
      const baseConfig = initialConfig || registration.defaultConfig
      const baseResponsiveConfig = initialResponsiveConfig || {}

      const configChanged =
        JSON.stringify(config) !== JSON.stringify(baseConfig)
      const responsiveChanged =
        JSON.stringify(responsiveConfig) !==
        JSON.stringify(baseResponsiveConfig)

      setHasChanges(configChanged || responsiveChanged)
    }
  }, [
    config,
    responsiveConfig,
    initialConfig,
    initialResponsiveConfig,
    registration,
  ])

  const handleConfigChange = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const handleResponsiveConfigChange = useCallback(
    (device: 'mobile' | 'tablet', updates: Partial<ResponsiveWidgetConfig>) => {
      setResponsiveConfig(prev => ({
        ...prev,
        [device]: { ...prev[device], ...updates },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!validation?.valid) return

    setSaving(true)
    try {
      await onSave(config, responsiveConfig)
      onClose()
    } catch (error) {
      console.error('Failed to save widget configuration:', error)
    } finally {
      setSaving(false)
    }
  }, [config, responsiveConfig, validation, onSave, onClose])

  const handleReset = useCallback(() => {
    if (registration) {
      setConfig(registration.defaultConfig)
      setResponsiveConfig({})
      setHasChanges(false)
    }
  }, [registration])

  const validationSummary = useMemo((): ValidationSummary => {
    if (!validation)
      return {
        valid: false,
        errorCount: 0,
        warningCount: 0,
        suggestionCount: 0,
      }

    return {
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      suggestionCount: validation.suggestions.length,
    }
  }, [validation])

  const configPreview = useMemo((): ConfigPreview => {
    if (!registration)
      return { title: '', description: '', features: [], config: {} }

    const features = []
    if (registration.features.realTimeUpdates)
      features.push('Sanntidsoppdateringer')
    if (registration.features.exportable) features.push('Eksporterbar')
    if (registration.features.configurable) features.push('Konfigurerbar')
    if (registration.features.caching) features.push('Caching')
    if (registration.features.responsive) features.push('Responsiv')

    return {
      title: config.customTitle || registration.displayName,
      description: config.customDescription || registration.description,
      features,
      config,
    }
  }, [registration, config])

  const renderPreview = () => {
    if (!registration) return null

    const currentConfig =
      previewMode === 'desktop'
        ? config
        : { ...config, ...responsiveConfig[previewMode]?.config }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Forhåndsvisning</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="mr-1 h-4 w-4" />
              Desktop
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'tablet' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="mr-1 h-4 w-4" />
              Tablet
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="mr-1 h-4 w-4" />
              Mobil
            </Button>
          </div>
        </div>

        <Card
          className={cn(
            'transition-all duration-200',
            previewMode === 'desktop' && 'max-w-full',
            previewMode === 'tablet' && 'mx-auto max-w-md',
            previewMode === 'mobile' && 'mx-auto max-w-sm'
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: categoryTheme?.primary }}
                />
                <CardTitle className="text-lg">{configPreview.title}</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {registration.category}
              </Badge>
            </div>
            {configPreview.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {configPreview.description}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-muted/50 to-muted/20">
                <div className="text-center">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: categoryTheme?.primary }}
                  >
                    {registration.displayName}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)}{' '}
                    visning
                  </div>
                </div>
              </div>

              {configPreview.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {configPreview.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>Ytelse: {registration.performance.renderPriority}</span>
                <span>•</span>
                <span>Minnebruk: {registration.performance.memoryUsage}</span>
                <span>•</span>
                <span>
                  Oppdatering: {registration.performance.updateFrequency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderValidationSummary = () => (
    <div className="flex items-center gap-3">
      {validationSummary.valid ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Gyldig konfigurasjon</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {validationSummary.errorCount} feil
          </span>
        </div>
      )}

      {validationSummary.warningCount > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            {validationSummary.warningCount} advarsler
          </span>
        </div>
      )}

      {validationSummary.suggestionCount > 0 && (
        <div className="flex items-center gap-1 text-blue-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">
            {validationSummary.suggestionCount} forslag
          </span>
        </div>
      )}
    </div>
  )

  if (!registration) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'h-[85vh] w-full max-w-5xl p-0',
          theme === 'dark' && 'border-slate-700 bg-slate-900',
          theme === 'dark-orange' && 'border-stone-700 bg-stone-950'
        )}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span>Konfigurer widget: {registration.displayName}</span>
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Endret
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex h-full flex-col"
            >
              <div className="border-b px-6 py-3">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">
                    <Sliders className="mr-1 h-4 w-4" />
                    Generelt
                  </TabsTrigger>
                  <TabsTrigger value="specific">
                    <Settings className="mr-1 h-4 w-4" />
                    Spesifikk
                  </TabsTrigger>
                  <TabsTrigger value="appearance">
                    <Palette className="mr-1 h-4 w-4" />
                    Utseende
                  </TabsTrigger>
                  <TabsTrigger value="responsive">
                    <Layout className="mr-1 h-4 w-4" />
                    Responsiv
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-1 h-4 w-4" />
                    Forhåndsvis
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4">
                    <TabsContent value="general" className="mt-0">
                      <WidgetConfigForms
                        registration={registration}
                        config={config}
                        onConfigChange={handleConfigChange}
                        validation={validation}
                        formType="general"
                        theme={theme}
                      />
                    </TabsContent>

                    <TabsContent value="specific" className="mt-0">
                      <WidgetConfigForms
                        registration={registration}
                        config={config}
                        onConfigChange={handleConfigChange}
                        validation={validation}
                        formType="specific"
                        theme={theme}
                        portfolioId={portfolioId}
                        stockSymbol={stockSymbol}
                        context={context}
                      />
                    </TabsContent>

                    <TabsContent value="appearance" className="mt-0">
                      <WidgetConfigForms
                        registration={registration}
                        config={config}
                        onConfigChange={handleConfigChange}
                        validation={validation}
                        formType="appearance"
                        theme={theme}
                      />
                    </TabsContent>

                    <TabsContent value="responsive" className="mt-0">
                      <WidgetConfigForms
                        registration={registration}
                        config={config}
                        responsiveConfig={responsiveConfig}
                        onConfigChange={handleConfigChange}
                        onResponsiveConfigChange={handleResponsiveConfigChange}
                        validation={validation}
                        formType="responsive"
                        theme={theme}
                      />
                    </TabsContent>

                    <TabsContent value="preview" className="mt-0">
                      {renderPreview()}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              {renderValidationSummary()}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Tilbakestill
              </Button>
              <Button variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button
                onClick={handleSave}
                disabled={!validation?.valid || saving}
                style={{
                  backgroundColor: validation?.valid
                    ? categoryTheme?.primary
                    : undefined,
                  borderColor: validation?.valid
                    ? categoryTheme?.primary
                    : undefined,
                }}
              >
                <Save className="mr-1 h-4 w-4" />
                {saving ? 'Lagrer...' : 'Lagre'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WidgetConfigModal
