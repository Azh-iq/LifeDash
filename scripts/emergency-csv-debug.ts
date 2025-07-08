#!/usr/bin/env npx tsx

// Emergency CSV Debug - Let's trace exactly what happens

import { readFileSync } from 'fs'
import { NordnetCSVParser } from '../lib/integrations/nordnet/csv-parser'

async function emergencyCSVDebug() {
  console.log('🚨 EMERGENCY CSV DEBUG')
  console.log('======================')

  try {
    // Load environment to check what's available
    console.log('\n🔧 Environment Check:')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('PWD:', process.cwd())
    
    // Check if .env.local exists
    try {
      const envFile = readFileSync('.env.local', 'utf-8')
      console.log('✅ .env.local file found')
      console.log('Contains SUPABASE_URL:', envFile.includes('NEXT_PUBLIC_SUPABASE_URL'))
      console.log('Contains SUPABASE_KEY:', envFile.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
    } catch (e) {
      console.log('❌ .env.local file not found')
    }

    // Test CSV parsing
    console.log('\n📁 CSV File Test:')
    const testFilePath = '/Users/azhar/Downloads/transactions-and-notes-export.csv'
    
    try {
      const fileBuffer = readFileSync(testFilePath)
      const file = new File([fileBuffer], 'transactions-and-notes-export.csv', {
        type: 'text/csv'
      })
      
      console.log('✅ CSV file loaded:', fileBuffer.length, 'bytes')
      
      const parseResult = await NordnetCSVParser.parseFile(file)
      console.log('✅ Parse success:', parseResult.totalRows, 'transactions')
      console.log('Headers count:', parseResult.headers?.length)
      console.log('First row keys:', parseResult.rows?.[0] ? Object.keys(parseResult.rows[0]).slice(0, 5) : 'No rows')
      
    } catch (e) {
      console.log('❌ CSV parsing failed:', e)
    }

    console.log('\n🔍 Import Function Analysis:')
    
    // Check if the import function can be loaded
    try {
      const { importNordnetTransactions } = await import('../lib/actions/transactions/csv-import')
      console.log('✅ Import function loaded successfully')
      console.log('Function type:', typeof importNordnetTransactions)
    } catch (e) {
      console.log('❌ Import function load error:', e)
    }

    console.log('\n🎯 NEXT STEPS:')
    console.log('1. Check if development server is running on http://localhost:3005')
    console.log('2. Open browser console when testing CSV import')
    console.log('3. Look for specific error messages in network tab')
    console.log('4. Check if authentication session exists')

  } catch (error) {
    console.log('💥 Emergency debug failed:', error)
  }
}

emergencyCSVDebug().catch(console.error)