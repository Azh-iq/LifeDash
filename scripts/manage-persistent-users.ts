// Comprehensive persistent user management script
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listPersistentUsers() {
  console.log('📋 Listing all persistent and test users...')

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, email, full_name, is_test_user, is_persistent, created_at, notes'
    )
    .or('is_test_user.eq.true,is_persistent.eq.true')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (data.length === 0) {
    console.log('No persistent or test users found.')
    return
  }

  console.table(
    data.map(user => ({
      Email: user.email,
      Name: user.full_name,
      'Test User': user.is_test_user ? '✅' : '❌',
      Persistent: user.is_persistent ? '🔒' : '❌',
      Created: new Date(user.created_at).toLocaleDateString('nb-NO'),
      Notes: user.notes || '-',
    }))
  )
}

async function ensureTestUserExists() {
  console.log('\n🔍 Checking for test@test.no...')

  // Try to sign in
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: 'test@test.no',
      password: '123456',
    })

  if (signInData?.user && !signInError) {
    console.log('✅ Test user exists and can log in')

    // Make sure it's marked as persistent
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_test_user: true,
        is_persistent: true,
        full_name: 'Test Bruker - PERSISTENT',
        display_name: 'Test (Persistent)',
        notes: 'Protected test user - DO NOT DELETE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', signInData.user.id)

    if (updateError) {
      console.error(
        'Warning: Could not mark user as persistent:',
        updateError.message
      )
    } else {
      console.log('✅ User marked as persistent')
    }

    return signInData.user
  }

  console.log('❌ Test user not found, creating...')

  // Create new user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@test.no',
    password: '123456',
    options: {
      data: {
        full_name: 'Test Bruker - PERSISTENT',
        display_name: 'Test (Persistent)',
      },
    },
  })

  if (signUpError || !signUpData.user) {
    console.error('❌ Failed to create test user:', signUpError?.message)
    return null
  }

  console.log('✅ Test user created')

  // Mark as persistent
  const { error: markError } = await supabase.from('user_profiles').upsert({
    id: signUpData.user.id,
    email: 'test@test.no',
    full_name: 'Test Bruker - PERSISTENT',
    display_name: 'Test (Persistent)',
    is_test_user: true,
    is_persistent: true,
    notes: 'Protected test user - DO NOT DELETE',
    timezone: 'Europe/Oslo',
    locale: 'nb-NO',
  })

  if (markError) {
    console.error(
      'Warning: Could not mark new user as persistent:',
      markError.message
    )
  } else {
    console.log('✅ New user marked as persistent')
  }

  return signUpData.user
}

async function cleanupNonPersistentTestData() {
  console.log('\n🧹 Cleaning up non-persistent test data...')

  try {
    const { data: result, error } = await supabase.rpc(
      'cleanup_non_persistent_test_data'
    )

    if (error) {
      console.error('❌ Cleanup failed:', error.message)
    } else {
      console.log(`✅ Cleaned up ${result} non-persistent test records`)
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error)
  }
}

async function showUsageInstructions() {
  console.log('\n📖 PERSISTENT TEST USER MANAGEMENT')
  console.log('==================================')
  console.log('')
  console.log('🔑 LOGIN CREDENTIALS:')
  console.log('   Email: test@test.no')
  console.log('   Password: 123456')
  console.log('')
  console.log('🔒 PROTECTION FEATURES:')
  console.log('   • User is marked as persistent (is_persistent = true)')
  console.log('   • User is marked as test user (is_test_user = true)')
  console.log('   • Database triggers prevent accidental deletion')
  console.log('   • Portfolio and data are protected from cleanup')
  console.log('')
  console.log('🛠️  MANAGEMENT COMMANDS:')
  console.log(
    '   • npx tsx scripts/manage-persistent-users.ts - Run this script'
  )
  console.log('   • npx tsx scripts/check-test-user.ts - Check login status')
  console.log(
    '   • npx tsx scripts/create-persistent-test-user.ts - Recreate if needed'
  )
  console.log('')
  console.log('⚠️  IMPORTANT NOTES:')
  console.log('   • This user will persist across database resets')
  console.log('   • Only delete manually if absolutely necessary')
  console.log('   • Portfolio and test data are included')
  console.log('   • Use for development and testing only')
}

// Main execution
async function main() {
  console.log('🎯 LifeDash Persistent User Management\n')

  await listPersistentUsers()
  await ensureTestUserExists()
  await cleanupNonPersistentTestData()
  await showUsageInstructions()
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Management script completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Management script failed:', error)
      process.exit(1)
    })
}

export {
  listPersistentUsers,
  ensureTestUserExists,
  cleanupNonPersistentTestData,
}
