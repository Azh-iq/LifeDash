'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Modern components import disabled for now
// import {
//   ModernButton,
//   ModernCard,
//   ModernLoading,
//   ModernTooltip,
//   ModernWidgetAction
// } from '../ui/modern-ui-components'
import {
  GripVertical,
  Settings,
  X,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Refresh,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useWidgetStore } from '../widget-store'
import {
  Widget,
  WidgetSize,
  WidgetCategory,
  WidgetType,
} from './simple-widget-types'

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
    text: 'text-purple-700',
  },
  CRYPTO: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
  ART: {
    primary: '#ec4899',
    secondary: '#f472b6',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
  },
  OTHER: {
    primary: '#10b981',
    secondary: '#34d399',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
}

// Widget size configurations
const sizeConfigs = {
  SMALL: {
    height: 'h-32',
    minHeight: 'min-h-32',
    gridSpan: 'col-span-1',
    label: 'Liten',
  },
  MEDIUM: {
    height: 'h-48',
    minHeight: 'min-h-48',
    gridSpan: 'col-span-1',
    label: 'Middels',
  },
  LARGE: {
    height: 'h-64',
    minHeight: 'min-h-64',
    gridSpan: 'col-span-2',
    label: 'Stor',
  },
  HERO: {
    height: 'h-80',
    minHeight: 'min-h-80',
    gridSpan: 'col-span-2 lg:col-span-3',
    label: 'Hero',
  },
}

export function WidgetContainer({
  widget,
  children,
  isEditable = false,
  onRemove,
  onConfigure,
  onResize,
  className,
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
    disabled: !isEditable || !editMode,
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
      className={cn('group relative', sizeConfig.gridSpan, className)}
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
          'w-full transition-all duration-300',
          sizeConfig.height,
          sizeConfig.minHeight,
          isSelected && editMode && 'ring-2 ring-purple-500 ring-offset-2',
          isDragging && 'rotate-2 scale-105 shadow-2xl',
          isExpanded && 'fixed inset-4 z-50 h-auto',
          isLoading && 'opacity-50',
          'border-white/20 bg-white/10 backdrop-blur-lg',
          isHovered && 'border-white/30 bg-white/20 shadow-2xl'
        )}
      >
        {/* Widget Header */}
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              {isEditable && editMode && (
                <ModernButton
                  variant="ghost"
                  size="sm"
                  glassmorphism={true}
                  className="widget-drag-handle h-6 w-6 cursor-grab p-1 active:cursor-grabbing"
                  {...listeners}
                >
                  <GripVertical className="h-3 w-3" />
                </ModernButton>
              )}

              {/* Widget Title */}
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {widget.title}

                {/* Category Badge */}
                <Badge
                  variant="secondary"
                  className={cn('px-2 py-0.5 text-xs', theme.bg, theme.text)}
                >
                  {widget.category}
                </Badge>
              </CardTitle>
            </div>

            {/* Widget Actions */}
            <div className="flex items-center gap-1">
              {/* Refresh Button */}
              <ModernWidgetAction
                icon={
                  <Refresh
                    className={cn('h-3 w-3', isLoading && 'animate-spin')}
                  />
                }
                label="Oppdater widget"
                onClick={() => handleRefresh()}
                disabled={isLoading}
                loading={isLoading}
                variant="secondary"
                glassmorphism={true}
              />

              {/* Expand/Collapse Button */}
              <ModernWidgetAction
                icon={
                  isExpanded ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )
                }
                label={isExpanded ? 'Minimer widget' : 'Utvid widget'}
                onClick={() => setIsExpanded(!isExpanded)}
                variant="secondary"
                glassmorphism={true}
              />

              {/* Widget Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    glassmorphism={true}
                    className="h-6 w-6 p-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </ModernButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="mr-2 h-4 w-4" />
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
                    <X className="mr-2 h-4 w-4" />
                    Fjern
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="h-full overflow-auto p-4 pt-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center"
              >
                <ModernLoading
                  size="md"
                  variant="dots"
                  message="Oppdaterer..."
                  glassmorphism={true}
                />
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
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-blue-500/10" />
        )}
      </Card>
    </motion.div>
  )
}
