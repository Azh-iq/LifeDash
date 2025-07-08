#!/usr/bin/env npx tsx

// Quick test to verify the CSV import fix
// This simulates what happens when the user clicks import

import { readFileSync } from 'fs'
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'

async function testCSVAuthFix() {
  console.log('🔍 Testing CSV Import Authentication Fix')
  console.log('========================================')

  const testFilePath =
    '/Users/azhar/Downloads/transactions-and-notes-export.csv'

  try {
    // Step 1: Parse CSV (this should work)
    console.log('\n📋 Step 1: Parse CSV')

    const fileBuffer = readFileSync(testFilePath)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    const parseResult = await NordnetCSVParser.parseFile(file)
    console.log('✅ Parse result:', parseResult.totalRows, 'rows')

    // Step 2: Test different authentication scenarios
    console.log('\n🔐 Step 2: Test Authentication Scenarios')

    // Test 1: Missing access token
    console.log('\n🧪 Test 1: Missing access token')
    let result = await importNordnetTransactions(
      parseResult,
      '',
      'fake-user-id'
    )
    console.log(
      'Result:',
      result.success ? '✅ Success' : '❌ Failed:',
      result.error
    )

    // Test 2: Missing user ID
    console.log('\n🧪 Test 2: Missing user ID')
    result = await importNordnetTransactions(parseResult, 'fake-token', '')
    console.log(
      'Result:',
      result.success ? '✅ Success' : '❌ Failed:',
      result.error
    )

    // Test 3: Invalid token format
    console.log('\n🧪 Test 3: Invalid token')
    result = await importNordnetTransactions(
      parseResult,
      'invalid-token',
      'fake-user-id'
    )
    console.log(
      'Result:',
      result.success ? '✅ Success' : '❌ Failed:',
      result.error
    )

    // Test 4: Check environment variables
    console.log('\n🧪 Test 4: Environment variables')
    console.log(
      'SUPABASE_URL available:',
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    )
    console.log(
      'SUPABASE_KEY available:',
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log(
      '\n✅ All tests completed - errors should be specific, not "unknown"'
    )
  } catch (error) {
    console.error('💥 Unexpected error:', error)

    if (error instanceof Error && error.message.includes('cookies')) {
      console.log('❌ Still getting cookies error!')
    } else {
      console.log("✅ No cookies error - that's good!")
    }
  }
}

// Run the test
testCSVAuthFix().catch(console.error)
