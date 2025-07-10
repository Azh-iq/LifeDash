'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Grid,
  List,
  X,
  Plus,
  Eye,
  Settings,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { WidgetConfigurationModal } from './widget-configuration-modal'
import { WidgetPreview } from './widget-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
// Modern components import disabled for now
// import {
//   ModernButton,
//   ModernCard,
//   ModernSearchInput,
//   ModernLoading,
//   ModernTooltip
// } from './modern-ui-components'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  useWidgetRegistry,
  useWidgetStore,
  useWidgetActions,
  useActiveLayout,
} from '@/components/widgets/widget-store'
import {
  WidgetRegistration,
  WidgetFilter,
  WidgetSearchResult,
  WidgetInstance,
  norwegianLabels,
} from '@/components/widgets/widget-types'
import {
  WidgetType,
  WidgetCategory,
  WidgetSize,
} from '@/lib/types/widget.types'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'
import { cn } from '@/lib/utils/cn'

// Norwegian category labels
const categoryLabels: Record<WidgetCategory, string> = {
  STOCKS: 'Aksjer',
  CRYPTO: 'Krypto',
  ART: 'Kunst',
  OTHER: 'Annet',
}

// Norwegian size labels
const sizeLabels: Record<WidgetSize, string> = {
  SMALL: 'Liten',
  MEDIUM: 'Medium',
  LARGE: 'Stor',
  HERO: 'Hero',
}

