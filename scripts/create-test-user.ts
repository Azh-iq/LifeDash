#!/usr/bin/env tsx

// Create test user for LifeDash development
// Creates user: test@test.no with password: 123456

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function createTestUser() {
  console.log('🔧 Creating test user for LifeDash...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Create test user
    console.log('📧 Creating user: test@test.no')
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'test@test.no',
        password: '123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      })

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }

    console.log('✅ User created with ID:', authData.user.id)

    // Create user profile
    console.log('👤 Creating user profile...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: 'test@test.no',
        full_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('❌ Profile error:', profileError.message)
      return
    }

    console.log('✅ User profile created')

    // Create default portfolio
    console.log('📊 Creating default portfolio...')
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: authData.user.id,
        name: 'Min Portefølje',
        description: 'Test portefølje for utvikling',
        currency: 'NOK',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (portfolioError) {
      console.error('❌ Portfolio error:', portfolioError.message)
      return
    }

    if (!portfolioData) {
      console.error('❌ No portfolio data returned')
      return
    }

    console.log('✅ Portfolio created with ID:', portfolioData.id)

    // Create default account
    console.log('🏦 Creating default account...')
    const { error: accountError } = await supabase.from('accounts').insert({
      user_id: authData.user.id,
      portfolio_id: portfolioData.id,
      platform_id: null, // Manual account
      name: 'Manuell Konto',
      account_type: 'INVESTMENT',
      currency: 'NOK',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (accountError) {
      console.error('❌ Account error:', accountError.message)
      return
    }

    console.log('✅ Account created')

    console.log('\n🎉 Test user setup complete!')
    console.log('📧 Email: test@test.no')
    console.log('🔑 Password: 123456')
    console.log('🚀 Ready to test the new stock search and fees system!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

if (require.main === module) {
  createTestUser().catch(console.error)
}

export { createTestUser }
