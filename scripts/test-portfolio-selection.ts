#!/usr/bin/env npx tsx

/**
 * Test which portfolio is being selected by the stocks page
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

async function testPortfolioSelection() {
  console.log('🔍 Testing Portfolio Selection\n')

  try {
    // Sign in as test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    })

    if (signInError || !signInData.user) {
      console.error('❌ Could not sign in as test user:', signInError?.message)
      return
    }

    const userId = signInData.user.id
    console.log('✅ Signed in as:', signInData.user.email)

    // Simulate the exact query from getUserPortfolios
    const { data: portfolios, error: fetchError } = await supabase
      .from('portfolios')
      .select(
        `
        *,
        accounts:accounts(
          id,
          holdings:holdings(
            id,
            quantity,
            average_cost,
            stock:stocks(
              symbol,
              current_price
            )
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Portfolio fetch error:', fetchError)
      return
    }

    console.log('📊 Portfolio Selection Test')
    console.log('===========================')
    console.log(`Found ${portfolios.length} portfolios (ordered by created_at DESC):`)
    
    portfolios.forEach((portfolio, index) => {
      console.log(`\n${index + 1}. "${portfolio.name}" (${portfolio.id})`)
      console.log(`   Created: ${portfolio.created_at}`)
      console.log(`   Default: ${portfolio.is_default}`)
      console.log(`   Type: ${portfolio.type}`)
      console.log(`   Accounts: ${portfolio.accounts?.length || 0}`)
      
      let totalHoldings = 0
      if (portfolio.accounts) {
        portfolio.accounts.forEach(account => {
          if (account.holdings) {
            totalHoldings += account.holdings.length
          }
        })
      }
      console.log(`   Total Holdings: ${totalHoldings}`)
      
      if (index === 0) {
        console.log('   ✅ THIS WILL BE SELECTED by stocks page')
      }
    })

    console.log('\n🎯 Conclusion:')
    if (portfolios.length > 0) {
      const selectedPortfolio = portfolios[0]
      console.log(`The stocks page will use: "${selectedPortfolio.name}" (${selectedPortfolio.id})`)
      
      // Check if this portfolio has holdings
      let hasHoldings = false
      if (selectedPortfolio.accounts) {
        selectedPortfolio.accounts.forEach(account => {
          if (account.holdings && account.holdings.length > 0) {
            hasHoldings = true
          }
        })
      }
      
      if (hasHoldings) {
        console.log('✅ This portfolio HAS holdings - should work correctly')
      } else {
        console.log('❌ This portfolio has NO holdings - that\'s the issue!')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPortfolioSelection().catch(console.error)