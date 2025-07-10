#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types/database.types';

config({ path: '.env.local' });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCurrentData() {
  console.log('🔍 Checking current database state...\n');

  // Check holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from('holdings')
    .select('*, stocks(symbol, name)')
    .gt('quantity', 0);

  if (holdingsError) {
    console.error('Holdings error:', holdingsError);
  } else {
    console.log('📈 Current Holdings:');
    holdings?.forEach(h => {
      console.log(`  - ${h.stocks?.symbol}: ${h.quantity} shares, Value: ${h.current_value || 'N/A'}`);
    });
  }

  // Check recent transactions
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*, stocks(symbol)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (txError) {
    console.error('Transactions error:', txError);
  } else {
    console.log('\n📋 Recent Transactions:');
    transactions?.forEach(t => {
      console.log(`  - ${t.stocks?.symbol}: ${t.transaction_type} ${t.quantity} @ ${t.price}`);
    });
  }

  // Check accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*');

  if (accountsError) {
    console.error('Accounts error:', accountsError);
  } else {
    console.log('\n🏦 Accounts:');
    accounts?.forEach(a => {
      console.log(`  - ${a.name} (${a.platform})`);
    });
  }

  console.log('\n✅ Database check completed');
}

checkCurrentData().catch(console.error);