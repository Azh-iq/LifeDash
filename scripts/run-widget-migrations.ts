#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runWidgetMigrations() {
  console.log('🚀 Running Widget Database Migrations...')
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/017_widget_layouts.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    
    // Execute the migration
    console.log('⏳ Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error.message)
      
      // Try alternative method - split and execute statements
      console.log('🔄 Trying alternative execution method...')
      
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))
      
      console.log(`📝 Found ${statements.length} SQL statements`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          try {
            console.log(`   Executing statement ${i + 1}/${statements.length}...`)
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
            if (stmtError) {
              console.error(`   ❌ Statement ${i + 1} failed:`, stmtError.message)
            } else {
              console.log(`   ✅ Statement ${i + 1} success`)
            }
          } catch (err) {
            console.error(`   ❌ Statement ${i + 1} error:`, err)
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }
    
    // Test the tables
    console.log('\n🔍 Testing created tables...')
    await testTables()
    
    console.log('\n🎉 Widget database migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function testTables() {
  const tables = ['widget_layouts', 'widget_preferences', 'widget_templates', 'widget_usage_analytics']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .single()
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Available`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`)
    }
  }
}

// Run the migrations
runWidgetMigrations()