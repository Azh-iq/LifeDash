'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  UniqueIdentifier,
  CollisionDetection,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core'
import { 
  SortableContext, 
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToWindowEdges, restrictToParentElement } from '@dnd-kit/modifiers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Plus, 
  Grid3X3, 
  Settings, 
  Save,
  RotateCcw,
  Eye,
  Edit3,
  Trash2,
  Move,
  Grip,
  Smartphone,
  Tablet,
  Monitor,
  ChevronUp,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import { useWidgetStore } from '../widget-store'
import { Widget, WidgetLayout, WidgetCategory } from '../widget-types'
import { MobileWidgetContainer } from './mobile-widget-container'
import { MobileWidgetPicker } from './mobile-widget-picker'
import { MobileGestureHandler } from './mobile-gesture-handler'
import { useToast } from '@/hooks/use-toast'

interface MobileWidgetBoardProps {
  layoutId: string
  widgets: Widget[]
  onWidgetUpdate?: (widgets: Widget[]) => void
  onWidgetRemove?: (widgetId: string) => void
  onWidgetConfigure?: (widget: Widget) => void
  onAddWidget?: () => void
  className?: string
  isEditable?: boolean
  maxWidgets?: number
  enableGestures?: boolean
}

// Mobile-specific layout configurations
const mobileLayoutConfigs = {
  stacking: {
    single: 'space-y-4',
    double: 'space-y-6',
    triple: 'space-y-8'
  },
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3'
  },
  spacing: {
    tight: 'gap-2',
    normal: 'gap-4',
    loose: 'gap-6'
  },
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8'
  }
}

// Norwegian translations for mobile
const translations = {
  widgetBoard: 'Widget Dashboard',
  noWidgets: 'Ingen widgets',
  noWidgetsDesc: 'Legg til widgets for å tilpasse ditt mobile dashboard',
  addWidget: 'Legg til widget',
  editMode: 'Redigeringsmodus',
  viewMode: 'Visningsmodus',
  save: 'Lagre',
  reset: 'Tilbakestill',
  settings: 'Innstillinger',
  widgetAdded: 'Widget lagt til',
  widgetRemoved: 'Widget fjernet',
  widgetMoved: 'Widget flyttet',
  layoutSaved: 'Layout lagret',
  maxWidgetsReached: 'Maksimalt antall widgets nådd',
  touchToEdit: 'Trykk for å redigere',
  dragToReorder: 'Dra for å omorganisere',
  swipeToDelete: 'Sveip for å slette',
  longPressToMove: 'Trykk lenge for å flytte',
  stackedView: 'Stablet visning',
  gridView: 'Rutenett visning',
  compactView: 'Kompakt visning',
  mobileOptimized: 'Mobile optimert',
  gesturesEnabled: 'Bevegelser aktivert',
  touchFriendly: 'Berøringsvennlig'
}

// Mobile collision detection for better touch handling
const mobileCollisionDetection: CollisionDetection = (args) => {
  const { active, droppableContainers } = args
  
  // First try pointer intersection (better for touch)
  const pointerIntersections = pointerWithin(args)
  if (pointerIntersections.length > 0) {
    return pointerIntersections
  }
  
  // Fallback to rect intersection
  return rectIntersection(args)
}

/**
 * Mobile Widget Board Component
 * 
 * Features:
 * - Touch-friendly drag and drop
 * - Mobile-first responsive design
 * - Gesture support for widget manipulation
 * - Stacked layout for mobile screens
 * - Swipe gestures for quick actions
 * - Long press for move mode
 * - Optimized for touch interactions
 */
