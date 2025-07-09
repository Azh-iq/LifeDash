'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  fetchCompanyProfile, 
  fetchBasicFinancials, 
  fetchCompanyNews,
  type CompanyProfile,
  type BasicFinancials,
  type CompanyNews 
} from '@/lib/utils/finnhub-api'

export interface StockTransaction {
  id: string
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'MERGER' | 'SPINOFF' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'FEE' | 'INTEREST' | 'TAX'
  date: string
  quantity: number
  price: number | null
  total_amount: number
  commission: number
  sec_fees: number
  other_fees: number
  total_fees: number
  currency: string
  notes?: string
  account_name?: string
  platform_name?: string
  created_at: string
}

export interface StockHolding {
  id: string
  account_id: string
  quantity: number
  cost_basis: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  currency: string
  account_name: string
  platform_name?: string
  is_active: boolean
}

export interface StockDetailData {
  symbol: string
  stock_name: string
  currency: string
  sector?: string
  exchange?: string
  holdings: StockHolding[]
  transactions: StockTransaction[]
  company_profile?: CompanyProfile
  basic_financials?: BasicFinancials
  company_news?: CompanyNews[]
}

export interface StockDetailResult {
  success: boolean
  data?: StockDetailData
  error?: string
}

/**
 * Fetch comprehensive stock detail data including holdings, transactions, and company data
 */
