#!/usr/bin/env npx tsx
/**
 * Test CSV Import - Post Fix Verification
 * 
 * This script tests the CSV import functionality after applying fixes
 * to verify that errors are now properly handled and reported.
 */

import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { join } from 'path'
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function testCSVImportFixed() {
  console.log('🧪 Test CSV Import - Post Fix Verification\n')
  
  try {
    // Step 1: Test with no environment variables
    console.log('🔧 Test 1: Missing Environment Variables')
    console.log('========================================')
    
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Temporarily remove environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv'
    })
    
    const parseResult = await NordnetCSVParser.parseFile(file)
    const limitedParseResult = {
      ...parseResult,
      rows: parseResult.rows.slice(0, 1),
      totalRows: 1
    }
    
    try {
      const result = await importNordnetTransactions(
        limitedParseResult,
        'test-token',
        'test-user'
      )
      
      console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      console.log(`Error: ${result.error}`)
      
      if (result.error && result.error.includes('Configuration error')) {
        console.log('✅ Environment variable validation working correctly')
      } else {
        console.log('❌ Environment variable validation not working')
      }
    } catch (error) {
      console.log(`❌ Unexpected exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    
    // Step 2: Test with invalid authentication token
    console.log('\n🔑 Test 2: Invalid Authentication Token')
    console.log('======================================')
    
    try {
      const result = await importNordnetTransactions(
        limitedParseResult,
        'invalid-jwt-token',
        'test-user-id'
      )
      
      console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      console.log(`Error: ${result.error}`)
      
      if (result.error && (result.error.includes('JWT') || result.error.includes('Authentication'))) {
        console.log('✅ Authentication error handling working correctly')
      } else {
        console.log('❌ Authentication error handling not working as expected')
      }
    } catch (error) {
      console.log(`❌ Unexpected exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    // Step 3: Test with empty token
    console.log('\n🚫 Test 3: Empty Authentication Token')
    console.log('====================================')
    
    try {
      const result = await importNordnetTransactions(
        limitedParseResult,
        '',
        'test-user-id'
      )
      
      console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      console.log(`Error: ${result.error}`)
      
      if (result.error && result.error.includes('Authentication')) {
        console.log('✅ Empty token error handling working correctly')
      } else {
        console.log('❌ Empty token error handling not working as expected')
      }
    } catch (error) {
      console.log(`❌ Unexpected exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
    
    console.log('\n📋 Summary of Fixes Applied')
    console.log('===========================')
    console.log('✅ Added environment variable validation')
    console.log('✅ Enhanced authentication error messages')
    console.log('✅ Improved error logging in CSV import modal')
    console.log('✅ Added specific error messages for common failure modes')
    
    console.log('\n💡 Next Steps for Complete Fix')
    console.log('==============================')
    console.log('1. Test in the actual application with valid user session')
    console.log('2. Verify that error messages are now user-friendly')
    console.log('3. Check browser console for detailed error logs')
    console.log('4. If issues persist, check database permissions and RLS policies')
    
    console.log('\n🎯 Expected User Experience')
    console.log('===========================')
    console.log('- Users should no longer see "unknown error"')
    console.log('- Specific error messages should guide users on how to fix issues')
    console.log('- Console logs should provide debugging information for developers')
    console.log('- Environment/configuration issues should be clearly identified')
    
  } catch (error) {
    console.error('❌ Test script failed:', error)
    
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack?.split('\n').slice(0, 5).join('\n'))
    }
  }
}

// Run the test
testCSVImportFixed().catch(console.error)