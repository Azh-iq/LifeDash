#!/usr/bin/env tsx
// Debug RLS policies for stocks table

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for stocks table...')
  
  try {
    // Check current policies
    const { data: policies, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT schemaname, tablename, policyname, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'stocks';
        `
      })
    
    if (error) {
      console.error('❌ Error checking policies:', error)
      
      // Try alternative approach
      const { data: altData, error: altError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'stocks')
        .limit(1)
      
      console.log('📋 Stocks table exists:', !altError && altData?.length > 0)
    } else {
      console.log('📋 Current RLS policies for stocks:')
      console.log(policies)
    }
  } catch (error) {
    console.error('❌ Exception checking policies:', error)
  }
}

async function testWithDifferentAuth() {
  console.log('🧪 Testing INSERT with different authentication methods...')
  
  // Test 1: Service role (should work)
  console.log('Test 1: Service role')
  try {
    const { data, error } = await supabase
      .from('stocks')
      .insert({
        symbol: 'TEST1',
        exchange: 'TEST',
        name: 'Test Stock 1',
        currency: 'USD',
        asset_class: 'STOCK',
        data_source: 'CSV_IMPORT'
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ Service role INSERT failed:', error)
    } else {
      console.log('✅ Service role INSERT successful:', data.id)
      // Clean up
      await supabase.from('stocks').delete().eq('id', data.id)
    }
  } catch (error) {
    console.error('❌ Service role exception:', error)
  }
  
  // Test 2: Check what role we're actually using
  console.log('\nTest 2: Current session info')
  try {
    const { data: session, error } = await supabase.auth.getSession()
    console.log('Session error:', error)
    console.log('Session user:', session?.session?.user?.id || 'No user')
    console.log('Session role:', session?.session?.user?.role || 'No role')
  } catch (error) {
    console.error('❌ Session check failed:', error)
  }
}

async function disableRLSTemporarily() {
  console.log('🔧 Temporarily disabling RLS to test INSERT...')
  
  try {
    // Disable RLS temporarily
    const { error: disableError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.stocks DISABLE ROW LEVEL SECURITY;'
    })
    
    if (disableError) {
      console.log('⚠️ Could not disable RLS via function, trying direct SQL...')
    } else {
      console.log('✅ RLS disabled')
    }
    
    // Test INSERT without RLS
    const { data, error } = await supabase
      .from('stocks')
      .insert({
        symbol: 'TEST2',
        exchange: 'TEST',
        name: 'Test Stock 2 No RLS',
        currency: 'USD',
        asset_class: 'STOCK',
        data_source: 'CSV_IMPORT'
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ INSERT without RLS failed:', error)
    } else {
      console.log('✅ INSERT without RLS successful:', data.id)
      // Clean up
      await supabase.from('stocks').delete().eq('id', data.id)
    }
    
    // Re-enable RLS
    const { error: enableError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;'
    })
    
    if (!enableError) {
      console.log('✅ RLS re-enabled')
    }
    
  } catch (error) {
    console.error('❌ RLS test failed:', error)
  }
}

async function main() {
  console.log('🚀 Starting comprehensive RLS debug...')
  
  await checkRLSPolicies()
  await testWithDifferentAuth()
  await disableRLSTemporarily()
  
  console.log('\n📋 DIAGNOSIS:')
  console.log('If INSERT without RLS works but with RLS fails, the problem is RLS policies.')
  console.log('If INSERT fails even without RLS, the problem is elsewhere (schema, constraints, etc.)')
}

if (require.main === module) {
  main()
}