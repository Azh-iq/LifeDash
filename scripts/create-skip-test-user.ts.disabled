// Create a test user for testing skip setup flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSkipTestUser() {
  console.log('Creating test user for skip flow: skip@test.no')

  try {
    // Create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: 'skip@test.no',
        password: '123456',
      }
    )

    if (signUpError) {
      console.error('❌ Could not create skip test user:', signUpError.message)
      return
    }

    console.log('✅ Skip test user created successfully!')
    console.log('User ID:', signUpData.user?.id)
    console.log('Email:', signUpData.user?.email)

    console.log('\n🚀 Test the skip flow:')
    console.log('1. Go to http://localhost:3000/login')
    console.log('2. Login with skip@test.no / 123456')
    console.log('3. You should be redirected to setup page')
    console.log('4. Click "Hopp over oppsett" button')
    console.log('5. You should see the empty stocks page!')
  } catch (error) {
    console.error('Error creating skip test user:', error)
  }
}

createSkipTestUser().catch(console.error)
