import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  Widget,
  WidgetLayout,
  WidgetCategory,
  WidgetSize,
  WidgetType,
} from './simple-widget-types'

interface WidgetPerformance {
  renderTime: number
  loadTime: number
  memoryUsage: number
  lastUpdated: Date
}

interface WidgetState {
  // Layout Management
  layouts: Record<string, WidgetLayout>
  activeLayoutId: string | null

  // Widget Management
  widgets: Record<string, Widget>

  // UI State
  editMode: boolean
  selectedWidget: string | null
  draggedWidget: string | null

  // Performance Monitoring
  performance: WidgetPerformance

  // History Management
  history: Widget[][]
  historyIndex: number
  maxHistorySize: number

  // Loading and Error States
  isLoading: boolean
  error: string | null

  // Actions
  setEditMode: (editMode: boolean) => void
  setSelectedWidget: (widgetId: string | null) => void
  setDraggedWidget: (widgetId: string | null) => void

  // Layout Actions
  createLayout: (layoutId: string, layout?: Partial<WidgetLayout>) => void
  updateLayout: (layoutId: string, layout: Partial<WidgetLayout>) => void
  deleteLayout: (layoutId: string) => void
  duplicateLayout: (layoutId: string, newId: string) => void
  setActiveLayout: (layoutId: string) => void

  // Widget Actions
  addWidget: (widget: Widget) => void
  removeWidget: (widgetId: string) => void
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void
  moveWidget: (
    widgetId: string,
    newPosition: { row: number; column: number }
  ) => void
  resizeWidget: (widgetId: string, newSize: WidgetSize) => void
  duplicateWidget: (widgetId: string, newId: string) => void

  // History Actions
  addToHistory: (widgets: Widget[]) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void

  // Performance Actions
  updatePerformance: (performance: Partial<WidgetPerformance>) => void

  // Utility Actions
  clearError: () => void
  setLoading: (isLoading: boolean) => void

  // Persistence Actions
  saveToStorage: () => void
  loadFromStorage: () => void

  // Bulk Actions
  bulkUpdateWidgets: (updates: Record<string, Partial<Widget>>) => void
  bulkRemoveWidgets: (widgetIds: string[]) => void
}

// Default performance metrics
const defaultPerformance: WidgetPerformance = {
  renderTime: 0,
  loadTime: 0,
  memoryUsage: 0,
  lastUpdated: new Date(),
}

