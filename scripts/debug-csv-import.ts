#!/usr/bin/env npx tsx

/**
 * Debug CSV Import Database Issues
 *
 * This script tests the complete CSV import pipeline to identify where the "unknown error" occurs
 * during database operations after successful CSV parsing.
 */

import { readFileSync } from 'fs'
import {
  NordnetCSVParser,
  NordnetFieldMapper,
  NordnetTransactionTransformer,
} from '../lib/integrations/nordnet'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'
import { createClient } from '../lib/supabase/server'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function debugCSVImport() {
  console.log('🔍 Debug CSV Import Database Issues\n')

  try {
    // Step 1: Test Supabase Connection
    console.log('📡 Step 1: Testing Supabase Connection')
    console.log('======================================')

    const supabase = createClient()

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    if (testError) {
      console.log(`❌ Database connection failed: ${testError.message}`)
      return
    }
    console.log('✅ Database connection successful')

    // Test authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`)
      console.log('⚠️  Need to authenticate first before running this script')
      return
    }

    if (!user) {
      console.log('❌ No authenticated user found')
      console.log('⚠️  Please login first before running this script')
      return
    }

    console.log(`✅ User authenticated: ${user.email}`)

    // Step 2: Test User Profile and Portfolio Access
    console.log('\n👤 Step 2: Testing User Profile and Portfolio Access')
    console.log('===================================================')

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log(`❌ Failed to fetch user profile: ${profileError.message}`)
      return
    }

    console.log(`✅ User profile found: ${userProfile.email}`)

    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)

    if (portfolioError) {
      console.log(`❌ Failed to fetch portfolios: ${portfolioError.message}`)
      return
    }

    console.log(`✅ Portfolios found: ${portfolios.length}`)
    portfolios.forEach((portfolio, index) => {
      console.log(`   ${index + 1}. ${portfolio.name} (${portfolio.id})`)
    })

    // Step 3: CSV Parsing Test
    console.log('\n📄 Step 3: Testing CSV Parsing')
    console.log('==============================')

    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    console.log('📁 File loaded successfully')

    const parseResult = await NordnetCSVParser.parseFile(file)
    console.log(`✅ CSV parsed: ${parseResult.totalRows} rows`)

    if (parseResult.errors.length > 0) {
      console.log('❌ CSV parsing errors:')
      parseResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
      return
    }

    // Step 4: Field Mapping Test
    console.log('\n🗺️  Step 4: Testing Field Mapping')
    console.log('=================================')

    const transformedTransactions = []
    const transformErrors = []

    for (const row of parseResult.rows.slice(0, 5)) {
      // Test first 5 rows
      try {
        const transactionData = NordnetFieldMapper.transformRow(row)
        transformedTransactions.push(transactionData)
        console.log(`✅ Row ${row.Id} transformed successfully`)
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        transformErrors.push(`Row ${row.Id}: ${errorMsg}`)
        console.log(`❌ Row ${row.Id} transformation failed: ${errorMsg}`)
      }
    }

    if (transformErrors.length > 0) {
      console.log(`⚠️  ${transformErrors.length} transformation errors found`)
      return
    }

    console.log(
      `✅ Successfully transformed ${transformedTransactions.length} transactions`
    )

    // Display first transaction for inspection
    if (transformedTransactions.length > 0) {
      const firstTransaction = transformedTransactions[0]
      console.log('\n🔍 First Transaction Details:')
      console.log(`   Transaction ID: ${firstTransaction.id}`)
      console.log(`   Date: ${firstTransaction.booking_date}`)
      console.log(`   Type: ${firstTransaction.transaction_type}`)
      console.log(
        `   Internal Type: ${firstTransaction.internal_transaction_type}`
      )
      console.log(`   Security: ${firstTransaction.security_name}`)
      console.log(`   ISIN: ${firstTransaction.isin}`)
      console.log(`   Amount: ${firstTransaction.amount}`)
      console.log(`   Currency: ${firstTransaction.currency}`)
      console.log(`   Portfolio: ${firstTransaction.portfolio_name}`)
      console.log(
        `   Needs Stock Lookup: ${firstTransaction.needs_stock_lookup}`
      )
      if (firstTransaction.validation_errors.length > 0) {
        console.log(
          `   Validation Errors: ${firstTransaction.validation_errors.join(', ')}`
        )
      }
      if (firstTransaction.validation_warnings.length > 0) {
        console.log(
          `   Validation Warnings: ${firstTransaction.validation_warnings.join(', ')}`
        )
      }
    }

    // Step 5: Test Transaction Transformer (Database Operations)
    console.log('\n🔄 Step 5: Testing Transaction Transformer')
    console.log('==========================================')

    const transformer = new NordnetTransactionTransformer(user.id, 'nordnet')

    const importConfig = {
      encoding: 'utf-8' as const,
      delimiter: '\t',
      skipRows: 0,
      portfolioMappings: [],
      duplicateTransactionHandling: 'skip' as const,
      createMissingStocks: true,
      validateISIN: true,
      strictMode: false,
      dateFormat: 'YYYY-MM-DD',
      currencyConversion: false,
    }

    console.log('🔧 Testing individual components:')

    // Test account creation
    console.log('\n📁 Testing Account Creation')
    console.log('---------------------------')

    // Extract unique portfolios from first few transactions
    const testPortfolios = [
      ...new Set(transformedTransactions.map(t => t.portfolio_name)),
    ]

    try {
      // Test account creation manually
      for (const portfolioName of testPortfolios.slice(0, 1)) {
        // Test first portfolio
        console.log(`Testing portfolio: ${portfolioName}`)

        // Check if account exists
        const { data: existingAccount, error: findError } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform_id', 'nordnet')
          .eq('name', portfolioName)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          console.log(`❌ Account lookup failed: ${findError.message}`)
          console.log(`   Error code: ${findError.code}`)
          console.log(`   Error details: ${findError.details}`)
          continue
        }

        if (existingAccount) {
          console.log(`✅ Account exists: ${existingAccount.id}`)
        } else {
          console.log('📝 Account not found, would create new one')

          // Test portfolio creation
          const { data: existingPortfolio, error: portfolioFindError } =
            await supabase
              .from('portfolios')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', portfolioName)
              .single()

          if (portfolioFindError && portfolioFindError.code !== 'PGRST116') {
            console.log(
              `❌ Portfolio lookup failed: ${portfolioFindError.message}`
            )
            continue
          }

          let portfolioId = existingPortfolio?.id

          if (!portfolioId) {
            console.log('📝 Portfolio not found, testing creation...')

            const { data: newPortfolio, error: createPortfolioError } =
              await supabase
                .from('portfolios')
                .insert({
                  user_id: user.id,
                  name: portfolioName,
                  description: 'Test portfolio for CSV import debugging',
                  currency: 'NOK',
                })
                .select('id')
                .single()

            if (createPortfolioError) {
              console.log(
                `❌ Portfolio creation failed: ${createPortfolioError.message}`
              )
              console.log(`   Error code: ${createPortfolioError.code}`)
              console.log(`   Error details: ${createPortfolioError.details}`)
              continue
            }

            portfolioId = newPortfolio.id
            console.log(`✅ Portfolio created: ${portfolioId}`)
          }

          // Test account creation
          const accountRecord = {
            user_id: user.id,
            portfolio_id: portfolioId,
            platform_id: 'nordnet',
            name: portfolioName,
            currency: 'NOK',
            account_type: 'TAXABLE',
          }

          const { data: newAccount, error: createAccountError } = await supabase
            .from('accounts')
            .insert(accountRecord)
            .select('id')
            .single()

          if (createAccountError) {
            console.log(
              `❌ Account creation failed: ${createAccountError.message}`
            )
            console.log(`   Error code: ${createAccountError.code}`)
            console.log(`   Error details: ${createAccountError.details}`)
            console.log(
              `   Data attempted: ${JSON.stringify(accountRecord, null, 2)}`
            )
            continue
          }

          console.log(`✅ Account created: ${newAccount.id}`)
        }
      }
    } catch (error) {
      console.log(
        `❌ Account creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.log(`   Full error: ${JSON.stringify(error, null, 2)}`)
    }

    // Step 6: Test Stock Lookup/Creation
    console.log('\n📈 Step 6: Testing Stock Lookup/Creation')
    console.log('========================================')

    // Get stocks that need lookup
    const stockTransactions = transformedTransactions.filter(
      t => t.needs_stock_lookup && t.isin
    )
    const uniqueStocks = new Map()

    for (const transaction of stockTransactions.slice(0, 2)) {
      // Test first 2 stocks
      if (transaction.isin && !uniqueStocks.has(transaction.isin)) {
        uniqueStocks.set(transaction.isin, {
          isin: transaction.isin,
          name: transaction.security_name || 'Unknown',
          currency: transaction.currency,
        })
      }
    }

    for (const [isin, stockInfo] of uniqueStocks) {
      console.log(`Testing stock: ${stockInfo.name} (${isin})`)

      try {
        const { data: existingStock, error: findError } = await supabase
          .from('stocks')
          .select('id')
          .eq('isin', isin)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          console.log(`❌ Stock lookup failed: ${findError.message}`)
          continue
        }

        if (existingStock) {
          console.log(`✅ Stock exists: ${existingStock.id}`)
        } else {
          console.log('📝 Stock not found, testing creation...')

          const stockRecord = {
            symbol: stockInfo.name.split(' ')[0].toUpperCase().slice(0, 6),
            exchange: 'UNKNOWN',
            name: stockInfo.name,
            company_name: stockInfo.name,
            isin,
            currency: stockInfo.currency,
            asset_class: 'STOCK',
            data_source: 'CSV_IMPORT',
          }

          const { data: newStock, error: createError } = await supabase
            .from('stocks')
            .insert(stockRecord)
            .select('id')
            .single()

          if (createError) {
            console.log(`❌ Stock creation failed: ${createError.message}`)
            console.log(`   Error code: ${createError.code}`)
            console.log(`   Error details: ${createError.details}`)
            console.log(
              `   Data attempted: ${JSON.stringify(stockRecord, null, 2)}`
            )
            continue
          }

          console.log(`✅ Stock created: ${newStock.id}`)
        }
      } catch (error) {
        console.log(
          `❌ Stock test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Step 7: Test Transaction Insert
    console.log('\n💾 Step 7: Testing Transaction Insert')
    console.log('====================================')

    // Try to insert a simple test transaction
    const testTransaction = {
      id: 'test-transaction-' + Date.now(),
      user_id: user.id,
      account_id: portfolios[0]?.id || 'test-account',
      external_id: 'test-external-' + Date.now(),
      transaction_type: 'DEPOSIT',
      date: '2024-01-01',
      quantity: 0,
      total_amount: 100,
      commission: 0,
      other_fees: 0,
      currency: 'NOK',
      exchange_rate: 1.0,
      description: 'Test transaction for debugging',
      notes: 'Debug test',
      data_source: 'CSV_IMPORT',
      import_batch_id: 'test-batch-' + Date.now(),
    }

    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('transactions')
        .insert(testTransaction)
        .select('id')
        .single()

      if (insertError) {
        console.log(`❌ Transaction insert failed: ${insertError.message}`)
        console.log(`   Error code: ${insertError.code}`)
        console.log(`   Error details: ${insertError.details}`)
        console.log(
          `   Data attempted: ${JSON.stringify(testTransaction, null, 2)}`
        )
      } else {
        console.log(`✅ Transaction inserted successfully: ${insertResult.id}`)

        // Clean up test transaction
        await supabase.from('transactions').delete().eq('id', insertResult.id)
        console.log('🧹 Test transaction cleaned up')
      }
    } catch (error) {
      console.log(
        `❌ Transaction insert test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    // Step 8: Test Full Import Function
    console.log('\n🚀 Step 8: Testing Full Import Function')
    console.log('======================================')

    // Test with a smaller subset
    const limitedParseResult = {
      ...parseResult,
      rows: parseResult.rows.slice(0, 3), // Test with only 3 transactions
    }

    try {
      console.log('🔄 Starting full import test...')
      const importResult = await importNordnetTransactions(limitedParseResult)

      console.log(
        `Import result: ${importResult.success ? 'SUCCESS' : 'FAILED'}`
      )

      if (importResult.success && importResult.data) {
        console.log(`✅ Import successful:`)
        console.log(`   Parsed rows: ${importResult.data.parsedRows}`)
        console.log(`   Transformed rows: ${importResult.data.transformedRows}`)
        console.log(`   Created accounts: ${importResult.data.createdAccounts}`)
        console.log(
          `   Created transactions: ${importResult.data.createdTransactions}`
        )
        console.log(`   Skipped rows: ${importResult.data.skippedRows}`)

        if (importResult.data.errors.length > 0) {
          console.log(`   Errors: ${importResult.data.errors.length}`)
          importResult.data.errors.forEach((error, index) => {
            console.log(`      ${index + 1}. ${error}`)
          })
        }

        if (importResult.data.warnings.length > 0) {
          console.log(`   Warnings: ${importResult.data.warnings.length}`)
          importResult.data.warnings.forEach((warning, index) => {
            console.log(`      ${index + 1}. ${warning}`)
          })
        }
      } else {
        console.log(`❌ Import failed: ${importResult.error}`)
      }
    } catch (error) {
      console.log(
        `❌ Full import test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.log(`   Full error: ${JSON.stringify(error, null, 2)}`)
    }

    console.log('\n📋 Debug Summary')
    console.log('================')
    console.log('✅ CSV import debugging completed')
    console.log('   Check the output above for specific error details')
    console.log('   Focus on the step where the first error occurs')
  } catch (error) {
    console.error('❌ Debug script failed:', error)
    console.error('Full error:', JSON.stringify(error, null, 2))
  }
}

// Run the debug script
debugCSVImport().catch(console.error)
