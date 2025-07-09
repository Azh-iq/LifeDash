#!/usr/bin/env npx tsx

/**
 * Debug Holdings Issue
 * 
 * This script connects directly to the database to check why holdings aren't showing up
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

async function debugHoldingsIssue() {
  console.log('🔍 Debug Holdings Issue\n')

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
    console.log('User ID:', userId)

    // Step 1: Get all portfolios for this user
    console.log('\n📊 Step 1: Get User Portfolios')
    console.log('=============================')
    
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (portfolioError) {
      console.error('❌ Portfolio error:', portfolioError)
      return
    }

    console.log(`Found ${portfolios.length} portfolios:`)
    portfolios.forEach((portfolio, index) => {
      console.log(`  ${index + 1}. "${portfolio.name}" (ID: ${portfolio.id})`)
      console.log(`     Default: ${portfolio.is_default}`)
      console.log(`     Created: ${portfolio.created_at}`)
    })

    // Step 2: Get all accounts for this user
    console.log('\n🏦 Step 2: Get User Accounts')
    console.log('============================')
    
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    if (accountError) {
      console.error('❌ Account error:', accountError)
      return
    }

    console.log(`Found ${accounts.length} accounts:`)
    accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. "${account.name}" (ID: ${account.id})`)
      console.log(`     Portfolio ID: ${account.portfolio_id}`)
      console.log(`     Platform: ${account.platform}`)
      console.log(`     Active: ${account.is_active}`)
    })

    // Step 3: Get all holdings for this user
    console.log('\n💼 Step 3: Get User Holdings')
    console.log('============================')
    
    const { data: holdings, error: holdingError } = await supabase
      .from('holdings')
      .select(`
        *,
        stocks (
          symbol,
          name,
          currency,
          exchange
        ),
        accounts (
          id,
          name,
          portfolio_id
        )
      `)
      .eq('user_id', userId)

    if (holdingError) {
      console.error('❌ Holdings error:', holdingError)
      return
    }

    console.log(`Found ${holdings.length} holdings:`)
    holdings.forEach((holding, index) => {
      console.log(`  ${index + 1}. ${holding.stocks?.symbol || 'Unknown'} (${holding.stocks?.name || 'Unknown'})`)
      console.log(`     Holding ID: ${holding.id}`)
      console.log(`     Account ID: ${holding.account_id}`)
      console.log(`     Account Name: ${holding.accounts?.name || 'Unknown'}`)
      console.log(`     Portfolio ID: ${holding.accounts?.portfolio_id || 'N/A'}`)
      console.log(`     Quantity: ${holding.quantity}`)
      console.log(`     Average Cost: ${holding.average_cost}`)
      console.log(`     Total Cost: ${holding.total_cost}`)
      console.log(`     Current Price: ${holding.current_price || 'N/A'}`)
      console.log(`     Active: ${holding.is_active}`)
      console.log(`     Currency: ${holding.stocks?.currency || 'Unknown'}`)
      console.log('     ---')
    })

    // Step 4: Check holdings filtered by each portfolio
    console.log('\n🔍 Step 4: Holdings by Portfolio')
    console.log('================================')
    
    for (const portfolio of portfolios) {
      console.log(`\nPortfolio: "${portfolio.name}" (${portfolio.id})`)
      
      const portfolioHoldings = holdings.filter(holding => 
        holding.accounts?.portfolio_id === portfolio.id
      )
      
      console.log(`  Holdings count: ${portfolioHoldings.length}`)
      
      if (portfolioHoldings.length > 0) {
        portfolioHoldings.forEach((holding, index) => {
          console.log(`    ${index + 1}. ${holding.stocks?.symbol} - ${holding.quantity} shares`)
        })
      } else {
        console.log(`    ⚠️  No holdings found for this portfolio`)
      }
    }

    // Step 5: Check transactions for context
    console.log('\n📈 Step 5: Recent Transactions')
    console.log('==============================')
    
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        stocks (symbol, name),
        accounts (name, portfolio_id)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5)

    if (transactionError) {
      console.error('❌ Transaction error:', transactionError)
      return
    }

    console.log(`Found ${transactions.length} recent transactions:`)
    transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.transaction_type} ${tx.quantity} ${tx.stocks?.symbol || 'Unknown'}`)
      console.log(`     Date: ${tx.date}`)
      console.log(`     Account: ${tx.accounts?.name || 'Unknown'}`)
      console.log(`     Portfolio: ${tx.accounts?.portfolio_id || 'N/A'}`)
      console.log(`     Total: ${tx.total_amount}`)
    })

    // Step 6: Check specific query that frontend uses
    console.log('\n🔧 Step 6: Frontend Query Simulation')
    console.log('====================================')
    
    const firstPortfolio = portfolios[0]
    if (firstPortfolio) {
      console.log(`\nSimulating frontend query for portfolio: ${firstPortfolio.id}`)
      
      // This is the exact query from use-portfolio-state.ts
      const { data: frontendHoldings, error: frontendError } = await supabase
        .from('holdings')
        .select(`
          *,
          stocks (
            symbol,
            name,
            currency,
            asset_class,
            sector,
            market_cap,
            last_updated
          ),
          accounts (
            id,
            portfolio_id
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('quantity', 0)
        .not('accounts', 'is', null)

      if (frontendError) {
        console.error('❌ Frontend query error:', frontendError)
        return
      }

      console.log(`Total holdings from frontend query: ${frontendHoldings.length}`)
      
      // Filter by portfolio_id (as done in frontend)
      const filteredHoldings = frontendHoldings.filter(
        holding => holding.accounts?.portfolio_id === firstPortfolio.id
      )
      
      console.log(`Holdings after portfolio filter: ${filteredHoldings.length}`)
      
      if (filteredHoldings.length > 0) {
        console.log('✅ Holdings found after filtering!')
        filteredHoldings.forEach((holding, index) => {
          console.log(`  ${index + 1}. ${holding.stocks?.symbol} - ${holding.quantity} shares`)
          console.log(`     Account Portfolio ID: ${holding.accounts?.portfolio_id}`)
          console.log(`     Target Portfolio ID: ${firstPortfolio.id}`)
          console.log(`     Match: ${holding.accounts?.portfolio_id === firstPortfolio.id}`)
        })
      } else {
        console.log('❌ No holdings found after portfolio filtering')
        console.log('   Raw holdings before filter:')
        frontendHoldings.forEach((holding, index) => {
          console.log(`     ${index + 1}. ${holding.stocks?.symbol}`)
          console.log(`        Account Portfolio: ${holding.accounts?.portfolio_id}`)
          console.log(`        Target Portfolio: ${firstPortfolio.id}`)
          console.log(`        Match: ${holding.accounts?.portfolio_id === firstPortfolio.id}`)
        })
      }
    }

    console.log('\n🎯 Summary')
    console.log('==========')
    console.log(`✅ User authenticated: ${signInData.user.email}`)
    console.log(`✅ Portfolios found: ${portfolios.length}`)
    console.log(`✅ Accounts found: ${accounts.length}`)
    console.log(`✅ Holdings found: ${holdings.length}`)
    console.log(`✅ Transactions found: ${transactions.length}`)
    
    if (holdings.length > 0 && portfolios.length > 0) {
      const firstPortfolioHoldings = holdings.filter(h => 
        h.accounts?.portfolio_id === portfolios[0].id
      )
      console.log(`✅ Holdings in first portfolio: ${firstPortfolioHoldings.length}`)
      
      if (firstPortfolioHoldings.length === 0) {
        console.log('⚠️  ISSUE: Holdings exist but not associated with any portfolio')
        console.log('   This suggests an account-portfolio relationship issue')
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug script
debugHoldingsIssue().catch(console.error)