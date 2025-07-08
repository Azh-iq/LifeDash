#!/usr/bin/env tsx

// Final fix for test user - complete setup

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function finalFixTestUser() {
  console.log('🔧 Final fix for test user...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Get first platform
    const { data: platforms } = await supabase
      .from('platforms')
      .select('id')
      .limit(1)
      .single()

    if (!platforms) {
      console.log('❌ No platforms found, creating manual platform...')

      // Create a manual platform
      const { data: newPlatform } = await supabase
        .from('platforms')
        .insert({
          name: 'Manual',
          display_name: 'Manuell Registrering',
          type: 'MANUAL',
          country: 'NO',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (newPlatform) {
        console.log('✅ Manual platform created:', newPlatform.id)
      }
    }

    // Get platform again
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .limit(1)
      .single()

    if (!platform) {
      console.error('❌ Still no platform available')
      return
    }

    console.log('📦 Using platform ID:', platform.id)

    // Create account
    const { error } = await supabase.from('accounts').insert({
      user_id: 'ad4bf17b-6571-4699-ab40-4da6e41090cd',
      portfolio_id: '9b5b3c81-ca3c-453b-b7b2-16042fe20694',
      platform_id: platform.id,
      name: 'Test Konto',
      account_type: 'TAXABLE',
      currency: 'NOK',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('❌ Account error:', error.message)
    } else {
      console.log('✅ SUCCESS! Test user is fully ready!')
      console.log('\n🎉 Complete test user setup:')
      console.log('📧 Email: test@test.no')
      console.log('🔑 Password: 123456')
      console.log('📊 Portfolio created')
      console.log('🏦 Account created')
      console.log('\n🎯 Now you can test:')
      console.log('1. Go to http://localhost:3003')
      console.log('2. Login with test@test.no / 123456')
      console.log('3. Type "micro" in stock search → see Microsoft!')
      console.log('4. Click "Avanserte gebyrer" → see separate fee fields!')
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

finalFixTestUser().catch(console.error)
