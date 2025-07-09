#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...')
  
  try {
    // Check if we can connect to the database
    console.log('📡 Testing database connection...')
    console.log('Supabase URL:', supabaseUrl)
    
    // List all tables in the database
    const { data: tables, error } = await supabase.rpc('get_tables')
    
    if (error) {
      console.log('❌ get_tables function not available:', error.message)
      
      // Try another approach - check some known tables
      console.log('\n🔍 Checking known tables...')
      
      const knownTables = [
        'user_profiles',
        'portfolios',
        'accounts',
        'stocks',
        'transactions',
        'holdings',
        'widget_layouts',
        'widget_preferences'
      ]
      
      for (const table of knownTables) {
        try {
          const { data, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(0)
          
          if (tableError) {
            console.log(`❌ ${table}: ${tableError.message}`)
          } else {
            console.log(`✅ ${table}: Available`)
          }
        } catch (err) {
          console.log(`❌ ${table}: ${err}`)
        }
      }
    } else {
      console.log('✅ Tables in database:')
      console.log(tables)
    }
    
    // Test authentication
    console.log('\n🔐 Testing authentication...')
    const { data: user, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Auth working (no active session expected)')
    }
    
    // Test service role capabilities
    console.log('\n🔧 Testing service role capabilities...')
    
    // Try to get schema information
    const { data: schema, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (schemaError) {
      console.log('❌ Schema query failed:', schemaError.message)
    } else {
      console.log('✅ Schema accessible')
      console.log('Available tables:', schema?.map(t => t.table_name) || [])
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error)
  }
}

// Run the check
checkDatabaseStatus()