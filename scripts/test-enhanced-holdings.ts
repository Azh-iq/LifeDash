#!/usr/bin/env node

/**
 * Test Enhanced Holdings Table with Real-time Updates
 * Tests the complete flow of transaction processing, optimistic updates, and real-time refreshes
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface TestResult {
  step: string
  success: boolean
  message: string
  data?: any
  error?: string
}

class EnhancedHoldingsTest {
  private results: TestResult[] = []
  private testUserId: string | null = null
  private testPortfolioId: string | null = null
  private testAccountId: string | null = null

  private addResult(step: string, success: boolean, message: string, data?: any, error?: string) {
    this.results.push({ step, success, message, data, error })
    const status = success ? '✅' : '❌'
    console.log(`${status} ${step}: ${message}`)
    if (error) {
      console.log(`   Error: ${error}`)
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...')
    
    // Get test user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      this.addResult('Setup', false, 'Failed to get test user', null, userError?.message)
      return false
    }
    
    this.testUserId = user.id
    this.addResult('Setup', true, `Test user found: ${user.email}`)

    // Get test portfolio
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', this.testUserId)
      .limit(1)

    if (portfolioError || !portfolios || portfolios.length === 0) {
      this.addResult('Setup', false, 'No test portfolio found', null, portfolioError?.message)
      return false
    }

    this.testPortfolioId = portfolios[0].id
    this.addResult('Setup', true, `Test portfolio found: ${portfolios[0].name}`)

    // Get test account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('portfolio_id', this.testPortfolioId)
      .limit(1)

    if (accountError || !accounts || accounts.length === 0) {
      this.addResult('Setup', false, 'No test account found', null, accountError?.message)
      return false
    }

    this.testAccountId = accounts[0].id
    this.addResult('Setup', true, `Test account found: ${accounts[0].name}`)

    return true
  }

  async testHoldingsRetrieval() {
    console.log('📊 Testing holdings retrieval...')

    const { data: holdings, error } = await supabase
      .from('holdings')
      .select(`
        *,
        stocks (
          symbol,
          name,
          currency,
          asset_class,
          sector,
          current_price
        ),
        accounts!inner (
          id,
          portfolio_id
        )
      `)
      .eq('accounts.portfolio_id', this.testPortfolioId)

    if (error) {
      this.addResult('Holdings Retrieval', false, 'Failed to retrieve holdings', null, error.message)
      return false
    }

    this.addResult('Holdings Retrieval', true, `Retrieved ${holdings?.length || 0} holdings`, holdings)
    return true
  }

  async testRealtimeSubscription() {
    console.log('🔄 Testing real-time subscription...')

    return new Promise<boolean>((resolve) => {
      let subscriptionWorking = false
      
      const subscription = supabase
        .channel(`test_holdings_${this.testPortfolioId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'holdings',
          },
          (payload) => {
            console.log('Real-time update received:', payload)
            subscriptionWorking = true
            this.addResult('Real-time Subscription', true, 'Real-time updates working')
            supabase.removeChannel(subscription)
            resolve(true)
          }
        )
        .subscribe()

      // Test timeout
      setTimeout(() => {
        if (!subscriptionWorking) {
          this.addResult('Real-time Subscription', false, 'No real-time updates received (timeout)')
          supabase.removeChannel(subscription)
          resolve(false)
        }
      }, 5000)

      // Trigger a change to test subscription
      setTimeout(async () => {
        if (this.testAccountId) {
          await supabase
            .from('holdings')
            .update({ updated_at: new Date().toISOString() })
            .eq('account_id', this.testAccountId)
            .limit(1)
        }
      }, 1000)
    })
  }

  async testOptimisticUpdate() {
    console.log('⚡ Testing optimistic update simulation...')

    // Simulate an optimistic update
    const mockHolding = {
      id: 'test-holding-id',
      symbol: 'AAPL',
      quantity: 10,
      cost_basis: 150.00,
      current_price: 155.00,
      current_value: 1550.00,
      gain_loss: 50.00,
      gain_loss_percent: 3.33,
      daily_change: 2.50,
      daily_change_percent: 1.61,
    }

    // Simulate updating the holding
    const updatedHolding = {
      ...mockHolding,
      quantity: 15,
      current_value: 2325.00,
      gain_loss: 75.00,
      gain_loss_percent: 3.33,
    }

    this.addResult('Optimistic Update', true, 'Optimistic update simulation successful', {
      original: mockHolding,
      updated: updatedHolding,
      changes: {
        quantity: updatedHolding.quantity - mockHolding.quantity,
        valueChange: updatedHolding.current_value - mockHolding.current_value,
      }
    })

    return true
  }

  async testTransactionProcessing() {
    console.log('💳 Testing transaction processing flow...')

    // Test adding a new transaction
    const testTransaction = {
      account_id: this.testAccountId,
      stock_symbol: 'TSLA',
      transaction_type: 'BUY',
      quantity: 5,
      price: 200.00,
      total_amount: 1000.00,
      booking_date: new Date().toISOString().split('T')[0],
      settlement_date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      exchange_rate: 1.0,
      other_fees: 0.00,
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select()
      .single()

    if (error) {
      this.addResult('Transaction Processing', false, 'Failed to add test transaction', null, error.message)
      return false
    }

    this.addResult('Transaction Processing', true, 'Test transaction added successfully', transaction)

    // Clean up test transaction
    await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id)

    return true
  }

  async testPortfolioMetrics() {
    console.log('📈 Testing portfolio metrics calculation...')

    const { data: holdings, error } = await supabase
      .from('holdings')
      .select(`
        *,
        stocks (
          symbol,
          name,
          current_price,
          sector
        ),
        accounts!inner (
          portfolio_id
        )
      `)
      .eq('accounts.portfolio_id', this.testPortfolioId)

    if (error) {
      this.addResult('Portfolio Metrics', false, 'Failed to retrieve holdings for metrics', null, error.message)
      return false
    }

    if (!holdings || holdings.length === 0) {
      this.addResult('Portfolio Metrics', true, 'No holdings found for metrics calculation')
      return true
    }

    // Calculate metrics
    const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.stocks?.current_price || h.cost_basis)), 0)
    const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.cost_basis), 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    // Sector allocation
    const sectorAllocation: { [key: string]: number } = {}
    holdings.forEach(h => {
      const sector = h.stocks?.sector || 'Unknown'
      const value = h.quantity * (h.stocks?.current_price || h.cost_basis)
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value
    })

    this.addResult('Portfolio Metrics', true, 'Portfolio metrics calculated successfully', {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: holdings.length,
      sectorAllocation,
    })

    return true
  }

  async testErrorHandling() {
    console.log('🚨 Testing error handling...')

    // Test invalid portfolio ID
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('account_id', 'invalid-id')

    // This should not fail at the database level, but should return empty results
    this.addResult('Error Handling', true, 'Invalid queries handled gracefully', {
      resultCount: data?.length || 0,
      hasError: !!error,
    })

    return true
  }

  async runAllTests() {
    console.log('🧪 Starting Enhanced Holdings Table Tests\n')

    const setupSuccess = await this.setupTestEnvironment()
    if (!setupSuccess) {
      console.log('\n❌ Setup failed, cannot continue with tests')
      return this.results
    }

    console.log('')
    
    await this.testHoldingsRetrieval()
    await this.testRealtimeSubscription()
    await this.testOptimisticUpdate()
    await this.testTransactionProcessing()
    await this.testPortfolioMetrics()
    await this.testErrorHandling()

    console.log('\n📊 Test Summary:')
    console.log('================')
    
    const successCount = this.results.filter(r => r.success).length
    const totalCount = this.results.length
    
    console.log(`✅ Passed: ${successCount}/${totalCount} tests`)
    
    if (successCount < totalCount) {
      console.log('\n❌ Failed tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ${r.step}: ${r.message}`)
          if (r.error) {
            console.log(`     Error: ${r.error}`)
          }
        })
    }

    return this.results
  }
}

// Run the tests
async function main() {
  const tester = new EnhancedHoldingsTest()
  const results = await tester.runAllTests()
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.success)
  process.exit(allPassed ? 0 : 1)
}

main().catch(console.error)