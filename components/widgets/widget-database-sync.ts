import React from 'react'
import {
  getUserWidgetLayouts,
  createWidgetLayout,
  updateWidgetLayout,
  deleteWidgetLayout,
} from '@/lib/actions/widgets/layouts'
import {
  getUserWidgetPreferences,
  updateWidgetPreferences,
} from '@/lib/actions/widgets/preferences'
import type {
  WidgetLayoutRow,
  WidgetPreferencesRow,
  WidgetInstance,
} from '@/lib/types/widget.types'
import { useWidgetStore } from './widget-store'

// Extended widget store with database sync
export interface WidgetStorePersistence {
  // Database sync methods
  loadFromDatabase: () => Promise<void>
  saveToDatabase: () => Promise<void>
  syncLayoutsWithDatabase: () => Promise<void>
  syncPreferencesWithDatabase: () => Promise<void>

  // Auto-save functionality
  enableAutoSave: () => void
  disableAutoSave: () => void

  // Database state
  lastSyncTime: Date | null
  syncInProgress: boolean
  syncError: string | null
}

// Convert database row to widget instance
const convertRowToWidget = (row: WidgetLayoutRow): WidgetInstance => ({
  id: row.id,
  type: row.widget_type,
  category: row.widget_category,
  size: row.widget_size,
  title: row.title || '',
  description: row.description || '',
  position: {
    row: row.grid_row,
    column: row.grid_column,
    rowSpan: row.grid_row_span,
    columnSpan: row.grid_column_span,
  },
  config: row.widget_config || {},
  visible: row.is_active,
  created: new Date(row.created_at),
  updated: new Date(row.updated_at),
})

// Convert widget instance to database insert
const convertWidgetToInsert = (widget: WidgetInstance, layoutId: string) => ({
  layout_name: layoutId,
  layout_type: layoutId.split('_')[0] as
    | 'dashboard'
    | 'portfolio'
    | 'stock'
    | 'custom',
  widget_type: widget.type,
  widget_category: widget.category,
  widget_size: widget.size,
  grid_row: widget.position.row,
  grid_column: widget.position.column,
  grid_row_span: widget.position.rowSpan,
  grid_column_span: widget.position.columnSpan,
  widget_config: widget.config,
  title: widget.title,
  description: widget.description,
  is_active: widget.visible,
  show_header: true,
  show_footer: false,
  mobile_hidden: false,
})

// Add database sync methods to the widget store
export const useWidgetDatabaseSync = () => {
  const store = useWidgetStore()

  const loadFromDatabase = async () => {
    try {
      store.setLoading(true)
      store.setError(null)

      // Load layouts
      const layoutsResponse = await getUserWidgetLayouts()
      if (layoutsResponse.success && layoutsResponse.data) {
        // Convert database rows to widget instances
        const layouts = layoutsResponse.data.reduce(
          (acc, row) => {
            const layoutId = `${row.layout_type}_${row.stock_symbol || row.portfolio_id || 'default'}`
            if (!acc[layoutId]) acc[layoutId] = []

            acc[layoutId].push(convertRowToWidget(row))

            return acc
          },
          {} as Record<string, WidgetInstance[]>
        )

        // Update store with loaded layouts
        Object.entries(layouts).forEach(([layoutId, widgets]) => {
          store.createLayout(layoutId, widgets)
        })

        // Set active layout if none is set
        if (!store.activeLayoutId && Object.keys(layouts).length > 0) {
          store.setActiveLayout(Object.keys(layouts)[0])
        }
      }

      // Load preferences
      const prefsResponse = await getUserWidgetPreferences()
      if (prefsResponse.success && prefsResponse.data) {
        const prefs = prefsResponse.data
        // Update store preferences
        store.theme = prefs.default_theme
        store.compactMode = prefs.compact_mode
        store.autoRefreshInterval = prefs.auto_refresh_interval * 1000
        store.preferences = {
          defaultGridColumns: prefs.grid_columns,
          defaultGridGap: prefs.grid_gap,
          animationsEnabled: prefs.animation_enabled,
          autoSave: true,
          showPerformanceMetrics: false,
        }
      }
    } catch (error) {
      console.error('Database sync error:', error)
      store.setError('Failed to load data from database')
    } finally {
      store.setLoading(false)
    }
  }

  const saveToDatabase = async () => {
    try {
      if (!store.activeLayoutId) return

      const activeWidgets = store.layouts[store.activeLayoutId] || []

      // Save each widget as a layout entry
      for (const widget of activeWidgets) {
        const insertData = convertWidgetToInsert(widget, store.activeLayoutId)

        // Try to update first, then create if not exists
        const updateResult = await updateWidgetLayout(widget.id, insertData)

        if (!updateResult.success) {
          // Create new layout entry
          const createResult = await createWidgetLayout({
            ...insertData,
            user_id: '', // Will be set by the action
          })

          if (!createResult.success) {
            console.error('Failed to save widget:', createResult.error)
          }
        }
      }

      // Save preferences
      await updateWidgetPreferences({
        default_theme: store.theme,
        compact_mode: store.compactMode,
        auto_refresh_interval: Math.floor(store.autoRefreshInterval / 1000),
        grid_columns: store.preferences.defaultGridColumns,
        grid_gap: store.preferences.defaultGridGap,
        animation_enabled: store.preferences.animationsEnabled,
      })
    } catch (error) {
      console.error('Save to database error:', error)
      store.setError('Failed to save data to database')
    }
  }

  const syncLayoutsWithDatabase = async () => {
    // Implementation for syncing layouts
    await loadFromDatabase()
  }

  const syncPreferencesWithDatabase = async () => {
    // Implementation for syncing preferences
    const prefsResponse = await getUserWidgetPreferences()
    if (prefsResponse.success && prefsResponse.data) {
      const prefs = prefsResponse.data
      store.theme = prefs.default_theme
      store.compactMode = prefs.compact_mode
      store.autoRefreshInterval = prefs.auto_refresh_interval * 1000
      store.preferences = {
        defaultGridColumns: prefs.grid_columns,
        defaultGridGap: prefs.grid_gap,
        animationsEnabled: prefs.animation_enabled,
        autoSave: true,
        showPerformanceMetrics: false,
      }
    }
  }

  // Auto-save functionality
  let autoSaveInterval: NodeJS.Timeout | null = null

  const enableAutoSave = () => {
    if (autoSaveInterval) return

    autoSaveInterval = setInterval(async () => {
      if (store.preferences.autoSave) {
        await saveToDatabase()
      }
    }, 30000) // Save every 30 seconds
  }

  const disableAutoSave = () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }
  }

  return {
    loadFromDatabase,
    saveToDatabase,
    syncLayoutsWithDatabase,
    syncPreferencesWithDatabase,
    enableAutoSave,
    disableAutoSave,
    syncInProgress: store.loading,
    syncError: store.error,
    lastSyncTime: null, // Could be tracked in store
  }
}

// Hook to initialize database sync
export const useInitializeWidgetSync = () => {
  const sync = useWidgetDatabaseSync()

  // Initialize sync on mount
  React.useEffect(() => {
    sync.loadFromDatabase()
    sync.enableAutoSave()

    return () => {
      sync.disableAutoSave()
    }
  }, [])

  return sync
}

// Export types for use in other components
export type { WidgetStorePersistence }
