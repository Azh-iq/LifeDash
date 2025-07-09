'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type {
  WidgetPreferencesInsert,
  WidgetPreferencesUpdate,
  WidgetPreferencesRow,
  WidgetPreferencesResponse,
  CategoryPreferences,
} from '@/lib/types/widget.types'

// Validation schemas
const categoryPreferencesSchema = z.object({
  stocks: z.object({
    defaultChartType: z.enum(['line', 'candlestick', 'area', 'bar']).optional(),
    showVolume: z.boolean().optional(),
    showTechnicalIndicators: z.boolean().optional(),
    defaultTimeframe: z.string().optional(),
  }).optional(),
  crypto: z.object({
    defaultChartType: z.enum(['line', 'candlestick', 'area', 'bar']).optional(),
    showVolume: z.boolean().optional(),
    showMarketCap: z.boolean().optional(),
    defaultTimeframe: z.string().optional(),
  }).optional(),
  art: z.object({
    showPriceHistory: z.boolean().optional(),
    showProvenance: z.boolean().optional(),
    defaultView: z.string().optional(),
  }).optional(),
  other: z.object({
    defaultView: z.string().optional(),
    showCustomFields: z.boolean().optional(),
  }).optional(),
})

const createWidgetPreferencesSchema = z.object({
  default_theme: z.enum(['light', 'dark', 'system']).default('light'),
  animation_enabled: z.boolean().default(true),
  auto_refresh_enabled: z.boolean().default(true),
  auto_refresh_interval: z.number().min(30).max(3600).default(300),
  category_preferences: categoryPreferencesSchema.default({}),
  grid_columns: z.number().min(1).max(4).default(2),
  grid_gap: z.enum(['sm', 'md', 'lg']).default('md'),
  compact_mode: z.boolean().default(false),
  chart_type: z.enum(['line', 'candlestick', 'area', 'bar']).default('line'),
  chart_theme: z.enum(['default', 'dark', 'minimal', 'colorful']).default('default'),
  show_volume: z.boolean().default(true),
  show_grid: z.boolean().default(true),
  currency_display: z.enum(['NOK', 'USD', 'EUR']).default('NOK'),
  number_format: z.enum(['norwegian', 'international']).default('norwegian'),
  date_format: z.enum(['dd.mm.yyyy', 'yyyy-mm-dd', 'mm/dd/yyyy']).default('dd.mm.yyyy'),
  price_alerts_enabled: z.boolean().default(true),
  news_alerts_enabled: z.boolean().default(false),
  email_notifications: z.boolean().default(false),
  push_notifications: z.boolean().default(false),
  share_portfolio_enabled: z.boolean().default(false),
  public_profile_enabled: z.boolean().default(false),
  analytics_enabled: z.boolean().default(true),
  advanced_features_enabled: z.boolean().default(false),
  beta_features_enabled: z.boolean().default(false),
})

const updateWidgetPreferencesSchema = createWidgetPreferencesSchema.partial()

// Default preferences
const DEFAULT_PREFERENCES: WidgetPreferencesInsert = {
  user_id: '', // Will be set dynamically
  default_theme: 'light',
  animation_enabled: true,
  auto_refresh_enabled: true,
  auto_refresh_interval: 300,
  category_preferences: {},
  grid_columns: 2,
  grid_gap: 'md',
  compact_mode: false,
  chart_type: 'line',
  chart_theme: 'default',
  show_volume: true,
  show_grid: true,
  currency_display: 'NOK',
  number_format: 'norwegian',
  date_format: 'dd.mm.yyyy',
  price_alerts_enabled: true,
  news_alerts_enabled: false,
  email_notifications: false,
  push_notifications: false,
  share_portfolio_enabled: false,
  public_profile_enabled: false,
  analytics_enabled: true,
  advanced_features_enabled: false,
  beta_features_enabled: false,
}

/**
 * Get user's widget preferences
 */
