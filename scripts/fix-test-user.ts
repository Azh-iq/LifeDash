#!/usr/bin/env tsx

// Fix test user account creation

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function fixTestUser() {
  console.log('🔧 Fixing test user account...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Create account with correct enum value
    const { error } = await supabase.from('accounts').insert({
      user_id: 'ad4bf17b-6571-4699-ab40-4da6e41090cd',
      portfolio_id: '9b5b3c81-ca3c-453b-b7b2-16042fe20694',
      platform_id: null,
      name: 'Manuell Konto',
      account_type: 'BROKERAGE',
      currency: 'NOK',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('❌ Account error:', error.message)
    } else {
      console.log('✅ Account created successfully!')
      console.log('\n🎉 Test user is ready!')
      console.log('📧 Email: test@test.no')
      console.log('🔑 Password: 123456')
      console.log('\n🎯 Now you can:')
      console.log('1. Go to http://localhost:3003')
      console.log('2. Login with test@test.no / 123456')
      console.log('3. Test the new stock search (type "micro" → see Microsoft)')
      console.log('4. Test advanced fees (click "Avanserte gebyrer")')
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixTestUser().catch(console.error)