// Category icons
const categoryIcons: Record<WidgetCategory, React.ReactNode> = {
  STOCKS: (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  CRYPTO: (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  ),
  ART: (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
      />
    </svg>
  ),
  OTHER: (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
}

interface WidgetMarketplaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWidgetAdd?: (widget: WidgetInstance) => void
  onWidgetPreview?: (registration: WidgetRegistration) => void
  userId: string
  portfolioId?: string
}

interface WidgetPreviewProps {
  registration: WidgetRegistration
  onAdd: () => void
  onPreview: () => void
  onConfigure: () => void
  loading?: boolean
}

// Widget preview card component
const WidgetPreviewCard: React.FC<WidgetPreviewProps> = ({
  registration,
  onAdd,
  onPreview,
  onConfigure,
  loading = false,
}) => {
  const theme = getInvestmentTheme(
    'light',
    registration.category.toLowerCase() as any
  )
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        'border-l-4',
        registration.category === 'STOCKS' && 'border-l-purple-500',
        registration.category === 'CRYPTO' && 'border-l-amber-500',
        registration.category === 'ART' && 'border-l-pink-500',
        registration.category === 'OTHER' && 'border-l-emerald-500'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                registration.category === 'STOCKS' &&
                  'bg-purple-100 text-purple-600',
                registration.category === 'CRYPTO' &&
                  'bg-amber-100 text-amber-600',
                registration.category === 'ART' && 'bg-pink-100 text-pink-600',
                registration.category === 'OTHER' &&
                  'bg-emerald-100 text-emerald-600'
              )}
            >
              {categoryIcons[registration.category]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {registration.displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {registration.description}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[registration.category]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Widget features */}
          <div className="flex flex-wrap gap-2">
            {registration.features.realTimeUpdates && (
              <Badge variant="outline" className="text-xs">
                Sanntidsoppdatering
              </Badge>
            )}
            {registration.features.exportable && (
              <Badge variant="outline" className="text-xs">
                Eksporterbar
              </Badge>
            )}
            {registration.features.configurable && (
              <Badge variant="outline" className="text-xs">
                Konfigurerbar
              </Badge>
            )}
            {registration.features.responsive && (
              <Badge variant="outline" className="text-xs">
                Responsiv
              </Badge>
            )}
          </div>

          {/* Size and requirements */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Størrelse: {sizeLabels[registration.recommendedSize]}</span>
            <span>v{registration.version}</span>
          </div>

          {/* Performance info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  registration.performance.renderPriority === 'high' &&
                    'bg-red-500',
                  registration.performance.renderPriority === 'medium' &&
                    'bg-yellow-500',
                  registration.performance.renderPriority === 'low' &&
                    'bg-green-500'
                )}
              />
              {registration.performance.renderPriority} prioritet
            </span>
            <span>{registration.performance.memoryUsage} minne</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <ModernButton
            variant="secondary"
            size="sm"
            glassmorphism={true}
            onClick={onPreview}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Forhåndsvis
          </ModernButton>
          <ModernTooltip content="Konfigurer widget">
            <ModernButton
              variant="secondary"
              size="sm"
              glassmorphism={true}
              onClick={onConfigure}
              disabled={!registration.features.configurable}
              className="p-2"
            >
              <Settings className="h-4 w-4" />
            </ModernButton>
          </ModernTooltip>
          <ModernButton
            variant="primary"
            size="sm"
            glassmorphism={true}
            onClick={onAdd}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Legg til
          </ModernButton>
        </div>
      </CardFooter>

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/5 to-transparent"
          />
        )}
      </AnimatePresence>
    </Card>
  )
}

export const WidgetMarketplace: React.FC<WidgetMarketplaceProps> = ({
  open,
  onOpenChange,
  onWidgetAdd,
  onWidgetPreview,
  userId,
  portfolioId,
}) => {
  const { search, registry } = useWidgetRegistry()
  const { addWidget } = useWidgetActions()
  const activeLayoutId = useActiveLayout()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    WidgetCategory | 'ALL'
  >('ALL')
  const [selectedSize, setSelectedSize] = useState<WidgetSize | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  const [previewWidget, setPreviewWidget] = useState<WidgetRegistration | null>(
    null
  )
  const [configurationWidget, setConfigurationWidget] =
    useState<WidgetRegistration | null>(null)
  const [previewConfig, setPreviewConfig] = useState<any>(null)

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Search results
  const searchResults = useMemo(() => {
    const filter: WidgetFilter = {
      searchTerm: debouncedSearchTerm,
      categories: selectedCategory === 'ALL' ? undefined : [selectedCategory],
      sizes: selectedSize === 'ALL' ? undefined : [selectedSize],
    }
    return search(filter)
  }, [debouncedSearchTerm, selectedCategory, selectedSize, search])

  // Available categories and sizes
  const availableCategories = useMemo(() => {
    const categories = registry.getCategories()
    return ['ALL' as const, ...categories]
  }, [registry])

  const availableSizes: Array<WidgetSize | 'ALL'> = [
    'ALL',
    'SMALL',
    'MEDIUM',
    'LARGE',
    'HERO',
  ]

  // Handle widget addition
  const handleAddWidget = useCallback(
    async (registration: WidgetRegistration) => {
      if (!activeLayoutId) return

      setLoading(true)
      try {
        const widget: WidgetInstance = {
          id: `${registration.type}_${Date.now()}`,
          type: registration.type,
          category: registration.category,
          size: registration.recommendedSize,
          position: {
            row: 0,
            column: 0,
            rowSpan: registration.minGridSize.rows,
            columnSpan: registration.minGridSize.columns,
          },
          props: {
            id: `${registration.type}_${Date.now()}`,
            type: registration.type,
            category: registration.category,
            size: registration.recommendedSize,
            position: {
              row: 0,
              column: 0,
              rowSpan: registration.minGridSize.rows,
              columnSpan: registration.minGridSize.columns,
            },
            config: registration.defaultConfig,
            title: registration.norwegianLabels.title,
            description: registration.norwegianLabels.description,
            userId,
            portfolioId,
          },
          registration,
          created: new Date(),
          updated: new Date(),
          isValid: true,
          validationErrors: [],
        }

        addWidget(activeLayoutId, widget)
        onWidgetAdd?.(widget)
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to add widget:', error)
      } finally {
        setLoading(false)
      }
    },
    [activeLayoutId, addWidget, onWidgetAdd, onOpenChange, userId, portfolioId]
  )

  // Handle widget preview
  const handlePreviewWidget = useCallback(
    (registration: WidgetRegistration) => {
      setPreviewWidget(registration)
      setPreviewConfig(registration.defaultConfig)
      onWidgetPreview?.(registration)
    },
    [onWidgetPreview]
  )

  // Handle widget configuration
  const handleConfigureWidget = useCallback(
    (registration: WidgetRegistration) => {
      setConfigurationWidget(registration)
      setPreviewConfig(registration.defaultConfig)
    },
    []
  )

  // Handle configuration save
  const handleConfigurationSave = useCallback(
    async (config: any) => {
      if (!configurationWidget) return

      try {
        // Here you would save the configuration as a template or user preference
        console.log(
          'Saving configuration for widget:',
          configurationWidget.type,
          config
        )
        setConfigurationWidget(null)
        setPreviewConfig(null)
      } catch (error) {
        console.error('Failed to save configuration:', error)
      }
    },
    [configurationWidget]
  )

  // Handle configuration preview
  const handleConfigurationPreview = useCallback((config: any) => {
    setPreviewConfig(config)
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('ALL')
    setSelectedSize('ALL')
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-6xl p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <DialogHeader className="border-b p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Widget Marketplace
                  </DialogTitle>
                  <DialogDescription>
                    Utforsk og legg til widgets til din dashboard
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="text-sm"
                  >
                    Tilbakestill filtre
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                    }
                  >
                    {viewMode === 'grid' ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <Grid className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Search and filters */}
            <div className="border-b bg-gray-50 p-6 pb-4">
              <div className="flex flex-col gap-4">
                {/* Search bar */}
                <ModernSearchInput
                  placeholder="Søk etter widgets..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  glassmorphism={true}
                  icon={<Search className="h-4 w-4" />}
                  onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />

                {/* Category tabs */}
                <Tabs
                  value={selectedCategory}
                  onValueChange={value => setSelectedCategory(value as any)}
                >
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="ALL">Alle</TabsTrigger>
                    {availableCategories.slice(1).map(category => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex items-center gap-2"
                      >
                        {categoryIcons[category]}
                        {categoryLabels[category]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* Size filter */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    Størrelse:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <ModernButton
                        key={size}
                        variant={
                          selectedSize === size ? 'primary' : 'secondary'
                        }
                        size="sm"
                        glassmorphism={true}
                        onClick={() => setSelectedSize(size)}
                        className="text-xs"
                      >
                        {size === 'ALL' ? 'Alle' : sizeLabels[size]}
                      </ModernButton>
                    ))}
                  </div>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600">
                  {searchResults.length} widget
                  {searchResults.length !== 1 ? 's' : ''} funnet
                </div>
              </div>
            </div>

            {/* Widget grid */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {searchResults.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-4 text-gray-400">
                        <Search className="mx-auto h-12 w-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        Ingen widgets funnet
                      </h3>
                      <p className="mb-4 text-gray-600">
                        Prøv å endre søkekriteriene dine
                      </p>
                      <ModernButton
                        variant="secondary"
                        glassmorphism={true}
                        onClick={resetFilters}
                      >
                        Tilbakestill filtre
                      </ModernButton>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'grid gap-6',
                        viewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1'
                      )}
                    >
                      {searchResults.map(result => (
                        <WidgetPreviewCard
                          key={result.registration.type}
                          registration={result.registration}
                          onAdd={() => handleAddWidget(result.registration)}
                          onPreview={() =>
                            handlePreviewWidget(result.registration)
                          }
                          onConfigure={() =>
                            handleConfigureWidget(result.registration)
                          }
                          loading={loading}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Footer */}
            <DialogFooter className="border-t p-6 pt-4">
              <div className="flex w-full items-center justify-between">
                <div className="text-sm text-gray-500">
                  Velg en widget for å legge den til i din dashboard
                </div>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Lukk
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Configuration Modal */}
      <WidgetConfigurationModal
        open={!!configurationWidget}
        onOpenChange={open => {
          if (!open) {
            setConfigurationWidget(null)
            setPreviewConfig(null)
          }
        }}
        registration={configurationWidget}
        currentConfig={previewConfig}
        onSave={handleConfigurationSave}
        onPreview={handleConfigurationPreview}
        userId={userId}
        portfolioId={portfolioId}
      />

      {/* Widget Preview */}
      <AnimatePresence>
        {previewWidget && previewConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPreviewWidget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-4xl overflow-auto"
            >
              <WidgetPreview
                registration={previewWidget}
                config={previewConfig}
                userId={userId}
                portfolioId={portfolioId}
                onReset={() => setPreviewConfig(previewWidget.defaultConfig)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default WidgetMarketplace
