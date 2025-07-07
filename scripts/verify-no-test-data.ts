#!/usr/bin/env tsx

// Verify that no test data remains in the database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyNoTestData() {
  console.log('🔍 Verifying that no test data remains in the database...')

  try {
    // Check for test users
    const { data: testUsers, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .or('email.ilike.%test%,email.ilike.%demo%,email.ilike.%skip%')

    if (userError) {
      console.log(`⚠️  Error checking users: ${userError.message}`)
    } else {
      console.log(`👥 Test users found: ${testUsers?.length || 0}`)
      if (testUsers && testUsers.length > 0) {
        testUsers.forEach(user => console.log(`   - ${user.email}`))
      }
    }

    // Check for test portfolios
    const { data: testPortfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('name')
      .or(
        'name.ilike.%test%,name.ilike.%demo%,description.ilike.%test%,description.ilike.%demo%'
      )

    if (portfolioError) {
      console.log(`⚠️  Error checking portfolios: ${portfolioError.message}`)
    } else {
      console.log(`📁 Test portfolios found: ${testPortfolios?.length || 0}`)
      if (testPortfolios && testPortfolios.length > 0) {
        testPortfolios.forEach(portfolio =>
          console.log(`   - ${portfolio.name}`)
        )
      }
    }

    // Check for test accounts
    const { data: testAccounts, error: accountError } = await supabase
      .from('accounts')
      .select('name')
      .or('name.ilike.%test%,name.ilike.%demo%')

    if (accountError) {
      console.log(`⚠️  Error checking accounts: ${accountError.message}`)
    } else {
      console.log(`🏦 Test accounts found: ${testAccounts?.length || 0}`)
      if (testAccounts && testAccounts.length > 0) {
        testAccounts.forEach(account => console.log(`   - ${account.name}`))
      }
    }

    // Check for suspicious stocks (with round prices like 100)
    const { data: suspiciousStocks, error: stockError } = await supabase
      .from('stocks')
      .select('symbol, name, current_price')
      .or('current_price.eq.100,name.ilike.%test%,name.ilike.%demo%')

    if (stockError) {
      console.log(`⚠️  Error checking stocks: ${stockError.message}`)
    } else {
      console.log(
        `📈 Suspicious stocks found: ${suspiciousStocks?.length || 0}`
      )
      if (suspiciousStocks && suspiciousStocks.length > 0) {
        suspiciousStocks.forEach(stock =>
          console.log(
            `   - ${stock.symbol}: ${stock.name} (${stock.current_price})`
          )
        )
      }
    }

    // Check for test platforms
    const { data: testPlatforms, error: platformError } = await supabase
      .from('platforms')
      .select('name, display_name')
      .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%manual%')

    if (platformError) {
      console.log(`⚠️  Error checking platforms: ${platformError.message}`)
    } else {
      console.log(`🔧 Test platforms found: ${testPlatforms?.length || 0}`)
      if (testPlatforms && testPlatforms.length > 0) {
        testPlatforms.forEach(platform =>
          console.log(`   - ${platform.name}: ${platform.display_name}`)
        )
      }
    }

    // Get total counts for context
    const { data: totalUsers } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })

    const { data: totalPortfolios } = await supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })

    const { data: totalHoldings } = await supabase
      .from('holdings')
      .select('id', { count: 'exact', head: true })

    const { data: totalTransactions } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })

    console.log('\n📊 Database summary:')
    console.log(`   Users: ${totalUsers?.length || 0}`)
    console.log(`   Portfolios: ${totalPortfolios?.length || 0}`)
    console.log(`   Holdings: ${totalHoldings?.length || 0}`)
    console.log(`   Transactions: ${totalTransactions?.length || 0}`)

    // Determine if cleanup was successful
    const hasTestData =
      (testUsers?.length || 0) +
        (testPortfolios?.length || 0) +
        (testAccounts?.length || 0) +
        (testPlatforms?.length || 0) >
      0

    if (hasTestData) {
      console.log('\n⚠️  Some test data may still remain in the database')
      console.log(
        '   Review the items listed above and clean them manually if needed'
      )
    } else {
      console.log('\n✅ No test data found! Database is clean.')
      console.log('   Holdings table will now only show real user data')
    }
  } catch (error) {
    console.error('❌ Error during verification:', error)
  }
}

// Run the verification
verifyNoTestData().catch(console.error)
