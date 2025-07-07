#!/usr/bin/env tsx

// Check what demo platforms exist
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDemoPlatforms() {
  console.log('🔍 Checking demo platforms...')

  try {
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')

    if (error) {
      console.log(`⚠️  Error checking platforms: ${error.message}`)
      return
    }

    console.log(`Found ${platforms?.length || 0} platforms:`)
    if (platforms) {
      platforms.forEach(platform => {
        console.log(
          `  - ID: ${platform.id}, Name: ${platform.name}, Display: ${platform.display_name}`
        )
      })

      // Try to delete any that look like demo/test platforms
      for (const platform of platforms) {
        if (
          platform.name?.toLowerCase().includes('demo') ||
          platform.name?.toLowerCase().includes('test') ||
          platform.display_name?.toLowerCase().includes('demo') ||
          platform.display_name?.toLowerCase().includes('test')
        ) {
          console.log(`Deleting demo platform: ${platform.name}`)
          const { error: deleteError } = await supabase
            .from('platforms')
            .delete()
            .eq('id', platform.id)

          if (deleteError) {
            console.log(`   ⚠️  Error deleting: ${deleteError.message}`)
          } else {
            console.log(`   ✅ Deleted: ${platform.name}`)
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the check
checkDemoPlatforms().catch(console.error)
