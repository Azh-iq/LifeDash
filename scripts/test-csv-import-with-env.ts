#!/usr/bin/env npx tsx
/**
 * Test CSV Import with Proper Environment Loading
 *
 * This script tests CSV import functionality with proper environment variable loading
 * to identify the root cause of the "unknown error" issue.
 */

import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { join } from 'path'
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser'
import { importNordnetTransactions } from '../lib/actions/transactions/csv-import'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

async function testCSVImportWithEnvironment() {
  console.log('🧪 Test CSV Import with Proper Environment\n')

  try {
    // Step 1: Verify environment variables
    console.log('🔧 Step 1: Environment Variables Check')
    console.log('=====================================')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found')
      return
    }

    if (!supabaseKey) {
      console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found')
      return
    }

    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
    console.log(
      `✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`
    )

    // Step 2: Parse CSV
    console.log('\n📄 Step 2: CSV Parsing')
    console.log('======================')

    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    const parseResult = await NordnetCSVParser.parseFile(file)

    if (parseResult.errors.length > 0) {
      console.log('❌ CSV parsing failed:')
      parseResult.errors.forEach(error => console.log(`   ${error}`))
      return
    }

    console.log(`✅ Parsed ${parseResult.totalRows} transactions successfully`)

    // Step 3: Test with limited data (first 3 transactions)
    console.log('\n🚀 Step 3: Database Import Test')
    console.log('===============================')

    const limitedParseResult = {
      ...parseResult,
      rows: parseResult.rows.slice(0, 3),
      totalRows: 3,
    }

    console.log('Testing import with 3 transactions...')

    // We need to simulate authentication context
    // For testing, we'll use placeholder values
    const mockAccessToken = 'test-token'
    const mockUserId = 'test-user-id'

    try {
      console.log('⏱️  Starting import...')
      const importResult = await importNordnetTransactions(
        limitedParseResult,
        mockAccessToken,
        mockUserId
      )

      console.log(
        `Import completed: ${importResult.success ? 'SUCCESS' : 'FAILED'}`
      )

      if (importResult.success && importResult.data) {
        console.log('✅ Import successful!')
        console.log(
          `   Created transactions: ${importResult.data.createdTransactions}`
        )
        console.log(`   Created accounts: ${importResult.data.createdAccounts}`)
        console.log(`   Skipped rows: ${importResult.data.skippedRows}`)
        console.log(`   Errors: ${importResult.data.errors.length}`)
        console.log(`   Warnings: ${importResult.data.warnings.length}`)

        if (importResult.data.errors.length > 0) {
          console.log('\n📝 Import errors:')
          importResult.data.errors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`)
          })
        }

        if (importResult.data.warnings.length > 0) {
          console.log('\n📝 Import warnings:')
          importResult.data.warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`)
          })
        }
      } else {
        console.log(`❌ Import failed: ${importResult.error}`)

        // Analyze the error to provide specific debugging guidance
        if (importResult.error?.includes('supabaseUrl is required')) {
          console.log('\n💡 Diagnosis: Supabase configuration issue')
          console.log(
            '   Environment variables are not properly loaded in server action context'
          )
        } else if (importResult.error?.includes('Authentication')) {
          console.log('\n💡 Diagnosis: Authentication issue')
          console.log('   User authentication failed or invalid access token')
        } else if (importResult.error?.includes('permission')) {
          console.log('\n💡 Diagnosis: Permission issue')
          console.log('   User lacks permissions for database operations')
        } else if (importResult.error?.includes('constraint')) {
          console.log('\n💡 Diagnosis: Database constraint violation')
          console.log(
            '   Data violates database constraints or foreign key references'
          )
        } else {
          console.log('\n💡 Diagnosis: Unknown database error')
          console.log(
            '   Check Supabase logs and database schema compatibility'
          )
        }
      }
    } catch (importError) {
      console.log(
        `❌ Import failed with exception: ${importError instanceof Error ? importError.message : 'Unknown error'}`
      )

      if (importError instanceof Error) {
        console.log(`\n🔍 Error details:`)
        console.log(`   Message: ${importError.message}`)
        console.log(
          `   Stack: ${importError.stack?.split('\n').slice(0, 3).join('\n')}`
        )
      }
    }

    console.log('\n📋 Summary')
    console.log('===========')
    console.log(
      'This test helps identify whether the CSV import issue is caused by:'
    )
    console.log('1. Environment variable loading (✅ FIXED)')
    console.log('2. Authentication context in server actions')
    console.log('3. Database permissions or RLS policies')
    console.log('4. Data validation or constraint violations')
    console.log('5. Supabase client configuration')
  } catch (error) {
    console.error('❌ Test failed:', error)

    if (error instanceof Error) {
      console.error(
        'Stack trace:',
        error.stack?.split('\n').slice(0, 5).join('\n')
      )
    }
  }
}

// Run the test
testCSVImportWithEnvironment().catch(console.error)
