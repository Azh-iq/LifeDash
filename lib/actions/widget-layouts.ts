'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type {
  WidgetLayoutInsert,
  WidgetLayoutUpdate,
  WidgetLayoutRow,
  WidgetLayoutResponse,
  LayoutType,
  WidgetType,
  WidgetCategory,
  WidgetSize,
  WidgetConfig,
  ResponsiveWidgetConfig,
} from '@/lib/types/widget.types'

// Enhanced validation schemas
const widgetConfigSchema = z
  .object({
    refreshInterval: z.number().min(30).max(3600).optional(),
    showLoadingStates: z.boolean().optional(),
    showErrorStates: z.boolean().optional(),
    customTitle: z.string().max(200).optional(),
    customDescription: z.string().max(500).optional(),
    showHeader: z.boolean().optional(),
    showFooter: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    chartType: z.enum(['line', 'candlestick', 'area', 'bar']).optional(),
    timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).optional(),
    showVolume: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    autoRefresh: z.boolean().optional(),
    compact: z.boolean().optional(),
    showLegend: z.boolean().optional(),
    animationsEnabled: z.boolean().optional(),
    // Category-specific configs
    stocksConfig: z
      .object({
        showMarketCap: z.boolean().optional(),
        showPERatio: z.boolean().optional(),
        showDividendYield: z.boolean().optional(),
        showSector: z.boolean().optional(),
      })
      .optional(),
    portfolioConfig: z
      .object({
        showAllocation: z.boolean().optional(),
        showPerformance: z.boolean().optional(),
        showRebalancing: z.boolean().optional(),
        defaultCurrency: z.enum(['NOK', 'USD', 'EUR']).optional(),
      })
      .optional(),
  })
  .passthrough()

const responsiveConfigSchema = z.object({
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'HERO']).optional(),
  gridRowSpan: z.number().min(1).max(4).optional(),
  gridColumnSpan: z.number().min(1).max(4).optional(),
  hidden: z.boolean().optional(),
  config: widgetConfigSchema.optional(),
})

const createWidgetLayoutSchema = z.object({
  portfolio_id: z.string().uuid().optional(),
  stock_symbol: z
    .string()
    .regex(/^[A-Z0-9]{1,10}$/)
    .optional(),
  layout_name: z.string().min(1).max(100),
  layout_type: z.enum(['dashboard', 'portfolio', 'stock', 'custom']),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  widget_type: z.enum([
    'HERO_PORTFOLIO_CHART',
    'CATEGORY_MINI_CHART',
    'STOCK_PERFORMANCE_CHART',
    'HOLDINGS_TABLE_RICH',
    'METRICS_GRID',
    'ACTIVITY_FEED',
    'TOP_NAVIGATION_ENHANCED',
    'CATEGORY_SELECTOR',
    'STOCK_DETAIL_CARD',
    'TRANSACTION_HISTORY',
    'PRICE_ALERTS',
    'NEWS_FEED',
    'PORTFOLIO_ALLOCATION',
    'PERFORMANCE_METRICS',
    'WATCHLIST',
    'CUSTOM_WIDGET',
  ]),
  widget_category: z
    .enum(['STOCKS', 'CRYPTO', 'ART', 'OTHER'])
    .default('STOCKS'),
  widget_size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'HERO']).default('MEDIUM'),
  grid_row: z.number().min(1).max(10),
  grid_column: z.number().min(1).max(4),
  grid_row_span: z.number().min(1).max(4).default(1),
  grid_column_span: z.number().min(1).max(4).default(1),
  widget_config: widgetConfigSchema.optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  show_header: z.boolean().default(true),
  show_footer: z.boolean().default(false),
  mobile_hidden: z.boolean().default(false),
  tablet_config: responsiveConfigSchema.optional(),
  mobile_config: responsiveConfigSchema.optional(),
})

const updateWidgetLayoutSchema = createWidgetLayoutSchema.partial().extend({
  id: z.string().uuid(),
})

const bulkUpdateSchema = z.object({
  layouts: z.array(updateWidgetLayoutSchema),
})

const layoutExportSchema = z.object({
  layoutId: z.string().uuid().optional(),
  layoutType: z.enum(['dashboard', 'portfolio', 'stock', 'custom']).optional(),
  includeUserData: z.boolean().default(false),
  includePreferences: z.boolean().default(false),
})

const layoutImportSchema = z.object({
  layoutData: z.object({
    layouts: z.array(createWidgetLayoutSchema),
    preferences: z.object({}).passthrough().optional(),
    metadata: z
      .object({
        version: z.string(),
        exportedAt: z.string(),
        exportedBy: z.string().optional(),
      })
      .optional(),
  }),
  overwriteExisting: z.boolean().default(false),
  preservePositions: z.boolean().default(true),
})

