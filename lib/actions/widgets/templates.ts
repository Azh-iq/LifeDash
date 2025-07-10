'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type {
  WidgetTemplateInsert,
  WidgetTemplateRow,
  WidgetTemplateResponse,
  WidgetLayoutTemplate,
  WidgetLayoutInsert,
  WidgetLayoutResponse,
  LayoutType,
  WidgetCategory,
} from '@/lib/types/widget.types'

// Validation schemas
const widgetLayoutTemplateSchema = z.object({
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
  widget_category: z.enum(['STOCKS', 'CRYPTO', 'ART', 'OTHER']),
  widget_size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'HERO']),
  grid_row: z.number().min(1),
  grid_column: z.number().min(1),
  grid_row_span: z.number().min(1).max(4),
  grid_column_span: z.number().min(1).max(4),
  widget_config: z.object({}).passthrough(),
  title: z.string().optional(),
  description: z.string().optional(),
  show_header: z.boolean(),
  show_footer: z.boolean(),
  mobile_hidden: z.boolean(),
  tablet_config: z.object({}).passthrough().optional(),
  mobile_config: z.object({}).passthrough().optional(),
})

const createWidgetTemplateSchema = z.object({
  template_name: z.string().min(1).max(100),
  template_type: z.enum(['dashboard', 'portfolio', 'stock', 'custom']),
  category: z.enum(['STOCKS', 'CRYPTO', 'ART', 'OTHER']).default('STOCKS'),
  display_name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  preview_image_url: z.string().url().optional(),
  widgets_config: z.array(widgetLayoutTemplateSchema).min(1),
  is_system_template: z.boolean().default(false),
  is_active: z.boolean().default(true),
  version: z.number().min(1).default(1),
})

const updateWidgetTemplateSchema = createWidgetTemplateSchema.partial().extend({
  id: z.string().uuid(),
})

/**
 * Get widget templates
 */
