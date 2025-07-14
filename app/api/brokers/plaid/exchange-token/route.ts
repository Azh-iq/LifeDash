// Plaid public token exchange API route
// Exchanges public token from Plaid Link for access token

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlaidClient } from '@/lib/integrations/brokers'
import { BrokerId } from '@/lib/integrations/brokers/types'

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
    const { public_token, institution_name, accounts } = body

    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 })
    }

    // Create Plaid client
    const plaidClient = new PlaidClient({
      clientId: process.env.PLAID_CLIENT_ID!,
      secret: process.env.PLAID_SECRET!,
      environment: process.env.PLAID_ENVIRONMENT as 'sandbox' | 'development' | 'production'
    })

    // Exchange public token for access token
    const authResult = await plaidClient.authenticate({ public_token })

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
        broker_id: BrokerId.PLAID,
        connection_id: authResult.connectionId!,
        display_name: institution_name || 'Plaid Connection',
        status: 'connected',
        access_token: authResult.accessToken, // Should be encrypted in production
        metadata: {
          institution_name,
          accounts_count: accounts?.length || 0,
          connected_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store Plaid connection:', dbError)
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      )
    }

    // Fetch and store accounts
    try {
      const brokerAccounts = await plaidClient.getAccounts(authResult.connectionId!)
      
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
      console.error('Failed to fetch/store Plaid accounts:', error)
      // Continue even if account fetch fails - user can sync later
    }

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      broker_id: BrokerId.PLAID,
      display_name: connection.display_name,
      accounts_count: brokerAccounts?.length || 0
    })
  } catch (error) {
    console.error('Failed to exchange Plaid token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}