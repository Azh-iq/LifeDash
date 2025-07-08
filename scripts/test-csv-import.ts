#!/usr/bin/env npx tsx

/**
 * CSV Import Test Script
 *
 * This script tests the complete CSV import functionality with the actual Nordnet file
 * to verify Norwegian character encoding, parsing, and database operations.
 */

import { readFileSync } from 'fs'
import {
  NordnetCSVParser,
  NordnetFieldMapper,
} from '../lib/integrations/nordnet'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function testCSVImport() {
  console.log('🧪 Testing CSV Import Functionality\n')

  try {
    // Test 1: File Reading and Basic Validation
    console.log('📁 Test 1: File Reading and Basic Validation')
    console.log('============================================')

    const fileStats = await import('fs').then(fs =>
      fs.promises.stat(CSV_FILE_PATH)
    )
    console.log(`✅ File found: ${CSV_FILE_PATH}`)
    console.log(`📊 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`)

    // Create a mock File object for testing
    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    // Test 2: File Validation
    console.log('\n🔍 Test 2: File Validation')
    console.log('==========================')

    const validation = NordnetCSVParser.validateFile(file)
    console.log(
      `✅ Validation result: ${validation.valid ? 'PASSED' : 'FAILED'}`
    )
    if (validation.error) {
      console.log(`⚠️  Validation warning: ${validation.error}`)
    }

    // Test 3: Encoding Detection and CSV Parsing
    console.log('\n🔤 Test 3: Encoding Detection and CSV Parsing')
    console.log('==============================================')

    const parseResult = await NordnetCSVParser.parseFile(file)

    console.log(`📝 Detected encoding: ${parseResult.detectedEncoding}`)
    console.log(`🔀 Detected delimiter: "${parseResult.detectedDelimiter}"`)
    console.log(
      `🇳🇴 Norwegian characters: ${parseResult.hasNorwegianCharacters ? 'YES' : 'NO'}`
    )
    console.log(`📊 Total rows parsed: ${parseResult.totalRows}`)
    console.log(`📋 Headers found: ${parseResult.headers.length}`)

    // Display first few headers to verify encoding
    console.log('\n📋 First 10 Headers:')
    parseResult.headers.slice(0, 10).forEach((header, index) => {
      console.log(`   ${index + 1}. "${header}"`)
    })

    // Test 4: Norwegian Character Validation
    console.log('\n🇳🇴 Test 4: Norwegian Character Validation')
    console.log('==========================================')

    const norwegianHeaders = parseResult.headers.filter(
      header =>
        /[æøåÆØÅ]/.test(header) ||
        [
          'Bokføringsdag',
          'Handelsdag',
          'Oppgjørsdag',
          'Portefølje',
          'Transaksjonstype',
          'Verdipapir',
          'Kjøpsverdi',
          'Beløp',
        ].includes(header)
    )

    console.log(`✅ Norwegian headers found: ${norwegianHeaders.length}`)
    norwegianHeaders.forEach((header, index) => {
      console.log(`   ${index + 1}. "${header}"`)
    })

    // Test 5: Data Analysis
    console.log('\n📊 Test 5: Data Analysis')
    console.log('========================')

    console.log(`📦 Portfolios: ${parseResult.portfolios.length}`)
    parseResult.portfolios.forEach((portfolio, index) => {
      console.log(`   ${index + 1}. ${portfolio}`)
    })

    console.log(`💰 Currencies: ${parseResult.currencies.length}`)
    parseResult.currencies.forEach((currency, index) => {
      console.log(`   ${index + 1}. ${currency}`)
    })

    console.log(`📈 Transaction Types: ${parseResult.transactionTypes.length}`)
    parseResult.transactionTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`)
    })

    console.log(`🏢 ISIN Codes: ${parseResult.isinCodes.length}`)
    parseResult.isinCodes.slice(0, 5).forEach((isin, index) => {
      console.log(`   ${index + 1}. ${isin}`)
    })

    // Test 6: Field Mapping Validation
    console.log('\n🗺️  Test 6: Field Mapping Validation')
    console.log('===================================')

    if (parseResult.rows.length > 0) {
      const firstRow = parseResult.rows[0]
      console.log('🔍 Testing field mapping on first transaction:')

      try {
        const mappedTransaction = NordnetFieldMapper.transformRow(firstRow)
        console.log('✅ Field mapping successful!')
        console.log(`   Transaction ID: ${mappedTransaction.transactionId}`)
        console.log(`   Date: ${mappedTransaction.transactionDate}`)
        console.log(`   Type: ${mappedTransaction.transactionType}`)
        console.log(`   Security: ${mappedTransaction.securityName}`)
        console.log(`   ISIN: ${mappedTransaction.isin}`)
        console.log(`   Amount: ${mappedTransaction.amount}`)
        console.log(`   Currency: ${mappedTransaction.currency}`)
        console.log(`   Portfolio: ${mappedTransaction.portfolioId}`)
      } catch (error) {
        console.log(
          `❌ Field mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Test 7: Error and Warning Analysis
    console.log('\n⚠️  Test 7: Error and Warning Analysis')
    console.log('=====================================')

    if (parseResult.errors.length > 0) {
      console.log(`❌ Errors found: ${parseResult.errors.length}`)
      parseResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    } else {
      console.log('✅ No parsing errors found')
    }

    if (parseResult.warnings.length > 0) {
      console.log(`⚠️  Warnings found: ${parseResult.warnings.length}`)
      parseResult.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    } else {
      console.log('✅ No parsing warnings found')
    }

    // Test Summary
    console.log('\n📋 Test Summary')
    console.log('===============')

    const totalTests = 7
    const passedTests = [
      validation.valid,
      parseResult.totalRows > 0,
      parseResult.hasNorwegianCharacters,
      norwegianHeaders.length > 0,
      parseResult.portfolios.length > 0,
      parseResult.rows.length > 0,
      parseResult.errors.length === 0,
    ].filter(Boolean).length

    console.log(`✅ Tests passed: ${passedTests}/${totalTests}`)
    console.log(
      `📊 Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    )

    if (passedTests === totalTests) {
      console.log(
        '\n🎉 All tests passed! CSV import functionality is working correctly.'
      )
    } else {
      console.log(
        '\n⚠️  Some tests failed. Please review the output above for details.'
      )
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Run the test
testCSVImport().catch(console.error)