interface LayoutExportData {
  layouts: WidgetLayoutRow[]
  preferences?: any
  metadata: {
    version: string
    exportedAt: string
    exportedBy: string
  }
}

interface LayoutImportResult {
  success: boolean
  importedLayouts: number
  errors: string[]
  warnings: string[]
}

/**
 * Enhanced widget layout actions with persistence features
 */

/**
 * Create a new widget layout with validation and conflict resolution
 */
export async function createWidgetLayout(
  formData: FormData | WidgetLayoutInsert
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
        error: 'Godkjenning kreves',
      }
    }

    // Parse and validate data
    let rawData: any
    if (formData instanceof FormData) {
      rawData = {
        portfolio_id: (formData.get('portfolio_id') as string) || undefined,
        stock_symbol: (formData.get('stock_symbol') as string) || undefined,
        layout_name: formData.get('layout_name') as string,
        layout_type: formData.get('layout_type') as LayoutType,
        is_default: formData.get('is_default') === 'true',
        is_active: formData.get('is_active') !== 'false',
        widget_type: formData.get('widget_type') as WidgetType,
        widget_category:
          (formData.get('widget_category') as WidgetCategory) || 'STOCKS',
        widget_size: (formData.get('widget_size') as WidgetSize) || 'MEDIUM',
        grid_row: parseInt(formData.get('grid_row') as string),
        grid_column: parseInt(formData.get('grid_column') as string),
        grid_row_span: parseInt(formData.get('grid_row_span') as string) || 1,
        grid_column_span:
          parseInt(formData.get('grid_column_span') as string) || 1,
        widget_config: formData.get('widget_config')
          ? JSON.parse(formData.get('widget_config') as string)
          : {},
        title: (formData.get('title') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
        show_header: formData.get('show_header') !== 'false',
        show_footer: formData.get('show_footer') === 'true',
        mobile_hidden: formData.get('mobile_hidden') === 'true',
        tablet_config: formData.get('tablet_config')
          ? JSON.parse(formData.get('tablet_config') as string)
          : undefined,
        mobile_config: formData.get('mobile_config')
          ? JSON.parse(formData.get('mobile_config') as string)
          : undefined,
      }
    } else {
      rawData = formData
    }

    const validatedData = createWidgetLayoutSchema.parse(rawData)

    // Check for position conflicts
    const conflictCheck = await supabase
      .from('widget_layouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('layout_type', validatedData.layout_type)
      .eq('is_active', true)
      .gte('grid_row', validatedData.grid_row)
      .lt('grid_row', validatedData.grid_row + validatedData.grid_row_span)
      .gte('grid_column', validatedData.grid_column)
      .lt(
        'grid_column',
        validatedData.grid_column + validatedData.grid_column_span
      )

    if (conflictCheck.data && conflictCheck.data.length > 0) {
      return {
        success: false,
        error:
          'Posisjonskonflikt: En annen widget okkuperer allerede denne posisjonen',
      }
    }

    // Create widget layout
    const { data: layout, error: createError } = await supabase
      .from('widget_layouts')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating widget layout:', createError)
      return {
        success: false,
        error: createError.message || 'Kunne ikke opprette widget-layout',
      }
    }

    // Track layout creation
    await trackLayoutUsage(user.id, layout.id, 'create')

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (validatedData.portfolio_id) {
      revalidatePath(`/portfolio/${validatedData.portfolio_id}`)
    }
    if (validatedData.stock_symbol) {
      revalidatePath(`/stocks/${validatedData.stock_symbol}`)
    }

    return {
      success: true,
      data: [layout],
    }
  } catch (error) {
    console.error('Create widget layout error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Valideringsfeil: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'En uventet feil oppstod',
    }
  }
}

/**
 * Save complete widget layout configuration
 */
export async function saveWidgetLayoutConfiguration(
  layoutId: string,
  widgets: any[],
  preferences?: any
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
        error: 'Godkjenning kreves',
      }
    }

    // Start transaction
    const { data: existingLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', layoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingLayout) {
      return {
        success: false,
        error: 'Layout ikke funnet eller tilgang nektet',
      }
    }

    // Create backup before modification
    const backupData = {
      ...existingLayout,
      layout_name: `${existingLayout.layout_name}_backup_${Date.now()}`,
      is_active: false,
      created_at: new Date().toISOString(),
    }

    const { error: backupError } = await supabase
      .from('widget_layouts')
      .insert([backupData])

    if (backupError) {
      console.warn('Failed to create backup:', backupError)
    }

    // Update layout with new configuration
    const { data: updatedLayout, error: updateError } = await supabase
      .from('widget_layouts')
      .update({
        widget_config: {
          ...existingLayout.widget_config,
          widgets,
          preferences,
          lastSaved: new Date().toISOString(),
        },
      })
      .eq('id', layoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating layout:', updateError)
      return {
        success: false,
        error: updateError.message || 'Kunne ikke lagre layout-konfigurasjon',
      }
    }

    // Track layout save
    await trackLayoutUsage(user.id, layoutId, 'save')

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: [updatedLayout],
    }
  } catch (error) {
    console.error('Save layout configuration error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod ved lagring',
    }
  }
}

