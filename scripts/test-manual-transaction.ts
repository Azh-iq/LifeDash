#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types/database.types';

config({ path: '.env.local' });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testManualTransaction() {
  console.log('🧪 Testing manual transaction flow...\n');

  try {
    // Step 1: Get user and portfolio info
    console.log('👤 Getting user and portfolio info...');
    
    const testUserId = 'ad4bf17b-6571-4699-ab40-4da6e41090cd';
    
    // Use the second portfolio (Test Konto)
    const portfolioId = '9b5b3c81-ca3c-453b-b7b2-16042fe20694';
    const accountId = 'aa987ef2-2f28-4a15-a659-968b5096947f';
    
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();
      
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    console.log(`✅ Found user: ${testUserId}`);
    console.log(`✅ Found portfolio: ${portfolio.name} (${portfolio.id})`);
    console.log(`✅ Found account: ${account.name} (${account.id})`);

    // Step 2: Find or create a stock to buy
    console.log('\n📊 Finding stock to purchase...');
    
    let { data: stock } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', 'GOOGL')
      .single();

    if (!stock) {
      console.log('Creating GOOGL stock entry...');
      const { data: newStock, error: stockError } = await supabase
        .from('stocks')
        .insert({
          symbol: 'GOOGL',
          name: 'Alphabet Inc. Class A',
          isin: 'US02079K3059',
          exchange: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          current_price: 180.0
        })
        .select()
        .single();

      if (stockError) {
        console.error('Failed to create stock:', stockError);
        return;
      }
      stock = newStock;
    }

    console.log(`✅ Stock found: ${stock.symbol} - ${stock.name}`);

    // Step 3: Create a buy transaction
    console.log('\n💰 Creating buy transaction...');
    
    const transactionData = {
      user_id: testUserId,
      account_id: account.id,
      stock_id: stock.id,
      transaction_type: 'BUY' as const,
      quantity: 10,
      price: 180.50,
      currency: 'USD',
      total_amount: 1805.0,
      commission: 9.99,  // Use commission instead of total_fees
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      notes: 'Test manual transaction'
    };

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      console.error('Failed to create transaction:', txError);
      return;
    }

    console.log(`✅ Transaction created: ${transaction.id}`);
    console.log(`   - Type: ${transaction.transaction_type}`);
    console.log(`   - Quantity: ${transaction.quantity}`);
    console.log(`   - Price: ${transaction.price}`);
    console.log(`   - Total: ${transaction.total_amount}`);

    // Step 4: Check if holdings were updated
    console.log('\n📈 Checking holdings update...');
    
    const { data: holding } = await supabase
      .from('holdings')
      .select('*, stocks(symbol, name)')
      .eq('account_id', account.id)
      .eq('stock_id', stock.id)
      .single();

    if (holding) {
      console.log(`✅ Holding found: ${holding.stocks?.symbol}`);
      console.log(`   - Quantity: ${holding.quantity}`);
      console.log(`   - Average Cost: ${holding.average_cost}`);
      console.log(`   - Total Value: ${holding.current_value || 'N/A'}`);
    } else {
      console.log('⚠️ No holding found - may need manual update');
    }

    // Step 5: Verify data flow
    console.log('\n🔍 Verifying complete data flow...');
    
    // Check transaction exists
    const { data: txCheck } = await supabase
      .from('transactions')
      .select('*, stocks(symbol)')
      .eq('id', transaction.id)
      .single();

    console.log(`✅ Transaction verified: ${txCheck?.stocks?.symbol} ${txCheck?.transaction_type}`);

    // Check holding calculation
    const { data: allTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', account.id)
      .eq('stock_id', stock.id)
      .eq('transaction_type', 'BUY');

    const totalShares = allTx?.reduce((sum, tx) => sum + (tx.quantity || 0), 0) || 0;
    const totalCost = allTx?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0;
    const avgCost = totalShares > 0 ? totalCost / totalShares : 0;

    console.log(`📊 Calculated totals:`);
    console.log(`   - Total shares: ${totalShares}`);
    console.log(`   - Total cost: ${totalCost}`);
    console.log(`   - Average cost: ${avgCost.toFixed(2)}`);

    console.log('\n✅ Manual transaction test completed successfully!');

  } catch (error) {
    console.error('❌ Manual transaction test failed:', error);
  }
}

testManualTransaction().catch(console.error);