export async function getUserWidgetPreferences(): Promise<WidgetPreferencesResponse> {
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

    // Fetch preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('widget_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      // If preferences don't exist, create default ones
      if (fetchError.code === 'PGRST116') {
        return await createDefaultWidgetPreferences()
      }
      
      console.error('Error fetching widget preferences:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget preferences',
      }
    }

    return {
      success: true,
      data: preferences,
    }
  } catch (error) {
    console.error('Get widget preferences error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create default widget preferences for a user
 */
async function createDefaultWidgetPreferences(): Promise<WidgetPreferencesResponse> {
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

    // Create default preferences
    const defaultPrefs = {
      ...DEFAULT_PREFERENCES,
      user_id: user.id,
    }

    const { data: preferences, error: createError } = await supabase
      .from('widget_preferences')
      .insert(defaultPrefs)
      .select()
      .single()

    if (createError) {
      console.error('Error creating default widget preferences:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to create default widget preferences',
      }
    }

    return {
      success: true,
      data: preferences,
    }
  } catch (error) {
    console.error('Create default widget preferences error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update widget preferences
 */
export async function updateWidgetPreferences(
  updates: WidgetPreferencesUpdate
): Promise<WidgetPreferencesResponse> {
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
    const validatedUpdates = updateWidgetPreferencesSchema.parse(updates)

    // Check if preferences exist
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('widget_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking widget preferences:', fetchError)
      return {
        success: false,
        error: 'Failed to check widget preferences',
      }
    }

    let preferences
    if (!existingPrefs) {
      // Create new preferences with updates
      const newPrefs = {
        ...DEFAULT_PREFERENCES,
        ...validatedUpdates,
        user_id: user.id,
      }

      const { data: createdPrefs, error: createError } = await supabase
        .from('widget_preferences')
        .insert(newPrefs)
        .select()
        .single()

      if (createError) {
        console.error('Error creating widget preferences:', createError)
        return {
          success: false,
          error: createError.message || 'Failed to create widget preferences',
        }
      }

      preferences = createdPrefs
    } else {
      // Update existing preferences
      const { data: updatedPrefs, error: updateError } = await supabase
        .from('widget_preferences')
        .update(validatedUpdates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating widget preferences:', updateError)
        return {
          success: false,
          error: updateError.message || 'Failed to update widget preferences',
        }
      }

      preferences = updatedPrefs
    }

    // Revalidate paths that depend on preferences
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    revalidatePath('/settings')

    return {
      success: true,
      data: preferences,
    }
  } catch (error) {
    console.error('Update widget preferences error:', error)

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
 * Update category-specific preferences
 */
export async function updateCategoryPreferences(
  category: keyof CategoryPreferences,
  preferences: CategoryPreferences[keyof CategoryPreferences]
): Promise<WidgetPreferencesResponse> {
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

    // Get current preferences
    const currentPrefs = await getUserWidgetPreferences()
    if (!currentPrefs.success || !currentPrefs.data) {
      return {
        success: false,
        error: 'Failed to get current preferences',
      }
    }

    // Update category preferences
    const updatedCategoryPrefs = {
      ...currentPrefs.data.category_preferences,
      [category]: {
        ...currentPrefs.data.category_preferences[category],
        ...preferences,
      },
    }

    // Update preferences
    return await updateWidgetPreferences({
      category_preferences: updatedCategoryPrefs,
    })
  } catch (error) {
    console.error('Update category preferences error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Reset widget preferences to defaults
 */
export async function resetWidgetPreferences(): Promise<WidgetPreferencesResponse> {
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

    // Reset to defaults
    const defaultPrefs = {
      ...DEFAULT_PREFERENCES,
      user_id: user.id,
    }

    const { data: preferences, error: updateError } = await supabase
      .from('widget_preferences')
      .upsert(defaultPrefs)
      .select()
      .single()

    if (updateError) {
      console.error('Error resetting widget preferences:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to reset widget preferences',
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/investments')
    revalidatePath('/settings')

    return {
      success: true,
      data: preferences,
    }
  } catch (error) {
    console.error('Reset widget preferences error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Toggle a boolean preference
 */
export async function togglePreference(
  preference: keyof Pick<WidgetPreferencesUpdate, 
    'animation_enabled' | 'auto_refresh_enabled' | 'compact_mode' | 'show_volume' | 'show_grid' |
    'price_alerts_enabled' | 'news_alerts_enabled' | 'email_notifications' | 'push_notifications' |
    'share_portfolio_enabled' | 'public_profile_enabled' | 'analytics_enabled' | 
    'advanced_features_enabled' | 'beta_features_enabled'
  >
): Promise<WidgetPreferencesResponse> {
  try {
    // Get current preferences
    const currentPrefs = await getUserWidgetPreferences()
    if (!currentPrefs.success || !currentPrefs.data) {
      return {
        success: false,
        error: 'Failed to get current preferences',
      }
    }

    // Toggle the preference
    const currentValue = currentPrefs.data[preference] as boolean
    const updates = {
      [preference]: !currentValue,
    }

    return await updateWidgetPreferences(updates)
  } catch (error) {
    console.error('Toggle preference error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update theme preference
 */
export async function updateTheme(
  theme: 'light' | 'dark' | 'system'
): Promise<WidgetPreferencesResponse> {
  return await updateWidgetPreferences({ default_theme: theme })
}

/**
 * Update chart preferences
 */
export async function updateChartPreferences(
  chartType?: 'line' | 'candlestick' | 'area' | 'bar',
  chartTheme?: 'default' | 'dark' | 'minimal' | 'colorful',
  showVolume?: boolean,
  showGrid?: boolean
): Promise<WidgetPreferencesResponse> {
  const updates: WidgetPreferencesUpdate = {}
  
  if (chartType !== undefined) updates.chart_type = chartType
  if (chartTheme !== undefined) updates.chart_theme = chartTheme
  if (showVolume !== undefined) updates.show_volume = showVolume
  if (showGrid !== undefined) updates.show_grid = showGrid

  return await updateWidgetPreferences(updates)
}

/**
 * Update grid preferences
 */
export async function updateGridPreferences(
  columns?: number,
  gap?: 'sm' | 'md' | 'lg',
  compactMode?: boolean
): Promise<WidgetPreferencesResponse> {
  const updates: WidgetPreferencesUpdate = {}
  
  if (columns !== undefined) updates.grid_columns = columns
  if (gap !== undefined) updates.grid_gap = gap
  if (compactMode !== undefined) updates.compact_mode = compactMode

  return await updateWidgetPreferences(updates)
}

/**
 * Update localization preferences
 */
export async function updateLocalizationPreferences(
  currency?: 'NOK' | 'USD' | 'EUR',
  numberFormat?: 'norwegian' | 'international',
  dateFormat?: 'dd.mm.yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy'
): Promise<WidgetPreferencesResponse> {
  const updates: WidgetPreferencesUpdate = {}
  
  if (currency !== undefined) updates.currency_display = currency
  if (numberFormat !== undefined) updates.number_format = numberFormat
  if (dateFormat !== undefined) updates.date_format = dateFormat

  return await updateWidgetPreferences(updates)
}