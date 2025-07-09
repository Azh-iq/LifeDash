"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  UniqueIdentifier
} from '@dnd-kit/core'
import { 
  SortableContext, 
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Grid3X3, 
  Settings, 
  Save,
  Undo2,
  Redo2,
  Eye,
  Edit3,
  Trash2,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useWidgetStore } from '../widget-store'
import { Widget, WidgetLayout, WidgetCategory, WidgetType } from './simple-widget-types'
import { WidgetContainer } from './widget-container'
import { useToast } from '@/hooks/use-toast'
import { 
  GridLayoutItem, 
  GridLayoutConfig, 
  WIDGET_SIZE_MAPPINGS, 
  DEFAULT_GRID_CONFIG, 
  WidgetSize 
} from './simple-widget-types'

// Import react-grid-layout styles
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface WidgetGridProps {
  layoutId: string
  widgets: Widget[]
  onWidgetUpdate?: (widgets: Widget[]) => void
  onWidgetRemove?: (widgetId: string) => void
  onWidgetConfigure?: (widget: Widget) => void
  onAddWidget?: () => void
  className?: string
  isEditable?: boolean
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
  maxWidgets?: number
  // New props for react-grid-layout integration
  useGridLayout?: boolean
  gridConfig?: Partial<GridLayoutConfig>
  onLayoutChange?: (layout: GridLayoutItem[], layouts: Record<string, GridLayoutItem[]>) => void
  enableResponsive?: boolean
  currentBreakpoint?: string
}

// Grid configurations
const gridConfigs = {
  columns: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  },
  gaps: {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
}

// Utility functions for grid layout conversion
const widgetToGridItem = (widget: Widget): GridLayoutItem => {
  const sizeMapping = WIDGET_SIZE_MAPPINGS[widget.size]
  return {
    i: widget.id,
    x: widget.position.column,
    y: widget.position.row,
    w: sizeMapping.w,
    h: sizeMapping.h,
    minW: 1,
    minH: 1,
    isDraggable: true,
    isResizable: true,
    resizeHandles: ['se'] // Only allow southeast resize handle
  }
}

const gridItemToWidget = (item: GridLayoutItem, widgets: Widget[]): Widget | null => {
  const widget = widgets.find(w => w.id === item.i)
  if (!widget) return null
  
  // Determine size based on grid dimensions
  let size: WidgetSize = 'SMALL'
  if (item.w >= 4 && item.h >= 4) size = 'HERO'
  else if (item.w >= 3 && item.h >= 3) size = 'LARGE'
  else if (item.w >= 2 && item.h >= 2) size = 'MEDIUM'
  
  return {
    ...widget,
    size,
    position: {
      row: item.y,
      column: item.x
    },
    updatedAt: new Date()
  }
}

// Norwegian translations
const translations = {
  noWidgets: 'Ingen widgets',
  noWidgetsDesc: 'Legg til widgets for å tilpasse ditt dashboard',
  addWidget: 'Legg til widget',
  editMode: 'Redigeringsmodus',
  viewMode: 'Visningsmodus',
  save: 'Lagre',
  undo: 'Angre',
  redo: 'Gjenta',
  settings: 'Innstillinger',
  remove: 'Fjern',
  widgetAdded: 'Widget lagt til',
  widgetRemoved: 'Widget fjernet',
  widgetUpdated: 'Widget oppdatert',
  layoutSaved: 'Layout lagret',
  maxWidgetsReached: 'Maksimalt antall widgets nådd',
  // New translations for grid layout
  desktop: 'Skrivebord',
  tablet: 'Nettbrett',
  mobile: 'Mobil',
  responsive: 'Responsiv',
  gridLayout: 'Rutenett-layout',
  classicLayout: 'Klassisk layout'
}