export async function getStockDetail(
  stockSymbol: string,
  portfolioId?: string
): Promise<StockDetailResult> {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const userId = session.user.id

    // First, get basic stock information
    console.log('Looking for stock with symbol:', stockSymbol)
    
    // Try to find the stock - first exact match, then try without exchange suffix
    let { data: stockData, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', stockSymbol)
      .single()

    // If not found and symbol doesn't have exchange suffix, try adding common exchanges
    if (stockError && !stockSymbol.includes('.')) {
      console.log('Trying to find stock with exchange suffixes...')
      
      // Try NASDAQ first (most common for US stocks)
      const { data: nasdaqStock } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', stockSymbol)
        .eq('exchange', 'NASDAQ')
        .single()
      
      if (nasdaqStock) {
        stockData = nasdaqStock
        stockError = null
      } else {
        // Try NYSE
        const { data: nyseStock } = await supabase
          .from('stocks')
          .select('*')
          .eq('symbol', stockSymbol)
          .eq('exchange', 'NYSE')
          .single()
        
        if (nyseStock) {
          stockData = nyseStock
          stockError = null
        }
      }
    }

    console.log('Stock data result:', stockData, 'Error:', stockError)

    if (stockError) {
      return {
        success: false,
        error: `Stock not found: ${stockSymbol}`
      }
    }

    // Get holdings for this stock
    const holdingsQuery = supabase
      .from('holdings')
      .select(`
        *,
        accounts!inner (
          id,
          name,
          portfolio_id,
          platforms (
            name,
            display_name
          )
        )
      `)
      .eq('stock_id', stockData.id)
      .eq('user_id', userId)
      .eq('is_active', true)

    // If portfolio_id is provided, filter by portfolio
    if (portfolioId) {
      holdingsQuery.eq('accounts.portfolio_id', portfolioId)
    }

    const { data: holdingsData, error: holdingsError } = await holdingsQuery

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError)
      return {
        success: false,
        error: 'Failed to fetch holdings'
      }
    }

    // Get transactions for this stock
    const transactionsQuery = supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner (
          id,
          name,
          portfolio_id,
          platforms (
            name,
            display_name
          )
        )
      `)
      .eq('stock_id', stockData.id)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    // If portfolio_id is provided, filter by portfolio
    if (portfolioId) {
      transactionsQuery.eq('accounts.portfolio_id', portfolioId)
    }

    const { data: transactionsData, error: transactionsError } = await transactionsQuery

    console.log('Transactions data result:', transactionsData, 'Error:', transactionsError)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return {
        success: false,
        error: 'Failed to fetch transactions'
      }
    }

    // Format holdings data
    const formattedHoldings: StockHolding[] = (holdingsData || []).map(holding => ({
      id: holding.id,
      account_id: holding.account_id,
      quantity: holding.quantity,
      cost_basis: holding.cost_basis,
      current_price: holding.current_price || holding.cost_basis,
      market_value: holding.market_value || (holding.quantity * (holding.current_price || holding.cost_basis)),
      unrealized_pnl: holding.unrealized_pnl || 0,
      unrealized_pnl_percent: holding.unrealized_pnl_percent || 0,
      currency: holding.currency,
      account_name: holding.accounts?.name || 'Unknown Account',
      platform_name: holding.accounts?.platforms?.display_name || holding.accounts?.platforms?.name || 'Manual',
      is_active: holding.is_active
    }))

    // Format transactions data
    const formattedTransactions: StockTransaction[] = (transactionsData || []).map(transaction => ({
      id: transaction.id,
      transaction_type: transaction.transaction_type,
      date: transaction.date,
      quantity: transaction.quantity,
      price: transaction.price,
      total_amount: transaction.total_amount,
      commission: transaction.commission || 0,
      sec_fees: transaction.sec_fees || 0,
      other_fees: transaction.other_fees || 0,
      total_fees: transaction.total_fees || 0,
      currency: transaction.currency,
      notes: transaction.notes,
      account_name: transaction.accounts?.name || 'Unknown Account',
      platform_name: transaction.accounts?.platforms?.display_name || transaction.accounts?.platforms?.name || 'Manual',
      created_at: transaction.created_at
    }))

    // Fetch company data from Finnhub in parallel
    const [companyProfileResult, basicFinancialsResult, companyNewsResult] = await Promise.allSettled([
      fetchCompanyProfile(stockSymbol),
      fetchBasicFinancials(stockSymbol),
      fetchCompanyNews(stockSymbol, 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        new Date().toISOString().split('T')[0] // today
      )
    ])

    // Extract company data (handle failures gracefully)
    const companyProfile = companyProfileResult.status === 'fulfilled' && companyProfileResult.value.success
      ? companyProfileResult.value.data
      : undefined

    const basicFinancials = basicFinancialsResult.status === 'fulfilled' && basicFinancialsResult.value.success
      ? basicFinancialsResult.value.data
      : undefined

    const companyNews = companyNewsResult.status === 'fulfilled' && companyNewsResult.value.success
      ? companyNewsResult.value.data
      : undefined

    const stockDetailData: StockDetailData = {
      symbol: stockData.symbol,
      stock_name: stockData.name || stockData.company_name || stockSymbol,
      currency: stockData.currency,
      sector: stockData.sector || companyProfile?.finnhubIndustry,
      exchange: stockData.exchange || companyProfile?.exchange,
      holdings: formattedHoldings,
      transactions: formattedTransactions,
      company_profile: companyProfile || undefined,
      basic_financials: basicFinancials || undefined,
      company_news: companyNews || undefined
    }

    return {
      success: true,
      data: stockDetailData
    }

  } catch (error) {
    console.error('Error fetching stock detail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get historical price data for chart (placeholder for future implementation)
 */
export async function getStockHistoricalData(
  stockSymbol: string,
  timeRange: '4h' | 'D' | 'W' | 'M' | 'Y' = 'D'
): Promise<{
  success: boolean
  data?: Array<{
    timestamp: string
    price: number
    volume?: number
  }>
  error?: string
}> {
  // TODO: Implement historical data fetching from Finnhub
  // For now, return placeholder data
  const now = new Date()
  const data = []
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({
      timestamp: timestamp.toISOString(),
      price: 100 + Math.random() * 50, // Placeholder price
      volume: Math.floor(Math.random() * 1000000)
    })
  }

  return {
    success: true,
    data
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      return {
        success: false,
        error: `Failed to delete transaction: ${deleteError.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Error deleting transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}