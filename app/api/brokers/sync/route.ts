// Universal broker sync API route
// Syncs portfolio data from connected brokers

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BrokerageClientFactory, BrokerId } from '@/lib/integrations/brokers'

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
    const { connection_id, broker_id, sync_type = 'full_sync' } = body

    if (!connection_id || !broker_id) {
      return NextResponse.json({ 
        error: 'Missing required parameters: connection_id, broker_id' 
      }, { status: 400 })
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .eq('broker_id', broker_id)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (connection.status !== 'connected') {
      return NextResponse.json({ 
        error: 'Connection not active',
        status: connection.status 
      }, { status: 400 })
    }

    // Create sync operation record
    const { data: syncOp, error: syncError } = await supabase
      .from('sync_operations')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        broker_id: broker_id as BrokerId,
        operation_type: sync_type,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncError) {
      return NextResponse.json({ error: 'Failed to create sync operation' }, { status: 500 })
    }

    // Create broker client
    const client = BrokerageClientFactory.create(broker_id as BrokerId, {
      // Configuration will be loaded from environment or connection metadata
    })

    try {
      let syncResult = {
        accounts_processed: 0,
        holdings_processed: 0,
        transactions_processed: 0,
        errors: [] as string[],
        warnings: [] as string[]
      }

      // Test connection first
      const isConnected = await client.testConnection(connection.connection_id)
      if (!isConnected) {
        throw new Error('Connection test failed')
      }

      // Sync accounts
      const accounts = await client.getAccounts(connection.connection_id)
      syncResult.accounts_processed = accounts.length

      // Update/insert accounts in database
      for (const account of accounts) {
        await supabase
          .from('brokerage_accounts')
          .upsert({
            connection_id: connection.id,
            broker_account_id: account.id,
            account_number: account.accountNumber,
            account_type: account.accountType,
            display_name: account.displayName,
            currency: account.currency,
            institution_name: account.institutionName,
            is_active: account.isActive,
            metadata: { last_synced: new Date().toISOString() },
            updated_at: new Date().toISOString()
          })
          .onConflict('connection_id,broker_account_id')
      }

      // Sync holdings if requested
      if (sync_type === 'full_sync' || sync_type === 'holdings_only') {
        const holdings = await client.getHoldings(connection.connection_id)
        syncResult.holdings_processed = holdings.length

        // Clear existing holdings for this connection
        await supabase
          .from('portfolio_holdings')
          .delete()
          .eq('user_id', user.id)
          .in('brokerage_account_id', accounts.map(acc => 
            supabase
              .from('brokerage_accounts')
              .select('id')
              .eq('connection_id', connection.id)
              .eq('broker_account_id', acc.id)
              .single()
              .then(result => result.data?.id)
          ).filter(Boolean))

        // Insert new holdings
        for (const holding of holdings) {
          // Find or create stock record
          let { data: stock } = await supabase
            .from('stocks')
            .select('id')
            .eq('symbol', holding.symbol)
            .single()

          if (!stock) {
            const { data: newStock } = await supabase
              .from('stocks')
              .insert({
                symbol: holding.symbol,
                company_name: holding.metadata?.securityName || holding.symbol,
                currency: holding.currency,
                asset_class: holding.assetClass,
                data_source: 'BROKER_API',
                institution_security_id: holding.institutionSecurityId
              })
              .select()
              .single()
            
            stock = newStock
          }

          // Find account ID
          const { data: brokerAccount } = await supabase
            .from('brokerage_accounts')
            .select('id')
            .eq('connection_id', connection.id)
            .eq('broker_account_id', holding.accountId)
            .single()

          if (stock && brokerAccount) {
            // Calculate P&L
            const unrealizedPnl = holding.marketValue - (holding.costBasis || 0)
            const unrealizedPnlPercent = holding.costBasis 
              ? (unrealizedPnl / holding.costBasis) * 100 
              : 0

            await supabase
              .from('portfolio_holdings')
              .insert({
                user_id: user.id,
                brokerage_account_id: brokerAccount.id,
                stock_id: stock.id,
                symbol: holding.symbol,
                quantity: holding.quantity,
                market_value: holding.marketValue,
                cost_basis: holding.costBasis,
                market_price: holding.marketPrice,
                currency: holding.currency,
                asset_class: holding.assetClass,
                unrealized_pnl: unrealizedPnl,
                unrealized_pnl_percent: unrealizedPnlPercent,
                institution_security_id: holding.institutionSecurityId,
                last_updated: new Date().toISOString(),
                metadata: holding.metadata
              })
          }
        }
      }

      // Sync transactions if requested
      if (sync_type === 'full_sync' || sync_type === 'transactions_only') {
        const transactions = await client.getTransactions(
          connection.connection_id,
          undefined, // all accounts
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // last 90 days
          new Date().toISOString().split('T')[0]
        )
        syncResult.transactions_processed = transactions.length

        // Insert new transactions (skip duplicates)
        for (const transaction of transactions) {
          const { data: brokerAccount } = await supabase
            .from('brokerage_accounts')
            .select('id')
            .eq('connection_id', connection.id)
            .eq('broker_account_id', transaction.accountId)
            .single()

          if (brokerAccount) {
            await supabase
              .from('transactions')
              .upsert({
                user_id: user.id,
                account_id: brokerAccount.id, // Map to our account system
                brokerage_account_id: brokerAccount.id,
                broker_transaction_id: transaction.id,
                type: transaction.type.toLowerCase(),
                symbol: transaction.symbol,
                quantity: transaction.quantity,
                price: transaction.price,
                amount: transaction.amount,
                currency: transaction.currency,
                date: transaction.date,
                fees: transaction.fees,
                description: transaction.description,
                transaction_type: transaction.type,
                broker_metadata: transaction.metadata,
                created_at: new Date().toISOString()
              })
              .onConflict('broker_transaction_id')
          }
        }
      }

      // Update sync operation as completed
      await supabase
        .from('sync_operations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: syncResult
        })
        .eq('id', syncOp.id)

      // Update connection last sync time
      await supabase
        .from('brokerage_connections')
        .update({
          last_synced_at: new Date().toISOString(),
          status: 'connected',
          error_message: null
        })
        .eq('id', connection.id)

      // Trigger portfolio summary recalculation
      await supabase.rpc('calculate_portfolio_summary', { p_user_id: user.id })

      return NextResponse.json({
        success: true,
        sync_operation_id: syncOp.id,
        result: syncResult,
        completed_at: new Date().toISOString()
      })
    } catch (syncError) {
      // Update sync operation as failed
      await supabase
        .from('sync_operations')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message
        })
        .eq('id', syncOp.id)

      // Update connection status
      await supabase
        .from('brokerage_connections')
        .update({
          status: 'error',
          error_message: syncError.message
        })
        .eq('id', connection.id)

      throw syncError
    }
  } catch (error) {
    console.error('Broker sync failed:', error)
    return NextResponse.json(
      { error: 'Sync operation failed', details: error.message },
      { status: 500 }
    )
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connection_id')

    let query = supabase
      .from('sync_operations')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20)

    if (connectionId) {
      query = query.eq('connection_id', connectionId)
    }

    const { data: syncOps, error: dbError } = await query

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      sync_operations: syncOps,
      active_syncs: syncOps.filter(op => op.status === 'running' || op.status === 'pending').length
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}