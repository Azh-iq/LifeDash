// Test script to add holdings for testing real prices
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestHoldings() {
  console.log('Adding test holdings...')

  // Get a user (or create test user)
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session) {
    console.log('Creating test user session...')
    const { error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpass123',
    })

    if (signUpError) {
      console.error('Error creating user:', signUpError)
      return
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error('No user found')
    return
  }

  // Create a test portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .insert({
      user_id: user.id,
      name: 'Test Portfolio',
      description: 'Portfolio for testing real prices',
      type: 'INVESTMENT',
      total_value: 100000,
      total_cost: 90000,
      currency: 'NOK',
    })
    .select()
    .single()

  if (portfolioError) {
    console.error('Error creating portfolio:', portfolioError)
    return
  }

  console.log('Created portfolio:', portfolio.id)

  // Create a test account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      portfolio_id: portfolio.id,
      name: 'Test Nordnet Account',
      account_type: 'TAXABLE',
      currency: 'NOK',
      is_active: true,
    })
    .select()
    .single()

  if (accountError) {
    console.error('Error creating account:', accountError)
    return
  }

  console.log('Created account:', account.id)

  // Add test stocks
  const testStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      currency: 'USD',
    },
    {
      symbol: 'EQNR.OL',
      name: 'Equinor ASA',
      exchange: 'OSLO',
      currency: 'NOK',
    },
    {
      symbol: 'DNB.OL',
      name: 'DNB Bank ASA',
      exchange: 'OSLO',
      currency: 'NOK',
    },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', currency: 'USD' },
  ]

  for (const stockData of testStocks) {
    // Insert stock
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .insert({
        symbol: stockData.symbol,
        name: stockData.name,
        company_name: stockData.name,
        exchange: stockData.exchange,
        currency: stockData.currency,
        asset_type: 'STOCK',
        current_price: 100, // Default price
      })
      .select()
      .single()

    if (stockError) {
      console.error('Error creating stock:', stockError)
      continue
    }

    // Add holding
    const { error: holdingError } = await supabase.from('holdings').insert({
      user_id: user.id,
      account_id: account.id,
      stock_id: stock.id,
      quantity: Math.floor(Math.random() * 100) + 10,
      cost_basis: Math.random() * 200 + 50,
      average_cost: Math.random() * 200 + 50,
      current_price: Math.random() * 200 + 50,
      is_active: true,
    })

    if (holdingError) {
      console.error('Error creating holding:', holdingError)
    } else {
      console.log('Created holding for:', stockData.symbol)
    }
  }

  console.log('Test holdings added successfully!')
}

addTestHoldings().catch(console.error)
