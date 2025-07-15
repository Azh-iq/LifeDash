// API endpoint for broker connection status and sync settings
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get broker connections for the user
    const { data: brokerConnections, error: connectionsError } = await supabase
      .from('broker_connections')
      .select(`
        id,
        broker_id,
        status,
        credentials_encrypted,
        error_message,
        last_sync_time,
        sync_frequency_minutes,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (connectionsError) {
      console.error('[API] Error fetching broker connections:', connectionsError)
      throw connectionsError
    }

    // Get sync activities for calculating next sync times and counts
    const { data: syncActivities, error: activitiesError } = await supabase
      .from('broker_sync_activities')
      .select(`
        broker_connection_id,
        status,
        started_at,
        completed_at,
        error_message
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (activitiesError) {
      console.error('[API] Error fetching sync activities:', activitiesError)
      // Don't throw - sync activities are optional
    }

    // Transform data for the UI
    const brokerStatusList = brokerConnections.map(connection => {
      // Count sync activities for this connection
      const connectionSyncs = syncActivities?.filter(
        activity => activity.broker_connection_id === connection.id
      ) || []
      
      const successfulSyncs = connectionSyncs.filter(
        activity => activity.status === 'completed'
      ).length

      // Calculate next sync time
      const lastSyncTime = connection.last_sync_time
      const syncFrequency = connection.sync_frequency_minutes || 60
      const nextSyncTime = lastSyncTime 
        ? new Date(new Date(lastSyncTime).getTime() + syncFrequency * 60 * 1000).toISOString()
        : null

      // Determine overall status
      let overallStatus: 'active' | 'paused' | 'error' | 'never_run' = 'never_run'
      
      if (connection.status === 'connected' && !connection.error_message) {
        overallStatus = 'active'
      } else if (connection.status === 'disconnected') {
        overallStatus = 'paused'
      } else if (connection.error_message) {
        overallStatus = 'error'
      }

      return {
        brokerId: connection.broker_id,
        brokerName: getBrokerDisplayName(connection.broker_id),
        enabled: connection.status === 'connected',
        intervalMinutes: connection.sync_frequency_minutes || 60,
        priority: getBrokerPriority(connection.broker_id),
        lastSyncTime: connection.last_sync_time,
        nextSyncTime,
        status: overallStatus,
        errorMessage: connection.error_message || undefined,
        syncCount: successfulSyncs,
        connectionId: connection.id
      }
    })

    return NextResponse.json({
      success: true,
      data: brokerStatusList
    })

  } catch (error) {
    console.error('[API] Broker status error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { brokerId, enabled, intervalMinutes } = body

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Broker ID is required' },
        { status: 400 }
      )
    }

    // Update broker connection settings
    const { data: updatedConnection, error: updateError } = await supabase
      .from('broker_connections')
      .update({
        status: enabled ? 'connected' : 'disconnected',
        sync_frequency_minutes: intervalMinutes || 60,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('broker_id', brokerId)
      .select()
      .single()

    if (updateError) {
      console.error('[API] Error updating broker connection:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      data: {
        brokerId,
        enabled,
        intervalMinutes,
        updated: true
      }
    })

  } catch (error) {
    console.error('[API] Update broker status error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getBrokerDisplayName(brokerId: string): string {
  const displayNames: Record<string, string> = {
    'plaid': 'Plaid (US Brokers)',
    'schwab': 'Charles Schwab',
    'interactive_brokers': 'Interactive Brokers',
    'nordnet': 'Nordnet'
  }
  return displayNames[brokerId] || brokerId
}

function getBrokerPriority(brokerId: string): number {
  const priorities: Record<string, number> = {
    'interactive_brokers': 1,
    'schwab': 2,
    'nordnet': 3,
    'plaid': 4
  }
  return priorities[brokerId] || 5
}