export function WidgetGrid({
  layoutId,
  widgets,
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetConfigure,
  onAddWidget,
  className,
  isEditable = true,
  columns = 3,
  gap = 'md',
  maxWidgets = 20,
  // New props
  useGridLayout = true,
  gridConfig,
  onLayoutChange,
  enableResponsive = true,
  currentBreakpoint = 'lg'
}: WidgetGridProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null)
  const [history, setHistory] = useState<Widget[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'classic'>(useGridLayout ? 'grid' : 'classic')
  const [currentDeviceBreakpoint, setCurrentDeviceBreakpoint] = useState(currentBreakpoint)
  
  const { toast } = useToast()
  
  const {
    editMode,
    selectedWidget,
    setEditMode,
    setSelectedWidget,
    layouts,
    updateLayout,
    performance
  } = useWidgetStore()
  
  // Merge default grid configuration with custom config
  const mergedGridConfig = useMemo(() => ({
    ...DEFAULT_GRID_CONFIG,
    ...gridConfig
  }), [gridConfig])
  
  // Convert widgets to grid layout format
  const gridLayout = useMemo(() => {
    const layouts: Record<string, GridLayoutItem[]> = {}
    
    Object.keys(mergedGridConfig.breakpoints).forEach(breakpoint => {
      layouts[breakpoint] = widgets.map(widgetToGridItem)
    })
    
    return layouts
  }, [widgets, mergedGridConfig])
  
  // Grid layout change handler
  const handleGridLayoutChange = useCallback((layout: GridLayoutItem[], layouts: Record<string, GridLayoutItem[]>) => {
    if (!isEditable || !editMode) return
    
    // Convert grid items back to widgets
    const updatedWidgets = layout.map(item => {
      const convertedWidget = gridItemToWidget(item, widgets)
      return convertedWidget || widgets.find(w => w.id === item.i)!
    }).filter(Boolean)
    
    // Update widget positions and sizes
    addToHistory(updatedWidgets)
    onWidgetUpdate?.(updatedWidgets)
    onLayoutChange?.(layout, layouts)
    
    toast({
      title: translations.widgetUpdated,
      description: 'Widget layout oppdatert',
      duration: 2000
    })
  }, [widgets, isEditable, editMode, addToHistory, onWidgetUpdate, onLayoutChange, toast])
  
  // Breakpoint change handler
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentDeviceBreakpoint(breakpoint)
  }, [])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize history
  useEffect(() => {
    if (widgets.length > 0 && history.length === 0) {
      setHistory([widgets])
      setHistoryIndex(0)
    }
  }, [widgets, history])

  // Add to history when widgets change
  const addToHistory = useCallback((newWidgets: Widget[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newWidgets)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setHasUnsavedChanges(true)
  }, [history, historyIndex])

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onWidgetUpdate?.(history[newIndex])
    }
  }

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onWidgetUpdate?.(history[newIndex])
    }
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)
    
    const widget = widgets.find(w => w.id === active.id)
    if (widget) {
      setDraggedWidget(widget)
    }
  }

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over logic for visual feedback
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedWidget(null)

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.id === active.id)
      const newIndex = widgets.findIndex(w => w.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex)
        addToHistory(newWidgets)
        onWidgetUpdate?.(newWidgets)
        
        toast({
          title: translations.widgetUpdated,
          description: 'Widget posisjon oppdatert',
          duration: 2000
        })
      }
    }
  }

  // Handle widget removal
  const handleWidgetRemove = (widgetId: string) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId)
    addToHistory(newWidgets)
    onWidgetRemove?.(widgetId)
    setSelectedWidget(null)
    
    toast({
      title: translations.widgetRemoved,
      description: 'Widget fjernet fra dashboard',
      duration: 2000
    })
  }

  // Handle widget resize
  const handleWidgetResize = (widgetId: string, newSize: any) => {
    const newWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, size: newSize } : w
    )
    addToHistory(newWidgets)
    onWidgetUpdate?.(newWidgets)
    
    toast({
      title: translations.widgetUpdated,
      description: 'Widget størrelse endret',
      duration: 2000
    })
  }
  
  // Toggle layout mode
  const toggleLayoutMode = () => {
    setLayoutMode(prev => prev === 'grid' ? 'classic' : 'grid')
  }

  // Handle save layout
  const handleSaveLayout = async () => {
    try {
      const layout: WidgetLayout = {
        id: layoutId,
        userId: 'user-123', // This should come from auth context
        name: 'Default Layout',
        widgets: widgets.map((widget, index) => ({
          id: widget.id,
          type: widget.type,
          category: widget.category,
          title: widget.title,
          size: widget.size,
          position: {
            row: Math.floor(index / columns) + 1,
            column: (index % columns) + 1
          },
          configuration: widget.configuration || {}
        })),
        configuration: {
          columns,
          gap,
          theme: 'default'
        }
      }
      
      await updateLayout(layoutId, layout)
      setHasUnsavedChanges(false)
      
      toast({
        title: translations.layoutSaved,
        description: 'Layout lagret til profilen din',
        duration: 2000
      })
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre layout',
        variant: 'destructive',
        duration: 3000
      })
    }
  }

  // Handle add widget
  const handleAddWidget = () => {
    if (widgets.length >= maxWidgets) {
      toast({
        title: translations.maxWidgetsReached,
        description: `Du kan maksimalt ha ${maxWidgets} widgets`,
        variant: 'destructive',
        duration: 3000
      })
      return
    }
    
    onAddWidget?.()
  }
  
  // Render responsive breakpoint indicator
  const renderBreakpointIndicator = () => {
    if (!enableResponsive) return null
    
    const breakpointIcons = {
      lg: Monitor,
      md: Monitor,
      sm: Tablet,
      xs: Smartphone,
      xxs: Smartphone
    }
    
    const IconComponent = breakpointIcons[currentDeviceBreakpoint as keyof typeof breakpointIcons] || Monitor
    
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
        <IconComponent className="h-4 w-4 text-gray-600" />
        <span className="text-xs text-gray-600">
          {currentDeviceBreakpoint.toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Widget Dashboard</h2>
          <Badge variant="secondary" className="text-xs">
            {widgets.length}/{maxWidgets}
          </Badge>
        </div>
        
        {/* Grid Actions */}
        <div className="flex items-center gap-2">
          {/* Responsive Breakpoint Indicator */}
          {renderBreakpointIndicator()}
          
          {/* Layout Mode Toggle */}
          <Button
            variant={layoutMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleLayoutMode}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            {layoutMode === 'grid' ? translations.gridLayout : translations.classicLayout}
          </Button>
          
          {/* History Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Edit Mode Toggle */}
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="gap-2"
          >
            {editMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {editMode ? translations.editMode : translations.viewMode}
          </Button>

          {/* Save Button */}
          {hasUnsavedChanges && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveLayout}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {translations.save}
            </Button>
          )}

          {/* Add Widget Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddWidget}
            className="gap-2"
            disabled={widgets.length >= maxWidgets}
          >
            <Plus className="h-4 w-4" />
            {translations.addWidget}
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      {widgets.length === 0 ? (
        /* Empty State */
        <Card className="p-8 text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Grid3X3 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">{translations.noWidgets}</h3>
            <p className="text-gray-500 mb-4">{translations.noWidgetsDesc}</p>
            <Button onClick={handleAddWidget} className="gap-2">
              <Plus className="h-4 w-4" />
              {translations.addWidget}
            </Button>
          </CardContent>
        </Card>
      ) : layoutMode === 'grid' ? (
        /* React Grid Layout */
        <div className="w-full">
          <ResponsiveGridLayout
            className="layout"
            layouts={gridLayout}
            breakpoints={mergedGridConfig.breakpoints}
            cols={mergedGridConfig.cols}
            rowHeight={mergedGridConfig.rowHeight}
            margin={mergedGridConfig.margin}
            containerPadding={mergedGridConfig.containerPadding}
            isDraggable={isEditable && editMode}
            isResizable={isEditable && editMode}
            onLayoutChange={handleGridLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            draggableHandle={mergedGridConfig.draggableHandle}
            preventCollision={mergedGridConfig.preventCollision}
            useCSSTransforms={true}
            compactType={null}
            measureBeforeMount={false}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="relative">
                <WidgetContainer
                  widget={widget}
                  isEditable={isEditable && editMode}
                  onRemove={() => handleWidgetRemove(widget.id)}
                  onConfigure={() => onWidgetConfigure?.(widget)}
                  onResize={(size) => handleWidgetResize(widget.id, size)}
                  className="h-full"
                >
                  {/* Widget Content - This will be replaced with actual widget components */}
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-sm font-medium">{widget.type[0]}</span>
                      </div>
                      <p className="text-sm text-gray-600">{widget.type}</p>
                    </div>
                  </div>
                </WidgetContainer>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      ) : (
        /* Classic DND Layout */
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={widgets.map(w => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className={cn(
              'grid w-full',
              gridConfigs.columns[columns as keyof typeof gridConfigs.columns],
              gridConfigs.gaps[gap],
              'auto-rows-fr'
            )}>
              <AnimatePresence>
                {widgets.map((widget) => (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WidgetContainer
                      widget={widget}
                      isEditable={isEditable && editMode}
                      onRemove={() => handleWidgetRemove(widget.id)}
                      onConfigure={() => onWidgetConfigure?.(widget)}
                      onResize={(size) => handleWidgetResize(widget.id, size)}
                    >
                      {/* Widget Content - This will be replaced with actual widget components */}
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-sm font-medium">{widget.type[0]}</span>
                          </div>
                          <p className="text-sm text-gray-600">{widget.type}</p>
                        </div>
                      </div>
                    </WidgetContainer>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Debug Info (Dev Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs">
          <h4 className="font-medium mb-2">Debug Info</h4>
          <div className="space-y-1">
            <div>Active Widget: {activeId}</div>
            <div>Edit Mode: {editMode ? 'Yes' : 'No'}</div>
            <div>Selected: {selectedWidget}</div>
            <div>History: {historyIndex + 1}/{history.length}</div>
            <div>Unsaved Changes: {hasUnsavedChanges ? 'Yes' : 'No'}</div>
            <div>Performance: {performance.renderTime}ms</div>
            <div>Layout Mode: {layoutMode}</div>
            <div>Current Breakpoint: {currentDeviceBreakpoint}</div>
            <div>Grid Layout Enabled: {useGridLayout ? 'Yes' : 'No'}</div>
            <div>Responsive Enabled: {enableResponsive ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced WidgetGrid with grid layout as default
export function EnhancedWidgetGrid(props: WidgetGridProps) {
  return (
    <WidgetGrid
      {...props}
      useGridLayout={true}
      enableResponsive={true}
      gridConfig={{
        ...DEFAULT_GRID_CONFIG,
        ...props.gridConfig
      }}
    />
  )
}

// Classic WidgetGrid for backward compatibility
export function ClassicWidgetGrid(props: WidgetGridProps) {
  return (
    <WidgetGrid
      {...props}
      useGridLayout={false}
      enableResponsive={false}
    />
  )
}