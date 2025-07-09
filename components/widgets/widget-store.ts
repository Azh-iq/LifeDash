import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  WidgetState,
  WidgetAction,
  WidgetEvent,
  WidgetEventHandler,
  WidgetInstance,
  WidgetPerformanceMetrics,
  WidgetGridLayout,
  WidgetGridCell,
  WidgetDragData,
  WidgetDropTarget,
} from './widget-types'
import { WidgetLayoutRow, WidgetType, WidgetCategory, WidgetSize } from '@/lib/types/widget.types'
import { widgetRegistry } from './widget-registry'

// Extended widget state with additional functionality
interface ExtendedWidgetState extends WidgetState {
  // Layout management
  activeLayoutId: string | null
  layouts: Record<string, WidgetInstance[]>
  
  // Selection and editing
  selectedWidgets: string[]
  editMode: boolean
  
  // Drag and drop
  draggedWidget: string | null
  dropTargets: WidgetDropTarget[]
  
  // Configuration
  configuringWidget: string | null
  
  // Performance and analytics
  metrics: Record<string, WidgetPerformanceMetrics>
  
  // Loading and error states
  loading: boolean
  error: string | null
  
  // Grid layout management
  gridLayout: WidgetGridLayout
  
  // Event system
  eventHandlers: Map<string, WidgetEventHandler[]>
  
  // Real-time updates
  realTimeEnabled: boolean
  autoRefreshInterval: number
  
  // Theme and customization
  theme: string
  compactMode: boolean
  
  // User preferences
  preferences: {
    defaultGridColumns: number
    defaultGridGap: string
    animationsEnabled: boolean
    autoSave: boolean
    showPerformanceMetrics: boolean
  }
}

// Widget store actions
interface WidgetStoreActions {
  // Layout management
  setActiveLayout: (layoutId: string) => void
  createLayout: (layoutId: string, widgets?: WidgetInstance[]) => void
  deleteLayout: (layoutId: string) => void
  duplicateLayout: (sourceLayoutId: string, targetLayoutId: string) => void
  
  // Widget management
  addWidget: (layoutId: string, widget: WidgetInstance) => void
  removeWidget: (layoutId: string, widgetId: string) => void
  updateWidget: (layoutId: string, widgetId: string, updates: Partial<WidgetInstance>) => void
  moveWidget: (layoutId: string, widgetId: string, position: { row: number; column: number }) => void
  resizeWidget: (layoutId: string, widgetId: string, size: { rowSpan: number; columnSpan: number }) => void
  
  // Selection management
  selectWidget: (widgetId: string) => void
  selectMultipleWidgets: (widgetIds: string[]) => void
  deselectWidget: (widgetId: string) => void
  clearSelection: () => void
  
  // Edit mode
  setEditMode: (enabled: boolean) => void
  
  // Drag and drop
  startDrag: (widgetId: string, dragData: WidgetDragData) => void
  updateDragTargets: (targets: WidgetDropTarget[]) => void
  endDrag: () => void
  
  // Configuration
  startConfiguration: (widgetId: string) => void
  endConfiguration: () => void
  
  // Performance tracking
  updateMetrics: (widgetId: string, metrics: WidgetPerformanceMetrics) => void
  clearMetrics: (widgetId?: string) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Grid layout
  updateGridLayout: (layout: WidgetGridLayout) => void
  recalculateGrid: (layoutId: string) => void
  
  // Event system
  addEventListener: (event: string, handler: WidgetEventHandler) => void
  removeEventListener: (event: string, handler: WidgetEventHandler) => void
  dispatchEvent: (event: WidgetEvent) => void
  
  // Utility functions
  getWidget: (layoutId: string, widgetId: string) => WidgetInstance | undefined
  getWidgetsByType: (layoutId: string, type: WidgetType) => WidgetInstance[]
  getWidgetsByCategory: (layoutId: string, category: WidgetCategory) => WidgetInstance[]
  
  // Validation
  validateWidgetPosition: (layoutId: string, widgetId: string, position: { row: number; column: number }) => boolean
  validateWidgetSize: (layoutId: string, widgetId: string, size: { rowSpan: number; columnSpan: number }) => boolean
  
  // Import/Export
  exportLayout: (layoutId: string) => Promise<string>
  importLayout: (layoutId: string, data: string) => Promise<void>
  
  // Reset and cleanup
  reset: () => void
  cleanup: () => void
}

