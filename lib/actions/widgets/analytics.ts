'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type {
  WidgetUsageAnalyticsInsert,
  WidgetUsageAnalyticsRow,
  WidgetUsageResponse,
  WidgetType,
  ActionType,
  DeviceType,
} from '@/lib/types/widget.types'

// Validation schema
const createWidgetUsageSchema = z.object({
  widget_layout_id: z.string().uuid().optional(),
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
  action_type: z.enum(['view', 'interact', 'refresh', 'export', 'configure']),
  portfolio_id: z.string().uuid().optional(),
  stock_symbol: z.string().regex(/^[A-Z]{1,5}$/).optional(),
  session_id: z.string().uuid().optional(),
  duration_seconds: z.number().min(0).optional(),
  interaction_count: z.number().min(0).default(1),
  device_type: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  browser_type: z.string().optional(),
})

/**
 * Track widget usage
 */
export async function trackWidgetUsage(
  usageData: WidgetUsageAnalyticsInsert
): Promise<WidgetUsageResponse> {
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

    // Validate usage data
    const validatedData = createWidgetUsageSchema.parse(usageData)

    // Create usage record
    const { data: usage, error: createError } = await supabase
      .from('widget_usage_analytics')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error tracking widget usage:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to track widget usage',
      }
    }

    return {
      success: true,
      data: [usage],
    }
  } catch (error) {
    console.error('Track widget usage error:', error)

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
 * Get widget usage analytics for a user
 */
export async function getUserWidgetUsage(
  startDate?: string,
  endDate?: string,
  widgetType?: WidgetType,
  actionType?: ActionType
): Promise<WidgetUsageResponse> {
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
      .from('widget_usage_analytics')
      .select('*')
      .eq('user_id', user.id)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (widgetType) {
      query = query.eq('widget_type', widgetType)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    // Execute query
    const { data: usage, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(1000)

    if (fetchError) {
      console.error('Error fetching widget usage:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget usage',
      }
    }

    return {
      success: true,
      data: usage || [],
    }
  } catch (error) {
    console.error('Get widget usage error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get widget usage summary
 */
export async function getWidgetUsageSummary(
  days: number = 30
): Promise<{
  success: boolean
  data?: {
    totalInteractions: number
    mostUsedWidget: string
    averageSessionDuration: number
    deviceBreakdown: Record<DeviceType, number>
    actionBreakdown: Record<ActionType, number>
    widgetBreakdown: Record<WidgetType, number>
  }
  error?: string
}> {
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

    // Get usage data for the specified period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error: fetchError } = await supabase
      .from('widget_usage_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (fetchError) {
      console.error('Error fetching widget usage summary:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget usage summary',
      }
    }

    if (!usage || usage.length === 0) {
      return {
        success: true,
        data: {
          totalInteractions: 0,
          mostUsedWidget: '',
          averageSessionDuration: 0,
          deviceBreakdown: {} as Record<DeviceType, number>,
          actionBreakdown: {} as Record<ActionType, number>,
          widgetBreakdown: {} as Record<WidgetType, number>,
        },
      }
    }

    // Calculate summary statistics
    const totalInteractions = usage.reduce((sum, record) => sum + (record.interaction_count || 0), 0)
    
    const sessionDurations = usage
      .filter(record => record.duration_seconds !== null)
      .map(record => record.duration_seconds || 0)
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0

    // Widget breakdown
    const widgetBreakdown = usage.reduce((acc, record) => {
      acc[record.widget_type] = (acc[record.widget_type] || 0) + (record.interaction_count || 1)
      return acc
    }, {} as Record<WidgetType, number>)

    const mostUsedWidget = Object.entries(widgetBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''

    // Action breakdown
    const actionBreakdown = usage.reduce((acc, record) => {
      acc[record.action_type] = (acc[record.action_type] || 0) + (record.interaction_count || 1)
      return acc
    }, {} as Record<ActionType, number>)

    // Device breakdown
    const deviceBreakdown = usage.reduce((acc, record) => {
      if (record.device_type) {
        acc[record.device_type] = (acc[record.device_type] || 0) + (record.interaction_count || 1)
      }
      return acc
    }, {} as Record<DeviceType, number>)

    return {
      success: true,
      data: {
        totalInteractions,
        mostUsedWidget,
        averageSessionDuration,
        deviceBreakdown,
        actionBreakdown,
        widgetBreakdown,
      },
    }
  } catch (error) {
    console.error('Get widget usage summary error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get widget performance metrics
 */
export async function getWidgetPerformanceMetrics(
  widgetType: WidgetType,
  days: number = 30
): Promise<{
  success: boolean
  data?: {
    totalViews: number
    totalInteractions: number
    averageEngagementTime: number
    refreshRate: number
    errorRate: number
    popularActions: Array<{ action: ActionType; count: number }>
  }
  error?: string
}> {
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

    // Get usage data for the widget
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error: fetchError } = await supabase
      .from('widget_usage_analytics')
      .select('*')
      .eq('user_id', user.id)
      .eq('widget_type', widgetType)
      .gte('created_at', startDate.toISOString())

    if (fetchError) {
      console.error('Error fetching widget performance metrics:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget performance metrics',
      }
    }

    if (!usage || usage.length === 0) {
      return {
        success: true,
        data: {
          totalViews: 0,
          totalInteractions: 0,
          averageEngagementTime: 0,
          refreshRate: 0,
          errorRate: 0,
          popularActions: [],
        },
      }
    }

    // Calculate metrics
    const totalViews = usage.filter(record => record.action_type === 'view').length
    const totalInteractions = usage.reduce((sum, record) => sum + (record.interaction_count || 0), 0)
    
    const engagementTimes = usage
      .filter(record => record.duration_seconds !== null)
      .map(record => record.duration_seconds || 0)
    const averageEngagementTime = engagementTimes.length > 0 
      ? engagementTimes.reduce((sum, duration) => sum + duration, 0) / engagementTimes.length
      : 0

    const refreshActions = usage.filter(record => record.action_type === 'refresh').length
    const refreshRate = totalViews > 0 ? (refreshActions / totalViews) * 100 : 0

    // For now, we don't track errors explicitly in usage analytics
    // This would require additional error tracking implementation
    const errorRate = 0

    // Popular actions
    const actionCounts = usage.reduce((acc, record) => {
      acc[record.action_type] = (acc[record.action_type] || 0) + (record.interaction_count || 1)
      return acc
    }, {} as Record<ActionType, number>)

    const popularActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action: action as ActionType, count }))
      .sort((a, b) => b.count - a.count)

    return {
      success: true,
      data: {
        totalViews,
        totalInteractions,
        averageEngagementTime,
        refreshRate,
        errorRate,
        popularActions,
      },
    }
  } catch (error) {
    console.error('Get widget performance metrics error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get daily widget usage trends
 */
export async function getWidgetUsageTrends(
  days: number = 30
): Promise<{
  success: boolean
  data?: Array<{
    date: string
    totalInteractions: number
    uniqueWidgets: number
    averageSessionDuration: number
  }>
  error?: string
}> {
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

    // Get usage data for the specified period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usage, error: fetchError } = await supabase
      .from('widget_usage_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching widget usage trends:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch widget usage trends',
      }
    }

    if (!usage || usage.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Group usage by date
    const dailyUsage = usage.reduce((acc, record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      
      if (!acc[date]) {
        acc[date] = {
          totalInteractions: 0,
          uniqueWidgets: new Set<WidgetType>(),
          sessionDurations: [],
        }
      }

      acc[date].totalInteractions += record.interaction_count || 1
      acc[date].uniqueWidgets.add(record.widget_type)
      
      if (record.duration_seconds !== null) {
        acc[date].sessionDurations.push(record.duration_seconds || 0)
      }

      return acc
    }, {} as Record<string, {
      totalInteractions: number
      uniqueWidgets: Set<WidgetType>
      sessionDurations: number[]
    }>)

    // Convert to array format
    const trends = Object.entries(dailyUsage).map(([date, data]) => ({
      date,
      totalInteractions: data.totalInteractions,
      uniqueWidgets: data.uniqueWidgets.size,
      averageSessionDuration: data.sessionDurations.length > 0 
        ? data.sessionDurations.reduce((sum, duration) => sum + duration, 0) / data.sessionDurations.length
        : 0,
    }))

    return {
      success: true,
      data: trends,
    }
  } catch (error) {
    console.error('Get widget usage trends error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Clean up old usage analytics data
 */
export async function cleanupOldUsageData(
  daysToKeep: number = 90
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
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

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Delete old records
    const { data: deletedRecords, error: deleteError } = await supabase
      .from('widget_usage_analytics')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (deleteError) {
      console.error('Error cleaning up old usage data:', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to clean up old usage data',
      }
    }

    return {
      success: true,
      deletedCount: deletedRecords?.length || 0,
    }
  } catch (error) {
    console.error('Cleanup old usage data error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}