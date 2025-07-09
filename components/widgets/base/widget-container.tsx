"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical, 
  Settings, 
  X, 
  Maximize2, 
  Minimize2,
  MoreHorizontal,
  Refresh
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useWidgetStore } from '../widget-store'
import { Widget, WidgetSize, WidgetCategory } from '../widget-types'

interface WidgetContainerProps {
  widget: Widget
  children: React.ReactNode
  isEditable?: boolean
  onRemove?: () => void
  onConfigure?: () => void
  onResize?: (size: WidgetSize) => void
  className?: string
}

// Category theme colors from LifeDash
const categoryThemes = {
  STOCKS: { 
    primary: '#6366f1', 
    secondary: '#a855f7',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700'
  },
  CRYPTO: { 
    primary: '#f59e0b', 
    secondary: '#fbbf24',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700'
  },
  ART: { 
    primary: '#ec4899', 
    secondary: '#f472b6',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700'
  },
  OTHER: { 
    primary: '#10b981', 
    secondary: '#34d399',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700'
  }
}

// Widget size configurations
const sizeConfigs = {
  SMALL: { 
    height: 'h-32', 
    minHeight: 'min-h-32',
    gridSpan: 'col-span-1',
    label: 'Liten'
  },
  MEDIUM: { 
    height: 'h-48', 
    minHeight: 'min-h-48',
    gridSpan: 'col-span-1',
    label: 'Middels'
  },
  LARGE: { 
    height: 'h-64', 
    minHeight: 'min-h-64',
    gridSpan: 'col-span-2',
    label: 'Stor'
  },
  HERO: { 
    height: 'h-80', 
    minHeight: 'min-h-80',
    gridSpan: 'col-span-2 lg:col-span-3',
    label: 'Hero'
  }
}

export function WidgetContainer({ 
  widget, 
  children, 
  isEditable = false,
  onRemove,
  onConfigure,
  onResize,
  className 
}: WidgetContainerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { selectedWidget, setSelectedWidget, editMode } = useWidgetStore()
  const isSelected = selectedWidget === widget.id

  // Get theme based on category
  const theme = categoryThemes[widget.category as WidgetCategory]
  const sizeConfig = sizeConfigs[widget.size]

  // Sortable setup for drag-and-drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: widget.id,
    disabled: !isEditable || !editMode
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Handle refresh action
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // Trigger widget refresh - this would be implemented by the parent component
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock refresh
    } finally {
      setIsLoading(false)
    }
  }

  // Handle widget selection
  const handleSelect = () => {
    if (editMode) {
      setSelectedWidget(isSelected ? null : widget.id)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && editMode) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            onRemove?.()
            break
          case 'Enter':
            e.preventDefault()
            onConfigure?.()
            break
          case 'Escape':
            setSelectedWidget(null)
            break
        }
      }
    }

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, editMode, onRemove, onConfigure, setSelectedWidget])

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        sizeConfig.gridSpan,
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
      {...attributes}
    >
      <Card 
        className={cn(
          'w-full transition-all duration-200',
          sizeConfig.height,
          sizeConfig.minHeight,
          isSelected && editMode && 'ring-2 ring-blue-500 ring-offset-2',
          isDragging && 'shadow-lg scale-105 rotate-2',
          theme.border,
          'border-2 border-dashed border-transparent',
          isHovered && 'border-gray-300',
          isExpanded && 'fixed inset-4 z-50 h-auto',
          isLoading && 'opacity-75'
        )}
      >
        {/* Widget Header */}
        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              {isEditable && editMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-grab active:cursor-grabbing p-1 h-6 w-6"
                  {...listeners}
                >
                  <GripVertical className="h-3 w-3" />
                </Button>
              )}
              
              {/* Widget Title */}
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {widget.title}
                
                {/* Category Badge */}
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs px-2 py-0.5',
                    theme.bg,
                    theme.text
                  )}
                >
                  {widget.category}
                </Badge>
              </CardTitle>
            </div>

            {/* Widget Actions */}
            <div className="flex items-center gap-1">
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRefresh()
                }}
                disabled={isLoading}
              >
                <Refresh className={cn(
                  "h-3 w-3", 
                  isLoading && "animate-spin"
                )} />
              </Button>

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>

              {/* Widget Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="h-4 w-4 mr-2" />
                    Konfigurer
                  </DropdownMenuItem>
                  
                  {/* Size Options */}
                  <DropdownMenuSeparator />
                  {Object.entries(sizeConfigs).map(([size, config]) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => onResize?.(size as WidgetSize)}
                      className={widget.size === size ? 'bg-accent' : ''}
                    >
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onRemove}
                    className="text-red-600 focus:text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Fjern
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="p-4 pt-0 h-full overflow-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-500">Oppdaterer...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Selection Overlay */}
        {isSelected && editMode && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none" />
        )}
      </Card>
    </motion.div>
  )
}