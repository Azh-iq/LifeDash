// Add 20 realistic test transactions for the persistent test user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

// Realistic test transactions with variety
const testTransactions = [
  // Recent transactions (last 30 days)
  {
    symbol: 'AAPL',
    quantity: 50,
    price: 193.42,
    type: 'BUY',
    date: '2024-12-15',
    fees: 12.50,
    notes: 'Kjøp på teknologi-nedgang'
  },
  {
    symbol: 'MSFT',
    quantity: 30,
    price: 415.26,
    type: 'BUY',
    date: '2024-12-10',
    fees: 15.75,
    notes: 'Posisjonering før kvartalsrapport'
  },
  {
    symbol: 'GOOGL',
    quantity: 25,
    price: 172.85,
    type: 'BUY',
    date: '2024-12-08',
    fees: 8.90,
    notes: 'AI-tema investering'
  },
  {
    symbol: 'EQNR.OL',
    quantity: 100,
    price: 298.50,
    type: 'BUY',
    date: '2024-12-05',
    fees: 25.00,
    notes: 'Norsk olje-eksponering'
  },
  {
    symbol: 'TSLA',
    quantity: 15,
    price: 352.56,
    type: 'SELL',
    date: '2024-12-02',
    fees: 9.75,
    notes: 'Profitt-taking etter oppgang'
  },
  {
    symbol: 'DNB.OL',
    quantity: 75,
    price: 213.40,
    type: 'BUY',
    date: '2024-11-28',
    fees: 18.50,
    notes: 'Norsk bank-eksponering'
  },
  {
    symbol: 'NVDA',
    quantity: 20,
    price: 486.75,
    type: 'BUY',
    date: '2024-11-25',
    fees: 22.30,
    notes: 'AI-chip leder'
  },
  
  // Older transactions (2-3 months ago)
  {
    symbol: 'META',
    quantity: 40,
    price: 331.20,
    type: 'BUY',
    date: '2024-11-15',
    fees: 16.80,
    notes: 'Sosiale medier comeback'
  },
  {
    symbol: 'TEL.OL',
    quantity: 200,
    price: 124.80,
    type: 'BUY',
    date: '2024-11-10',
    notes: 'Telekom dividende-spill'
  },
  {
    symbol: 'AAPL',
    quantity: 25,
    price: 180.15,
    type: 'SELL',
    date: '2024-11-05',
    fees: 7.50,
    notes: 'Delvis profitt-taking'
  },
  {
    symbol: 'AMZN',
    quantity: 35,
    price: 142.80,
    type: 'BUY',
    date: '2024-10-28',
    fees: 14.20,
    notes: 'Cloud-vekst investering'
  },
  {
    symbol: 'MOWI.OL',
    quantity: 150,
    price: 195.60,
    type: 'BUY',
    date: '2024-10-20',
    fees: 28.50,
    notes: 'Lakseoppdrett eksponering'
  },
  {
    symbol: 'V',
    quantity: 60,
    price: 278.90,
    type: 'BUY',
    date: '2024-10-15',
    fees: 19.80,
    notes: 'Betalingssystem-leder'
  },
  {
    symbol: 'JNJ',
    quantity: 80,
    price: 161.30,
    type: 'BUY',
    date: '2024-10-08',
    fees: 21.40,
    notes: 'Defensiv helsevern-posisjon'
  },
  
  // Older transactions (4-6 months ago)
  {
    symbol: 'YAR.OL',
    quantity: 120,
    price: 342.80,
    type: 'BUY',
    date: '2024-09-25',
    fees: 32.60,
    notes: 'Gjødsel og kjemikalier'
  },
  {
    symbol: 'TSLA',
    quantity: 25,
    price: 248.42,
    type: 'BUY',
    date: '2024-09-18',
    fees: 11.25,
    notes: 'EV-leder på lavt nivå'
  },
  {
    symbol: 'WMT',
    quantity: 70,
    price: 159.80,
    type: 'BUY',
    date: '2024-09-10',
    fees: 16.90,
    notes: 'Defensiv retail-posisjon'
  },
  {
    symbol: 'HD',
    quantity: 45,
    price: 412.50,
    type: 'BUY',
    date: '2024-08-28',
    fees: 18.75,
    notes: 'Hjemmeforbedrings-eksponering'
  },
  {
    symbol: 'SALM.OL',
    quantity: 90,
    price: 278.20,
    type: 'BUY',
    date: '2024-08-15',
    fees: 24.80,
    notes: 'Alternativ lakseoppdrett'
  },
  {
    symbol: 'PG',
    quantity: 55,
    price: 168.90,
    type: 'BUY',
    date: '2024-08-08',
    fees: 14.50,
    notes: 'Stabil forbrukervaregigant'
  }
]

