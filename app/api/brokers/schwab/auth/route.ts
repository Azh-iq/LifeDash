// Charles Schwab OAuth initiation API route
// Generates OAuth authorization URL for Schwab authentication

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SchwabClient } from '@/lib/integrations/brokers'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate state parameter for security
    const state = randomBytes(32).toString('hex')

    // Store state in database for verification
    await supabase
      .from('oauth_states')
      .upsert({
        user_id: user.id,
        broker_id: 'schwab',
        state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      })

    // Create Schwab client
    const schwabClient = new SchwabClient({
      clientId: process.env.SCHWAB_CLIENT_ID!,
      clientSecret: process.env.SCHWAB_CLIENT_SECRET!,
      redirectUri: process.env.SCHWAB_REDIRECT_URI!,
      environment: process.env.SCHWAB_ENVIRONMENT as 'sandbox' | 'production'
    })

    // Generate authorization URL
    const authUrl = schwabClient.generateAuthUrl(state)

    return NextResponse.json({
      auth_url: authUrl,
      state,
      expires_in: 600 // 10 minutes
    })
  } catch (error) {
    console.error('Failed to generate Schwab auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}

// OAuth callback handler
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
    const { code, state } = body

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing authorization code or state' }, { status: 400 })
    }

    // Verify state parameter
    const { data: storedState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_id', 'schwab')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !storedState) {
      return NextResponse.json({ error: 'Invalid or expired state parameter' }, { status: 400 })
    }

    // Delete used state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('id', storedState.id)

    // Create Schwab client
    const schwabClient = new SchwabClient({
      clientId: process.env.SCHWAB_CLIENT_ID!,
      clientSecret: process.env.SCHWAB_CLIENT_SECRET!,
      redirectUri: process.env.SCHWAB_REDIRECT_URI!,
      environment: process.env.SCHWAB_ENVIRONMENT as 'sandbox' | 'production'
    })

    // Exchange authorization code for access token
    const authResult = await schwabClient.authenticate({ authorization_code: code })

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 400 }
      )
    }

    // Store connection in database
    const { data: connection, error: dbError } = await supabase
      .from('brokerage_connections')
      .insert({
        user_id: user.id,
        broker_id: 'schwab',
        connection_id: authResult.connectionId!,
        display_name: 'Charles Schwab',
        status: 'connected',
        access_token: authResult.accessToken, // Should be encrypted in production
        refresh_token: authResult.refreshToken,
        expires_at: authResult.expiresAt,
        metadata: {
          connected_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store Schwab connection:', dbError)
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      )
    }

    // Fetch and store accounts
    try {
      const brokerAccounts = await schwabClient.getAccounts(authResult.connectionId!)
      
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
      console.error('Failed to fetch/store Schwab accounts:', error)
      // Continue even if account fetch fails
    }

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      broker_id: 'schwab',
      display_name: connection.display_name
    })
  } catch (error) {
    console.error('Failed to process Schwab OAuth callback:', error)
    return NextResponse.json(
      { error: 'OAuth callback processing failed' },
      { status: 500 }
    )
  }
}