export function MobileWidgetBoard({
  layoutId,
  widgets,
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetConfigure,
  onAddWidget,
  className,
  isEditable = true,
  maxWidgets = 20,
  enableGestures = true
}: MobileWidgetBoardProps) {
  const { toast } = useToast()
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isTouch,
    orientation,
    width,
    height 
  } = useResponsiveLayout()
  
  const {
    editMode,
    selectedWidget,
    setEditMode,
    setSelectedWidget,
    layouts,
    updateLayout,
    performance
  } = useWidgetStore()

  // Mobile-specific state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'stack' | 'grid' | 'compact'>('stack')
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set())
  const [reorderMode, setReorderMode] = useState(false)

  // Touch sensors optimized for mobile
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  // Responsive layout selection
  const currentLayoutMode = useMemo(() => {
    if (isMobile) return 'stack'
    if (isTablet) return 'grid'
    return 'grid'
  }, [isMobile, isTablet])

  // Widget arrangement based on screen size
  const arrangedWidgets = useMemo(() => {
    if (currentLayoutMode === 'stack') {
      return widgets.sort((a, b) => {
        const aOrder = a.position?.row || 0
        const bOrder = b.position?.row || 0
        return aOrder - bOrder
      })
    }
    return widgets
  }, [widgets, currentLayoutMode])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)
    
    const widget = widgets.find(w => w.id === active.id)
    if (widget) {
      setDraggedWidget(widget)
      setReorderMode(true)
    }
  }, [widgets])

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Optional: Provide visual feedback during drag
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedWidget(null)
    setReorderMode(false)

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.id === active.id)
      const newIndex = widgets.findIndex(w => w.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex)
        
        // Update positions for stacked layout
        const updatedWidgets = newWidgets.map((widget, index) => ({
          ...widget,
          position: {
            ...widget.position,
            row: index + 1
          }
        }))
        
        onWidgetUpdate?.(updatedWidgets)
        
        toast({
          title: translations.widgetMoved,
          description: 'Widget rekkefølge oppdatert',
          duration: 2000
        })
      }
    }
  }, [widgets, onWidgetUpdate, toast])

  // Handle widget removal
  const handleWidgetRemove = useCallback((widgetId: string) => {
    onWidgetRemove?.(widgetId)
    setSelectedWidget(null)
    
    toast({
      title: translations.widgetRemoved,
      description: 'Widget fjernet fra mobile dashboard',
      duration: 2000
    })
  }, [onWidgetRemove, setSelectedWidget, toast])

  // Handle widget expansion (for mobile)
  const handleWidgetExpand = useCallback((widgetId: string) => {
    setExpandedWidgets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId)
      } else {
        newSet.add(widgetId)
      }
      return newSet
    })
  }, [])

  // Handle add widget
  const handleAddWidget = useCallback(() => {
    if (widgets.length >= maxWidgets) {
      toast({
        title: translations.maxWidgetsReached,
        description: `Du kan maksimalt ha ${maxWidgets} widgets`,
        variant: 'destructive',
        duration: 3000
      })
      return
    }
    
    setShowWidgetPicker(true)
  }, [widgets.length, maxWidgets, toast])

  // Handle save layout
  const handleSaveLayout = useCallback(async () => {
    try {
      const layout: WidgetLayout = {
        id: layoutId,
        userId: 'user-123',
        name: 'Mobile Layout',
        widgets: widgets.map((widget, index) => ({
          id: widget.id,
          type: widget.type,
          category: widget.category,
          title: widget.title,
          size: widget.size,
          position: {
            row: index + 1,
            column: 1
          },
          configuration: widget.configuration || {}
        })),
        configuration: {
          columns: 1,
          gap: 'md',
          theme: 'mobile',
          layoutMode: currentLayoutMode
        }
      }
      
      await updateLayout(layoutId, layout)
      
      toast({
        title: translations.layoutSaved,
        description: 'Mobile layout lagret',
        duration: 2000
      })
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre mobile layout',
        variant: 'destructive',
        duration: 3000
      })
    }
  }, [layoutId, widgets, currentLayoutMode, updateLayout, toast])

  // Mobile header with responsive controls
  const MobileHeader = () => (
    <div className="flex flex-col gap-3 mb-4">
      {/* Top row with title and device indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {isMobile && <Smartphone className="h-4 w-4 text-green-600" />}
            {isTablet && <Tablet className="h-4 w-4 text-blue-600" />}
            {isDesktop && <Monitor className="h-4 w-4 text-purple-600" />}
          </div>
          <h2 className="text-lg font-semibold">{translations.widgetBoard}</h2>
          <Badge variant="secondary" className="text-xs">
            {widgets.length}/{maxWidgets}
          </Badge>
        </div>
        
        {/* Device-specific badge */}
        <Badge variant="outline" className="text-xs">
          {isMobile && translations.mobileOptimized}
          {isTablet && 'Tablet'}
          {isDesktop && 'Desktop'}
        </Badge>
      </div>

      {/* Control row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Edit mode toggle */}
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="gap-2"
          >
            {editMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {editMode ? translations.editMode : translations.viewMode}
          </Button>
          
          {/* Layout mode selector (tablet/desktop) */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              <Button
                variant={currentLayoutMode === 'stack' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('stack')}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant={currentLayoutMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveLayout}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {translations.save}
          </Button>
          
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
    </div>
  )

  // Mobile widget list (stacked layout)
  const MobileWidgetList = () => (
    <div className={cn(
      'space-y-4',
      reorderMode && 'space-y-6'
    )}>
      {arrangedWidgets.map((widget) => (
        <MobileWidgetContainer
          key={widget.id}
          widget={widget}
          isEditable={isEditable && editMode}
          isExpanded={expandedWidgets.has(widget.id)}
          enableGestures={enableGestures}
          onRemove={() => handleWidgetRemove(widget.id)}
          onConfigure={() => onWidgetConfigure?.(widget)}
          onExpand={() => handleWidgetExpand(widget.id)}
        />
      ))}
    </div>
  )

  // Tablet/Desktop grid layout
  const TabletGridLayout = () => (
    <div className={cn(
      'grid w-full gap-4',
      isTablet ? 'grid-cols-2' : 'grid-cols-3',
      'auto-rows-fr'
    )}>
      {arrangedWidgets.map((widget) => (
        <MobileWidgetContainer
          key={widget.id}
          widget={widget}
          isEditable={isEditable && editMode}
          isExpanded={expandedWidgets.has(widget.id)}
          enableGestures={enableGestures}
          onRemove={() => handleWidgetRemove(widget.id)}
          onConfigure={() => onWidgetConfigure?.(widget)}
          onExpand={() => handleWidgetExpand(widget.id)}
        />
      ))}
    </div>
  )

  // Empty state
  const EmptyState = () => (
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
  )

  return (
    <div className={cn(
      'w-full min-h-screen',
      isMobile ? 'px-4 py-2' : 'px-6 py-4',
      className
    )}>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Touch instructions for mobile */}
      {isMobile && editMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">{translations.touchToEdit}</p>
          <p className="text-xs text-blue-600">
            {translations.dragToReorder} • {translations.longPressToMove}
          </p>
        </div>
      )}

      {/* Widget Board */}
      <DndContext 
        sensors={sensors}
        collisionDetection={mobileCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext 
          items={arrangedWidgets.map(w => w.id)}
          strategy={isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy}
        >
          {arrangedWidgets.length === 0 ? (
            <EmptyState />
          ) : (
            <MobileGestureHandler
              enabled={enableGestures && isMobile}
              onSwipeLeft={(widgetId) => handleWidgetRemove(widgetId)}
              onLongPress={(widgetId) => setSelectedWidget(widgetId)}
            >
              {isMobile || currentLayoutMode === 'stack' ? (
                <MobileWidgetList />
              ) : (
                <TabletGridLayout />
              )}
            </MobileGestureHandler>
          )}
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedWidget && (
            <div className="opacity-50 transform rotate-2 scale-105">
              <MobileWidgetContainer
                widget={draggedWidget}
                isEditable={false}
                isExpanded={false}
                enableGestures={false}
                onRemove={() => {}}
                onConfigure={() => {}}
                onExpand={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Mobile Widget Picker */}
      <MobileWidgetPicker
        open={showWidgetPicker}
        onOpenChange={setShowWidgetPicker}
        onWidgetSelect={(widgetType) => {
          // Handle widget selection
          setShowWidgetPicker(false)
          toast({
            title: translations.widgetAdded,
            description: `${widgetType} widget lagt til`,
            duration: 2000
          })
        }}
        maxWidgets={maxWidgets}
        currentWidgetCount={widgets.length}
      />

      {/* Debug info (development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs">
          <h4 className="font-medium mb-2">Mobile Debug Info</h4>
          <div className="space-y-1">
            <div>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
            <div>Touch: {isTouch ? 'Yes' : 'No'}</div>
            <div>Orientation: {orientation}</div>
            <div>Screen: {width}x{height}</div>
            <div>Layout Mode: {currentLayoutMode}</div>
            <div>Edit Mode: {editMode ? 'Yes' : 'No'}</div>
            <div>Gestures: {enableGestures ? 'Enabled' : 'Disabled'}</div>
            <div>Widgets: {widgets.length}/{maxWidgets}</div>
          </div>
        </div>
      )}
    </div>
  )
}