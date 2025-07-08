#!/usr/bin/env npx tsx

/**
 * Simple CSV Import Debug Script
 *
 * This script focuses on debugging the CSV parsing and transformation steps
 * without requiring authentication.
 */

import { readFileSync } from 'fs'
import {
  NordnetCSVParser,
  NordnetFieldMapper,
} from '../lib/integrations/nordnet'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function debugCSVImportSimple() {
  console.log('🔍 Debug CSV Import - Simple Version\n')

  try {
    // Step 1: Basic file validation
    console.log('📁 Step 1: File Validation')
    console.log('=========================')

    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    console.log(
      `✅ File loaded: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`
    )

    const validation = NordnetCSVParser.validateFile(file)
    console.log(`✅ File validation: ${validation.valid ? 'PASSED' : 'FAILED'}`)
    if (validation.error) {
      console.log(`⚠️  Validation error: ${validation.error}`)
    }

    // Step 2: CSV Parsing
    console.log('\n📄 Step 2: CSV Parsing')
    console.log('======================')

    const parseResult = await NordnetCSVParser.parseFile(file)

    console.log(`✅ Parsing completed`)
    console.log(`   Rows: ${parseResult.totalRows}`)
    console.log(`   Headers: ${parseResult.headers.length}`)
    console.log(`   Encoding: ${parseResult.detectedEncoding}`)
    console.log(`   Delimiter: "${parseResult.detectedDelimiter}"`)
    console.log(`   Norwegian chars: ${parseResult.hasNorwegianCharacters}`)
    console.log(`   Errors: ${parseResult.errors.length}`)
    console.log(`   Warnings: ${parseResult.warnings.length}`)

    if (parseResult.errors.length > 0) {
      console.log('\n❌ Parse Errors:')
      parseResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
      return
    }

    if (parseResult.warnings.length > 0) {
      console.log('\n⚠️  Parse Warnings:')
      parseResult.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }

    // Step 3: Headers analysis
    console.log('\n📋 Step 3: Headers Analysis')
    console.log('===========================')

    console.log('Headers found:')
    parseResult.headers.forEach((header, index) => {
      console.log(`   ${index + 1}. "${header}"`)
    })

    // Check for required headers
    const requiredHeaders = [
      'Id',
      'Bokføringsdag',
      'Portefølje',
      'Transaksjonstype',
      'Beløp',
      'Valuta',
    ]
    const missingHeaders = requiredHeaders.filter(
      h => !parseResult.headers.includes(h)
    )

    if (missingHeaders.length > 0) {
      console.log(`\n❌ Missing required headers: ${missingHeaders.join(', ')}`)
      return
    } else {
      console.log('\n✅ All required headers found')
    }

    // Step 4: Field Mapping Test
    console.log('\n🗺️  Step 4: Field Mapping Test')
    console.log('==============================')

    const testRows = parseResult.rows.slice(0, 5) // Test first 5 rows
    const transformedTransactions = []
    const transformErrors = []

    for (const [index, row] of testRows.entries()) {
      try {
        console.log(`\n📝 Testing row ${index + 1} (ID: ${row.Id}):`)

        // Show raw CSV data
        console.log('   Raw CSV Data:')
        Object.entries(row).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            console.log(`      ${key}: "${value}"`)
          }
        })

        // Transform the row
        const transactionData = NordnetFieldMapper.transformRow(row)
        transformedTransactions.push(transactionData)

        console.log('   ✅ Transformation successful')
        console.log('   Transformed Data:')
        console.log(`      ID: ${transactionData.id}`)
        console.log(`      Date: ${transactionData.booking_date}`)
        console.log(`      Portfolio: ${transactionData.portfolio_name}`)
        console.log(
          `      Type: ${transactionData.transaction_type} → ${transactionData.internal_transaction_type}`
        )
        console.log(`      Currency: ${transactionData.currency}`)
        console.log(`      Amount: ${transactionData.amount}`)

        if (transactionData.security_name) {
          console.log(`      Security: ${transactionData.security_name}`)
        }
        if (transactionData.isin) {
          console.log(`      ISIN: ${transactionData.isin}`)
        }
        if (transactionData.quantity) {
          console.log(`      Quantity: ${transactionData.quantity}`)
        }
        if (transactionData.price) {
          console.log(`      Price: ${transactionData.price}`)
        }

        console.log(
          `      Needs Stock Lookup: ${transactionData.needs_stock_lookup}`
        )

        // Show validation results
        if (transactionData.validation_errors.length > 0) {
          console.log(
            `      ❌ Validation Errors: ${transactionData.validation_errors.join(', ')}`
          )
        }
        if (transactionData.validation_warnings.length > 0) {
          console.log(
            `      ⚠️  Validation Warnings: ${transactionData.validation_warnings.join(', ')}`
          )
        }

        if (transactionData.validation_errors.length === 0) {
          console.log('      ✅ No validation errors')
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        transformErrors.push(`Row ${row.Id}: ${errorMsg}`)
        console.log(`   ❌ Transformation failed: ${errorMsg}`)

        // Show the stack trace for debugging
        if (error instanceof Error && error.stack) {
          console.log(
            `   Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`
          )
        }
      }
    }

    // Step 5: Summary
    console.log('\n📊 Step 5: Summary')
    console.log('==================')

    console.log(`✅ Successfully parsed ${parseResult.totalRows} total rows`)
    console.log(
      `✅ Successfully transformed ${transformedTransactions.length}/${testRows.length} test rows`
    )

    if (transformErrors.length > 0) {
      console.log(`❌ Transformation errors: ${transformErrors.length}`)
      transformErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    // Analyze transaction types
    if (transformedTransactions.length > 0) {
      const transactionTypes = new Map()
      const portfolios = new Set()
      const currencies = new Set()

      transformedTransactions.forEach(t => {
        if (t.internal_transaction_type) {
          transactionTypes.set(
            t.internal_transaction_type,
            (transactionTypes.get(t.internal_transaction_type) || 0) + 1
          )
        }
        if (t.portfolio_name) portfolios.add(t.portfolio_name)
        if (t.currency) currencies.add(t.currency)
      })

      console.log('\n📈 Transaction Analysis:')
      console.log(
        `   Transaction Types: ${Array.from(transactionTypes.keys()).join(', ')}`
      )
      console.log(`   Portfolios: ${Array.from(portfolios).join(', ')}`)
      console.log(`   Currencies: ${Array.from(currencies).join(', ')}`)
    }

    // Step 6: Database Schema Preparation
    console.log('\n💾 Step 6: Database Schema Validation')
    console.log('====================================')

    console.log('Required database fields for transactions:')
    const requiredDbFields = [
      'user_id',
      'account_id',
      'transaction_type',
      'date',
      'total_amount',
      'currency',
      'commission',
      'other_fees',
      'exchange_rate',
      'data_source',
      'import_batch_id',
    ]

    requiredDbFields.forEach(field => {
      console.log(`   • ${field}`)
    })

    console.log('\nOptional database fields:')
    const optionalDbFields = [
      'stock_id',
      'external_id',
      'quantity',
      'price',
      'settlement_date',
      'description',
      'notes',
    ]

    optionalDbFields.forEach(field => {
      console.log(`   • ${field}`)
    })

    // Check what fields we can populate from transformed data
    if (transformedTransactions.length > 0) {
      const firstTransaction = transformedTransactions[0]
      console.log('\n🔍 Field Mapping Analysis for Database Insert:')

      const fieldMappings = {
        user_id: '(to be provided by authentication)',
        account_id: '(to be created/looked up from portfolio)',
        external_id: firstTransaction.id,
        transaction_type: firstTransaction.internal_transaction_type,
        date: firstTransaction.booking_date,
        settlement_date: firstTransaction.settlement_date,
        quantity: firstTransaction.quantity || 0,
        price: firstTransaction.price,
        total_amount: firstTransaction.amount,
        commission: firstTransaction.commission || 0,
        other_fees:
          (firstTransaction.total_fees || 0) -
          (firstTransaction.commission || 0),
        currency: firstTransaction.currency,
        exchange_rate: firstTransaction.exchange_rate || 1.0,
        description:
          firstTransaction.transaction_text || firstTransaction.security_name,
        data_source: 'CSV_IMPORT',
        import_batch_id: '(to be generated)',
      }

      Object.entries(fieldMappings).forEach(([dbField, value]) => {
        console.log(`   ${dbField}: ${value}`)
      })
    }

    console.log('\n🎉 CSV Import Analysis Complete!')
    console.log('================================')

    if (transformErrors.length === 0) {
      console.log(
        '✅ No critical issues found in CSV parsing and transformation'
      )
      console.log('💡 The issue is likely in the database operations step')
      console.log('   Suggested next steps:')
      console.log('   1. Check database connection and authentication')
      console.log('   2. Verify user permissions and RLS policies')
      console.log('   3. Test account creation logic')
      console.log('   4. Test stock lookup/creation logic')
      console.log('   5. Test transaction insert with proper foreign keys')
    } else {
      console.log('❌ Issues found in transformation step')
      console.log(
        '   Fix transformation errors before proceeding to database operations'
      )
    }
  } catch (error) {
    console.error('❌ Debug script failed:', error)
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

// Run the debug script
debugCSVImportSimple().catch(console.error)
