// Simple widget types for the current WidgetGrid system
// These complement the complex widget-types.ts for the enhanced system

export interface Widget {
  id: string
  type: string
  category: WidgetCategory
  title: string
  size: WidgetSize
  position: {
    row: number
    column: number
  }
  configuration?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type WidgetType = string // Keep it simple for now

export interface WidgetLayout {
  id: string
  userId: string
  name: string
  widgets: Widget[]
  configuration: {
    columns: number
    gap: 'sm' | 'md' | 'lg'
    theme: string
  }
  createdAt: Date
  updatedAt: Date
}

export type WidgetCategory = 'STOCKS' | 'CRYPTO' | 'ART' | 'OTHER'
export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'HERO'

// React Grid Layout types
export interface GridLayoutItem {
  i: string // widget id
  x: number // column position
  y: number // row position
  w: number // width in grid units
  h: number // height in grid units
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  resizeHandles?: string[]
}

export interface GridLayoutConfig {
  breakpoints: {
    lg: number
    md: number
    sm: number
    xs: number
    xxs: number
  }
  cols: {
    lg: number
    md: number
    sm: number
    xs: number
    xxs: number
  }
  rowHeight: number
  margin: [number, number]
  containerPadding: [number, number]
  draggableHandle?: string
  resizeHandle?: string
  preventCollision?: boolean
}

// Widget size mappings for react-grid-layout
export const WIDGET_SIZE_MAPPINGS: Record<WidgetSize, { w: number; h: number }> = {
  SMALL: { w: 1, h: 1 },
  MEDIUM: { w: 2, h: 2 },
  LARGE: { w: 3, h: 3 },
  HERO: { w: 4, h: 4 }
}

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridLayoutConfig = {
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0
  },
  cols: {
    lg: 12,
    md: 8,
    sm: 6,
    xs: 4,
    xxs: 2
  },
  rowHeight: 100,
  margin: [16, 16],
  containerPadding: [16, 16],
  draggableHandle: '.widget-drag-handle',
  resizeHandle: '.widget-resize-handle',
  preventCollision: false
}