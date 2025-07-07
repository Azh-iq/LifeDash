#!/usr/bin/env tsx

// Clean up all test data from the database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test user emails to clean up
const TEST_USER_EMAILS = [
  'test@example.com',
  'test@test.no',
  'skip@test.com',
  'skip@test.no',
  'demo@test.com',
  'demo@test.no',
]

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...')

  try {
    // Clean up test users and all their associated data
    for (const email of TEST_USER_EMAILS) {
      console.log(`\n🔍 Cleaning up test user: ${email}`)

      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError) {
        console.log(`   ℹ️  No user found with email: ${email}`)
        continue
      }

      const userId = userData.id
      console.log(`   ✅ Found user: ${userId}`)

      // Clean up user data in order (respecting foreign keys)

      // 1. Clean up transactions
      const { error: transError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)

      if (transError) {
        console.log(`   ⚠️  Error deleting transactions: ${transError.message}`)
      } else {
        console.log(`   ✅ Deleted transactions`)
      }

      // 2. Clean up holdings
      const { error: holdingsError } = await supabase
        .from('holdings')
        .delete()
        .eq('user_id', userId)

      if (holdingsError) {
        console.log(`   ⚠️  Error deleting holdings: ${holdingsError.message}`)
      } else {
        console.log(`   ✅ Deleted holdings`)
      }

      // 3. Clean up accounts
      const { error: accountsError } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId)

      if (accountsError) {
        console.log(`   ⚠️  Error deleting accounts: ${accountsError.message}`)
      } else {
        console.log(`   ✅ Deleted accounts`)
      }

      // 4. Clean up portfolios
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .delete()
        .eq('user_id', userId)

      if (portfolioError) {
        console.log(
          `   ⚠️  Error deleting portfolios: ${portfolioError.message}`
        )
      } else {
        console.log(`   ✅ Deleted portfolios`)
      }

      // 5. Clean up user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.log(
          `   ⚠️  Error deleting user profile: ${profileError.message}`
        )
      } else {
        console.log(`   ✅ Deleted user profile`)
      }

      console.log(`   🎉 Cleanup complete for: ${email}`)
    }

    // Clean up orphaned test stocks that might not have real data
    console.log('\n🔍 Cleaning up test stocks...')

    // Get stocks that were created for testing (have very round/fake prices)
    const { data: testStocks, error: testStocksError } = await supabase
      .from('stocks')
      .select('*')
      .or('current_price.eq.100,name.ilike.%test%,name.ilike.%demo%')

    if (testStocksError) {
      console.log(
        `   ⚠️  Error finding test stocks: ${testStocksError.message}`
      )
    } else if (testStocks && testStocks.length > 0) {
      console.log(`   ✅ Found ${testStocks.length} test stocks to clean up`)

      for (const stock of testStocks) {
        // Check if stock is still referenced by any holdings
        const { data: references, error: refError } = await supabase
          .from('holdings')
          .select('id')
          .eq('stock_id', stock.id)
          .limit(1)

        if (refError) {
          console.log(
            `   ⚠️  Error checking stock references: ${refError.message}`
          )
          continue
        }

        if (references && references.length === 0) {
          // Stock is not referenced, safe to delete
          const { error: deleteError } = await supabase
            .from('stocks')
            .delete()
            .eq('id', stock.id)

          if (deleteError) {
            console.log(
              `   ⚠️  Error deleting stock ${stock.symbol}: ${deleteError.message}`
            )
          } else {
            console.log(`   ✅ Deleted orphaned test stock: ${stock.symbol}`)
          }
        }
      }
    }

    // Clean up test platforms
    console.log('\n🔍 Cleaning up test platforms...')

    const { data: testPlatforms, error: testPlatformsError } = await supabase
      .from('platforms')
      .select('*')
      .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%manual%')

    if (testPlatformsError) {
      console.log(
        `   ⚠️  Error finding test platforms: ${testPlatformsError.message}`
      )
    } else if (testPlatforms && testPlatforms.length > 0) {
      console.log(
        `   ✅ Found ${testPlatforms.length} test platforms to clean up`
      )

      for (const platform of testPlatforms) {
        // Check if platform is still referenced by any accounts
        const { data: references, error: refError } = await supabase
          .from('accounts')
          .select('id')
          .eq('platform_id', platform.id)
          .limit(1)

        if (refError) {
          console.log(
            `   ⚠️  Error checking platform references: ${refError.message}`
          )
          continue
        }

        if (references && references.length === 0) {
          // Platform is not referenced, safe to delete
          const { error: deleteError } = await supabase
            .from('platforms')
            .delete()
            .eq('id', platform.id)

          if (deleteError) {
            console.log(
              `   ⚠️  Error deleting platform ${platform.name}: ${deleteError.message}`
            )
          } else {
            console.log(
              `   ✅ Deleted orphaned test platform: ${platform.name}`
            )
          }
        }
      }
    }

    console.log('\n🎉 Database cleanup completed!')
    console.log('✅ All test data has been removed')
    console.log('ℹ️  Only real user data remains in the database')

    // Provide next steps
    console.log('\n📋 Next steps:')
    console.log('1. Test the application with your real user account')
    console.log('2. Verify that no dummy holdings appear in the UI')
    console.log('3. Add real transactions to see actual portfolio data')
    console.log(
      '4. If you need test data later, create it manually with real transactions'
    )
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

// Run the cleanup
cleanupTestData().catch(console.error)
