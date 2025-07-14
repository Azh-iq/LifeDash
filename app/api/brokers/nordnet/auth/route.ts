// Nordnet API authentication route
// Handles SSH key-based authentication for Nordic markets

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NordnetClient } from '@/lib/integrations/brokers'
import { BrokerId } from '@/lib/integrations/brokers/types'

// Authenticate with Nordnet using SSH keys
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { api_key, private_key, country } = body

    if (!api_key || !private_key || !country) {
      return NextResponse.json({ 
        error: 'Missing required credentials: api_key, private_key, country' 
      }, { status: 400 })
    }

    // Validate country
    if (!['se', 'no', 'dk', 'fi'].includes(country)) {
      return NextResponse.json({ 
        error: 'Invalid country. Must be one of: se, no, dk, fi' 
      }, { status: 400 })
    }

    // Create Nordnet client
    const nordnetClient = new NordnetClient({
      apiKey: api_key,
      privateKey: private_key,
      country
    })

    // Authenticate with Nordnet
    const authResult = await nordnetClient.authenticate({
      api_key,
      private_key
    })

    if (!authResult.success) {
      return NextResponse.json({
        error: authResult.error || 'Authentication failed',
        details: 'Please verify your API key and SSH private key are correct'
      }, { status: 400 })
    }

    // Get country display name
    const countryNames = {
      se: 'Sweden',
      no: 'Norway', 
      dk: 'Denmark',
      fi: 'Finland'
    }

    // Store connection in database
    const { data: connection, error: dbError } = await supabase
      .from('brokerage_connections')
      .insert({
        user_id: user.id,
        broker_id: BrokerId.NORDNET,
        connection_id: authResult.connectionId!,
        display_name: `Nordnet ${countryNames[country as keyof typeof countryNames]}`,
        status: 'connected',
        access_token: authResult.accessToken, // Session key, should be encrypted
        expires_at: authResult.expiresAt,
        metadata: {
          country,
          api_key: api_key.substring(0, 8) + '...', // Store partial key for reference
          connected_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store Nordnet connection:', dbError)
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      )
    }

    // Fetch and store accounts
    try {
      const brokerAccounts = await nordnetClient.getAccounts(authResult.connectionId!)
      
      if (brokerAccounts.length > 0) {
        const accountsToInsert = brokerAccounts.map(account => ({
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
    } catch (error) {
      console.error('Failed to fetch/store Nordnet accounts:', error)
      // Continue even if account fetch fails
    }

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      broker_id: BrokerId.NORDNET,
      display_name: connection.display_name,
      country: countryNames[country as keyof typeof countryNames],
      accounts_count: brokerAccounts?.length || 0
    })
  } catch (error) {
    console.error('Failed to authenticate with Nordnet:', error)
    return NextResponse.json(
      { error: 'Nordnet authentication failed' },
      { status: 500 }
    )
  }
}

// Get Nordnet authentication status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Nordnet connections
    const { data: connections, error: dbError } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_id', BrokerId.NORDNET)
      .eq('status', 'connected')

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      connected: connections.length > 0,
      connections: connections.map(conn => ({
        id: conn.id,
        display_name: conn.display_name,
        country: conn.metadata?.country,
        connected_at: conn.created_at,
        last_synced: conn.last_synced_at
      }))
    })
  } catch (error) {
    console.error('Failed to get Nordnet status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

// Test Nordnet connection
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

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .eq('broker_id', BrokerId.NORDNET)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Create Nordnet client
    const nordnetClient = new NordnetClient({
      apiKey: process.env.NORDNET_API_KEY!, // Should be from stored credentials
      privateKey: process.env.NORDNET_PRIVATE_KEY!,
      country: connection.metadata?.country || 'no'
    })

    // Test connection
    const isConnected = await nordnetClient.testConnection(connection.connection_id)
    
    if (!isConnected) {
      // Try to refresh authentication
      const authResult = await nordnetClient.refreshAuth(connection)
      
      if (!authResult.success) {
        // Update connection status to error
        await supabase
          .from('brokerage_connections')
          .update({
            status: 'error',
            error_message: 'Session expired. Please reauthenticate.',
            updated_at: new Date().toISOString()
          })
          .eq('id', connection_id)

        return NextResponse.json({
          error: 'Connection lost',
          instructions: 'Please reauthenticate with your Nordnet credentials'
        }, { status: 400 })
      }

      // Update with new session
      await supabase
        .from('brokerage_connections')
        .update({
          connection_id: authResult.connectionId!,
          access_token: authResult.accessToken,
          expires_at: authResult.expiresAt,
          status: 'connected',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection_id)
    } else {
      // Update last checked time
      await supabase
        .from('brokerage_connections')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connection_id)
    }

    return NextResponse.json({
      success: true,
      status: 'connected',
      last_checked: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to test Nordnet connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}