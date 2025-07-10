'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type {
  WidgetConfig,
  WidgetType,
  WidgetCategory,
  WidgetSize,
  WidgetLayoutInsert,
  WidgetLayoutUpdate,
  WidgetLayoutResponse,
  ChartWidgetConfig,
  TableWidgetConfig,
  MetricsWidgetConfig,
  NewsWidgetConfig,
  AlertsWidgetConfig,
} from '@/lib/types/widget.types'

// Configuration validation schemas
const baseConfigSchema = z.object({
  refreshInterval: z.number().min(30).max(3600).optional(),
  showLoadingStates: z.boolean().optional(),
  showErrorStates: z.boolean().optional(),
  customTitle: z.string().optional(),
  customDescription: z.string().optional(),
  showHeader: z.boolean().optional(),
  showFooter: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

const chartConfigSchema = baseConfigSchema.extend({
  chartType: z.enum(['line', 'candlestick', 'area', 'bar']).optional(),
  chartTheme: z.enum(['default', 'dark', 'minimal', 'colorful']).optional(),
  showVolume: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  showTechnicalIndicators: z.boolean().optional(),
  indicators: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
  showLegend: z.boolean().optional(),
  height: z.number().min(200).max(800).optional(),
})

const tableConfigSchema = baseConfigSchema.extend({
  columns: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  pageSize: z.number().min(5).max(50).optional(),
  showPagination: z.boolean().optional(),
  showSearch: z.boolean().optional(),
  showFilters: z.boolean().optional(),
  compactMode: z.boolean().optional(),
})

const metricsConfigSchema = baseConfigSchema.extend({
  metrics: z.array(z.string()).optional(),
  showPercentageChange: z.boolean().optional(),
  showSparklines: z.boolean().optional(),
  compactView: z.boolean().optional(),
  colorScheme: z.enum(['default', 'colorful', 'minimal']).optional(),
})

const newsConfigSchema = baseConfigSchema.extend({
  sources: z.array(z.string()).optional(),
  maxItems: z.number().min(5).max(50).optional(),
  showImages: z.boolean().optional(),
  showSummary: z.boolean().optional(),
  filterBySymbol: z.boolean().optional(),
})

const alertsConfigSchema = baseConfigSchema.extend({
  alertTypes: z.array(z.string()).optional(),
  showNotifications: z.boolean().optional(),
  autoMarkAsRead: z.boolean().optional(),
  maxItems: z.number().min(5).max(50).optional(),
})

/**
 * Validate widget configuration based on widget type
 */
export function validateWidgetConfig(
  widgetType: WidgetType,
  config: WidgetConfig
): WidgetConfig {
  try {
    switch (widgetType) {
      case 'HERO_PORTFOLIO_CHART':
      case 'CATEGORY_MINI_CHART':
      case 'STOCK_PERFORMANCE_CHART':
        return chartConfigSchema.parse(config)
      case 'HOLDINGS_TABLE_RICH':
        return tableConfigSchema.parse(config)
      case 'METRICS_GRID':
      case 'PERFORMANCE_METRICS':
        return metricsConfigSchema.parse(config)
      case 'NEWS_FEED':
        return newsConfigSchema.parse(config)
      case 'PRICE_ALERTS':
        return alertsConfigSchema.parse(config)
      default:
        return baseConfigSchema.parse(config)
    }
  } catch (error) {
    console.error('Widget config validation error:', error)
    throw new Error('Invalid widget configuration')
  }
}

/**
 * Save widget configuration to database
 */
export async function saveWidgetConfiguration(
  widgetLayoutId: string,
  config: WidgetConfig
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Get current widget layout
    const { data: currentLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching widget layout:', fetchError)
      return {
        success: false,
        error: 'Widget layout not found',
      }
    }

    // Validate configuration
    const validatedConfig = validateWidgetConfig(
      currentLayout.widget_type,
      config
    )

    // Update widget configuration
    const { data: updatedLayout, error: updateError } = await supabase
      .from('widget_layouts')
      .update({
        widget_config: validatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating widget configuration:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to save widget configuration',
      }
    }

    // Revalidate pages that use this widget
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    revalidatePath(`/stocks/${currentLayout.stock_symbol}`)

    return {
      success: true,
      data: [updatedLayout],
    }
  } catch (error) {
    console.error('Save widget configuration error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Create new widget with configuration
 */
export async function createWidgetWithConfig(
  widgetData: Omit<WidgetLayoutInsert, 'user_id'>,
  config: WidgetConfig
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate configuration
    const validatedConfig = validateWidgetConfig(widgetData.widget_type, config)

    // Create widget with configuration
    const newWidget: WidgetLayoutInsert = {
      ...widgetData,
      user_id: user.id,
      widget_config: validatedConfig,
    }

    const { data: createdWidget, error: createError } = await supabase
      .from('widget_layouts')
      .insert(newWidget)
      .select()
      .single()

    if (createError) {
      console.error('Error creating widget:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to create widget',
      }
    }

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (widgetData.stock_symbol) {
      revalidatePath(`/stocks/${widgetData.stock_symbol}`)
    }

    return {
      success: true,
      data: [createdWidget],
    }
  } catch (error) {
    console.error('Create widget with config error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Update widget configuration and layout properties
 */
export async function updateWidgetConfigAndLayout(
  widgetLayoutId: string,
  updates: Partial<WidgetLayoutUpdate>,
  config?: WidgetConfig
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Get current widget layout
    const { data: currentLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching widget layout:', fetchError)
      return {
        success: false,
        error: 'Widget layout not found',
      }
    }

    // Prepare updates
    const updateData: WidgetLayoutUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Validate and add configuration if provided
    if (config) {
      const validatedConfig = validateWidgetConfig(
        currentLayout.widget_type,
        config
      )
      updateData.widget_config = validatedConfig
    }

    // Update widget
    const { data: updatedLayout, error: updateError } = await supabase
      .from('widget_layouts')
      .update(updateData)
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating widget:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to update widget',
      }
    }

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (currentLayout.stock_symbol) {
      revalidatePath(`/stocks/${currentLayout.stock_symbol}`)
    }

    return {
      success: true,
      data: [updatedLayout],
    }
  } catch (error) {
    console.error('Update widget config and layout error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get widget configuration by ID
 */
export async function getWidgetConfiguration(
  widgetLayoutId: string
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Fetch widget configuration
    const { data: widgetLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching widget configuration:', fetchError)
      return {
        success: false,
        error: 'Widget configuration not found',
      }
    }

    return {
      success: true,
      data: [widgetLayout],
    }
  } catch (error) {
    console.error('Get widget configuration error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Reset widget configuration to defaults
 */
export async function resetWidgetConfiguration(
  widgetLayoutId: string,
  defaultConfig: WidgetConfig
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Get current widget layout
    const { data: currentLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching widget layout:', fetchError)
      return {
        success: false,
        error: 'Widget layout not found',
      }
    }

    // Validate default configuration
    const validatedConfig = validateWidgetConfig(
      currentLayout.widget_type,
      defaultConfig
    )

    // Reset configuration
    const { data: updatedLayout, error: updateError } = await supabase
      .from('widget_layouts')
      .update({
        widget_config: validatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error resetting widget configuration:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to reset widget configuration',
      }
    }

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (currentLayout.stock_symbol) {
      revalidatePath(`/stocks/${currentLayout.stock_symbol}`)
    }

    return {
      success: true,
      data: [updatedLayout],
    }
  } catch (error) {
    console.error('Reset widget configuration error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Bulk update widget configurations
 */
export async function bulkUpdateWidgetConfigurations(
  updates: Array<{
    widgetLayoutId: string
    config: WidgetConfig
  }>
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const updatedLayouts = []

    // Process each update
    for (const update of updates) {
      const { widgetLayoutId, config } = update

      // Get current widget layout
      const { data: currentLayout, error: fetchError } = await supabase
        .from('widget_layouts')
        .select('*')
        .eq('id', widgetLayoutId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching widget layout:', fetchError)
        continue
      }

      // Validate configuration
      const validatedConfig = validateWidgetConfig(
        currentLayout.widget_type,
        config
      )

      // Update widget configuration
      const { data: updatedLayout, error: updateError } = await supabase
        .from('widget_layouts')
        .update({
          widget_config: validatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', widgetLayoutId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating widget configuration:', updateError)
        continue
      }

      updatedLayouts.push(updatedLayout)
    }

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: updatedLayouts,
    }
  } catch (error) {
    console.error('Bulk update widget configurations error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Export widget configuration
 */
export async function exportWidgetConfiguration(
  widgetLayoutId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Fetch widget configuration
    const { data: widgetLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', widgetLayoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching widget configuration:', fetchError)
      return {
        success: false,
        error: 'Widget configuration not found',
      }
    }

    // Create export data
    const exportData = {
      widget_type: widgetLayout.widget_type,
      widget_category: widgetLayout.widget_category,
      widget_size: widgetLayout.widget_size,
      widget_config: widgetLayout.widget_config,
      title: widgetLayout.title,
      description: widgetLayout.description,
      show_header: widgetLayout.show_header,
      show_footer: widgetLayout.show_footer,
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by: user.id,
        version: '1.0.0',
      },
    }

    return {
      success: true,
      data: exportData,
    }
  } catch (error) {
    console.error('Export widget configuration error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Import widget configuration
 */
export async function importWidgetConfiguration(
  layoutName: string,
  importData: any
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate import data
    if (!importData.widget_type || !importData.widget_config) {
      return {
        success: false,
        error: 'Invalid import data',
      }
    }

    // Validate configuration
    const validatedConfig = validateWidgetConfig(
      importData.widget_type,
      importData.widget_config
    )

    // Create widget from import data
    const newWidget: WidgetLayoutInsert = {
      user_id: user.id,
      layout_name: layoutName,
      layout_type: 'custom',
      widget_type: importData.widget_type,
      widget_category: importData.widget_category || 'STOCKS',
      widget_size: importData.widget_size || 'MEDIUM',
      grid_row: 0,
      grid_column: 0,
      grid_row_span: 1,
      grid_column_span: 1,
      widget_config: validatedConfig,
      title: importData.title,
      description: importData.description,
      show_header: importData.show_header ?? true,
      show_footer: importData.show_footer ?? true,
      mobile_hidden: false,
    }

    const { data: createdWidget, error: createError } = await supabase
      .from('widget_layouts')
      .insert(newWidget)
      .select()
      .single()

    if (createError) {
      console.error('Error importing widget configuration:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to import widget configuration',
      }
    }

    // Revalidate pages
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: [createdWidget],
    }
  } catch (error) {
    console.error('Import widget configuration error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
