const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUser() {
  console.log('Oppretter bruker med test@test.no...')

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@test.no',
    password: 'testpassword123',
    email_confirm: true,
  })

  if (error) {
    console.error('Feil ved oppretting av bruker:', error)
    return
  }

  console.log('✅ Bruker opprettet!')
  console.log('E-post: test@test.no')
  console.log('Passord: testpassword123')
  console.log('Bruker ID:', data.user.id)

  // Opprett user_profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: data.user.id,
    email: 'test@test.no',
    full_name: 'Test Bruker',
    display_name: 'Test',
    locale: 'nb-NO',
    timezone: 'Europe/Oslo',
  })

  if (profileError) {
    console.error('Feil ved oppretting av profil:', profileError)
    return
  }

  // Opprett user_preferences
  const { error: preferencesError } = await supabase
    .from('user_preferences')
    .insert({
      user_id: data.user.id,
      theme: 'dark',
      primary_currency: 'NOK',
      secondary_currency: 'USD',
    })

  if (preferencesError) {
    console.error('Feil ved oppretting av preferanser:', preferencesError)
    return
  }

  console.log('✅ Brukerprofil og preferanser opprettet!')
}

createUser()
  .then(() => {
    console.log('Ferdig!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Feil:', err)
    process.exit(1)
  })
