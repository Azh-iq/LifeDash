#!/usr/bin/env tsx

/**
 * Clean Dummy Data Script
 * 
 * Removes all test/dummy holdings and transactions from the database,
 * keeping only real transactions that were manually entered or imported from CSV.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types/database.types'

// Load environment variables
config({ path: '.env.local' })

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('URL:', supabaseUrl ? 'set' : 'missing')
  console.error('Key:', supabaseKey ? 'set' : 'missing')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function cleanDummyData() {
  console.log('🧹 Starting database cleanup...')

  try {
    // 1. Clean holdings that have zero quantity or are inactive
    console.log('🗑️ Cleaning inactive holdings...')
    const { data: inactiveHoldings, error: inactiveError } = await supabase
      .from('holdings')
      .delete()
      .or('quantity.lte.0,is_active.eq.false')

    if (inactiveError) {
      console.error('Error cleaning inactive holdings:', inactiveError)
    } else {
      console.log(`✅ Cleaned inactive holdings`)
    }

    // 2. Clean holdings without valid transactions
    console.log('🗑️ Cleaning holdings without valid transactions...')
    
    // Find holdings that don't have corresponding transactions
    const { data: holdingsWithoutTransactions, error: holdingsError } = await supabase
      .from('holdings')
      .select(`
        id,
        account_id,
        stock_id,
        quantity,
        stocks (symbol, name)
      `)
      .filter('quantity', 'gt', 0)

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError)
      return
    }

    console.log(`Found ${holdingsWithoutTransactions?.length || 0} active holdings`)

    // Check each holding for valid transactions
    let cleanedCount = 0
    for (const holding of holdingsWithoutTransactions || []) {
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, transaction_type, quantity')
        .eq('account_id', holding.account_id)
        .eq('stock_id', holding.stock_id)
        .in('transaction_type', ['BUY', 'SELL'])

      if (txError) {
        console.error(`Error checking transactions for holding ${holding.id}:`, txError)
        continue
      }

      // If no transactions found, this is likely dummy data
      if (!transactions || transactions.length === 0) {
        console.log(`🗑️ Removing dummy holding: ${holding.stocks?.symbol} (${holding.quantity} shares)`)
        
        const { error: deleteError } = await supabase
          .from('holdings')
          .delete()
          .eq('id', holding.id)

        if (deleteError) {
          console.error(`Error deleting holding ${holding.id}:`, deleteError)
        } else {
          cleanedCount++
        }
      }
    }

    console.log(`✅ Cleaned ${cleanedCount} dummy holdings`)

    // 3. Clean stocks that are no longer referenced by any holdings or transactions
    console.log('🗑️ Cleaning unreferenced stocks...')
    
    const { data: unusedStocks, error: stocksError } = await supabase
      .from('stocks')
      .select(`
        id,
        symbol,
        name,
        holdings (id),
        transactions (id)
      `)

    if (stocksError) {
      console.error('Error fetching stocks:', stocksError)
      return
    }

    let removedStocksCount = 0
    for (const stock of unusedStocks || []) {
      // If stock has no holdings and no transactions, it's orphaned
      if (
        (!stock.holdings || stock.holdings.length === 0) &&
        (!stock.transactions || stock.transactions.length === 0)
      ) {
        console.log(`🗑️ Removing unused stock: ${stock.symbol} - ${stock.name}`)
        
        const { error: deleteStockError } = await supabase
          .from('stocks')
          .delete()
          .eq('id', stock.id)

        if (deleteStockError) {
          console.error(`Error deleting stock ${stock.symbol}:`, deleteStockError)
        } else {
          removedStocksCount++
        }
      }
    }

    console.log(`✅ Cleaned ${removedStocksCount} unused stocks`)

    // 4. Update holdings with correct current prices (set to null for real-time update)
    console.log('🔄 Resetting current prices for real-time updates...')
    
    const { error: priceResetError } = await supabase
      .from('holdings')
      .update({ current_price: null })
      .gt('quantity', 0)

    if (priceResetError) {
      console.error('Error resetting prices:', priceResetError)
    } else {
      console.log('✅ Reset current prices for real-time updates')
    }

    // 5. Summary of remaining data
    console.log('\n📊 Database cleanup summary:')
    
    const { data: remainingHoldings, error: summaryError1 } = await supabase
      .from('holdings')
      .select('id, stocks (symbol)')
      .gt('quantity', 0)
      .eq('is_active', true)

    const { data: remainingTransactions, error: summaryError2 } = await supabase
      .from('transactions')
      .select('id, transaction_type')
      .in('transaction_type', ['BUY', 'SELL'])

    if (!summaryError1 && !summaryError2) {
      console.log(`📈 Active holdings: ${remainingHoldings?.length || 0}`)
      console.log(`📋 Transactions: ${remainingTransactions?.length || 0}`)
      
      if (remainingHoldings && remainingHoldings.length > 0) {
        console.log('📊 Remaining stocks:')
        const uniqueSymbols = [...new Set(remainingHoldings.map(h => h.stocks?.symbol).filter(Boolean))]
        uniqueSymbols.forEach(symbol => console.log(`  - ${symbol}`))
      }
    }

    console.log('\n✅ Database cleanup completed successfully!')
    console.log('🎯 Only real transactions and holdings remain in the database.')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanDummyData()
  .then(() => {
    console.log('🎉 Cleanup script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error)
    process.exit(1)
  })