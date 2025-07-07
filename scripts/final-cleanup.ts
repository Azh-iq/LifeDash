#!/usr/bin/env tsx

// Final cleanup for remaining demo platform
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalCleanup() {
  console.log('🧹 Final cleanup of remaining demo data...')

  try {
    // Remove demo platform
    const { error: demoPlatformError } = await supabase
      .from('platforms')
      .delete()
      .eq('name', 'demo')

    if (demoPlatformError) {
      console.log(
        `⚠️  Error removing demo platform: ${demoPlatformError.message}`
      )
    } else {
      console.log('✅ Removed demo platform')
    }

    console.log('🎉 Final cleanup completed!')
  } catch (error) {
    console.error('❌ Error during final cleanup:', error)
  }
}

// Run the final cleanup
finalCleanup().catch(console.error)
