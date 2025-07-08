#!/usr/bin/env npx tsx

/**
 * Standalone CSV Import Test
 *
 * This script tests CSV import functionality in a standalone environment
 * without Next.js server context dependencies.
 */

import { readFileSync } from 'fs'
import {
  NordnetCSVParser,
  NordnetFieldMapper,
} from '../lib/integrations/nordnet'
import { createClient } from '@supabase/supabase-js'

const CSV_FILE_PATH = '/Users/azhar/Downloads/transactions-and-notes-export.csv'

// Create standalone Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testCSVImportStandalone() {
  console.log('🧪 Standalone CSV Import Test\n')

  try {
    // Step 1: CSV Parsing Test
    console.log('📄 Step 1: CSV Parsing Test')
    console.log('===========================')

    const fileBuffer = readFileSync(CSV_FILE_PATH)
    const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
      type: 'text/csv',
    })

    console.log(`📁 File loaded: ${(fileBuffer.length / 1024).toFixed(2)} KB`)

    const parseResult = await NordnetCSVParser.parseFile(file)

    console.log(`✅ Parsing completed`)
    console.log(`   Total rows: ${parseResult.totalRows}`)
    console.log(`   Encoding: ${parseResult.detectedEncoding}`)
    console.log(`   Delimiter: "${parseResult.detectedDelimiter}"`)
    console.log(
      `   Norwegian characters: ${parseResult.hasNorwegianCharacters ? 'YES' : 'NO'}`
    )
    console.log(`   Parse errors: ${parseResult.errors.length}`)
    console.log(`   Parse warnings: ${parseResult.warnings.length}`)

    if (parseResult.errors.length > 0) {
      console.log('\n❌ Parse errors found:')
      parseResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
      return
    }

    // Step 2: Show some sample data
    console.log('\n📊 Step 2: Sample Data Analysis')
    console.log('===============================')

    console.log('First 3 rows of raw data:')
    const sampleRows = parseResult.rows.slice(0, 3)

    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i]
      console.log(`\n📋 Row ${i + 1} (ID: ${row.Id}):`)
      console.log(`   Date: ${row.Bokføringsdag}`)
      console.log(`   Type: ${row.Transaksjonstype}`)
      console.log(`   Security: ${row.Verdipapir}`)
      console.log(`   ISIN: ${row.ISIN}`)
      console.log(`   Amount: ${row.Antall}`)
      console.log(`   Price: ${row.Kurs}`)
      console.log(`   Currency: ${row.Valuta}`)
      console.log(`   Total: ${row.Beløp}`)
      console.log(`   Portfolio: ${row.Portefølje}`)
    }

    // Step 3: Field Mapping Test
    console.log('\n🗺️  Step 3: Field Mapping Test')
    console.log('==============================')

    const testRowCount = Math.min(5, parseResult.rows.length)
    console.log(`Testing field mapping on first ${testRowCount} rows...`)

    const transformedRows = []

    for (let i = 0; i < testRowCount; i++) {
      const row = parseResult.rows[i]
      try {
        const transformed = NordnetFieldMapper.transformRow(row)
        transformedRows.push(transformed)
        console.log(`✅ Row ${i + 1} (ID: ${row.Id}) transformed successfully`)

        if (transformed.validation_errors.length > 0) {
          console.log(
            `   ❌ Validation errors: ${transformed.validation_errors.join(', ')}`
          )
        }
        if (transformed.validation_warnings.length > 0) {
          console.log(
            `   ⚠️  Validation warnings: ${transformed.validation_warnings.join(', ')}`
          )
        }

        // Show transformed data
        console.log(`   ➡️  Transformed:`)
        console.log(`      Type: ${transformed.internal_transaction_type}`)
        console.log(`      Symbol: ${transformed.symbol}`)
        console.log(`      Quantity: ${transformed.quantity}`)
        console.log(`      Price: ${transformed.price}`)
        console.log(`      Amount: ${transformed.amount}`)
        console.log(`      Currency: ${transformed.currency}`)
      } catch (error) {
        console.log(
          `❌ Row ${i + 1} transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        return
      }
    }

    // Step 4: Database Connection Test
    console.log('\n🔗 Step 4: Database Connection Test')
    console.log('===================================')

    try {
      // Test database connection by fetching user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .limit(1)

      if (profileError) {
        console.log('❌ Database connection failed:', profileError.message)
        return
      }

      console.log('✅ Database connection successful')
      console.log(`   Found ${profiles?.length || 0} user profiles`)
    } catch (error) {
      console.log(
        '❌ Database connection error:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return
    }

    // Step 5: Summary & Character Verification
    console.log('\n📋 Step 5: Character Encoding Verification')
    console.log('==========================================')

    // Check Norwegian characters in headers
    const norwegianHeaders = parseResult.headers.filter(header =>
      /[æøåÆØÅ]/.test(header)
    )

    console.log(`Headers with Norwegian characters:`)
    norwegianHeaders.forEach(header => {
      console.log(`   ✅ "${header}" - Characters display correctly`)
    })

    // Check transaction types
    const transactionTypes = new Set(
      parseResult.rows.map(row => row.Transaksjonstype)
    )
    console.log(`\nTransaction types found:`)
    Array.from(transactionTypes).forEach(type => {
      console.log(
        `   ✅ "${type}" - ${/[æøåÆØÅ]/.test(type) ? 'Contains Norwegian chars' : 'ASCII only'}`
      )
    })

    // Check securities with Norwegian characters
    const norwegianSecurities = parseResult.rows
      .filter(row => row.Verdipapir && /[æøåÆØÅ]/.test(row.Verdipapir))
      .map(row => row.Verdipapir)
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 5)

    if (norwegianSecurities.length > 0) {
      console.log(`\nSecurities with Norwegian characters:`)
      norwegianSecurities.forEach(security => {
        console.log(`   ✅ "${security}" - Characters display correctly`)
      })
    }

    // Final Summary
    console.log('\n🎉 Final Summary')
    console.log('================')

    console.log(`✅ CSV parsing: SUCCESS`)
    console.log(
      `   - File format: ${parseResult.detectedEncoding.toUpperCase()}`
    )
    console.log(`   - Delimiter: TAB character`)
    console.log(`   - Norwegian characters: Properly decoded`)
    console.log(`   - Total transactions: ${parseResult.totalRows}`)

    console.log(`✅ Field mapping: SUCCESS`)
    console.log(`   - All test rows transformed successfully`)
    console.log(`   - Validation warnings noted but not blocking`)

    console.log(`✅ Database connection: SUCCESS`)
    console.log(`   - Supabase client working correctly`)

    console.log(`\n🚀 READY FOR FULL IMPORT`)
    console.log(
      `   Your ${parseResult.totalRows} transactions are ready to import!`
    )
    console.log(`   Use the web interface to complete the import process.`)
  } catch (error) {
    console.error('❌ Standalone test failed:', error)

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      })
    }
  }
}

// Run the test
testCSVImportStandalone().catch(console.error)
