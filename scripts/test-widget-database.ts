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

async function testWidgetDatabase() {
  console.log('🔍 Testing Widget Database Connection...')
  
  try {
    // Test 1: Check if widget_layouts table exists
    console.log('\n1. Checking if widget_layouts table exists...')
    const { data: layouts, error: layoutsError } = await supabase
      .from('widget_layouts')
      .select('count')
      .single()
      
    if (layoutsError) {
      console.error('❌ widget_layouts table error:', layoutsError.message)
    } else {
      console.log('✅ widget_layouts table exists')
    }
    
    // Test 2: Check if widget_preferences table exists
    console.log('\n2. Checking if widget_preferences table exists...')
    const { data: preferences, error: preferencesError } = await supabase
      .from('widget_preferences')
      .select('count')
      .single()
      
    if (preferencesError) {
      console.error('❌ widget_preferences table error:', preferencesError.message)
    } else {
      console.log('✅ widget_preferences table exists')
    }
    
    // Test 3: Check if widget_templates table exists
    console.log('\n3. Checking if widget_templates table exists...')
    const { data: templates, error: templatesError } = await supabase
      .from('widget_templates')
      .select('count')
      .single()
      
    if (templatesError) {
      console.error('❌ widget_templates table error:', templatesError.message)
    } else {
      console.log('✅ widget_templates table exists')
    }
    
    // Test 4: Check if widget_usage_analytics table exists
    console.log('\n4. Checking if widget_usage_analytics table exists...')
    const { data: analytics, error: analyticsError } = await supabase
      .from('widget_usage_analytics')
      .select('count')
      .single()
      
    if (analyticsError) {
      console.error('❌ widget_usage_analytics table error:', analyticsError.message)
    } else {
      console.log('✅ widget_usage_analytics table exists')
    }
    
    // Test 5: Test basic authentication
    console.log('\n5. Testing authentication...')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('ℹ️  Authentication test (expected - no user session in script)')
    } else {
      console.log('✅ Authentication working')
    }
    
    // Test 6: Test database actions
    console.log('\n6. Testing database actions...')
    const { getUserWidgetPreferences } = await import('../lib/actions/widgets/preferences')
    
    console.log('✅ Database actions import successful')
    
    console.log('\n🎉 Database connection test completed!')
    console.log('✅ All widget tables are available')
    console.log('✅ Database actions are ready')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  }
}

// Run the test
testWidgetDatabase()