// Initial state
const initialState: ExtendedWidgetState = {
  activeLayoutId: null,
  layouts: {},
  selectedWidgets: [],
  editMode: false,
  draggedWidget: null,
  dropTargets: [],
  configuringWidget: null,
  metrics: {},
  loading: false,
  error: null,
  gridLayout: {
    rows: 10,
    columns: 4,
    cells: [],
    widgets: new Map(),
  },
  eventHandlers: new Map(),
  realTimeEnabled: true,
  autoRefreshInterval: 300000, // 5 minutes
  theme: 'light',
  compactMode: false,
  preferences: {
    defaultGridColumns: 2,
    defaultGridGap: 'md',
    animationsEnabled: true,
    autoSave: true,
    showPerformanceMetrics: false,
  },
}

// Create the store
export const useWidgetStore = create<ExtendedWidgetState & WidgetStoreActions>()()
  (devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,
          
          // Layout management
          setActiveLayout: (layoutId: string) => set((state) => {
            state.activeLayoutId = layoutId
            if (!state.layouts[layoutId]) {
              state.layouts[layoutId] = []
            }
            get().recalculateGrid(layoutId)
          }),
          
          createLayout: (layoutId: string, widgets: WidgetInstance[] = []) => set((state) => {
            state.layouts[layoutId] = widgets
            if (!state.activeLayoutId) {
              state.activeLayoutId = layoutId
            }
            get().recalculateGrid(layoutId)
          }),
          
          deleteLayout: (layoutId: string) => set((state) => {
            delete state.layouts[layoutId]
            if (state.activeLayoutId === layoutId) {
              const remainingLayouts = Object.keys(state.layouts)
              state.activeLayoutId = remainingLayouts.length > 0 ? remainingLayouts[0] : null
            }
          }),
          
          duplicateLayout: (sourceLayoutId: string, targetLayoutId: string) => set((state) => {
            const sourceLayout = state.layouts[sourceLayoutId]
            if (sourceLayout) {
              state.layouts[targetLayoutId] = sourceLayout.map(widget => ({
                ...widget,
                id: `${widget.id}_copy_${Date.now()}`,
                created: new Date(),
                updated: new Date(),
              }))
            }
          }),
          
          // Widget management
          addWidget: (layoutId: string, widget: WidgetInstance) => set((state) => {
            if (!state.layouts[layoutId]) {
              state.layouts[layoutId] = []
            }
            state.layouts[layoutId].push(widget)
            get().recalculateGrid(layoutId)
            get().dispatchEvent({
              type: 'widget:created',
              widgetId: widget.id,
              layoutId,
              timestamp: new Date(),
              data: widget,
            })
          }),
          
          removeWidget: (layoutId: string, widgetId: string) => set((state) => {
            if (state.layouts[layoutId]) {
              state.layouts[layoutId] = state.layouts[layoutId].filter(w => w.id !== widgetId)
              state.selectedWidgets = state.selectedWidgets.filter(id => id !== widgetId)
              delete state.metrics[widgetId]
              get().recalculateGrid(layoutId)
              get().dispatchEvent({
                type: 'widget:deleted',
                widgetId,
                layoutId,
                timestamp: new Date(),
              })
            }
          }),
          
          updateWidget: (layoutId: string, widgetId: string, updates: Partial<WidgetInstance>) => set((state) => {
            if (state.layouts[layoutId]) {
              const widget = state.layouts[layoutId].find(w => w.id === widgetId)
              if (widget) {
                Object.assign(widget, updates)
                widget.updated = new Date()
                get().recalculateGrid(layoutId)
                get().dispatchEvent({
                  type: 'widget:updated',
                  widgetId,
                  layoutId,
                  timestamp: new Date(),
                  data: updates,
                })
              }
            }
          }),
          
          moveWidget: (layoutId: string, widgetId: string, position: { row: number; column: number }) => set((state) => {
            if (state.layouts[layoutId]) {
              const widget = state.layouts[layoutId].find(w => w.id === widgetId)
              if (widget) {
                widget.position.row = position.row
                widget.position.column = position.column
                widget.updated = new Date()
                get().recalculateGrid(layoutId)
                get().dispatchEvent({
                  type: 'widget:moved',
                  widgetId,
                  layoutId,
                  timestamp: new Date(),
                  data: position,
                })
              }
            }
          }),
          
          resizeWidget: (layoutId: string, widgetId: string, size: { rowSpan: number; columnSpan: number }) => set((state) => {
            if (state.layouts[layoutId]) {
              const widget = state.layouts[layoutId].find(w => w.id === widgetId)
              if (widget) {
                widget.position.rowSpan = size.rowSpan
                widget.position.columnSpan = size.columnSpan
                widget.updated = new Date()
                get().recalculateGrid(layoutId)
                get().dispatchEvent({
                  type: 'widget:resized',
                  widgetId,
                  layoutId,
                  timestamp: new Date(),
                  data: size,
                })
              }
            }
          }),
          
          // Selection management
          selectWidget: (widgetId: string) => set((state) => {
            if (!state.selectedWidgets.includes(widgetId)) {
              state.selectedWidgets.push(widgetId)
            }
          }),
          
          selectMultipleWidgets: (widgetIds: string[]) => set((state) => {
            state.selectedWidgets = [...new Set([...state.selectedWidgets, ...widgetIds])]
          }),
          
          deselectWidget: (widgetId: string) => set((state) => {
            state.selectedWidgets = state.selectedWidgets.filter(id => id !== widgetId)
          }),
          
          clearSelection: () => set((state) => {
            state.selectedWidgets = []
          }),
          
          // Edit mode
          setEditMode: (enabled: boolean) => set((state) => {
            state.editMode = enabled
            if (!enabled) {
              state.selectedWidgets = []
              state.draggedWidget = null
              state.dropTargets = []
            }
          }),
          
          // Drag and drop
          startDrag: (widgetId: string, dragData: WidgetDragData) => set((state) => {
            state.draggedWidget = widgetId
          }),
          
          updateDragTargets: (targets: WidgetDropTarget[]) => set((state) => {
            state.dropTargets = targets
          }),
          
          endDrag: () => set((state) => {
            state.draggedWidget = null
            state.dropTargets = []
          }),
          
          // Configuration
          startConfiguration: (widgetId: string) => set((state) => {
            state.configuringWidget = widgetId
          }),
          
          endConfiguration: () => set((state) => {
            state.configuringWidget = null
          }),
          
          // Performance tracking
          updateMetrics: (widgetId: string, metrics: WidgetPerformanceMetrics) => set((state) => {
            state.metrics[widgetId] = metrics
          }),
          
          clearMetrics: (widgetId?: string) => set((state) => {
            if (widgetId) {
              delete state.metrics[widgetId]
            } else {
              state.metrics = {}
            }
          }),
          
          // State management
          setLoading: (loading: boolean) => set((state) => {
            state.loading = loading
          }),
          
          setError: (error: string | null) => set((state) => {
            state.error = error
          }),
          
          // Grid layout
          updateGridLayout: (layout: WidgetGridLayout) => set((state) => {
            state.gridLayout = layout
          }),
          
          recalculateGrid: (layoutId: string) => set((state) => {
            const widgets = state.layouts[layoutId] || []
            const rows = state.gridLayout.rows
            const columns = state.gridLayout.columns
            
            // Initialize grid cells
            const cells: WidgetGridCell[][] = []
            for (let row = 0; row < rows; row++) {
              cells[row] = []
              for (let col = 0; col < columns; col++) {
                cells[row][col] = {
                  row,
                  column: col,
                  occupied: false,
                  canPlace: true,
                }
              }
            }
            
            // Mark occupied cells
            widgets.forEach(widget => {
              const { row, column, rowSpan, columnSpan } = widget.position
              for (let r = row; r < row + rowSpan && r < rows; r++) {
                for (let c = column; c < column + columnSpan && c < columns; c++) {
                  if (cells[r] && cells[r][c]) {
                    cells[r][c].occupied = true
                    cells[r][c].widgetId = widget.id
                    cells[r][c].canPlace = false
                  }
                }
              }
            })
            
            // Update grid layout
            state.gridLayout = {
              rows,
              columns,
              cells,
              widgets: new Map(widgets.map(w => [w.id, w])),
            }
          }),
          
          // Event system
          addEventListener: (event: string, handler: WidgetEventHandler) => set((state) => {
            if (!state.eventHandlers.has(event)) {
              state.eventHandlers.set(event, [])
            }
            state.eventHandlers.get(event)!.push(handler)
          }),
          
          removeEventListener: (event: string, handler: WidgetEventHandler) => set((state) => {
            const handlers = state.eventHandlers.get(event)
            if (handlers) {
              const index = handlers.indexOf(handler)
              if (index > -1) {
                handlers.splice(index, 1)
              }
            }
          }),
          
          dispatchEvent: (event: WidgetEvent) => {
            const handlers = get().eventHandlers.get(event.type)
            if (handlers) {
              handlers.forEach(handler => {
                try {
                  handler(event)
                } catch (error) {
                  console.error('Error in widget event handler:', error)
                }
              })
            }
          },
          
          // Utility functions
          getWidget: (layoutId: string, widgetId: string) => {
            return get().layouts[layoutId]?.find(w => w.id === widgetId)
          },
          
          getWidgetsByType: (layoutId: string, type: WidgetType) => {
            return get().layouts[layoutId]?.filter(w => w.type === type) || []
          },
          
          getWidgetsByCategory: (layoutId: string, category: WidgetCategory) => {
            return get().layouts[layoutId]?.filter(w => w.category === category) || []
          },
          
          // Validation
          validateWidgetPosition: (layoutId: string, widgetId: string, position: { row: number; column: number }) => {
            const state = get()
            const widget = state.getWidget(layoutId, widgetId)
            if (!widget) return false
            
            const { row, column } = position
            const { rowSpan, columnSpan } = widget.position
            
            // Check bounds
            if (row < 0 || column < 0 || 
                row + rowSpan > state.gridLayout.rows || 
                column + columnSpan > state.gridLayout.columns) {
              return false
            }
            
            // Check for conflicts with other widgets
            const otherWidgets = state.layouts[layoutId]?.filter(w => w.id !== widgetId) || []
            for (const otherWidget of otherWidgets) {
              const { row: otherRow, column: otherColumn, rowSpan: otherRowSpan, columnSpan: otherColumnSpan } = otherWidget.position
              
              // Check if rectangles overlap
              if (!(row >= otherRow + otherRowSpan || 
                    otherRow >= row + rowSpan || 
                    column >= otherColumn + otherColumnSpan || 
                    otherColumn >= column + columnSpan)) {
                return false
              }
            }
            
            return true
          },
          
          validateWidgetSize: (layoutId: string, widgetId: string, size: { rowSpan: number; columnSpan: number }) => {
            const state = get()
            const widget = state.getWidget(layoutId, widgetId)
            if (!widget) return false
            
            const registration = widgetRegistry.get(widget.type)
            if (!registration) return false
            
            const { rowSpan, columnSpan } = size
            const { row, column } = widget.position
            
            // Check bounds
            if (row + rowSpan > state.gridLayout.rows || 
                column + columnSpan > state.gridLayout.columns) {
              return false
            }
            
            // Check against widget constraints
            const { minGridSize, maxGridSize } = registration
            if (rowSpan < minGridSize.rows || columnSpan < minGridSize.columns || 
                rowSpan > maxGridSize.rows || columnSpan > maxGridSize.columns) {
              return false
            }
            
            return true
          },
          
          // Import/Export
          exportLayout: async (layoutId: string) => {
            const state = get()
            const layout = state.layouts[layoutId]
            if (!layout) throw new Error('Layout not found')
            
            const exportData = {
              layoutId,
              widgets: layout,
              metadata: {
                exported: new Date().toISOString(),
                version: '1.0.0',
                theme: state.theme,
              },
            }
            
            return JSON.stringify(exportData, null, 2)
          },
          
          importLayout: async (layoutId: string, data: string) => {
            try {
              const importData = JSON.parse(data)
              const { widgets } = importData
              
              set((state) => {
                state.layouts[layoutId] = widgets.map((widget: any) => ({
                  ...widget,
                  id: `${widget.id}_imported_${Date.now()}`,
                  created: new Date(),
                  updated: new Date(),
                }))
              })
              
              get().recalculateGrid(layoutId)
            } catch (error) {
              throw new Error('Invalid layout data')
            }
          },
          
          // Reset and cleanup
          reset: () => set(() => ({ ...initialState })),
          
          cleanup: () => set((state) => {
            // Clear event handlers
            state.eventHandlers.clear()
            
            // Clear metrics
            state.metrics = {}
            
            // Reset selection and drag state
            state.selectedWidgets = []
            state.draggedWidget = null
            state.dropTargets = []
            state.configuringWidget = null
            
            // Reset error state
            state.error = null
            state.loading = false
          }),
        }))
      ),
      {
        name: 'widget-store',
        partialize: (state) => ({
          layouts: state.layouts,
          activeLayoutId: state.activeLayoutId,
          theme: state.theme,
          compactMode: state.compactMode,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'widget-store',
    }
  ))

