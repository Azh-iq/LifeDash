// Plaid Link token generation API route
// Creates Link tokens for Plaid Link initialization

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlaidClient } from '@/lib/integrations/brokers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Plaid client
    const plaidClient = new PlaidClient({
      clientId: process.env.PLAID_CLIENT_ID!,
      secret: process.env.PLAID_SECRET!,
      environment: process.env.PLAID_ENVIRONMENT as 'sandbox' | 'development' | 'production'
    })

    // Generate Link token
    const linkToken = await plaidClient.createLinkToken(
      user.id,
      ['investments'] // Request investments product
    )

    return NextResponse.json({ 
      link_token: linkToken,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    })
  } catch (error) {
    console.error('Failed to create Plaid Link token:', error)
    return NextResponse.json(
      { error: 'Failed to create Link token' },
      { status: 500 }
    )
  }
}