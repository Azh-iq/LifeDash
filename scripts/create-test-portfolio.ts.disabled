// Create test portfolio for test user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
// Use service role key to bypass RLS for admin operations
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestPortfolio() {
  console.log('Creating test portfolio for test@test.no...')

  try {
    // Sign in as test user
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: 'test@test.no',
        password: '123456',
      })

    if (signInError) {
      console.error('❌ Could not sign in:', signInError.message)
      return
    }

    const user = authData.user
    console.log('✅ Signed in as:', user.email)

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      console.log('Creating user profile...')
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: 'Test User',
          display_name: 'Test User',
        })

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError)
        return
      }
      console.log('✅ User profile created')
    }

    // Check if portfolio already exists
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingPortfolio) {
      console.log('✅ Portfolio already exists:', existingPortfolio.name)
      return
    }

    // Create portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: 'Min Portefølje',
        description: 'Test portefølje for demonstrasjon',
        currency: 'NOK',
        is_public: false,
        is_default: true,
      })
      .select()
      .single()

    if (portfolioError) {
      console.error('❌ Error creating portfolio:', portfolioError)
      return
    }

    console.log('✅ Portfolio created:', portfolio.name)

    // First create or get a platform
    let { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('name', 'nordnet')
      .single()

    if (platformError || !platform) {
      const { data: newPlatform, error: createPlatformError } = await supabase
        .from('platforms')
        .insert({
          name: 'nordnet',
          display_name: 'Nordnet',
          type: 'BROKER',
          default_currency: 'NOK',
          country_code: 'NO',
          is_active: true,
        })
        .select()
        .single()

      if (createPlatformError) {
        console.error('❌ Error creating platform:', createPlatformError)
        return
      }
      platform = newPlatform
    }

    // Create test account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        portfolio_id: portfolio.id,
        platform_id: platform.id,
        name: 'Nordnet ASK',
        account_type: 'TAXABLE',
        currency: 'NOK',
        is_active: true,
      })
      .select()
      .single()

    if (accountError) {
      console.error('❌ Error creating account:', accountError)
      return
    }

    console.log('✅ Account created:', account.name)

    // Add some test stocks and holdings
    const testStocks = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        quantity: 25,
        cost_basis: 150.0,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        exchange: 'NASDAQ',
        currency: 'USD',
        quantity: 15,
        cost_basis: 300.0,
      },
      {
        symbol: 'EQNR.OL',
        name: 'Equinor ASA',
        exchange: 'OSLO',
        currency: 'NOK',
        quantity: 200,
        cost_basis: 280.5,
      },
      {
        symbol: 'DNB.OL',
        name: 'DNB Bank ASA',
        exchange: 'OSLO',
        currency: 'NOK',
        quantity: 100,
        cost_basis: 220.0,
      },
    ]

    for (const stockData of testStocks) {
      console.log(`Adding ${stockData.symbol}...`)

      // Insert or get stock
      let { data: stock, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', stockData.symbol)
        .eq('exchange', stockData.exchange)
        .single()

      if (stockError || !stock) {
        const { data: newStock, error: createStockError } = await supabase
          .from('stocks')
          .insert({
            symbol: stockData.symbol,
            name: stockData.name,
            company_name: stockData.name,
            exchange: stockData.exchange,
            currency: stockData.currency,
            asset_type: 'STOCK',
            current_price: stockData.cost_basis,
          })
          .select()
          .single()

        if (createStockError) {
          console.error(
            `❌ Error creating stock ${stockData.symbol}:`,
            createStockError
          )
          continue
        }
        stock = newStock
      }

      // Add holding
      const { error: holdingError } = await supabase.from('holdings').insert({
        user_id: user.id,
        account_id: account.id,
        stock_id: stock.id,
        quantity: stockData.quantity,
        cost_basis: stockData.cost_basis,
        average_cost: stockData.cost_basis,
        current_price: stockData.cost_basis,
        is_active: true,
      })

      if (holdingError) {
        console.error(
          `❌ Error creating holding for ${stockData.symbol}:`,
          holdingError
        )
      } else {
        console.log(`✅ Holding created for ${stockData.symbol}`)
      }
    }

    console.log('\n🎉 Test portfolio setup complete!')
    console.log(
      'You can now navigate to /investments/stocks and see your holdings'
    )
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createTestPortfolio().catch(console.error)
