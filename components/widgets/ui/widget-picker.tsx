'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Grid, 
  Star, 
  Clock, 
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Settings,
  Eye,
  Download,
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  useWidgetRegistry,
  useWidgetActions,
  useActiveLayout,
} from '@/components/widgets/widget-store'
import { 
  WidgetRegistration,
  WidgetFilter,
  WidgetInstance,
  norwegianLabels,
} from '@/components/widgets/widget-types'
import { 
  WidgetCategory,
  WidgetSize,
  WidgetType,
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

// Widget type icons
const widgetTypeIcons: Record<string, React.ReactNode> = {
  HERO_PORTFOLIO_CHART: <TrendingUp className="w-4 h-4" />,
  CATEGORY_MINI_CHART: <BarChart3 className="w-4 h-4" />,
  STOCK_PERFORMANCE_CHART: <PieChart className="w-4 h-4" />,
  HOLDINGS_TABLE_RICH: <Grid className="w-4 h-4" />,
  METRICS_GRID: <Activity className="w-4 h-4" />,
  ACTIVITY_FEED: <Clock className="w-4 h-4" />,
  PRICE_ALERTS: <Bell className="w-4 h-4" />,
  NEWS_FEED: <Activity className="w-4 h-4" />,
  PORTFOLIO_ALLOCATION: <PieChart className="w-4 h-4" />,
  PERFORMANCE_METRICS: <TrendingUp className="w-4 h-4" />,
  WATCHLIST: <Star className="w-4 h-4" />,
  CUSTOM_WIDGET: <Settings className="w-4 h-4" />,
}

// Category icons
const categoryIcons: Record<WidgetCategory, React.ReactNode> = {
  STOCKS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  CRYPTO: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  ART: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
    </svg>
  ),
  OTHER: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
}

interface WidgetPickerProps {
  className?: string
  onWidgetAdd?: (widget: WidgetInstance) => void
  onWidgetPreview?: (registration: WidgetRegistration) => void
  onMarketplaceOpen?: () => void
  userId: string
  portfolioId?: string
  compact?: boolean
}

interface WidgetItemProps {
  registration: WidgetRegistration
  onAdd: () => void
  onPreview: () => void
  compact?: boolean
  draggable?: boolean
}

// Individual widget item component
const WidgetItem: React.FC<WidgetItemProps> = ({
  registration,
  onAdd,
  onPreview,
  compact = false,
  draggable = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!draggable) return
    setIsDragging(true)
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'widget',
      registration: registration,
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [draggable, registration])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const theme = getInvestmentTheme('light', registration.category.toLowerCase() as any)

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              className={cn(
                'relative flex items-center gap-2 p-2 rounded-lg border text-left transition-all duration-200',
                'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                registration.category === 'STOCKS' && 'border-purple-200 bg-purple-50 hover:bg-purple-100 focus:ring-purple-500',
                registration.category === 'CRYPTO' && 'border-amber-200 bg-amber-50 hover:bg-amber-100 focus:ring-amber-500',
                registration.category === 'ART' && 'border-pink-200 bg-pink-50 hover:bg-pink-100 focus:ring-pink-500',
                registration.category === 'OTHER' && 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 focus:ring-emerald-500',
                isDragging && 'opacity-50 scale-95',
              )}
              onClick={onAdd}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              draggable={draggable}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md',
                registration.category === 'STOCKS' && 'bg-purple-100 text-purple-600',
                registration.category === 'CRYPTO' && 'bg-amber-100 text-amber-600',
                registration.category === 'ART' && 'bg-pink-100 text-pink-600',
                registration.category === 'OTHER' && 'bg-emerald-100 text-emerald-600',
              )}>
                {widgetTypeIcons[registration.type] || <Grid className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {registration.displayName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {sizeLabels[registration.recommendedSize]}
                </div>
              </div>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPreview()
                    }}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Plus className="w-4 h-4" />
                </motion.div>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm">
            <div className="space-y-2">
              <div className="font-semibold">{registration.displayName}</div>
              <div className="text-sm text-gray-600">{registration.description}</div>
              <div className="flex flex-wrap gap-1">
                {registration.features.realTimeUpdates && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Sanntid
                  </Badge>
                )}
                {registration.features.exportable && (
                  <Badge variant="secondary" className="text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    Eksport
                  </Badge>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer',
        'border-l-4',
        registration.category === 'STOCKS' && 'border-l-purple-500',
        registration.category === 'CRYPTO' && 'border-l-amber-500',
        registration.category === 'ART' && 'border-l-pink-500',
        registration.category === 'OTHER' && 'border-l-emerald-500',
        isDragging && 'opacity-50 scale-95',
      )}
      onClick={onAdd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              registration.category === 'STOCKS' && 'bg-purple-100 text-purple-600',
              registration.category === 'CRYPTO' && 'bg-amber-100 text-amber-600',
              registration.category === 'ART' && 'bg-pink-100 text-pink-600',
              registration.category === 'OTHER' && 'bg-emerald-100 text-emerald-600',
            )}>
              {widgetTypeIcons[registration.type] || <Grid className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{registration.displayName}</h3>
              <p className="text-sm text-gray-500">{registration.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[registration.category]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="space-y-2">
          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {registration.features.realTimeUpdates && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Sanntid
              </Badge>
            )}
            {registration.features.exportable && (
              <Badge variant="outline" className="text-xs">
                <Download className="w-3 h-3 mr-1" />
                Eksport
              </Badge>
            )}
            {registration.features.configurable && (
              <Badge variant="outline" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Konfig
              </Badge>
            )}
          </div>

          {/* Size and performance */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Størrelse: {sizeLabels[registration.recommendedSize]}</span>
            <span className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                registration.performance.renderPriority === 'high' && 'bg-red-500',
                registration.performance.renderPriority === 'medium' && 'bg-yellow-500',
                registration.performance.renderPriority === 'low' && 'bg-green-500',
              )} />
              {registration.performance.renderPriority}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Forhåndsvis
          </Button>
          <Button
            variant="default"
            size="sm"
            className={cn(
              'flex-1',
              registration.category === 'STOCKS' && 'bg-purple-600 hover:bg-purple-700',
              registration.category === 'CRYPTO' && 'bg-amber-600 hover:bg-amber-700',
              registration.category === 'ART' && 'bg-pink-600 hover:bg-pink-700',
              registration.category === 'OTHER' && 'bg-emerald-600 hover:bg-emerald-700',
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            Legg til
          </Button>
        </div>
      </CardFooter>

      {/* Drag indicator */}
      {draggable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zm-6 6h2v2H8v-2zm6 0h2v2h-2v-2zm-6 6h2v2H8v-2zm6 0h2v2h-2v-2z" />
            </svg>
          </div>
        </div>
      )}
    </Card>
  )
}