export async function getWidgetTemplates(
  templateType?: LayoutType,
  category?: WidgetCategory,
  systemOnly: boolean = false
): Promise<WidgetTemplateResponse> {
  try {
    const supabase = createClient()

    // Build query
    let query = supabase
      .from('widget_templates')
      .select('*')
      .eq('is_active', true)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (systemOnly) {
      query = query.eq('is_system_template', true)
    }

    // Execute query
    const { data: templates, error: fetchError } = await query
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching widget templates:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget templates',
      }
    }

    return {
      success: true,
      data: templates || [],
    }
  } catch (error) {
    console.error('Get widget templates error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's custom widget templates
 */
export async function getUserWidgetTemplates(): Promise<WidgetTemplateResponse> {
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

    // Fetch user's templates
    const { data: templates, error: fetchError } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('created_by', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching user widget templates:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch user widget templates',
      }
    }

    return {
      success: true,
      data: templates || [],
    }
  } catch (error) {
    console.error('Get user widget templates error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new widget template
 */
export async function createWidgetTemplate(
  templateData: WidgetTemplateInsert
): Promise<WidgetTemplateResponse> {
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

    // Validate template data
    const validatedData = createWidgetTemplateSchema.parse(templateData)

    // Check if template name already exists
    const { data: existingTemplate, error: existsError } = await supabase
      .from('widget_templates')
      .select('id')
      .eq('template_name', validatedData.template_name)
      .single()

    if (existingTemplate) {
      return {
        success: false,
        error: 'Template name already exists',
      }
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('widget_templates')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating widget template:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to create widget template',
      }
    }

    return {
      success: true,
      data: [template],
    }
  } catch (error) {
    console.error('Create widget template error:', error)

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
 * Update a widget template
 */
export async function updateWidgetTemplate(
  id: string,
  updates: Partial<WidgetTemplateInsert>
): Promise<WidgetTemplateResponse> {
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

    // Validate updates
    const validatedData = updateWidgetTemplateSchema.parse({ id, ...updates })
    const { id: templateId, ...updateData } = validatedData

    // Check if template belongs to user
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('widget_templates')
      .select('id, created_by, is_system_template')
      .eq('id', templateId)
      .single()

    if (fetchError || !existingTemplate) {
      return {
        success: false,
        error: 'Widget template not found',
      }
    }

    // Only allow updates to user's own templates or system templates by admins
    if (
      existingTemplate.created_by !== user.id &&
      !existingTemplate.is_system_template
    ) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Update template
    const { data: template, error: updateError } = await supabase
      .from('widget_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating widget template:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to update widget template',
      }
    }

    return {
      success: true,
      data: [template],
    }
  } catch (error) {
    console.error('Update widget template error:', error)

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
 * Delete a widget template
 */
export async function deleteWidgetTemplate(
  id: string
): Promise<WidgetTemplateResponse> {
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

    // Check if template belongs to user
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('widget_templates')
      .select('id, created_by, is_system_template')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return {
        success: false,
        error: 'Widget template not found',
      }
    }

    // Only allow deletion of user's own templates (not system templates)
    if (
      existingTemplate.created_by !== user.id ||
      existingTemplate.is_system_template
    ) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('widget_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting widget template:', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to delete widget template',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete widget template error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Apply a template to create widget layouts
 */
export async function applyWidgetTemplate(
  templateId: string,
  layoutName: string,
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

    // Get template
    const { data: template, error: fetchError } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (fetchError || !template) {
      return {
        success: false,
        error: 'Widget template not found',
      }
    }

    // Create widget layouts from template
    const widgetLayouts: WidgetLayoutInsert[] = template.widgets_config.map(
      widget => ({
        user_id: user.id,
        portfolio_id: portfolioId,
        stock_symbol: stockSymbol,
        layout_name: layoutName,
        layout_type: template.template_type,
        is_default: false,
        is_active: true,
        widget_type: widget.widget_type,
        widget_category: widget.widget_category,
        widget_size: widget.widget_size,
        grid_row: widget.grid_row,
        grid_column: widget.grid_column,
        grid_row_span: widget.grid_row_span,
        grid_column_span: widget.grid_column_span,
        widget_config: widget.widget_config,
        title: widget.title,
        description: widget.description,
        show_header: widget.show_header,
        show_footer: widget.show_footer,
        mobile_hidden: widget.mobile_hidden,
        tablet_config: widget.tablet_config,
        mobile_config: widget.mobile_config,
      })
    )

    // Insert widget layouts
    const { data: createdLayouts, error: createError } = await supabase
      .from('widget_layouts')
      .insert(widgetLayouts)
      .select()

    if (createError) {
      console.error('Error applying widget template:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to apply widget template',
      }
    }

    // Increment template usage count
    await supabase
      .from('widget_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId)

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    if (portfolioId) {
      revalidatePath(`/portfolio/${portfolioId}`)
    }
    if (stockSymbol) {
      revalidatePath(`/stocks/${stockSymbol}`)
    }

    return {
      success: true,
      data: createdLayouts || [],
    }
  } catch (error) {
    console.error('Apply widget template error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create template from existing layout
 */
export async function createTemplateFromLayout(
  layoutName: string,
  templateName: string,
  templateDisplayName: string,
  description?: string,
  portfolioId?: string,
  stockSymbol?: string
): Promise<WidgetTemplateResponse> {
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

    // Get existing layouts
    let query = supabase
      .from('widget_layouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('layout_name', layoutName)
      .eq('is_active', true)

    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId)
    }

    if (stockSymbol) {
      query = query.eq('stock_symbol', stockSymbol)
    }

    const { data: layouts, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching layouts for template:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch layouts for template',
      }
    }

    if (!layouts || layouts.length === 0) {
      return {
        success: false,
        error: 'No layouts found to create template from',
      }
    }

    // Convert layouts to template format
    const widgetsConfig: WidgetLayoutTemplate[] = layouts.map(layout => ({
      widget_type: layout.widget_type,
      widget_category: layout.widget_category,
      widget_size: layout.widget_size,
      grid_row: layout.grid_row,
      grid_column: layout.grid_column,
      grid_row_span: layout.grid_row_span,
      grid_column_span: layout.grid_column_span,
      widget_config: layout.widget_config,
      title: layout.title,
      description: layout.description,
      show_header: layout.show_header,
      show_footer: layout.show_footer,
      mobile_hidden: layout.mobile_hidden,
      tablet_config: layout.tablet_config,
      mobile_config: layout.mobile_config,
    }))

    // Create template
    const templateData: WidgetTemplateInsert = {
      template_name: templateName,
      template_type: layouts[0].layout_type,
      category: layouts[0].widget_category,
      display_name: templateDisplayName,
      description,
      widgets_config: widgetsConfig,
      is_system_template: false,
      is_active: true,
      created_by: user.id,
      version: 1,
    }

    return await createWidgetTemplate(templateData)
  } catch (error) {
    console.error('Create template from layout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get popular widget templates
 */
export async function getPopularWidgetTemplates(
  limit: number = 10
): Promise<WidgetTemplateResponse> {
  try {
    const supabase = createClient()

    // Get popular templates
    const { data: templates, error: fetchError } = await supabase
      .from('widget_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_system_template', true)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching popular widget templates:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch popular widget templates',
      }
    }

    return {
      success: true,
      data: templates || [],
    }
  } catch (error) {
    console.error('Get popular widget templates error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Search widget templates
 */
export async function searchWidgetTemplates(
  query: string,
  templateType?: LayoutType,
  category?: WidgetCategory
): Promise<WidgetTemplateResponse> {
  try {
    const supabase = createClient()

    // Build search query
    let searchQuery = supabase
      .from('widget_templates')
      .select('*')
      .eq('is_active', true)
      .or(
        `template_name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`
      )

    if (templateType) {
      searchQuery = searchQuery.eq('template_type', templateType)
    }

    if (category) {
      searchQuery = searchQuery.eq('category', category)
    }

    const { data: templates, error: fetchError } = await searchQuery
      .order('usage_count', { ascending: false })
      .limit(50)

    if (fetchError) {
      console.error('Error searching widget templates:', fetchError)
      return {
        success: false,
        error: 'Failed to search widget templates',
      }
    }

    return {
      success: true,
      data: templates || [],
    }
  } catch (error) {
    console.error('Search widget templates error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