// Selectors
export const useActiveLayout = () => useWidgetStore(state => state.activeLayoutId)
export const useWidgets = (layoutId?: string) => useWidgetStore(state => 
  layoutId ? state.layouts[layoutId] || [] : state.activeLayoutId ? state.layouts[state.activeLayoutId] || [] : []
)
export const useSelectedWidgets = () => useWidgetStore(state => state.selectedWidgets)
export const useEditMode = () => useWidgetStore(state => state.editMode)
export const useDragState = () => useWidgetStore(state => ({
  draggedWidget: state.draggedWidget,
  dropTargets: state.dropTargets,
}))
export const useWidgetMetrics = (widgetId?: string) => useWidgetStore(state => 
  widgetId ? state.metrics[widgetId] : state.metrics
)
export const useGridLayout = () => useWidgetStore(state => state.gridLayout)
export const useWidgetError = () => useWidgetStore(state => state.error)
export const useWidgetLoading = () => useWidgetStore(state => state.loading)

// Action hooks
export const useWidgetActions = () => {
  const store = useWidgetStore()
  return {
    setActiveLayout: store.setActiveLayout,
    addWidget: store.addWidget,
    removeWidget: store.removeWidget,
    updateWidget: store.updateWidget,
    moveWidget: store.moveWidget,
    resizeWidget: store.resizeWidget,
    selectWidget: store.selectWidget,
    clearSelection: store.clearSelection,
    setEditMode: store.setEditMode,
    startDrag: store.startDrag,
    endDrag: store.endDrag,
    updateMetrics: store.updateMetrics,
    setError: store.setError,
    setLoading: store.setLoading,
    recalculateGrid: store.recalculateGrid,
    dispatchEvent: store.dispatchEvent,
  }
}

