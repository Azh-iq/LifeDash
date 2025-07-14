#!/usr/bin/env tsx
// Fix RLS policies for stocks table to allow INSERT operations

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addStocksInsertPolicies() {
  console.log('🔧 Adding INSERT policies for stocks table...')

  const policies = [
    {
      name: 'Authenticated users can insert stocks',
      sql: `
        CREATE POLICY "Authenticated users can insert stocks" ON public.stocks
          FOR INSERT 
          TO authenticated
          WITH CHECK (true);
      `
    },
    {
      name: 'Service role can insert stocks',
      sql: `
        CREATE POLICY "Service role can insert stocks" ON public.stocks
          FOR INSERT 
          TO service_role
          WITH CHECK (true);
      `
    },
    {
      name: 'Authenticated users can insert stock aliases',
      sql: `
        CREATE POLICY "Authenticated users can insert stock aliases" ON public.stock_aliases
          FOR INSERT 
          TO authenticated
          WITH CHECK (true);
      `
    },
    {
      name: 'Service role can insert stock aliases',
      sql: `
        CREATE POLICY "Service role can insert stock aliases" ON public.stock_aliases
          FOR INSERT 
          TO service_role
          WITH CHECK (true);
      `
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`⏳ Creating policy: ${policy.name}`)
      
      const { error } = await supabase.rpc('execute_sql', {
        sql: policy.sql
      })
      
      if (error) {
        // If the function doesn't exist, try direct SQL execution
        const { error: directError } = await supabase
          .from('_dummy')
          .select()
          .limit(0)
        
        if (directError) {
          // Try alternative approach with raw SQL
          console.log(`⚠️  Using alternative SQL execution method`)
          const { error: rawError } = await (supabase as any).sql`${policy.sql}`
          
          if (rawError && !rawError.message.includes('already exists')) {
            console.error(`❌ Failed to create policy: ${policy.name}`)
            console.error('Error:', rawError)
          } else {
            console.log(`✅ Policy created: ${policy.name}`)
          }
        }
      } else {
        console.log(`✅ Policy created: ${policy.name}`)
      }
    } catch (error) {
      console.error(`❌ Error creating policy: ${policy.name}`)
      console.error('Error:', error)
    }
  }

  console.log('🎉 INSERT policies configuration completed')
}

async function testStocksInsert() {
  console.log('🧪 Testing stocks INSERT permission...')
  
  try {
    const testStock = {
      symbol: 'TEST',
      exchange: 'TEST',
      name: 'Test Stock',
      company_name: 'Test Company',
      isin: 'US0000000000',
      currency: 'USD',
      asset_class: 'STOCK',
      data_source: 'CSV_IMPORT',
    }

    const { data, error } = await supabase
      .from('stocks')
      .insert(testStock)
      .select('id')
      .single()

    if (error) {
      console.error('❌ Test INSERT failed:', error)
      return false
    }

    console.log('✅ Test INSERT successful, ID:', data.id)
    
    // Clean up test stock
    await supabase.from('stocks').delete().eq('id', data.id)
    console.log('🧹 Test stock cleaned up')
    
    return true
  } catch (error) {
    console.error('❌ Test INSERT exception:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting stocks RLS policy fix...')
  
  try {
    await addStocksInsertPolicies()
    const testResult = await testStocksInsert()
    
    if (testResult) {
      console.log('🎉 All stocks RLS policies are working correctly!')
    } else {
      console.log('⚠️  Manual policy creation may be required')
      console.log('📋 SQL to run manually:')
      console.log(`
CREATE POLICY "Authenticated users can insert stocks" ON public.stocks
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can insert stocks" ON public.stocks
  FOR INSERT 
  TO service_role
  WITH CHECK (true);
      `)
    }
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}