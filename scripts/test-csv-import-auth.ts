#!/usr/bin/env npx tsx

// Simple test to verify CSV import authentication works

import { readFileSync } from 'fs'
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser'
import { NordnetFieldMapper } from '../lib/integrations/nordnet/field-mapping'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'

async function testCSVImportAuth() {
  console.log('🔍 Test CSV Import Authentication')
  console.log('=================================')

  const testFilePath = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

  try {
    // Step 1: Parse the CSV file
    console.log('\n📋 Step 1: Parse CSV')
    
    // Create file object from buffer
    const fileBuffer = readFileSync(testFilePath)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv'
    })
    
    const parseResult = await NordnetCSVParser.parseFile(file)
    
    console.log('📊 Parse result status:', {
      success: parseResult.success,
      totalRows: parseResult.totalRows,
      errors: parseResult.errors.length,
      warnings: parseResult.warnings.length,
      hasRows: parseResult.rows && parseResult.rows.length > 0
    })
    
    // Check if parsing was successful (has rows and no critical errors)
    if (!parseResult.rows || parseResult.rows.length === 0) {
      console.error('❌ Parse failed or no data:', parseResult.errors)
      if (parseResult.warnings.length > 0) {
        console.log('⚠️  Warnings:', parseResult.warnings)
      }
      return
    }
    
    console.log('✅ Parse successful - proceeding with import test')

    // Step 2: Test authentication in import action
    console.log('\n🔐 Step 2: Test Import Authentication')
    
    const importResult = await importNordnetTransactions(parseResult)
    
    console.log('📊 Import Result:', {
      success: importResult.success,
      error: importResult.error,
    })
    
    if (importResult.success && importResult.data) {
      console.log('✅ Import data available:', {
        createdTransactions: importResult.data.createdTransactions,
        createdAccounts: importResult.data.createdAccounts,
        errors: importResult.data.errors.length,
        warnings: importResult.data.warnings.length,
      })
    } else {
      console.log('❌ Import failed:', importResult.error)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
  }
}

// Run the test
testCSVImportAuth().catch(console.error)