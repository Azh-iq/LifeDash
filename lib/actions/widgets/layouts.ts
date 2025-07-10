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

// Validation schemas
const widgetConfigSchema = z
  .object({
    refreshInterval: z.number().optional(),
    showLoadingStates: z.boolean().optional(),
    showErrorStates: z.boolean().optional(),
    customTitle: z.string().optional(),
    customDescription: z.string().optional(),
    showHeader: z.boolean().optional(),
    showFooter: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  })
  .passthrough() // Allow additional properties for specific widget types

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
    .regex(/^[A-Z]{1,5}$/)
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
  grid_row: z.number().min(1),
  grid_column: z.number().min(1),
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

/**
 * Create a new widget layout
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
        error: 'Authentication required',
      }
    }

    // Parse data depending on input type
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

    // Validate data
    const validatedData = createWidgetLayoutSchema.parse(rawData)

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
        error: createError.message || 'Failed to create widget layout',
      }
    }

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
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update an existing widget layout
 */
export async function updateWidgetLayout(
  id: string,
  updates: WidgetLayoutUpdate
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

    // Validate data
    const validatedData = updateWidgetLayoutSchema.parse({ id, ...updates })
    const { id: layoutId, ...updateData } = validatedData

    // Check if layout belongs to user
    const { data: existingLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('id, user_id, portfolio_id, stock_symbol')
      .eq('id', layoutId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingLayout) {
      return {
        success: false,
        error: 'Widget layout not found or access denied',
      }
    }

    // Update layout
    const { data: layout, error: updateError } = await supabase
      .from('widget_layouts')
      .update(updateData)
      .eq('id', layoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating widget layout:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to update widget layout',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (existingLayout.portfolio_id) {
      revalidatePath(`/portfolio/${existingLayout.portfolio_id}`)
    }
    if (existingLayout.stock_symbol) {
      revalidatePath(`/stocks/${existingLayout.stock_symbol}`)
    }

    return {
      success: true,
      data: [layout],
    }
  } catch (error) {
    console.error('Update widget layout error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a widget layout
 */
export async function deleteWidgetLayout(
  id: string
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

    // Check if layout belongs to user
    const { data: existingLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('id, user_id, portfolio_id, stock_symbol')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingLayout) {
      return {
        success: false,
        error: 'Widget layout not found or access denied',
      }
    }

    // Delete layout
    const { error: deleteError } = await supabase
      .from('widget_layouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting widget layout:', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to delete widget layout',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (existingLayout.portfolio_id) {
      revalidatePath(`/portfolio/${existingLayout.portfolio_id}`)
    }
    if (existingLayout.stock_symbol) {
      revalidatePath(`/stocks/${existingLayout.stock_symbol}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete widget layout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's widget layouts
 */
export async function getUserWidgetLayouts(
  layoutType?: LayoutType,
  portfolioId?: string,
  stockSymbol?: string,
  activeOnly: boolean = true
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

    // Build query
    let query = supabase
      .from('widget_layouts')
      .select('*')
      .eq('user_id', user.id)

    if (layoutType) {
      query = query.eq('layout_type', layoutType)
    }

    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId)
    }

    if (stockSymbol) {
      query = query.eq('stock_symbol', stockSymbol)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // Execute query
    const { data: layouts, error: fetchError } = await query
      .order('grid_row', { ascending: true })
      .order('grid_column', { ascending: true })

    if (fetchError) {
      console.error('Error fetching widget layouts:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget layouts',
      }
    }

    return {
      success: true,
      data: layouts || [],
    }
  } catch (error) {
    console.error('Get widget layouts error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get default widget layout for a specific type
 */
export async function getDefaultWidgetLayout(
  layoutType: LayoutType,
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
        error: 'Authentication required',
      }
    }

    // Build query
    let query = supabase
      .from('widget_layouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('layout_type', layoutType)
      .eq('is_default', true)
      .eq('is_active', true)

    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId)
    }

    if (stockSymbol) {
      query = query.eq('stock_symbol', stockSymbol)
    }

    // Execute query
    const { data: layouts, error: fetchError } = await query
      .order('grid_row', { ascending: true })
      .order('grid_column', { ascending: true })

    if (fetchError) {
      console.error('Error fetching default widget layout:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch default widget layout',
      }
    }

    return {
      success: true,
      data: layouts || [],
    }
  } catch (error) {
    console.error('Get default widget layout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Set a widget layout as default
 */
export async function setDefaultWidgetLayout(
  id: string
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

    // Check if layout belongs to user
    const { data: existingLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('id, user_id, layout_type, portfolio_id, stock_symbol')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingLayout) {
      return {
        success: false,
        error: 'Widget layout not found or access denied',
      }
    }

    // Update layout to be default (trigger will handle clearing other defaults)
    const { data: layout, error: updateError } = await supabase
      .from('widget_layouts')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error setting default widget layout:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to set default widget layout',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (existingLayout.portfolio_id) {
      revalidatePath(`/portfolio/${existingLayout.portfolio_id}`)
    }
    if (existingLayout.stock_symbol) {
      revalidatePath(`/stocks/${existingLayout.stock_symbol}`)
    }

    return {
      success: true,
      data: [layout],
    }
  } catch (error) {
    console.error('Set default widget layout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Duplicate a widget layout
 */
export async function duplicateWidgetLayout(
  id: string,
  newName: string
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

    // Get existing layout
    const { data: existingLayout, error: fetchError } = await supabase
      .from('widget_layouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingLayout) {
      return {
        success: false,
        error: 'Widget layout not found or access denied',
      }
    }

    // Create duplicate
    const {
      id: originalId,
      created_at,
      updated_at,
      is_default,
      ...layoutData
    } = existingLayout

    const duplicateData = {
      ...layoutData,
      layout_name: newName,
      is_default: false, // Duplicates are never default
    }

    const { data: newLayout, error: createError } = await supabase
      .from('widget_layouts')
      .insert(duplicateData)
      .select()
      .single()

    if (createError) {
      console.error('Error duplicating widget layout:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to duplicate widget layout',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (existingLayout.portfolio_id) {
      revalidatePath(`/portfolio/${existingLayout.portfolio_id}`)
    }
    if (existingLayout.stock_symbol) {
      revalidatePath(`/stocks/${existingLayout.stock_symbol}`)
    }

    return {
      success: true,
      data: [newLayout],
    }
  } catch (error) {
    console.error('Duplicate widget layout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Bulk update widget layouts (for reordering/repositioning)
 */
export async function bulkUpdateWidgetLayouts(
  updates: Array<{ id: string } & WidgetLayoutUpdate>
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

    // Validate bulk updates
    const validatedUpdates = bulkUpdateSchema.parse({ layouts: updates })
    const updatedLayouts: WidgetLayoutRow[] = []

    // Execute updates in transaction
    for (const update of validatedUpdates.layouts) {
      const { id, ...updateData } = update

      // Check ownership
      const { data: existingLayout, error: fetchError } = await supabase
        .from('widget_layouts')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !existingLayout) {
        return {
          success: false,
          error: `Widget layout ${id} not found or access denied`,
        }
      }

      // Update layout
      const { data: layout, error: updateError } = await supabase
        .from('widget_layouts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating widget layout:', updateError)
        return {
          success: false,
          error: `Failed to update widget layout ${id}: ${updateError.message}`,
        }
      }

      updatedLayouts.push(layout)
    }

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')

    return {
      success: true,
      data: updatedLayouts,
    }
  } catch (error) {
    console.error('Bulk update widget layouts error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors[0].message}`,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
