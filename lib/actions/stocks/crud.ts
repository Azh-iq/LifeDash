'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database, Tables } from '@/lib/types/database.types'

// Type definitions for better IntelliSense
type HoldingWithStock = Tables<'holdings'> & {
  stock: Tables<'stocks'>
  account: Tables<'accounts'>
}

type TransactionWithStock = Tables<'transactions'> & {
  stock?: Tables<'stocks'>
  account: Tables<'accounts'>
}

type StockWithPrice = Tables<'stocks'> & {
  current_price?: number
}

// Validation schemas
const stockIdsSchema = z.array(z.string().uuid('Invalid stock ID'))
const holdingUpdateSchema = z.object({
  holdingId: z.string().uuid('Invalid holding ID'),
  currentPrice: z.number().positive('Price must be positive'),
})

export interface StocksResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Get all holdings for a user
 */
export async function getHoldings(userId: string): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if requested userId matches authenticated user
    if (user.id !== userId) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Fetch holdings with related stock and account data
    const { data: holdings, error: fetchError } = await supabase
      .from('holdings')
      .select(
        `
        *,
        stock:stocks(
          id,
          symbol,
          name,
          exchange,
          currency,
          current_price,
          sector,
          asset_class,
          company_name
        ),
        account:accounts(
          id,
          name,
          account_type,
          currency,
          portfolio_id
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('market_value', { ascending: false, nullsFirst: false })

    if (fetchError) {
      console.error('Error fetching holdings:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch holdings',
      }
    }

    // Calculate additional metrics for each holding
    const holdingsWithMetrics =
      holdings?.map(holding => {
        const currentPrice = holding.stock?.current_price || 0
        const marketValue = currentPrice * holding.quantity
        const unrealizedPnl = marketValue - holding.total_cost
        const unrealizedPnlPercent =
          holding.total_cost > 0
            ? (unrealizedPnl / holding.total_cost) * 100
            : 0

        return {
          ...holding,
          market_value: marketValue,
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_percent: unrealizedPnlPercent,
          weight_in_portfolio: 0, // Can be calculated if portfolio total is available
        }
      }) || []

    return {
      success: true,
      data: holdingsWithMetrics,
    }
  } catch (error) {
    console.error('Get holdings error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get transactions for a user, optionally filtered by stock
 */
export async function getTransactions(
  userId: string,
  stockId?: string
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if requested userId matches authenticated user
    if (user.id !== userId) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Build query
    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        stock:stocks(
          id,
          symbol,
          name,
          exchange,
          currency
        ),
        account:accounts(
          id,
          name,
          account_type,
          currency,
          portfolio_id
        )
      `
      )
      .eq('user_id', userId)

    // Add stock filter if provided
    if (stockId) {
      query = query.eq('stock_id', stockId)
    }

    const { data: transactions, error: fetchError } = await query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch transactions',
      }
    }

    return {
      success: true,
      data: transactions || [],
    }
  } catch (error) {
    console.error('Get transactions error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get current prices for multiple stocks
 */
export async function getStockPrices(
  stockIds: string[]
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Validate input
    const validatedStockIds = stockIdsSchema.parse(stockIds)

    if (validatedStockIds.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Fetch stocks with current prices
    const { data: stocks, error: fetchError } = await supabase
      .from('stocks')
      .select(
        `
        id,
        symbol,
        name,
        exchange,
        currency,
        current_price,
        last_updated
      `
      )
      .in('id', validatedStockIds)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching stock prices:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch stock prices',
      }
    }

    // Also get the latest price from stock_prices table for comparison
    const { data: latestPrices, error: pricesError } = await supabase
      .from('stock_prices')
      .select(
        `
        stock_id,
        close_price,
        date,
        created_at
      `
      )
      .in('stock_id', validatedStockIds)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (pricesError) {
      console.error('Error fetching latest prices:', pricesError)
      // Continue without latest prices data
    }

    // Merge the data
    const stocksWithPrices =
      stocks?.map(stock => {
        // Find the most recent price data
        const latestPrice = latestPrices?.find(p => p.stock_id === stock.id)

        return {
          ...stock,
          latest_price: latestPrice?.close_price || stock.current_price,
          price_date: latestPrice?.date,
          price_updated_at: latestPrice?.created_at,
        }
      }) || []

    return {
      success: true,
      data: stocksWithPrices,
    }
  } catch (error) {
    console.error('Get stock prices error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update current price for a holding
 */
export async function updateHoldingPrice(
  holdingId: string,
  currentPrice: number
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate input
    const validatedData = holdingUpdateSchema.parse({ holdingId, currentPrice })

    // Check if holding belongs to user
    const { data: holding, error: fetchError } = await supabase
      .from('holdings')
      .select('id, user_id, stock_id, quantity, total_cost')
      .eq('id', validatedData.holdingId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !holding) {
      return {
        success: false,
        error: 'Holding not found or access denied',
      }
    }

    // Calculate new market value
    const marketValue = validatedData.currentPrice * holding.quantity

    // Update holding with new price and calculated values
    const { data: updatedHolding, error: updateError } = await supabase
      .from('holdings')
      .update({
        current_price: validatedData.currentPrice,
        market_value: marketValue,
        last_price_update: new Date().toISOString(),
      })
      .eq('id', validatedData.holdingId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating holding price:', updateError)
      return {
        success: false,
        error: 'Failed to update holding price',
      }
    }

    // Also update the stock's current price if this is more recent
    const { error: stockUpdateError } = await supabase
      .from('stocks')
      .update({
        current_price: validatedData.currentPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('id', holding.stock_id)

    if (stockUpdateError) {
      console.error('Error updating stock price:', stockUpdateError)
      // Don't fail the request if stock update fails
    }

    // Revalidate related pages
    revalidatePath('/portfolios')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedHolding,
    }
  } catch (error) {
    console.error('Update holding price error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get holdings by portfolio ID
 */
export async function getHoldingsByPortfolio(
  portfolioId: string
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Fetch holdings through accounts
    const { data: holdings, error: fetchError } = await supabase
      .from('holdings')
      .select(
        `
        *,
        stock:stocks(
          id,
          symbol,
          name,
          exchange,
          currency,
          current_price,
          sector,
          asset_class,
          company_name
        ),
        account:accounts!inner(
          id,
          name,
          account_type,
          currency,
          portfolio_id
        )
      `
      )
      .eq('user_id', user.id)
      .eq('account.portfolio_id', portfolioId)
      .eq('is_active', true)
      .order('market_value', { ascending: false, nullsFirst: false })

    if (fetchError) {
      console.error('Error fetching portfolio holdings:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch portfolio holdings',
      }
    }

    return {
      success: true,
      data: holdings || [],
    }
  } catch (error) {
    console.error('Get portfolio holdings error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get stock details by symbol and exchange
 */
export async function getStockBySymbol(
  symbol: string,
  exchange?: string
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Build query
    let query = supabase
      .from('stocks')
      .select(
        `
        id,
        symbol,
        name,
        company_name,
        exchange,
        currency,
        current_price,
        sector,
        industry,
        asset_class,
        market_cap,
        is_active,
        is_tradeable,
        last_updated
      `
      )
      .eq('symbol', symbol.toUpperCase())
      .eq('is_active', true)

    // Add exchange filter if provided
    if (exchange) {
      query = query.eq('exchange', exchange.toUpperCase())
    }

    const { data: stocks, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching stock by symbol:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch stock information',
      }
    }

    if (!stocks || stocks.length === 0) {
      return {
        success: false,
        error: 'Stock not found',
      }
    }

    // Return the first match (or the one with the specified exchange)
    const stock = stocks[0]

    return {
      success: true,
      data: stock,
    }
  } catch (error) {
    console.error('Get stock by symbol error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get recent transactions for dashboard
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if requested userId matches authenticated user
    if (user.id !== userId) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Fetch recent transactions
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select(
        `
        id,
        transaction_type,
        date,
        quantity,
        price,
        total_amount,
        currency,
        stock:stocks(
          symbol,
          name
        ),
        account:accounts(
          name
        )
      `
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching recent transactions:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch recent transactions',
      }
    }

    return {
      success: true,
      data: transactions || [],
    }
  } catch (error) {
    console.error('Get recent transactions error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Search for stocks by symbol, name, or company name
 */
export async function searchStocks(
  query: string,
  limit: number = 10
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    if (!query || query.trim().length < 1) {
      return {
        success: true,
        data: [],
      }
    }

    const searchQuery = query.trim()

    // Search in stocks table with fuzzy matching
    const { data: stocks, error: searchError } = await supabase
      .from('stocks')
      .select(
        `
        id,
        symbol,
        name,
        company_name,
        exchange,
        currency,
        current_price,
        sector,
        industry,
        asset_class,
        market_cap,
        is_active,
        is_tradeable,
        last_updated
      `
      )
      .eq('is_active', true)
      .eq('is_tradeable', true)
      .or(
        `symbol.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`
      )
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (searchError) {
      console.error('Error searching stocks:', searchError)
      return {
        success: false,
        error: 'Failed to search stocks',
      }
    }

    // Also search in stock aliases for alternative symbols
    const { data: aliases, error: aliasError } = await supabase
      .from('stock_aliases')
      .select(
        `
        stock_id,
        alias_symbol,
        alias_exchange,
        source,
        stock:stocks(
          id,
          symbol,
          name,
          company_name,
          exchange,
          currency,
          current_price,
          sector,
          industry,
          asset_class,
          market_cap,
          is_active,
          is_tradeable,
          last_updated
        )
      `
      )
      .ilike('alias_symbol', `%${searchQuery}%`)
      .limit(limit)

    if (aliasError) {
      console.error('Error searching stock aliases:', aliasError)
      // Continue without aliases if this fails
    }

    // Combine results and remove duplicates
    const allResults = stocks || []
    const aliasResults = (aliases || [])
      .filter(alias => alias.stock?.is_active && alias.stock?.is_tradeable)
      .map(alias => alias.stock)
      .filter(Boolean)

    // Remove duplicate stocks
    const uniqueStocks = new Map()

    // Add main search results
    allResults.forEach(stock => {
      if (stock && !uniqueStocks.has(stock.id)) {
        uniqueStocks.set(stock.id, stock)
      }
    })

    // Add alias results (if not already present)
    aliasResults.forEach(stock => {
      if (stock && !uniqueStocks.has(stock.id)) {
        uniqueStocks.set(stock.id, stock)
      }
    })

    const finalResults = Array.from(uniqueStocks.values())
      .sort((a, b) => {
        // Prioritize exact symbol matches
        if (a.symbol.toLowerCase() === searchQuery.toLowerCase()) return -1
        if (b.symbol.toLowerCase() === searchQuery.toLowerCase()) return 1

        // Then sort by market cap (descending)
        return (b.market_cap || 0) - (a.market_cap || 0)
      })
      .slice(0, limit)

    return {
      success: true,
      data: finalResults,
    }
  } catch (error) {
    console.error('Search stocks error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Add a new stock holding to user's portfolio
 */
export async function addStockHolding(
  stockId: string,
  accountId: string,
  quantity: number,
  averageCost: number,
  currency: string = 'USD'
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate input
    if (!stockId || !accountId || quantity <= 0 || averageCost <= 0) {
      return {
        success: false,
        error: 'Invalid input parameters',
      }
    }

    // Check if stock exists and is tradeable
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select(
        'id, symbol, name, currency, current_price, is_active, is_tradeable'
      )
      .eq('id', stockId)
      .eq('is_active', true)
      .eq('is_tradeable', true)
      .single()

    if (stockError || !stock) {
      return {
        success: false,
        error: 'Stock not found or not tradeable',
      }
    }

    // Check if account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, currency, user_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return {
        success: false,
        error: 'Account not found or access denied',
      }
    }

    // Calculate total cost
    const totalCost = quantity * averageCost
    const currentPrice = stock.current_price || averageCost
    const marketValue = quantity * currentPrice

    // Check if holding already exists
    const { data: existingHolding, error: checkError } = await supabase
      .from('holdings')
      .select('id, quantity, total_cost, average_cost')
      .eq('user_id', user.id)
      .eq('stock_id', stockId)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing holding:', checkError)
      return {
        success: false,
        error: 'Failed to check existing holdings',
      }
    }

    let result

    if (existingHolding) {
      // Update existing holding
      const newQuantity = existingHolding.quantity + quantity
      const newTotalCost = existingHolding.total_cost + totalCost
      const newAverageCost = newTotalCost / newQuantity
      const newMarketValue = newQuantity * currentPrice

      const { data: updatedHolding, error: updateError } = await supabase
        .from('holdings')
        .update({
          quantity: newQuantity,
          average_cost: newAverageCost,
          total_cost: newTotalCost,
          current_price: currentPrice,
          market_value: newMarketValue,
          last_price_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingHolding.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating holding:', updateError)
        return {
          success: false,
          error: 'Failed to update holding',
        }
      }

      result = updatedHolding
    } else {
      // Create new holding
      const { data: newHolding, error: createError } = await supabase
        .from('holdings')
        .insert([
          {
            user_id: user.id,
            stock_id: stockId,
            account_id: accountId,
            quantity: quantity,
            average_cost: averageCost,
            total_cost: totalCost,
            current_price: currentPrice,
            market_value: marketValue,
            currency: currency,
            is_active: true,
            last_price_update: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating holding:', createError)
        return {
          success: false,
          error: 'Failed to create holding',
        }
      }

      result = newHolding
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          stock_id: stockId,
          account_id: accountId,
          transaction_type: 'BUY',
          quantity: quantity,
          price: averageCost,
          total_amount: totalCost,
          currency: currency,
          date: new Date().toISOString().split('T')[0],
          fees: 0,
          notes: 'Added via stock search',
        },
      ])

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // Don't fail the holding creation if transaction fails
    }

    // Revalidate related pages
    revalidatePath('/investments/stocks')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Add stock holding error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Remove a stock holding from user's portfolio
 */
export async function removeStockHolding(
  holdingId: string
): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if holding belongs to user
    const { data: holding, error: holdingError } = await supabase
      .from('holdings')
      .select(
        'id, user_id, stock_id, account_id, quantity, average_cost, total_cost'
      )
      .eq('id', holdingId)
      .eq('user_id', user.id)
      .single()

    if (holdingError || !holding) {
      return {
        success: false,
        error: 'Holding not found or access denied',
      }
    }

    // Soft delete the holding
    const { error: deleteError } = await supabase
      .from('holdings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', holdingId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error removing holding:', deleteError)
      return {
        success: false,
        error: 'Failed to remove holding',
      }
    }

    // Create transaction record for the sale
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          stock_id: holding.stock_id,
          account_id: holding.account_id,
          transaction_type: 'SELL',
          quantity: holding.quantity,
          price: holding.average_cost,
          total_amount: holding.total_cost,
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          fees: 0,
          notes: 'Removed via stock management',
        },
      ])

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // Don't fail the holding removal if transaction fails
    }

    // Revalidate related pages
    revalidatePath('/investments/stocks')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { id: holdingId },
    }
  } catch (error) {
    console.error('Remove stock holding error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's accounts for stock addition
 */
export async function getUserAccounts(userId: string): Promise<StocksResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check if requested userId matches authenticated user
    if (user.id !== userId) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    // Fetch user's accounts
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select(
        `
        id,
        name,
        account_type,
        currency,
        balance,
        portfolio_id,
        portfolio:portfolios(
          id,
          name
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (fetchError) {
      console.error('Error fetching accounts:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch accounts',
      }
    }

    return {
      success: true,
      data: accounts || [],
    }
  } catch (error) {
    console.error('Get user accounts error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