// Default widget layout
const createDefaultLayout = (id: string): WidgetLayout => ({
  id,
  userId: '',
  name: 'Default Layout',
  widgets: [],
  configuration: {
    columns: 3,
    gap: 'md',
    theme: 'default',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
})

export const useWidgetStore = create<WidgetState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // Initial State
          layouts: {},
          activeLayoutId: null,
          widgets: {},
          editMode: false,
          selectedWidget: null,
          draggedWidget: null,
          performance: defaultPerformance,
          history: [],
          historyIndex: -1,
          maxHistorySize: 50,
          isLoading: false,
          error: null,

          // UI Actions
          setEditMode: editMode => set({ editMode }),
          setSelectedWidget: selectedWidget => set({ selectedWidget }),
          setDraggedWidget: draggedWidget => set({ draggedWidget }),

          // Layout Actions
          createLayout: (layoutId, layout) => {
            set(state => {
              const newLayout = {
                ...createDefaultLayout(layoutId),
                ...layout,
              }
              state.layouts[layoutId] = newLayout
              if (!state.activeLayoutId) {
                state.activeLayoutId = layoutId
              }
            })
          },

          updateLayout: (layoutId, layout) => {
            set(state => {
              if (state.layouts[layoutId]) {
                state.layouts[layoutId] = {
                  ...state.layouts[layoutId],
                  ...layout,
                  updatedAt: new Date(),
                }
              }
            })
          },

          deleteLayout: layoutId => {
            set(state => {
              delete state.layouts[layoutId]
              if (state.activeLayoutId === layoutId) {
                state.activeLayoutId = Object.keys(state.layouts)[0] || null
              }
            })
          },

          duplicateLayout: (layoutId, newId) => {
            set(state => {
              const original = state.layouts[layoutId]
              if (original) {
                state.layouts[newId] = {
                  ...original,
                  id: newId,
                  name: `${original.name} (Copy)`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              }
            })
          },

          setActiveLayout: layoutId => {
            set(state => {
              if (state.layouts[layoutId]) {
                state.activeLayoutId = layoutId
              }
            })
          },

          // Widget Actions
          addWidget: widget => {
            set(state => {
              state.widgets[widget.id] = widget

              // Add to active layout if exists
              if (state.activeLayoutId && state.layouts[state.activeLayoutId]) {
                const layout = state.layouts[state.activeLayoutId]
                layout.widgets.push({
                  id: widget.id,
                  type: widget.type,
                  category: widget.category,
                  title: widget.title,
                  size: widget.size,
                  position: widget.position,
                  configuration: widget.configuration || {},
                })
                layout.updatedAt = new Date()
              }
            })
          },

          removeWidget: widgetId => {
            set(state => {
              // Remove from widgets
              delete state.widgets[widgetId]

              // Remove from active layout
              if (state.activeLayoutId && state.layouts[state.activeLayoutId]) {
                const layout = state.layouts[state.activeLayoutId]
                layout.widgets = layout.widgets.filter(w => w.id !== widgetId)
                layout.updatedAt = new Date()
              }

              // Clear selection if this widget was selected
              if (state.selectedWidget === widgetId) {
                state.selectedWidget = null
              }
            })
          },

          updateWidget: (widgetId, updates) => {
            set(state => {
              if (state.widgets[widgetId]) {
                state.widgets[widgetId] = {
                  ...state.widgets[widgetId],
                  ...updates,
                  updatedAt: new Date(),
                }

                // Update in active layout as well
                if (
                  state.activeLayoutId &&
                  state.layouts[state.activeLayoutId]
                ) {
                  const layout = state.layouts[state.activeLayoutId]
                  const widgetIndex = layout.widgets.findIndex(
                    w => w.id === widgetId
                  )
                  if (widgetIndex !== -1) {
                    layout.widgets[widgetIndex] = {
                      ...layout.widgets[widgetIndex],
                      ...updates,
                    }
                    layout.updatedAt = new Date()
                  }
                }
              }
            })
          },

          moveWidget: (widgetId, newPosition) => {
            set(state => {
              if (state.widgets[widgetId]) {
                state.widgets[widgetId].position = newPosition
                state.widgets[widgetId].updatedAt = new Date()
              }
            })
          },

          resizeWidget: (widgetId, newSize) => {
            set(state => {
              if (state.widgets[widgetId]) {
                state.widgets[widgetId].size = newSize
                state.widgets[widgetId].updatedAt = new Date()
              }
            })
          },

          duplicateWidget: (widgetId, newId) => {
            set(state => {
              const original = state.widgets[widgetId]
              if (original) {
                state.widgets[newId] = {
                  ...original,
                  id: newId,
                  title: `${original.title} (Copy)`,
                  position: {
                    row: original.position.row + 1,
                    column: original.position.column,
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              }
            })
          },

          // History Actions
          addToHistory: widgets => {
            set(state => {
              // Remove items after current index
              state.history = state.history.slice(0, state.historyIndex + 1)

              // Add new state
              state.history.push(widgets)
              state.historyIndex = state.history.length - 1

              // Limit history size
              if (state.history.length > state.maxHistorySize) {
                state.history = state.history.slice(-state.maxHistorySize)
                state.historyIndex = state.history.length - 1
              }
            })
          },

          undo: () => {
            set(state => {
              if (state.historyIndex > 0) {
                state.historyIndex -= 1
                const previousState = state.history[state.historyIndex]

                // Restore widgets from history
                state.widgets = {}
                previousState.forEach(widget => {
                  state.widgets[widget.id] = widget
                })
              }
            })
          },

          redo: () => {
            set(state => {
              if (state.historyIndex < state.history.length - 1) {
                state.historyIndex += 1
                const nextState = state.history[state.historyIndex]

                // Restore widgets from history
                state.widgets = {}
                nextState.forEach(widget => {
                  state.widgets[widget.id] = widget
                })
              }
            })
          },

          clearHistory: () => {
            set(state => {
              state.history = []
              state.historyIndex = -1
            })
          },

          // Performance Actions
          updatePerformance: performance => {
            set(state => {
              state.performance = {
                ...state.performance,
                ...performance,
                lastUpdated: new Date(),
              }
            })
          },

          // Utility Actions
          clearError: () => set({ error: null }),
          setLoading: isLoading => set({ isLoading }),

          // Persistence Actions
          saveToStorage: () => {
            try {
              const state = get()
              const dataToSave = {
                layouts: state.layouts,
                widgets: state.widgets,
                activeLayoutId: state.activeLayoutId,
                performance: state.performance,
              }
              localStorage.setItem(
                'lifedash-widget-state',
                JSON.stringify(dataToSave)
              )
            } catch (error) {
              console.error('Failed to save widget state:', error)
            }
          },

          loadFromStorage: () => {
            try {
              const saved = localStorage.getItem('lifedash-widget-state')
              if (saved) {
                const parsedData = JSON.parse(saved)
                set(state => {
                  state.layouts = parsedData.layouts || {}
                  state.widgets = parsedData.widgets || {}
                  state.activeLayoutId = parsedData.activeLayoutId || null
                  state.performance =
                    parsedData.performance || defaultPerformance
                })
              }
            } catch (error) {
              console.error('Failed to load widget state:', error)
            }
          },

          // Bulk Actions
          bulkUpdateWidgets: updates => {
            set(state => {
              Object.entries(updates).forEach(([widgetId, widgetUpdates]) => {
                if (state.widgets[widgetId]) {
                  state.widgets[widgetId] = {
                    ...state.widgets[widgetId],
                    ...widgetUpdates,
                    updatedAt: new Date(),
                  }
                }
              })
            })
          },

          bulkRemoveWidgets: widgetIds => {
            set(state => {
              widgetIds.forEach(widgetId => {
                delete state.widgets[widgetId]

                // Remove from active layout
                if (
                  state.activeLayoutId &&
                  state.layouts[state.activeLayoutId]
                ) {
                  const layout = state.layouts[state.activeLayoutId]
                  layout.widgets = layout.widgets.filter(w => w.id !== widgetId)
                  layout.updatedAt = new Date()
                }
              })

              // Clear selection if selected widget was removed
              if (widgetIds.includes(state.selectedWidget!)) {
                state.selectedWidget = null
              }
            })
          },
        }),
        {
          name: 'lifedash-widget-store',
          partialize: state => ({
            layouts: state.layouts,
            widgets: state.widgets,
            activeLayoutId: state.activeLayoutId,
            performance: state.performance,
          }),
        }
      )
    )
  )
)

