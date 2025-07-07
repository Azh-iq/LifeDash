// Test that the persistent user cannot be deleted
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDeletionProtection() {
  console.log('🧪 Testing deletion protection for test@test.no...')

  try {
    // First, list all persistent users
    console.log('\n📋 Listing all persistent users:')
    const { data: persistentUsers, error: listError } = await supabase.rpc(
      'list_persistent_users'
    )

    if (listError) {
      console.error('Error listing persistent users:', listError.message)
    } else {
      console.table(persistentUsers)
    }

    // Try to delete the test user (this should fail)
    console.log('\n🚫 Attempting to delete test@test.no (should fail)...')
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', 'test@test.no')

    if (deleteError) {
      console.log('✅ PROTECTION WORKING! Deletion failed as expected:')
      console.log('   Error:', deleteError.message)
    } else {
      console.log(
        '❌ PROTECTION FAILED! User was deleted (this should not happen)'
      )
    }

    // Verify the user still exists
    console.log('\n🔍 Verifying user still exists...')
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('email, full_name, is_persistent, is_test_user')
      .eq('email', 'test@test.no')
      .single()

    if (userError) {
      console.error('❌ User verification failed:', userError.message)
    } else {
      console.log('✅ User still exists:')
      console.log('   Email:', userData.email)
      console.log('   Name:', userData.full_name)
      console.log('   Is Persistent:', userData.is_persistent)
      console.log('   Is Test User:', userData.is_test_user)
    }
  } catch (error) {
    console.error('Test failed with error:', error)
  }
}

if (require.main === module) {
  testDeletionProtection()
    .then(() => {
      console.log('\n🎉 Deletion protection test completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}
