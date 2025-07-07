// Check if test user exists
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTestUser() {
  console.log('Checking for test user: test@test.no')

  try {
    // Try to sign in with test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@test.no',
      password: '123456',
    })

    if (error) {
      console.log(
        '❌ Test user not found or password incorrect:',
        error.message
      )
      console.log('\nTrying to create test user...')

      // Try to create the user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: 'test@test.no',
          password: '123456',
        })

      if (signUpError) {
        console.log('❌ Could not create test user:', signUpError.message)
      } else {
        console.log('✅ Test user created successfully!')
        console.log('User ID:', signUpData.user?.id)
      }
    } else {
      console.log('✅ Test user exists and login successful!')
      console.log('User ID:', data.user?.id)
      console.log('Email:', data.user?.email)
      console.log('Created:', data.user?.created_at)
    }
  } catch (error) {
    console.error('Error checking test user:', error)
  }
}

checkTestUser().catch(console.error)