// Selectors for derived state
export const useWidgetActions = () =>
  useWidgetStore(state => ({
    setEditMode: state.setEditMode,
    setSelectedWidget: state.setSelectedWidget,
    setDraggedWidget: state.setDraggedWidget,
    createLayout: state.createLayout,
    updateLayout: state.updateLayout,
    deleteLayout: state.deleteLayout,
    duplicateLayout: state.duplicateLayout,
    setActiveLayout: state.setActiveLayout,
    addWidget: state.addWidget,
    removeWidget: state.removeWidget,
    updateWidget: state.updateWidget,
    moveWidget: state.moveWidget,
    resizeWidget: state.resizeWidget,
    duplicateWidget: state.duplicateWidget,
    addToHistory: state.addToHistory,
    undo: state.undo,
    redo: state.redo,
    clearHistory: state.clearHistory,
    updatePerformance: state.updatePerformance,
    clearError: state.clearError,
    setLoading: state.setLoading,
    bulkUpdateWidgets: state.bulkUpdateWidgets,
    bulkRemoveWidgets: state.bulkRemoveWidgets,
  }))

export const useActiveLayout = () =>
  useWidgetStore(state => {
    const activeLayoutId = state.activeLayoutId
    return activeLayoutId ? state.layouts[activeLayoutId] : null
  })

export const useActiveWidgets = () =>
  useWidgetStore(state => {
    const activeLayout = state.activeLayoutId
      ? state.layouts[state.activeLayoutId]
      : null
    if (!activeLayout) return []

    return activeLayout.widgets.map(w => state.widgets[w.id]).filter(Boolean)
  })

export const useWidgetById = (widgetId: string) =>
  useWidgetStore(state => state.widgets[widgetId])

export const useCanUndo = () => useWidgetStore(state => state.historyIndex > 0)
export const useCanRedo = () =>
  useWidgetStore(state => state.historyIndex < state.history.length - 1)

// Performance monitor hook
export const usePerformanceMonitor = () => {
  const updatePerformance = useWidgetStore(state => state.updatePerformance)

  return {
    startRender: () => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        updatePerformance({ renderTime: endTime - startTime })
      }
    },
    startLoad: () => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        updatePerformance({ loadTime: endTime - startTime })
      }
    },
    updateMemoryUsage: (memoryUsage: number) => {
      updatePerformance({ memoryUsage })
    },
  }
}
