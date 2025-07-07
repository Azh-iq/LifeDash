#!/usr/bin/env tsx

// Comprehensive cleanup of all test/demo data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function comprehensiveCleanup() {
  console.log('🧹 Comprehensive cleanup of all test/demo data...')

  try {
    // Delete ALL demo/test platforms by name pattern
    const { error: platformError } = await supabase
      .from('platforms')
      .delete()
      .or(
        'name.ilike.%demo%,name.ilike.%test%,display_name.ilike.%demo%,display_name.ilike.%test%'
      )

    if (platformError) {
      console.log(`⚠️  Error removing demo platforms: ${platformError.message}`)
    } else {
      console.log('✅ Removed all demo/test platforms')
    }

    // Clean up any orphaned stocks with suspicious data
    const { error: stockError } = await supabase
      .from('stocks')
      .delete()
      .or(
        'current_price.eq.100,name.ilike.%test%,name.ilike.%demo%,symbol.ilike.%test%'
      )

    if (stockError) {
      console.log(`⚠️  Error removing test stocks: ${stockError.message}`)
    } else {
      console.log('✅ Removed test stocks')
    }

    console.log('🎉 Comprehensive cleanup completed!')

    // Final verification
    const { data: platforms } = await supabase
      .from('platforms')
      .select('name, display_name')

    console.log('\n📊 Remaining platforms:')
    if (platforms) {
      platforms.forEach(platform => {
        console.log(`  - ${platform.name}: ${platform.display_name}`)
      })
    }
  } catch (error) {
    console.error('❌ Error during comprehensive cleanup:', error)
  }
}

// Run the comprehensive cleanup
comprehensiveCleanup().catch(console.error)