// Performance monitoring hook
export const useWidgetPerformance = (widgetId: string) => {
  const metrics = useWidgetMetrics(widgetId)
  const updateMetrics = useWidgetStore(state => state.updateMetrics)
  
  const recordRenderTime = (time: number) => {
    const currentMetrics = metrics || {
      widgetId,
      type: 'CUSTOM_WIDGET' as WidgetType,
      renderTime: 0,
      mountTime: 0,
      updateCount: 0,
      memoryUsage: 0,
      viewCount: 0,
      interactionCount: 0,
      dataLoadTime: 0,
      dataUpdateCount: 0,
      errorCount: 0,
      created: new Date(),
      lastUpdated: new Date(),
    }
    
    updateMetrics(widgetId, {
      ...currentMetrics,
      renderTime: time,
      updateCount: currentMetrics.updateCount + 1,
      lastUpdated: new Date(),
    })
  }
  
  const recordInteraction = () => {
    const currentMetrics = metrics || {
      widgetId,
      type: 'CUSTOM_WIDGET' as WidgetType,
      renderTime: 0,
      mountTime: 0,
      updateCount: 0,
      memoryUsage: 0,
      viewCount: 0,
      interactionCount: 0,
      dataLoadTime: 0,
      dataUpdateCount: 0,
      errorCount: 0,
      created: new Date(),
      lastUpdated: new Date(),
    }
    
    updateMetrics(widgetId, {
      ...currentMetrics,
      interactionCount: currentMetrics.interactionCount + 1,
      lastUpdated: new Date(),
    })
  }
  
  return {
    metrics,
    recordRenderTime,
    recordInteraction,
  }
}

// Layout management hook
export const useLayoutManager = () => {
  const store = useWidgetStore()
  
  return {
    createLayout: store.createLayout,
    deleteLayout: store.deleteLayout,
    duplicateLayout: store.duplicateLayout,
    exportLayout: store.exportLayout,
    importLayout: store.importLayout,
    activeLayoutId: store.activeLayoutId,
    layouts: Object.keys(store.layouts),
  }
}

// Event system hook
export const useWidgetEvents = () => {
  const store = useWidgetStore()
  
  return {
    addEventListener: store.addEventListener,
    removeEventListener: store.removeEventListener,
    dispatchEvent: store.dispatchEvent,
  }
}

// Grid utilities
export const useGridUtils = () => {
  const store = useWidgetStore()
  
  return {
    validatePosition: store.validateWidgetPosition,
    validateSize: store.validateWidgetSize,
    recalculateGrid: store.recalculateGrid,
    gridLayout: store.gridLayout,
  }
}

// Theme and preferences
export const useWidgetPreferences = () => {
  const store = useWidgetStore()
  
  return {
    theme: store.theme,
    compactMode: store.compactMode,
    preferences: store.preferences,
  }
}
