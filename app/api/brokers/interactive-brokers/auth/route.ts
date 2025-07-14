// Interactive Brokers authentication API route
// Handles IBKR Gateway authentication status and connection

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractiveBrokersClient } from '@/lib/integrations/brokers'
import { BrokerId } from '@/lib/integrations/brokers/types'

// Check IBKR Gateway status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create IBKR client
    const ibkrClient = new InteractiveBrokersClient({
      gatewayUrl: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000'
    })

    // Check authentication status
    const authStatus = await ibkrClient.checkAuthStatus()

    return NextResponse.json({
      gateway_url: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000',
      authenticated: authStatus.authenticated,
      connected: authStatus.connected,
      competing: authStatus.competing,
      status: authStatus.authenticated && authStatus.connected ? 'ready' : 'not_ready',
      instructions: authStatus.authenticated && authStatus.connected 
        ? 'IBKR Gateway is ready for API calls'
        : 'Please authenticate through IBKR Client Portal Gateway'
    })
  } catch (error) {
    console.error('Failed to check IBKR Gateway status:', error)
    return NextResponse.json({
      gateway_url: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000',
      authenticated: false,
      connected: false,
      competing: false,
      status: 'error',
      error: 'Unable to connect to IBKR Gateway. Please ensure Gateway is running.',
      instructions: 'Start IBKR Client Portal Gateway and authenticate through the web interface'
    })
  }
}

// Connect to IBKR Gateway after manual authentication
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create IBKR client
    const ibkrClient = new InteractiveBrokersClient({
      gatewayUrl: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000'
    })

    // Check if Gateway is authenticated
    const authStatus = await ibkrClient.checkAuthStatus()
    
    if (!authStatus.authenticated || !authStatus.connected) {
      return NextResponse.json({
        error: 'IBKR Gateway not authenticated',
        gateway_url: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000',
        instructions: 'Please authenticate through IBKR Client Portal Gateway first'
      }, { status: 400 })
    }

    // Test connection by fetching accounts
    const accounts = await ibkrClient.getAccounts('ibkr_session')

    // Store connection in database
    const { data: connection, error: dbError } = await supabase
      .from('brokerage_connections')
      .insert({
        user_id: user.id,
        broker_id: BrokerId.INTERACTIVE_BROKERS,
        connection_id: 'ibkr_session', // IBKR uses session-based auth
        display_name: 'Interactive Brokers',
        status: 'connected',
        metadata: {
          gateway_url: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000',
          connected_at: new Date().toISOString(),
          accounts_count: accounts.length
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store IBKR connection:', dbError)
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      )
    }

    // Store accounts
    if (accounts.length > 0) {
      const accountsToInsert = accounts.map(account => ({
        connection_id: connection.id,
        broker_account_id: account.id,
        account_number: account.accountNumber,
        account_type: account.accountType,
        display_name: account.displayName,
        currency: account.currency,
        institution_name: account.institutionName,
        metadata: {
          is_active: account.isActive
        }
      }))

      await supabase
        .from('brokerage_accounts')
        .insert(accountsToInsert)
    }

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      broker_id: BrokerId.INTERACTIVE_BROKERS,
      display_name: connection.display_name,
      accounts_count: accounts.length,
      gateway_url: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000'
    })
  } catch (error) {
    console.error('Failed to connect to IBKR:', error)
    return NextResponse.json(
      { error: 'Failed to establish IBKR connection' },
      { status: 500 }
    )
  }
}

// Refresh IBKR connection
export async function PUT(request: NextRequest) {
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

    // Create IBKR client
    const ibkrClient = new InteractiveBrokersClient({
      gatewayUrl: process.env.IBKR_GATEWAY_URL || 'https://localhost:5000'
    })

    // Check if still connected
    const isConnected = await ibkrClient.testConnection('ibkr_session')
    
    if (!isConnected) {
      // Try to reauthenticate
      await ibkrClient.reauthenticate()
      
      // Test again
      const isConnectedAfterReauth = await ibkrClient.testConnection('ibkr_session')
      
      if (!isConnectedAfterReauth) {
        // Update connection status to error
        await supabase
          .from('brokerage_connections')
          .update({
            status: 'error',
            error_message: 'Gateway session expired. Please reauthenticate through IBKR Gateway.',
            updated_at: new Date().toISOString()
          })
          .eq('id', connection_id)
          .eq('user_id', user.id)

        return NextResponse.json({
          error: 'Connection lost',
          instructions: 'Please reauthenticate through IBKR Client Portal Gateway'
        }, { status: 400 })
      }
    }

    // Update connection status
    await supabase
      .from('brokerage_connections')
      .update({
        status: 'connected',
        error_message: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id)
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      status: 'connected',
      last_checked: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to refresh IBKR connection:', error)
    return NextResponse.json(
      { error: 'Failed to refresh connection' },
      { status: 500 }
    )
  }
}