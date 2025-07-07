// Create a persistent test user that won't be deleted
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

async function createPersistentTestUser() {
  console.log('🔍 Checking for persistent test user:', TEST_USER_EMAIL)

  try {
    // First check if user already exists by trying to sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      })

    if (signInData?.user && !signInError) {
      console.log('✅ Test user already exists and is working!')
      console.log('User ID:', signInData.user.id)
      console.log('Email:', signInData.user.email)

      // Mark as persistent in user profile
      await markUserAsPersistent(signInData.user.id)

      return signInData.user
    }

    console.log('🔨 Creating new persistent test user...')

    // Create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        options: {
          data: {
            full_name: 'Test Bruker',
            display_name: 'Test',
            is_test_user: true,
            is_persistent: true,
            created_by: 'script',
          },
        },
      }
    )

    if (signUpError) {
      console.error('❌ Could not create test user:', signUpError.message)
      throw signUpError
    }

    if (!signUpData.user) {
      throw new Error('User creation succeeded but no user data returned')
    }

    console.log('✅ Test user created successfully!')
    console.log('User ID:', signUpData.user.id)

    // Mark as persistent in user profile
    await markUserAsPersistent(signUpData.user.id)

    // Create default portfolio and data
    await createDefaultTestData(signUpData.user.id)

    return signUpData.user
  } catch (error) {
    console.error('Error creating persistent test user:', error)
    throw error
  }
}

async function markUserAsPersistent(userId: string) {
  console.log('🔒 Marking user as persistent (do not delete)...')

  try {
    // Update or insert user profile with persistent flag
    const { error } = await supabase.from('user_profiles').upsert({
      id: userId,
      email: TEST_USER_EMAIL,
      full_name: 'Test Bruker - PERSISTENT',
      display_name: 'Test (Persistent)',
      timezone: 'Europe/Oslo',
      locale: 'nb-NO',
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error marking user as persistent:', error.message)
    } else {
      console.log('✅ User marked as persistent in database')
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
  }
}

async function createDefaultTestData(userId: string) {
  console.log('📊 Creating default test portfolio...')

  try {
    // Create default portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        name: 'Test Portefølje - PERSISTENT',
        description: 'Persistent test portfolio - DO NOT DELETE',
        user_id: userId,
        is_default: true,
      })
      .select()
      .single()

    if (portfolioError) {
      console.error('Error creating portfolio:', portfolioError.message)
      return
    }

    console.log('✅ Default portfolio created:', portfolio.id)

    // Create manual platform
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .insert({
        name: 'Manuell Inntasting',
        type: 'manual',
        user_id: userId,
        is_demo: true,
      })
      .select()
      .single()

    if (platformError) {
      console.error('Error creating platform:', platformError.message)
      return
    }

    // Create manual account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: 'Test Konto',
        type: 'investment',
        platform_id: platform.id,
        portfolio_id: portfolio.id,
        user_id: userId,
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating account:', accountError.message)
      return
    }

    console.log('✅ Test data structure created successfully')
    console.log('Portfolio ID:', portfolio.id)
    console.log('Account ID:', account.id)
  } catch (error) {
    console.error('Error creating test data:', error)
  }
}

// Run the script
if (require.main === module) {
  createPersistentTestUser()
    .then(() => {
      console.log('\n🎉 Persistent test user setup complete!')
      console.log('Login with: test@test.no / 123456')
      console.log(
        '⚠️  This user is marked as persistent and should not be deleted'
      )
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed to create persistent test user:', error)
      process.exit(1)
    })
}

export { createPersistentTestUser, TEST_USER_EMAIL, TEST_USER_PASSWORD }
