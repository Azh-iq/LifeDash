// Broker connections management API route
// Lists, manages, and monitors all user broker connections

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BrokerageClientFactory, BrokerId } from '@/lib/integrations/brokers'

// Get all user broker connections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all connections with account counts
    const { data: connections, error: dbError } = await supabase
      .from('brokerage_connections')
      .select(`
        *,
        brokerage_accounts(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get recent sync operations
    const { data: recentSyncs } = await supabase
      .from('sync_operations')
      .select('connection_id, status, completed_at, result')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50)

    // Create sync lookup map
    const syncMap = new Map()
    recentSyncs?.forEach(sync => {
      if (!syncMap.has(sync.connection_id)) {
        syncMap.set(sync.connection_id, sync)
      }
    })

    // Enhance connections with sync info and sanitize sensitive data
    const enhancedConnections = connections.map(conn => ({
      id: conn.id,
      broker_id: conn.broker_id,
      display_name: conn.display_name,
      status: conn.status,
      error_message: conn.error_message,
      last_synced_at: conn.last_synced_at,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      accounts_count: conn.brokerage_accounts?.[0]?.count || 0,
      metadata: {
        ...conn.metadata,
        // Remove sensitive data
        api_key: conn.metadata?.api_key ? '***' : undefined
      },
      last_sync: syncMap.get(conn.id) ? {
        status: syncMap.get(conn.id).status,
        completed_at: syncMap.get(conn.id).completed_at,
        accounts_processed: syncMap.get(conn.id).result?.accounts_processed,
        holdings_processed: syncMap.get(conn.id).result?.holdings_processed,
        transactions_processed: syncMap.get(conn.id).result?.transactions_processed
      } : null
    }))

    return NextResponse.json({
      connections: enhancedConnections,
      total_connections: connections.length,
      connected_count: connections.filter(c => c.status === 'connected').length,
      error_count: connections.filter(c => c.status === 'error').length
    })
  } catch (error) {
    console.error('Failed to get broker connections:', error)
    return NextResponse.json(
      { error: 'Failed to get connections' },
      { status: 500 }
    )
  }
}

// Delete broker connection
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connection_id } = body

    if (!connection_id) {
      return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 })
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Try to disconnect from broker API if possible
    try {
      const client = BrokerageClientFactory.create(connection.broker_id as BrokerId, {})
      await client.disconnect(connection.connection_id)
    } catch (error) {
      console.warn('Failed to disconnect from broker API:', error)
      // Continue with database cleanup even if API disconnect fails
    }

    // Delete from database (cascades to accounts, holdings, etc.)
    const { error: deleteError } = await supabase
      .from('brokerage_connections')
      .delete()
      .eq('id', connection_id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    // Recalculate portfolio summary after connection removal
    await supabase.rpc('calculate_portfolio_summary', { p_user_id: user.id })

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete broker connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}

// Update connection settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connection_id, display_name, auto_sync } = body

    if (!connection_id) {
      return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 })
    }

    // Update connection
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (display_name) {
      updateData.display_name = display_name
    }

    if (auto_sync !== undefined) {
      updateData.metadata = supabase
        .from('brokerage_connections')
        .select('metadata')
        .eq('id', connection_id)
        .single()
        .then(result => ({
          ...result.data?.metadata,
          auto_sync
        }))
    }

    const { data: updatedConnection, error: updateError } = await supabase
      .from('brokerage_connections')
      .update(updateData)
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: updatedConnection.id,
        display_name: updatedConnection.display_name,
        broker_id: updatedConnection.broker_id,
        updated_at: updatedConnection.updated_at
      }
    })
  } catch (error) {
    console.error('Failed to update broker connection:', error)
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}