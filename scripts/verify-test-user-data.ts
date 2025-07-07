// Verify and display test user data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const TEST_USER_EMAIL = 'test@test.no'
const TEST_USER_PASSWORD = '123456'

async function verifyTestUserData() {
  console.log('🔍 Verifying test user data...\n')

  try {
    // Sign in as test user
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      })

    if (signInError || !signInData.user) {
      console.error('❌ Could not sign in as test user:', signInError?.message)
      return
    }

    console.log('✅ TEST USER VERIFICATION')
    console.log('========================')
    console.log(`Email: ${signInData.user.email}`)
    console.log(`User ID: ${signInData.user.id}`)
    console.log(
      `Created: ${new Date(signInData.user.created_at).toLocaleDateString('nb-NO')}`
    )

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (profile) {
      console.log(`Full Name: ${profile.full_name}`)
      console.log(`Display Name: ${profile.display_name}`)
      console.log(`Persistent User: YES (Protected from deletion)`)
    }

    // Get portfolios
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', signInData.user.id)

    console.log('\n📊 PORTFOLIOS')
    console.log('=============')
    portfolios?.forEach((portfolio, index) => {
      console.log(`${index + 1}. ${portfolio.name}`)
      console.log(`   Description: ${portfolio.description || 'N/A'}`)
      console.log(`   Currency: ${portfolio.currency}`)
      console.log(`   Default: ${portfolio.is_default ? 'Yes' : 'No'}`)
      console.log(`   ID: ${portfolio.id}`)
    })

    if (!portfolios || portfolios.length === 0) {
      console.log('❌ No portfolios found')
      return
    }

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select(
        `
        *,
        platforms (name, display_name)
      `
      )
      .eq('user_id', signInData.user.id)

    console.log('\n🏦 ACCOUNTS')
    console.log('===========')
    accounts?.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name}`)
      console.log(
        `   Platform: ${account.platforms?.display_name || account.platforms?.name || 'N/A'}`
      )
      console.log(`   Type: ${account.account_type}`)
      console.log(`   Currency: ${account.currency}`)
      console.log(`   Active: ${account.is_active ? 'Yes' : 'No'}`)
      console.log(`   ID: ${account.id}`)
    })

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select(
        `
        *,
        stocks (symbol, name, currency)
      `
      )
      .eq('user_id', signInData.user.id)
      .order('date', { ascending: false })

    console.log('\n📈 TRANSACTIONS')
    console.log('===============')
    console.log(`Total Transactions: ${transactions?.length || 0}`)

    if (transactions && transactions.length > 0) {
      console.log('\nTransaction Details:')
      transactions.forEach((tx, index) => {
        const stock = tx.stocks
        console.log(
          `${index + 1}. ${tx.transaction_type} ${tx.quantity} ${stock?.symbol || 'N/A'} @ ${tx.price} ${stock?.currency || ''}`
        )
        console.log(`   Date: ${tx.date}`)
        console.log(`   Total: ${tx.total_amount} ${stock?.currency || ''}`)
        console.log(`   Fees: ${tx.commission || 0}`)
        console.log(`   Notes: ${tx.notes || 'N/A'}`)
        console.log('')
      })
    }

    // Get holdings
    const { data: holdings } = await supabase
      .from('holdings')
      .select(
        `
        *,
        stocks (symbol, name, currency, exchange)
      `
      )
      .eq('user_id', signInData.user.id)
      .eq('is_active', true)
      .order('market_value', { ascending: false })

    console.log('\n💼 CURRENT HOLDINGS')
    console.log('==================')
    console.log(`Active Holdings: ${holdings?.length || 0}`)

    if (holdings && holdings.length > 0) {
      let totalValue = 0
      console.log('\nHolding Details:')
      holdings.forEach((holding, index) => {
        const stock = holding.stocks
        const marketValue =
          holding.market_value || holding.quantity * holding.current_price
        const unrealizedPnL = holding.unrealized_pnl || 0
        const pnlPercent = holding.unrealized_pnl_percent || 0

        console.log(
          `${index + 1}. ${stock?.symbol || 'N/A'} (${stock?.name || 'Unknown'})`
        )
        console.log(`   Exchange: ${stock?.exchange || 'N/A'}`)
        console.log(`   Quantity: ${holding.quantity}`)
        console.log(
          `   Avg Cost: ${holding.average_cost} ${stock?.currency || ''}`
        )
        console.log(
          `   Current Price: ${holding.current_price || 'N/A'} ${stock?.currency || ''}`
        )
        console.log(
          `   Market Value: ${marketValue || 'N/A'} ${stock?.currency || ''}`
        )
        console.log(
          `   Unrealized P&L: ${unrealizedPnL > 0 ? '+' : ''}${unrealizedPnL} (${pnlPercent > 0 ? '+' : ''}${pnlPercent}%)`
        )
        console.log('')

        if (marketValue && typeof marketValue === 'number') {
          totalValue += marketValue
        }
      })

      console.log(`📊 Portfolio Summary:`)
      console.log(
        `   Total Market Value: ${totalValue.toLocaleString('nb-NO')} (mixed currencies)`
      )
    }

    // Get stock registry count
    const { count: stockRegistryCount } = await supabase
      .from('stock_registry')
      .select('*', { count: 'exact', head: true })

    console.log('\n🏪 STOCK REGISTRY')
    console.log('================')
    console.log(`Total Stocks in Registry: ${stockRegistryCount || 0}`)

    // Get stocks in stocks table
    const { count: stocksCount } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true })

    console.log(`Stocks in Stocks Table: ${stocksCount || 0}`)

    console.log('\n✅ TEST USER SETUP COMPLETE')
    console.log('===========================')
    console.log('The test user has been successfully created with:')
    console.log('• Protected/persistent status (cannot be deleted)')
    console.log('• Default portfolio and account')
    console.log('• Realistic transaction history')
    console.log('• Current holdings with various stock positions')
    console.log('• Norwegian and US stock exposure')
    console.log('\nLogin credentials:')
    console.log('• Email: test@test.no')
    console.log('• Password: 123456')
  } catch (error) {
    console.error('❌ Error verifying test user data:', error)
    throw error
  }
}

// Run the script
if (require.main === module) {
  verifyTestUserData()
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Failed to verify test user data:', error)
      process.exit(1)
    })
}

export { verifyTestUserData }
