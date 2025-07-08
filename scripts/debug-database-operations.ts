#!/usr/bin/env npx tsx

/**
 * Debug Database Operations for CSV Import
 * 
 * This script tests the database operations portion of the CSV import
 * to identify where the "unknown error" occurs.
 */

import { createClient } from '../lib/supabase/server'

async function debugDatabaseOperations() {
  console.log('🔍 Debug Database Operations\n')
  
  try {
    const supabase = createClient()
    
    // Step 1: Test basic database connection
    console.log('📡 Step 1: Database Connection Test')
    console.log('===================================')
    
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.log(`❌ Database connection failed: ${connectionError.message}`)
      console.log(`   Error code: ${connectionError.code}`)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Step 2: Test authentication status
    console.log('\n👤 Step 2: Authentication Test')
    console.log('==============================')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`)
      console.log('💡 This is expected if running in a server environment')
      console.log('   The CSV import should use service key authentication')
      return
    }
    
    if (!user) {
      console.log('❌ No authenticated user found')
      console.log('💡 Testing with hardcoded test user ID instead...')
      
      // Try to find a test user
      const { data: testUsers, error: testUserError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .limit(5)
      
      if (testUserError) {
        console.log(`❌ Could not fetch test users: ${testUserError.message}`)
        return
      }
      
      if (!testUsers || testUsers.length === 0) {
        console.log('❌ No users found in database')
        return
      }
      
      console.log('🔍 Found test users:')
      testUsers.forEach((testUser, index) => {
        console.log(`   ${index + 1}. ${testUser.email} (${testUser.id})`)
      })
      
      // Use the first test user for our tests
      const testUserId = testUsers[0].id
      console.log(`✅ Using test user: ${testUsers[0].email}`)
      
      // Step 3: Test portfolio operations
      console.log('\n📁 Step 3: Portfolio Operations Test')
      console.log('===================================')
      
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', testUserId)
      
      if (portfolioError) {
        console.log(`❌ Portfolio query failed: ${portfolioError.message}`)
        console.log(`   Error code: ${portfolioError.code}`)
        return
      }
      
      console.log(`✅ Portfolios found: ${portfolios.length}`)
      portfolios.forEach((portfolio, index) => {
        console.log(`   ${index + 1}. ${portfolio.name} (${portfolio.id})`)
      })
      
      let testPortfolioId = portfolios[0]?.id
      
      // Test portfolio creation if none exist
      if (!testPortfolioId) {
        console.log('📝 Testing portfolio creation...')
        
        const { data: newPortfolio, error: createPortfolioError } = await supabase
          .from('portfolios')
          .insert({
            user_id: testUserId,
            name: 'Debug Test Portfolio',
            description: 'Created for CSV import debugging',
            currency: 'NOK',
          })
          .select('id')
          .single()
        
        if (createPortfolioError) {
          console.log(`❌ Portfolio creation failed: ${createPortfolioError.message}`)
          console.log(`   Error code: ${createPortfolioError.code}`)
          console.log(`   Error details: ${createPortfolioError.details}`)
          return
        }
        
        testPortfolioId = newPortfolio.id
        console.log(`✅ Portfolio created: ${testPortfolioId}`)
      }
      
      // Step 4: Test account operations
      console.log('\n🏦 Step 4: Account Operations Test')
      console.log('=================================')
      
      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', testUserId)
        .eq('portfolio_id', testPortfolioId)
      
      if (accountError) {
        console.log(`❌ Account query failed: ${accountError.message}`)
        return
      }
      
      console.log(`✅ Accounts found: ${accounts.length}`)
      
      let testAccountId = accounts[0]?.id
      
      // Test account creation
      if (!testAccountId) {
        console.log('📝 Testing account creation...')
        
        const accountRecord = {
          user_id: testUserId,
          portfolio_id: testPortfolioId,
          platform_id: 'nordnet',
          name: 'Debug Test Account',
          currency: 'NOK',
          account_type: 'TAXABLE',
        }
        
        console.log('Account data to insert:')
        console.log(JSON.stringify(accountRecord, null, 2))
        
        const { data: newAccount, error: createAccountError } = await supabase
          .from('accounts')
          .insert(accountRecord)
          .select('id')
          .single()
        
        if (createAccountError) {
          console.log(`❌ Account creation failed: ${createAccountError.message}`)
          console.log(`   Error code: ${createAccountError.code}`)
          console.log(`   Error details: ${createAccountError.details}`)
          return
        }
        
        testAccountId = newAccount.id
        console.log(`✅ Account created: ${testAccountId}`)
      } else {
        console.log(`✅ Using existing account: ${testAccountId}`)
      }
      
      // Step 5: Test stock operations
      console.log('\n📈 Step 5: Stock Operations Test')
      console.log('===============================')
      
      // Test stock lookup
      const testISIN = 'US0378331005' // Apple Inc.
      const { data: existingStock, error: stockLookupError } = await supabase
        .from('stocks')
        .select('*')
        .eq('isin', testISIN)
        .single()
      
      if (stockLookupError && stockLookupError.code !== 'PGRST116') {
        console.log(`❌ Stock lookup failed: ${stockLookupError.message}`)
        return
      }
      
      let testStockId = existingStock?.id
      
      if (!testStockId) {
        console.log('📝 Testing stock creation...')
        
        const stockRecord = {
          symbol: 'AAPL',
          exchange: 'NASDAQ',
          name: 'Apple Inc.',
          company_name: 'Apple Inc.',
          isin: testISIN,
          currency: 'USD',
          asset_class: 'STOCK',
          data_source: 'CSV_IMPORT',
        }
        
        console.log('Stock data to insert:')
        console.log(JSON.stringify(stockRecord, null, 2))
        
        const { data: newStock, error: createStockError } = await supabase
          .from('stocks')
          .insert(stockRecord)
          .select('id')
          .single()
        
        if (createStockError) {
          console.log(`❌ Stock creation failed: ${createStockError.message}`)
          console.log(`   Error code: ${createStockError.code}`)
          console.log(`   Error details: ${createStockError.details}`)
          return
        }
        
        testStockId = newStock.id
        console.log(`✅ Stock created: ${testStockId}`)
      } else {
        console.log(`✅ Using existing stock: ${testStockId} (${existingStock.symbol})`)
      }
      
      // Step 6: Test transaction operations
      console.log('\n💾 Step 6: Transaction Operations Test')
      console.log('====================================')
      
      // Test transaction insert
      const transactionRecord = {
        id: `debug-test-${Date.now()}`,
        user_id: testUserId,
        account_id: testAccountId,
        stock_id: testStockId,
        external_id: `debug-external-${Date.now()}`,
        transaction_type: 'BUY',
        date: '2024-01-01',
        quantity: 10,
        price: 150.00,
        total_amount: 1500.00,
        commission: 5.00,
        other_fees: 0.00,
        currency: 'USD',
        exchange_rate: 1.0,
        description: 'Debug test transaction',
        notes: 'Created for CSV import debugging',
        data_source: 'CSV_IMPORT',
        import_batch_id: `debug-batch-${Date.now()}`,
      }
      
      console.log('Transaction data to insert:')
      console.log(JSON.stringify(transactionRecord, null, 2))
      
      const { data: newTransaction, error: createTransactionError } = await supabase
        .from('transactions')
        .insert(transactionRecord)
        .select('id')
        .single()
      
      if (createTransactionError) {
        console.log(`❌ Transaction creation failed: ${createTransactionError.message}`)
        console.log(`   Error code: ${createTransactionError.code}`)
        console.log(`   Error details: ${createTransactionError.details}`)
        console.log(`   Hint: ${createTransactionError.hint}`)
        
        // Check for specific constraint violations
        if (createTransactionError.code === '23505') {
          console.log('   💡 Duplicate key violation - transaction may already exist')
        } else if (createTransactionError.code === '23503') {
          console.log('   💡 Foreign key violation - referenced record may not exist')
        } else if (createTransactionError.code === '23514') {
          console.log('   💡 Check constraint violation - data may not meet validation rules')
        }
        
        return
      }
      
      console.log(`✅ Transaction created: ${newTransaction.id}`)
      
      // Step 7: Cleanup test data
      console.log('\n🧹 Step 7: Cleanup Test Data')
      console.log('============================')
      
      // Delete test transaction
      const { error: deleteTransactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', newTransaction.id)
      
      if (deleteTransactionError) {
        console.log(`⚠️  Failed to cleanup transaction: ${deleteTransactionError.message}`)
      } else {
        console.log('✅ Test transaction cleaned up')
      }
      
      // Don't delete portfolio/account as they might be needed for actual CSV import
      
      console.log('\n🎉 Database Operations Test Complete!')
      console.log('====================================')
      console.log('✅ All database operations successful')
      console.log('💡 The CSV import should work with proper authentication')
      
    } else {
      console.log(`✅ User authenticated: ${user.email}`)
      console.log('💡 Continue with authenticated testing...')
      // Continue with the same testing logic but using the authenticated user
    }
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error)
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

// Run the debug script
debugDatabaseOperations().catch(console.error)