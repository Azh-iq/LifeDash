'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  Trash2, 
  Move,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Grip,
  Eye,
  Edit3,
  Maximize,
  Minimize,
  Smartphone,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import { Widget, WidgetCategory } from '../widget-types'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'

interface MobileWidgetContainerProps {
  widget: Widget
  isEditable: boolean
  isExpanded: boolean
  enableGestures: boolean
  onRemove: () => void
  onConfigure: () => void
  onExpand: () => void
}

// Mobile-specific size configurations
const mobileWidgetSizes = {
  small: {
    collapsed: 'h-32',
    expanded: 'h-48',
    minHeight: 'min-h-[8rem]'
  },
  medium: {
    collapsed: 'h-40',
    expanded: 'h-64',
    minHeight: 'min-h-[10rem]'
  },
  large: {
    collapsed: 'h-48',
    expanded: 'h-80',
    minHeight: 'min-h-[12rem]'
  },
  hero: {
    collapsed: 'h-56',
    expanded: 'h-96',
    minHeight: 'min-h-[14rem]'
  }
}

// Category theme integration
const categoryThemes = {
  stocks: {
    accent: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    header: 'bg-blue-500',
    icon: 'text-blue-600'
  },
  crypto: {
    accent: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    header: 'bg-amber-500',
    icon: 'text-amber-600'
  },
  art: {
    accent: 'bg-pink-50 border-pink-200',
    badge: 'bg-pink-100 text-pink-800',
    header: 'bg-pink-500',
    icon: 'text-pink-600'
  },
  other: {
    accent: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
    header: 'bg-green-500',
    icon: 'text-green-600'
  }
}

// Norwegian translations
const translations = {
  configure: 'Konfigurer',
  remove: 'Fjern',
  expand: 'Utvid',
  collapse: 'Kollaps',
  edit: 'Rediger',
  view: 'Vis',
  loading: 'Laster...',
  error: 'Feil',
  noData: 'Ingen data',
  refresh: 'Oppdater',
  swipeToDelete: 'Sveip for å slette',
  longPressToMove: 'Trykk lenge for å flytte',
  touchToExpand: 'Trykk for å utvide',
  dragToReorder: 'Dra for å endre rekkefølge',
  mobileOptimized: 'Mobile optimert',
  gestures: 'Bevegelser',
  touchFriendly: 'Berøringsvennlig'
}

/**
 * Mobile Widget Container Component
 * 
 * Features:
 * - Touch-optimized interactions
 * - Swipe gestures for quick actions
 * - Expandable/collapsible design
 * - Mobile-first responsive behavior
 * - Category-based theming
 * - Drag handle for reordering
 * - Long press support
 * - Haptic feedback simulation
 */
export function MobileWidgetContainer({
  widget,
  isEditable,
  isExpanded,
  enableGestures,
  onRemove,
  onConfigure,
  onExpand
}: MobileWidgetContainerProps) {
  const { isMobile, isTablet, isTouch } = useResponsiveLayout()
  const [isPressed, setIsPressed] = useState(false)
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id: widget.id,
    disabled: !isEditable || !enableGestures
  })

  // Motion values for swipe gestures
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5])
  const scale = useTransform(x, [-100, 0, 100], [0.9, 1, 0.9])
  const backgroundColor = useTransform(
    x,
    [-100, -50, 0, 50, 100],
    ['#fee2e2', '#fef3c7', '#ffffff', '#fef3c7', '#fee2e2']
  )

  // Get theme for category
  const theme = categoryThemes[widget.category] || categoryThemes.other
  const sizeConfig = mobileWidgetSizes[widget.size || 'medium']

  // Transform for drag and drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  }

  // Handle long press start
  const handlePressStart = useCallback(() => {
    if (!isEditable || !enableGestures) return
    
    setIsPressed(true)
    const timer = setTimeout(() => {
      setIsSwipeEnabled(true)
      // Simulate haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 300)
    setLongPressTimer(timer)
  }, [isEditable, enableGestures])

  // Handle long press end
  const handlePressEnd = useCallback(() => {
    setIsPressed(false)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  // Handle swipe gesture
  const handleSwipe = useCallback((info: PanInfo) => {
    if (!isSwipeEnabled || !enableGestures) return

    const { offset, velocity } = info
    
    // Swipe right to remove
    if (offset.x > 100 || velocity.x > 500) {
      onRemove()
      return
    }
    
    // Swipe left for actions
    if (offset.x < -100 || velocity.x < -500) {
      setShowActions(true)
      return
    }
    
    // Reset position
    x.set(0)
  }, [isSwipeEnabled, enableGestures, onRemove, x])

  // Handle widget refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mobile header with drag handle
  const MobileHeader = () => (
    <CardHeader className={cn(
      'pb-3',
      theme.accent,
      'border-b border-gray-200'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag handle */}
          {isEditable && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded touch-none"
            >
              <Grip className={cn("h-4 w-4", theme.icon)} />
            </div>
          )}
          
          {/* Widget title */}
          <CardTitle className="text-sm font-medium truncate flex-1">
            {widget.title || widget.type}
          </CardTitle>
          
          {/* Category badge */}
          <Badge 
            variant="secondary" 
            className={cn("text-xs", theme.badge)}
          >
            {widget.category}
          </Badge>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          
          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {translations.refresh}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="h-4 w-4 mr-2" />
                {translations.configure}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {translations.remove}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
  )

  // Mobile content area
  const MobileContent = () => (
    <CardContent className={cn(
      'p-4',
      isExpanded ? sizeConfig.expanded : sizeConfig.collapsed,
      'transition-all duration-300'
    )}>
      {/* Widget content placeholder */}
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className={cn(
            "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
            theme.accent
          )}>
            <Smartphone className={cn("h-6 w-6", theme.icon)} />
          </div>
          <p className="text-sm text-gray-600 mb-2">{widget.type}</p>
          <p className="text-xs text-gray-500">
            {isExpanded ? 'Expanded view' : 'Collapsed view'}
          </p>
          {isMobile && (
            <Badge variant="outline" className="mt-2 text-xs">
              {translations.mobileOptimized}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  )

  // Gesture indicators (mobile only)
  const GestureIndicators = () => {
    if (!isMobile || !enableGestures || !isEditable) return null
    
    return (
      <div className="absolute bottom-2 left-2 right-2 flex justify-center">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>← {translations.swipeToDelete}</span>
          <span>↕ {translations.dragToReorder}</span>
          <span>⟳ {translations.longPressToMove}</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50',
        isOver && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      drag={enableGestures && isSwipeEnabled ? 'x' : false}
      dragConstraints={{ left: -150, right: 150 }}
      onDragEnd={handleSwipe}
      onPanStart={handlePressStart}
      onPanEnd={handlePressEnd}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        y: isDragging ? -5 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Card className={cn(
        'w-full overflow-hidden',
        theme.accent,
        'border-2',
        isPressed && 'ring-2 ring-blue-400',
        isDragging && 'shadow-lg rotate-1',
        'transition-all duration-200'
      )}>
        <MobileHeader />
        <MobileContent />
        <GestureIndicators />
      </Card>
      
      {/* Swipe action overlay */}
      {isSwipeEnabled && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-red-500 text-white rounded-lg opacity-0"
          animate={{
            opacity: Math.abs(x.get()) > 50 ? 1 : 0
          }}
        >
          <Trash2 className="h-6 w-6" />
        </motion.div>
      )}
    </motion.div>
  )
}