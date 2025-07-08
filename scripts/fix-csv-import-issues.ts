#!/usr/bin/env npx tsx

/**
 * CSV Import Issues Analysis and Fix
 *
 * This script identifies and fixes common issues in the CSV import pipeline
 * that cause "unknown error" during database operations.
 */

import { readFileSync } from 'fs'
import {
  NordnetCSVParser,
  NordnetFieldMapper,
} from '../lib/integrations/nordnet'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function analyzeAndFixCSVImportIssues() {
  console.log('🔧 CSV Import Issues Analysis and Fix\n')

  try {
    // Step 1: Parse CSV and analyze data structure
    console.log('📄 Step 1: Parsing CSV and Analyzing Data')
    console.log('=========================================')

    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    const parseResult = await NordnetCSVParser.parseFile(file)
    console.log(`✅ Parsed ${parseResult.totalRows} rows`)

    // Step 2: Transform sample transactions and identify issues
    console.log('\n🗺️  Step 2: Field Mapping Analysis')
    console.log('==================================')

    const sampleTransactions = []
    const issues = []

    for (let i = 0; i < Math.min(10, parseResult.rows.length); i++) {
      const row = parseResult.rows[i]
      try {
        const transformed = NordnetFieldMapper.transformRow(row)
        sampleTransactions.push(transformed)

        // Analyze for potential database issues
        console.log(`\n📝 Transaction ${i + 1} (ID: ${row.Id})`)
        console.log(
          `   Date: "${transformed.booking_date}" (type: ${typeof transformed.booking_date})`
        )
        console.log(
          `   Type: "${transformed.transaction_type}" → "${transformed.internal_transaction_type}"`
        )
        console.log(`   Currency: "${transformed.currency}"`)
        console.log(
          `   Amount: ${transformed.amount} (type: ${typeof transformed.amount})`
        )
        console.log(`   Portfolio: "${transformed.portfolio_name}"`)

        // Check for common issues
        if (!transformed.booking_date) {
          issues.push(`Transaction ${row.Id}: Missing booking_date`)
        } else if (typeof transformed.booking_date !== 'string') {
          issues.push(`Transaction ${row.Id}: booking_date is not a string`)
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(transformed.booking_date)) {
          issues.push(
            `Transaction ${row.Id}: booking_date format incorrect: "${transformed.booking_date}"`
          )
        }

        if (!transformed.internal_transaction_type) {
          issues.push(
            `Transaction ${row.Id}: Missing internal_transaction_type`
          )
        }

        if (!transformed.currency || typeof transformed.currency !== 'string') {
          issues.push(
            `Transaction ${row.Id}: Invalid currency: "${transformed.currency}"`
          )
        }

        if (transformed.amount === null || transformed.amount === undefined) {
          issues.push(`Transaction ${row.Id}: Missing amount`)
        } else if (typeof transformed.amount !== 'number') {
          issues.push(
            `Transaction ${row.Id}: Amount is not a number: ${transformed.amount} (${typeof transformed.amount})`
          )
        }

        if (!transformed.portfolio_name) {
          issues.push(`Transaction ${row.Id}: Missing portfolio_name`)
        }

        // Check validation errors
        if (transformed.validation_errors.length > 0) {
          issues.push(
            `Transaction ${row.Id}: Validation errors: ${transformed.validation_errors.join(', ')}`
          )
        }
      } catch (error) {
        issues.push(
          `Transaction ${row.Id}: Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Step 3: Database Compatibility Analysis
    console.log('\n💾 Step 3: Database Compatibility Analysis')
    console.log('==========================================')

    // Valid transaction types according to database enum
    const validTransactionTypes = [
      'BUY',
      'SELL',
      'DIVIDEND',
      'SPLIT',
      'MERGER',
      'SPINOFF',
      'DEPOSIT',
      'WITHDRAWAL',
      'FEE',
      'INTEREST',
      'TAX',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'REINVESTMENT',
    ]

    // Valid currencies (from database schema)
    const validCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CAD',
      'AUD',
      'CHF',
      'CNY',
      'SEK',
      'NOK',
      'DKK',
      // ... (abbreviated for brevity)
    ]

    console.log('Checking transaction type compatibility...')
    const transactionTypes = new Set()
    const currencies = new Set()

    sampleTransactions.forEach(transaction => {
      if (transaction.internal_transaction_type) {
        transactionTypes.add(transaction.internal_transaction_type)
      }
      if (transaction.currency) {
        currencies.add(transaction.currency)
      }
    })

    console.log('Transaction types found:')
    Array.from(transactionTypes).forEach(type => {
      const isValid = validTransactionTypes.includes(type as string)
      console.log(`   ${type}: ${isValid ? '✅' : '❌'}`)
      if (!isValid) {
        issues.push(
          `Invalid transaction type: "${type}" (not in database enum)`
        )
      }
    })

    console.log('Currencies found:')
    Array.from(currencies).forEach(currency => {
      const isValid = validCurrencies.includes(currency as string)
      console.log(`   ${currency}: ${isValid ? '✅' : '❌'}`)
      if (!isValid) {
        issues.push(`Invalid currency: "${currency}" (not in database enum)`)
      }
    })

    // Step 4: Database Record Generation Test
    console.log('\n🔧 Step 4: Database Record Generation Test')
    console.log('==========================================')

    if (sampleTransactions.length > 0) {
      const transaction = sampleTransactions[0]

      // Simulate the TransactionRecord creation
      const mockUserId = 'user_123'
      const mockAccountId = 'account_456'
      const mockStockId = transaction.needs_stock_lookup
        ? 'stock_789'
        : undefined
      const mockBatchId = 'batch_' + Date.now()

      const transactionRecord = {
        id: `tx_${Date.now()}`,
        user_id: mockUserId,
        account_id: mockAccountId,
        stock_id: mockStockId,
        external_id: transaction.id,
        transaction_type: transaction.internal_transaction_type,
        date: transaction.booking_date,
        settlement_date: transaction.settlement_date || null,
        quantity: transaction.quantity || 0,
        price: transaction.price || null,
        total_amount: transaction.amount,
        commission: transaction.commission || 0,
        other_fees: Math.max(
          0,
          (transaction.total_fees || 0) - (transaction.commission || 0)
        ),
        currency: transaction.currency,
        exchange_rate: transaction.exchange_rate || 1.0,
        description: transaction.transaction_text || transaction.security_name,
        notes: `Imported from CSV: ${transaction.transaction_text || ''}`,
        data_source: 'CSV_IMPORT',
        import_batch_id: mockBatchId,
      }

      console.log('Generated transaction record:')
      console.log(JSON.stringify(transactionRecord, null, 2))

      // Validate the generated record
      const recordIssues = []

      if (!transactionRecord.user_id) recordIssues.push('Missing user_id')
      if (!transactionRecord.account_id) recordIssues.push('Missing account_id')
      if (!transactionRecord.transaction_type)
        recordIssues.push('Missing transaction_type')
      if (!transactionRecord.date) recordIssues.push('Missing date')
      if (
        transactionRecord.total_amount === null ||
        transactionRecord.total_amount === undefined
      ) {
        recordIssues.push('Missing total_amount')
      }
      if (!transactionRecord.currency) recordIssues.push('Missing currency')

      // Check data types
      if (typeof transactionRecord.user_id !== 'string')
        recordIssues.push('user_id must be string')
      if (typeof transactionRecord.account_id !== 'string')
        recordIssues.push('account_id must be string')
      if (typeof transactionRecord.transaction_type !== 'string')
        recordIssues.push('transaction_type must be string')
      if (typeof transactionRecord.date !== 'string')
        recordIssues.push('date must be string')
      if (typeof transactionRecord.total_amount !== 'number')
        recordIssues.push('total_amount must be number')
      if (typeof transactionRecord.currency !== 'string')
        recordIssues.push('currency must be string')

      // Check constraints
      if (transactionRecord.commission < 0)
        recordIssues.push('commission cannot be negative')
      if (transactionRecord.other_fees < 0)
        recordIssues.push('other_fees cannot be negative')
      if (transactionRecord.exchange_rate <= 0)
        recordIssues.push('exchange_rate must be positive')

      if (recordIssues.length > 0) {
        console.log('\n❌ Transaction record issues:')
        recordIssues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`)
        })
        issues.push(...recordIssues.map(issue => `Record validation: ${issue}`))
      } else {
        console.log('\n✅ Transaction record looks valid')
      }
    }

    // Step 5: Summary and Recommendations
    console.log('\n📋 Step 5: Issues Summary and Recommendations')
    console.log('=============================================')

    if (issues.length === 0) {
      console.log('🎉 No issues found in CSV import pipeline!')
      console.log('✅ The problem is likely in:')
      console.log('   1. Database connection/authentication')
      console.log('   2. Row Level Security policies')
      console.log('   3. Account/portfolio creation logic')
      console.log('   4. Stock lookup/creation logic')
      console.log('\n💡 Recommended next steps:')
      console.log('   1. Run: npm run debug:database-operations')
      console.log('   2. Check Supabase dashboard for RLS policy errors')
      console.log('   3. Verify user authentication in CSV import context')
    } else {
      console.log(`❌ Found ${issues.length} issues that need fixing:`)
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })

      console.log('\n🛠️  Recommended fixes:')

      // Group issues by category
      const dateIssues = issues.filter(i => i.includes('date'))
      const typeIssues = issues.filter(
        i =>
          i.includes('transaction_type') ||
          i.includes('Invalid transaction type')
      )
      const currencyIssues = issues.filter(
        i => i.includes('currency') || i.includes('Invalid currency')
      )
      const amountIssues = issues.filter(i => i.includes('amount'))
      const validationIssues = issues.filter(i =>
        i.includes('Validation errors')
      )

      if (dateIssues.length > 0) {
        console.log('\n📅 Date Format Issues:')
        console.log(
          '   - Fix date parsing in NordnetFieldMapper.parseNordnetDate()'
        )
        console.log('   - Ensure dates are in YYYY-MM-DD format')
        console.log('   - Handle empty/null dates properly')
      }

      if (typeIssues.length > 0) {
        console.log('\n🏷️  Transaction Type Issues:')
        console.log('   - Update NORDNET_TRANSACTION_TYPES mapping')
        console.log(
          '   - Ensure all Nordnet types map to valid database enum values'
        )
        console.log('   - Add fallback handling for unknown transaction types')
      }

      if (currencyIssues.length > 0) {
        console.log('\n💱 Currency Issues:')
        console.log('   - Validate currency codes against database enum')
        console.log('   - Handle missing or invalid currency codes')
      }

      if (amountIssues.length > 0) {
        console.log('\n💰 Amount Issues:')
        console.log(
          '   - Fix number parsing in NordnetFieldMapper.parseNordnetNumber()'
        )
        console.log('   - Handle null/undefined amounts')
        console.log('   - Ensure amounts are valid numbers')
      }

      if (validationIssues.length > 0) {
        console.log('\n✅ Validation Issues:')
        console.log('   - Review business logic validations')
        console.log('   - Fix data consistency checks')
        console.log('   - Handle edge cases in validation')
      }
    }

    console.log('\n🔍 For detailed debugging, run:')
    console.log('   npm run debug:csv-import (basic parsing test)')
    console.log('   npm run debug:database-operations (database test)')
    console.log('   npm run test:csv-import (end-to-end test)')
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    if (error instanceof Error && error.stack) {
      console.error(
        'Stack trace:',
        error.stack.split('\n').slice(0, 5).join('\n')
      )
    }
  }
}

// Run the analysis
analyzeAndFixCSVImportIssues().catch(console.error)
