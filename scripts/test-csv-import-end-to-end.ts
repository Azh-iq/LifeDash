#!/usr/bin/env npx tsx

/**
 * End-to-End CSV Import Test
 * 
 * This script performs a complete test of the CSV import functionality
 * from parsing to database operations, with detailed error reporting.
 */

import { readFileSync } from 'fs'
import { NordnetCSVParser, NordnetFieldMapper } from '../lib/integrations/nordnet'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function testCSVImportEndToEnd() {
  console.log('🧪 End-to-End CSV Import Test\n')
  
  try {
    // Step 1: CSV Parsing Test
    console.log('📄 Step 1: CSV Parsing Test')
    console.log('===========================')
    
    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv'
    })
    
    console.log(`📁 File loaded: ${(fileBuffer.length / 1024).toFixed(2)} KB`)
    
    const parseResult = await NordnetCSVParser.parseFile(file)
    
    console.log(`✅ Parsing completed`)
    console.log(`   Total rows: ${parseResult.totalRows}`)
    console.log(`   Encoding: ${parseResult.detectedEncoding}`)
    console.log(`   Delimiter: "${parseResult.detectedDelimiter}"`)
    console.log(`   Parse errors: ${parseResult.errors.length}`)
    console.log(`   Parse warnings: ${parseResult.warnings.length}`)
    
    if (parseResult.errors.length > 0) {
      console.log('\n❌ Parse errors found:')
      parseResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
      return
    }
    
    // Step 2: Field Mapping Test
    console.log('\n🗺️  Step 2: Field Mapping Test')
    console.log('==============================')
    
    const testRowCount = Math.min(3, parseResult.rows.length)
    console.log(`Testing field mapping on first ${testRowCount} rows...`)
    
    for (let i = 0; i < testRowCount; i++) {
      const row = parseResult.rows[i]
      try {
        const transformed = NordnetFieldMapper.transformRow(row)
        console.log(`✅ Row ${i + 1} (ID: ${row.Id}) transformed successfully`)
        
        if (transformed.validation_errors.length > 0) {
          console.log(`   ❌ Validation errors: ${transformed.validation_errors.join(', ')}`)
        }
        if (transformed.validation_warnings.length > 0) {
          console.log(`   ⚠️  Validation warnings: ${transformed.validation_warnings.join(', ')}`)
        }
      } catch (error) {
        console.log(`❌ Row ${i + 1} transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return
      }
    }
    
    // Step 3: Limited Import Test
    console.log('\n🚀 Step 3: Limited Import Test (5 transactions)')
    console.log('==============================================')
    
    // Create a limited parse result for testing
    const limitedParseResult = {
      ...parseResult,
      rows: parseResult.rows.slice(0, 5), // Only test with 5 transactions
      totalRows: Math.min(5, parseResult.rows.length)
    }
    
    console.log(`Testing import with ${limitedParseResult.totalRows} transactions...`)
    
    const startTime = Date.now()
    const importResult = await importNordnetTransactions(limitedParseResult)
    const endTime = Date.now()
    
    console.log(`⏱️  Import completed in ${endTime - startTime}ms`)
    
    // Step 4: Result Analysis
    console.log('\n📊 Step 4: Result Analysis')
    console.log('==========================')
    
    console.log(`Import Success: ${importResult.success ? '✅ YES' : '❌ NO'}`)
    
    if (importResult.success && importResult.data) {
      console.log('📈 Import Statistics:')
      console.log(`   Parsed rows: ${importResult.data.parsedRows}`)
      console.log(`   Transformed rows: ${importResult.data.transformedRows}`)
      console.log(`   Created accounts: ${importResult.data.createdAccounts}`)
      console.log(`   Created transactions: ${importResult.data.createdTransactions}`)
      console.log(`   Skipped rows: ${importResult.data.skippedRows}`)
      console.log(`   Import batch ID: ${importResult.data.importBatchId}`)
      
      if (importResult.data.errors.length > 0) {
        console.log('\n❌ Import Errors:')
        importResult.data.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      } else {
        console.log('\n✅ No import errors')
      }
      
      if (importResult.data.warnings.length > 0) {
        console.log('\n⚠️  Import Warnings:')
        importResult.data.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning}`)
        })
      } else {
        console.log('✅ No import warnings')
      }
      
      // Additional analysis
      if (importResult.data.processedData && importResult.data.processedData.length > 0) {
        console.log('\n📋 Data Analysis:')
        
        const portfolios = new Set()
        const currencies = new Set()
        const transactionTypes = new Map()
        
        importResult.data.processedData.forEach(transaction => {
          if (transaction.portfolio_name) portfolios.add(transaction.portfolio_name)
          if (transaction.currency) currencies.add(transaction.currency)
          if (transaction.internal_transaction_type) {
            const count = transactionTypes.get(transaction.internal_transaction_type) || 0
            transactionTypes.set(transaction.internal_transaction_type, count + 1)
          }
        })
        
        console.log(`   Portfolios: ${Array.from(portfolios).join(', ')}`)
        console.log(`   Currencies: ${Array.from(currencies).join(', ')}`)
        console.log('   Transaction Types:')
        Array.from(transactionTypes.entries()).forEach(([type, count]) => {
          console.log(`      ${type}: ${count}`)
        })
      }
      
    } else {
      console.log(`❌ Import failed: ${importResult.error}`)
      
      // Additional debugging information
      console.log('\n🔍 Debugging Information:')
      console.log('========================')
      
      console.log('Check the following potential issues:')
      console.log('1. Database connection and authentication')
      console.log('2. Row Level Security (RLS) policies')
      console.log('3. Missing foreign key references')
      console.log('4. Data validation constraints')
      console.log('5. Supabase service key permissions')
      
      // Suggest running the database operations test
      console.log('\n💡 Suggested next steps:')
      console.log('   Run: npm run debug:database-operations')
      console.log('   This will test database operations in isolation')
    }
    
    // Step 5: Final Summary
    console.log('\n📋 Final Summary')
    console.log('================')
    
    if (importResult.success) {
      console.log('🎉 CSV Import test completed successfully!')
      console.log('✅ The CSV import functionality is working correctly')
      
      if (parseResult.totalRows > 5) {
        console.log(`💡 Ready to import all ${parseResult.totalRows} transactions`)
        console.log('   Use the full CSV file for complete import')
      }
    } else {
      console.log('❌ CSV Import test failed')
      console.log('🛠️  Debugging needed for database operations')
      
      console.log('\nDebugging checklist:')
      console.log('[ ] CSV parsing works ✅')
      console.log('[ ] Field mapping works ✅')
      console.log('[ ] Database operations need fixing ❌')
    }
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      })
    }
    
    console.log('\n🛠️  This error occurred at the test framework level')
    console.log('   Check file paths and dependencies')
  }
}

// Run the test
testCSVImportEndToEnd().catch(console.error)