/**
 * Load widget layout configuration
 */
export async function loadWidgetLayoutConfiguration(
  layoutId: string
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
        error: 'Godkjenning kreves',
      }
    }

    // Load layout
    const { data: layout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', layoutId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (fetchError || !layout) {
      return {
        success: false,
        error: 'Layout ikke funnet eller tilgang nektet',
      }
    }

    // Track layout load
    await trackLayoutUsage(user.id, layoutId, 'load')

    return {
      success: true,
      data: [layout],
    }
  } catch (error) {
    console.error('Load layout configuration error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod ved lasting',
    }
  }
}

/**
 * Export widget layout for backup or sharing
 */
export async function exportWidgetLayout(exportConfig: {
  layoutId?: string
  layoutType?: LayoutType
  includeUserData?: boolean
  includePreferences?: boolean
}): Promise<{ success: boolean; data?: LayoutExportData; error?: string }> {
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
        error: 'Godkjenning kreves',
      }
    }

    const validatedConfig = layoutExportSchema.parse(exportConfig)

    // Build query
    let query = supabase
      .from('widget_layouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (validatedConfig.layoutId) {
      query = query.eq('id', validatedConfig.layoutId)
    }

    if (validatedConfig.layoutType) {
      query = query.eq('layout_type', validatedConfig.layoutType)
    }

    const { data: layouts, error: fetchError } = await query

    if (fetchError) {
      return {
        success: false,
        error: 'Kunne ikke eksportere layout',
      }
    }

    // Clean sensitive data if not including user data
    const cleanedLayouts =
      layouts?.map(layout => {
        if (!validatedConfig.includeUserData) {
          const { user_id, created_at, updated_at, ...cleanLayout } = layout
          return cleanLayout
        }
        return layout
      }) || []

    // Get preferences if requested
    let preferences = undefined
    if (validatedConfig.includePreferences) {
      const { data: userPreferences } = await supabase
        .from('widget_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      preferences = userPreferences
    }

    const exportData: LayoutExportData = {
      layouts: cleanedLayouts,
      preferences,
      metadata: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: user.email || 'unknown',
      },
    }

    return {
      success: true,
      data: exportData,
    }
  } catch (error) {
    console.error('Export layout error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod ved eksportering',
    }
  }
}

/**
 * Import widget layout from backup or external source
 */
export async function importWidgetLayout(importConfig: {
  layoutData: LayoutExportData
  overwriteExisting?: boolean
  preservePositions?: boolean
}): Promise<{ success: boolean; data?: LayoutImportResult; error?: string }> {
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
        error: 'Godkjenning kreves',
      }
    }

    const validatedConfig = layoutImportSchema.parse(importConfig)
    const { layoutData, overwriteExisting, preservePositions } = validatedConfig

    const importResult: LayoutImportResult = {
      success: true,
      importedLayouts: 0,
      errors: [],
      warnings: [],
    }

    // Process each layout
    for (const layoutItem of layoutData.layouts) {
      try {
        // Check if layout already exists
        const { data: existingLayout } = await supabase
          .from('widget_layouts')
          .select('id')
          .eq('user_id', user.id)
          .eq('layout_name', layoutItem.layout_name)
          .eq('layout_type', layoutItem.layout_type)
          .single()

        if (existingLayout && !overwriteExisting) {
          importResult.warnings.push(
            `Layout "${layoutItem.layout_name}" allerede eksisterer og ble hoppet over`
          )
          continue
        }

        // Adjust positions if not preserving
        const adjustedLayout = { ...layoutItem }
        if (!preservePositions) {
          // Find next available position
          const { data: maxPosition } = await supabase
            .from('widget_layouts')
            .select('grid_row, grid_column')
            .eq('user_id', user.id)
            .eq('layout_type', layoutItem.layout_type)
            .order('grid_row', { ascending: false })
            .order('grid_column', { ascending: false })
            .limit(1)
            .single()

          if (maxPosition) {
            adjustedLayout.grid_row = maxPosition.grid_row + 1
            adjustedLayout.grid_column = maxPosition.grid_column
          }
        }

        // Create or update layout
        const layoutData = {
          ...adjustedLayout,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (existingLayout && overwriteExisting) {
          const { error: updateError } = await supabase
            .from('widget_layouts')
            .update(layoutData)
            .eq('id', existingLayout.id)

          if (updateError) {
            importResult.errors.push(
              `Kunne ikke oppdatere layout "${layoutItem.layout_name}": ${updateError.message}`
            )
          } else {
            importResult.importedLayouts++
          }
        } else {
          const { error: createError } = await supabase
            .from('widget_layouts')
            .insert(layoutData)

          if (createError) {
            importResult.errors.push(
              `Kunne ikke opprette layout "${layoutItem.layout_name}": ${createError.message}`
            )
          } else {
            importResult.importedLayouts++
          }
        }
      } catch (error) {
        importResult.errors.push(
          `Feil ved behandling av layout "${layoutItem.layout_name}": ${error}`
        )
      }
    }

    // Import preferences if provided
    if (layoutData.preferences) {
      try {
        const { error: preferencesError } = await supabase
          .from('widget_preferences')
          .upsert({
            ...layoutData.preferences,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          })

        if (preferencesError) {
          importResult.warnings.push(
            `Kunne ikke importere preferanser: ${preferencesError.message}`
          )
        }
      } catch (error) {
        importResult.warnings.push(`Feil ved import av preferanser: ${error}`)
      }
    }

    // Set success based on whether we imported anything
    importResult.success = importResult.importedLayouts > 0

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: importResult,
    }
  } catch (error) {
    console.error('Import layout error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod ved importering',
    }
  }
}

