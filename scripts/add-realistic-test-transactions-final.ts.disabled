// Add 20 realistic test transactions using only existing stocks in registry
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

// Realistic test transactions using only stocks that exist in registry
const testTransactions = [
  // Recent transactions (last 30 days) - using stocks from registry
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
    type: 'BUY',  // Changed to BUY to avoid selling before buying
    date: '2024-12-02',
    fees: 9.75,
    notes: 'Første Tesla-posisjon'
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
    notes: 'Øker Tesla-posisjon'
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
    symbol: 'TSLA',
    quantity: 10,
    price: 352.56,
    type: 'SELL',
    date: '2024-08-08',
    fees: 14.50,
    notes: 'Delvis profitt-taking Tesla'
  }
]

async function addRealisticTestTransactionsFinal() {
  console.log('🔍 Adding 20 realistic test transactions (using existing stocks)...')

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

    // Get user's portfolio and account
    let { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', signInData.user.id)

    let portfolio = portfolios && portfolios.length > 0 ? portfolios[0] : null

    if (!portfolio) {
      console.error('❌ No portfolio found for test user')
      return
    }

    let { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('portfolio_id', portfolio.id)

    let account = accounts && accounts.length > 0 ? accounts[0] : null

    if (!account) {
      console.error('❌ No account found for test user')
      return
    }

    console.log('📊 Using portfolio:', portfolio.name)
    console.log('🏦 Using account:', account.name)

    // Clear existing transactions to avoid duplicates
    console.log('🧹 Clearing existing transactions...')
    await supabase.from('transactions').delete().eq('account_id', account.id)

    let successCount = 0
    let skippedCount = 0

    for (const tx of testTransactions) {
      console.log(`\n📈 Processing transaction: ${tx.type} ${tx.quantity} ${tx.symbol} @ ${tx.price}`)

      // Check if stock exists in registry
      let { data: stockData } = await supabase
        .from('stock_registry')
        .select('*')
        .eq('symbol', tx.symbol)
        .single()

      if (!stockData) {
        console.log(`⚠️  Skipping ${tx.symbol} - not found in stock registry`)
        skippedCount++
        continue
      }

      // Check if stock exists in stocks table, use registry data to create if needed
      let { data: stock } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', tx.symbol)
        .single()

      if (!stock) {
        console.log(`⚠️  Stock ${tx.symbol} not found in stocks table, but exists in registry`)
        console.log(`   Using stock registry data for transaction...`)
        
        // For the transaction, we'll reference by creating a temporary stock entry or using registry
        // Let's skip stocks that don't exist in the stocks table to avoid RLS issues
        skippedCount++
        continue
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
    console.log(`⚠️  Skipped ${skippedCount} transactions (stocks not in stocks table)`)
    
    // Calculate total values by currency
    const totalValueUSD = testTransactions
      .filter(tx => !tx.symbol.includes('.OL') && successCount > 0)
      .reduce((sum, tx) => sum + (tx.quantity * tx.price), 0)
    
    const totalValueNOK = testTransactions
      .filter(tx => tx.symbol.includes('.OL') && successCount > 0)
      .reduce((sum, tx) => sum + (tx.quantity * tx.price), 0)

    console.log(`💰 Portfolio value: ${totalValueUSD.toLocaleString('en-US')} USD + ${totalValueNOK.toLocaleString('nb-NO')} NOK`)
    
    // Get current holdings count
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', signInData.user.id)
      .eq('is_active', true)

    console.log(`📊 Active holdings: ${holdings?.length || 0} stocks`)

  } catch (error) {
    console.error('❌ Error adding test transactions:', error)
    throw error
  }
}

// Run the script
if (require.main === module) {
  addRealisticTestTransactionsFinal()
    .then(() => {
      console.log('\n🎉 Test transactions process completed!')
      console.log('🔐 Test user: test@test.no / 123456')
      console.log('📊 Login to see your portfolio with realistic transaction data')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed to add test transactions:', error)
      process.exit(1)
    })
}

export { addRealisticTestTransactionsFinal }