export const WidgetPicker: React.FC<WidgetPickerProps> = ({
  className,
  onWidgetAdd,
  onWidgetPreview,
  onMarketplaceOpen,
  userId,
  portfolioId,
  compact = false,
}) => {
  const { registry, search } = useWidgetRegistry()
  const { addWidget } = useWidgetActions()
  const activeLayoutId = useActiveLayout()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<WidgetCategory, boolean>>({
    STOCKS: true,
    CRYPTO: false,
    ART: false,
    OTHER: false,
  })

  // Get widgets grouped by category
  const widgetsByCategory = useMemo(() => {
    const allWidgets = registry.getAll()
    const grouped: Record<WidgetCategory, WidgetRegistration[]> = {
      STOCKS: [],
      CRYPTO: [],
      ART: [],
      OTHER: [],
    }

    allWidgets.forEach(widget => {
      grouped[widget.category].push(widget)
    })

    return grouped
  }, [registry])

  // Filter widgets based on search
  const filteredWidgets = useMemo(() => {
    if (!searchTerm) return widgetsByCategory

    const filtered: Record<WidgetCategory, WidgetRegistration[]> = {
      STOCKS: [],
      CRYPTO: [],
      ART: [],
      OTHER: [],
    }

    Object.entries(widgetsByCategory).forEach(([category, widgets]) => {
      filtered[category as WidgetCategory] = widgets.filter(widget =>
        widget.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.norwegianLabels.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    return filtered
  }, [widgetsByCategory, searchTerm])

  // Handle widget addition
  const handleAddWidget = useCallback(async (registration: WidgetRegistration) => {
    if (!activeLayoutId) return

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
    } catch (error) {
      console.error('Failed to add widget:', error)
    }
  }, [activeLayoutId, addWidget, onWidgetAdd, userId, portfolioId])

  // Handle widget preview
  const handlePreviewWidget = useCallback((registration: WidgetRegistration) => {
    onWidgetPreview?.(registration)
  }, [onWidgetPreview])

  // Toggle category expansion
  const toggleCategory = useCallback((category: WidgetCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }, [])

  return (
    <Card className={cn('widget-picker', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Widget Bibliotek</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarketplaceOpen}
            className="text-sm"
          >
            <Grid className="w-4 h-4 mr-2" />
            Utforsk flere
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Søk widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-3">
            {Object.entries(filteredWidgets).map(([category, widgets]) => {
              const categoryKey = category as WidgetCategory
              const isExpanded = expandedCategories[categoryKey]
              const hasWidgets = widgets.length > 0

              if (!hasWidgets && searchTerm) return null

              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(categoryKey)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-8 px-2 text-sm',
                        categoryKey === 'STOCKS' && 'text-purple-700 hover:bg-purple-50',
                        categoryKey === 'CRYPTO' && 'text-amber-700 hover:bg-amber-50',
                        categoryKey === 'ART' && 'text-pink-700 hover:bg-pink-50',
                        categoryKey === 'OTHER' && 'text-emerald-700 hover:bg-emerald-50',
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      {categoryIcons[categoryKey]}
                      <span className="ml-2">{categoryLabels[categoryKey]}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {widgets.length}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 ml-4">
                    {widgets.map((widget) => (
                      <WidgetItem
                        key={widget.type}
                        registration={widget}
                        onAdd={() => handleAddWidget(widget)}
                        onPreview={() => handlePreviewWidget(widget)}
                        compact={compact}
                        draggable={true}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="w-full text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onMarketplaceOpen}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Utforsk Widget Marketplace
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default WidgetPicker