/**
 * Get layout templates for quick setup
 */
export async function getLayoutTemplates(
  category?: WidgetCategory
): Promise<WidgetLayoutResponse> {
  try {
    const supabase = createClient()

    let query = supabase
      .from('widget_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error: fetchError } = await query

    if (fetchError) {
      return {
        success: false,
        error: 'Kunne ikke hente layout-maler',
      }
    }

    return {
      success: true,
      data: templates || [],
    }
  } catch (error) {
    console.error('Get layout templates error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod',
    }
  }
}

/**
 * Apply layout template to user's configuration
 */
export async function applyLayoutTemplate(
  templateId: string,
  targetLayoutName: string,
  portfolioId?: string,
  stockSymbol?: string
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
        error: 'Godkjenning kreves',
      }
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return {
        success: false,
        error: 'Mal ikke funnet',
      }
    }

    // Parse template configuration
    const templateConfig = template.widgets_config
    const createdLayouts: any[] = []

    // Create layouts from template
    for (const widgetConfig of templateConfig) {
      const layoutData = {
        ...widgetConfig,
        user_id: user.id,
        layout_name: targetLayoutName,
        portfolio_id: portfolioId,
        stock_symbol: stockSymbol,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: createdLayout, error: createError } = await supabase
        .from('widget_layouts')
        .insert(layoutData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating layout from template:', createError)
        continue
      }

      createdLayouts.push(createdLayout)
    }

    // Update template usage count
    await supabase
      .from('widget_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId)

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: createdLayouts,
    }
  } catch (error) {
    console.error('Apply layout template error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod ved anvendelse av mal',
    }
  }
}

/**
 * Track layout usage analytics
 */
async function trackLayoutUsage(
  userId: string,
  layoutId: string,
  action: string
): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('widget_usage_analytics').insert({
      user_id: userId,
      widget_layout_id: layoutId,
      widget_type: 'CUSTOM_WIDGET',
      action_type: action,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Failed to track layout usage:', error)
  }
}

/**
 * Clean up old layout backups
 */
export async function cleanupLayoutBackups(): Promise<void> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return
    }

    // Delete backups older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await supabase
      .from('widget_layouts')
      .delete()
      .eq('user_id', user.id)
      .eq('is_active', false)
      .like('layout_name', '%_backup_%')
      .lt('created_at', thirtyDaysAgo.toISOString())
  } catch (error) {
    console.warn('Failed to cleanup layout backups:', error)
  }
}

/**
 * Get layout usage statistics
 */
export async function getLayoutUsageStats(
  layoutId?: string
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
        error: 'Godkjenning kreves',
      }
    }

    let query = supabase
      .from('widget_usage_analytics')
      .select('*')
      .eq('user_id', user.id)

    if (layoutId) {
      query = query.eq('widget_layout_id', layoutId)
    }

    const { data: analytics, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (fetchError) {
      return {
        success: false,
        error: 'Kunne ikke hente bruksstatistikk',
      }
    }

    return {
      success: true,
      data: analytics || [],
    }
  } catch (error) {
    console.error('Get layout usage stats error:', error)
    return {
      success: false,
      error: 'En uventet feil oppstod',
    }
  }
}

// Re-export existing functions for backward compatibility
export {
  updateWidgetLayout,
  deleteWidgetLayout,
  getUserWidgetLayouts,
  getDefaultWidgetLayout,
  setDefaultWidgetLayout,
  duplicateWidgetLayout,
  bulkUpdateWidgetLayouts,
} from './widgets/layouts'