async function addRealisticTestTransactions() {
  console.log('🔍 Adding 20 realistic test transactions...')

  try {
    // Sign in as test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    })

    if (signInError || !signInData.user) {
      console.error('❌ Could not sign in as test user:', signInError?.message)
      return
    }

    console.log('✅ Signed in as test user:', signInData.user.email)

    // Get user's portfolio and account, create if doesn't exist
    let { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', signInData.user.id)

    let portfolio = portfolios && portfolios.length > 0 ? portfolios[0] : null

    if (!portfolio) {
      console.log('🏗️  Creating portfolio for test user...')
      const { data: newPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          user_id: signInData.user.id,
          name: 'Test Portefølje - PERSISTENT',
          description: 'Persistent test portfolio with realistic data',
          is_default: true,
          currency: 'NOK',
        })
        .select()
        .single()

      if (portfolioError) {
        console.error('❌ Error creating portfolio:', portfolioError.message)
        return
      }
      portfolio = newPortfolio
    } else {
      console.log('✅ Found existing portfolio:', portfolio.name)
    }

    let { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('portfolio_id', portfolio.id)

    let account = accounts && accounts.length > 0 ? accounts[0] : null

    if (!account) {
      console.log('🏗️  Creating account for test user...')
      
      // First ensure we have a platform
      let { data: platform } = await supabase
        .from('platforms')
        .select('*')
        .eq('name', 'Manual Entry')
        .single()

      if (!platform) {
        console.log('🏗️  Creating manual platform...')
        const { data: newPlatform, error: platformError } = await supabase
          .from('platforms')
          .insert({
            name: 'Manual Entry',
            display_name: 'Manuell Inntasting',
            type: 'MANUAL',
            default_currency: 'NOK',
          })
          .select()
          .single()

        if (platformError) {
          console.error('❌ Error creating platform:', platformError.message)
          return
        }
        platform = newPlatform
      }

      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          user_id: signInData.user.id,
          portfolio_id: portfolio.id,
          platform_id: platform.id,
          name: 'Test Konto - Realistic Data',
          account_type: 'TAXABLE',
          currency: 'NOK',
          is_active: true,
        })
        .select()
        .single()

      if (accountError) {
        console.error('❌ Error creating account:', accountError.message)
        return
      }
      account = newAccount
    } else {
      console.log('✅ Found existing account:', account.name)
    }

    console.log('📊 Using portfolio:', portfolio.name)
    console.log('🏦 Using account:', account.name)

    // Clear existing transactions to avoid duplicates
    console.log('🧹 Clearing existing transactions...')
    await supabase.from('transactions').delete().eq('account_id', account.id)

    let successCount = 0
    let stocksCreated = 0

    for (const tx of testTransactions) {
      console.log(`\n📈 Processing transaction: ${tx.type} ${tx.quantity} ${tx.symbol} @ ${tx.price}`)

      // Check if stock exists in registry
      let { data: stockData } = await supabase
        .from('stock_registry')
        .select('*')
        .eq('symbol', tx.symbol)
        .single()

      if (!stockData) {
        console.log(`🏗️  Creating stock registry entry for ${tx.symbol}`)
        // Create stock registry entry
        const { data: newStock, error: stockError } = await supabase
          .from('stock_registry')
          .insert({
            symbol: tx.symbol,
            name: tx.symbol.includes('.OL') ? `${tx.symbol.split('.')[0]} ASA` : `${tx.symbol} Inc.`,
            company_name: tx.symbol.includes('.OL') ? `${tx.symbol.split('.')[0]} ASA` : `${tx.symbol} Inc.`,
            exchange: tx.symbol.includes('.OL') ? 'OSLO' : 'NASDAQ',
            currency: tx.symbol.includes('.OL') ? 'NOK' : 'USD',
            sector: 'Technology',
            industry: 'Software',
            country: tx.symbol.includes('.OL') ? 'NO' : 'US',
            is_popular: true,
          })
          .select()
          .single()

        if (stockError) {
          console.error(`❌ Error creating stock registry for ${tx.symbol}:`, stockError.message)
          continue
        }
        stockData = newStock
        stocksCreated++
      }

      // Check if stock exists in stocks table
      let { data: stock } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', tx.symbol)
        .single()

      if (!stock) {
        console.log(`🏗️  Creating stock entry for ${tx.symbol}`)
        // Create stock entry
        const { data: newStock, error: stockError } = await supabase
          .from('stocks')
          .insert({
            symbol: tx.symbol,
            name: stockData.name,
            company_name: stockData.company_name,
            exchange: stockData.exchange,
            currency: stockData.currency,
            sector: stockData.sector,
            industry: stockData.industry,
            asset_class: 'STOCK',
            country_code: stockData.country === 'NO' ? 'NO' : 'US',
          })
          .select()
          .single()

        if (stockError) {
          console.error(`❌ Error creating stock for ${tx.symbol}:`, stockError.message)
          continue
        }
        stock = newStock
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: account.id,
          user_id: signInData.user.id,
          stock_id: stock.id,
          transaction_type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          commission: tx.fees || 0,
          date: tx.date,
          notes: tx.notes || '',
          currency: stock.currency,
          total_amount: tx.quantity * tx.price,
        })

      if (transactionError) {
        console.error(`❌ Error creating transaction for ${tx.symbol}:`, transactionError.message)
        continue
      }

      console.log(`✅ Transaction added: ${tx.type} ${tx.quantity} ${tx.symbol} @ ${tx.price}`)
      successCount++
    }

    console.log(`\n🎉 Successfully added ${successCount} out of ${testTransactions.length} transactions`)
    console.log(`🏗️  Created ${stocksCreated} new stock entries`)
    console.log(`📊 Total portfolio value: ${testTransactions.reduce((sum, tx) => sum + (tx.quantity * tx.price), 0).toLocaleString('nb-NO')} mixed currencies`)
    
    // Log summary by stock
    const stockSummary = testTransactions.reduce((acc, tx) => {
      if (!acc[tx.symbol]) {
        acc[tx.symbol] = { buy: 0, sell: 0, netQuantity: 0, totalValue: 0 }
      }
      if (tx.type === 'BUY') {
        acc[tx.symbol].buy += tx.quantity
        acc[tx.symbol].netQuantity += tx.quantity
      } else {
        acc[tx.symbol].sell += tx.quantity
        acc[tx.symbol].netQuantity -= tx.quantity
      }
      acc[tx.symbol].totalValue += tx.quantity * tx.price
      return acc
    }, {} as any)

    console.log('\n📈 Portfolio Summary:')
    Object.entries(stockSummary).forEach(([symbol, data]: [string, any]) => {
      console.log(`${symbol}: ${data.netQuantity} shares (${data.buy} bought, ${data.sell} sold) - Value: ${data.totalValue.toLocaleString('nb-NO')}`)
    })

  } catch (error) {
    console.error('❌ Error adding test transactions:', error)
    throw error
  }
}

// Run the script
if (require.main === module) {
  addRealisticTestTransactions()
    .then(() => {
      console.log('\n🎉 Realistic test transactions added successfully!')
      console.log('🔐 Test user: test@test.no / 123456')
      console.log('📊 Login to see your portfolio with realistic data')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed to add test transactions:', error)
      process.exit(1)
    })
}

export { addRealisticTestTransactions }