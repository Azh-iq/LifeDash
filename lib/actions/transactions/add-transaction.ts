'use server'

import { createClient } from '@/lib/supabase/server'
import { TransactionData } from '@/components/stocks/add-transaction-modal'

export interface AddTransactionResult {
  success: boolean
  data?: {
    transactionId: string
    holdingUpdated: boolean
  }
  error?: string
}

/**
 * Add a new manual transaction to the database
 */
export async function addTransaction(
  transactionData: TransactionData,
  portfolioId: string
): Promise<AddTransactionResult> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const userId = session.user.id

    // First, ensure the stock exists in our database
    let stockId: string | null = null

    // Check if stock already exists
    const { data: existingStock } = await supabase
      .from('stocks')
      .select('id')
      .eq('symbol', transactionData.symbol)
      .eq(
        'exchange',
        transactionData.symbol.includes('.OL') ? 'OSLO' : 'NASDAQ'
      )
      .single()

    if (existingStock) {
      stockId = existingStock.id
    } else {
      // Create new stock entry
      const { data: newStock, error: stockError } = await supabase
        .from('stocks')
        .insert({
          symbol: transactionData.symbol,
          exchange: transactionData.symbol.includes('.OL') ? 'OSLO' : 'NASDAQ',
          name: transactionData.stockName,
          company_name: transactionData.stockName,
          currency: transactionData.currency,
          current_price: transactionData.pricePerShare,
          asset_type: 'STOCK',
        })
        .select('id')
        .single()

      if (stockError || !newStock) {
        return {
          success: false,
          error: `Failed to create stock entry: ${stockError?.message || 'Unknown error'}`,
        }
      }

      stockId = newStock.id
    }

    // Get account ID - either use provided accountId or get default account for portfolio
    let accountId = transactionData.accountId

    if (!accountId) {
      // Get default account for this portfolio
      const { data: defaultAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (defaultAccount) {
        accountId = defaultAccount.id
      } else {
        // Create a default manual account if none exists
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: userId,
            portfolio_id: portfolioId,
            platform_id: null, // Manual entry
            name: 'Manual Trading Account',
            account_type: 'TAXABLE',
            currency: transactionData.currency,
            is_active: true,
          })
          .select('id')
          .single()

        if (accountError || !newAccount) {
          return {
            success: false,
            error: `Failed to create account: ${accountError?.message || 'Unknown error'}`,
          }
        }

        accountId = newAccount.id
      }
    }

    // Insert the transaction with advanced fees
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: accountId,
        stock_id: stockId,
        transaction_type: transactionData.type,
        date: transactionData.date,
        quantity: transactionData.quantity,
        price: transactionData.pricePerShare,
        total_amount: transactionData.totalAmount,
        // Advanced fees breakdown
        commission: transactionData.advancedFees?.commission || transactionData.fees || 0,
        sec_fees: transactionData.advancedFees?.currencyExchange || 0, // Currency exchange fees
        other_fees: transactionData.advancedFees?.otherFees || 0,
        // Note: total_fees is automatically calculated by the database
        currency: transactionData.currency,
        notes: transactionData.notes,
        data_source: 'MANUAL',
      })
      .select('id')
      .single()

    if (transactionError || !transaction) {
      return {
        success: false,
        error: `Failed to create transaction: ${transactionError?.message || 'Unknown error'}`,
      }
    }

    // Update or create holding
    let holdingUpdated = false

    // Check if holding already exists
    const { data: existingHolding } = await supabase
      .from('holdings')
      .select('id, quantity, cost_basis')
      .eq('account_id', accountId)
      .eq('stock_id', stockId)
      .single()

    if (existingHolding) {
      // Update existing holding
      const newQuantity =
        transactionData.type === 'BUY'
          ? existingHolding.quantity + transactionData.quantity
          : existingHolding.quantity - transactionData.quantity

      // Calculate new cost basis (for buys) using weighted average
      let newCostBasis = existingHolding.cost_basis
      if (transactionData.type === 'BUY') {
        const totalOldValue =
          existingHolding.quantity * existingHolding.cost_basis
        const totalNewValue =
          transactionData.quantity * transactionData.pricePerShare
        const totalQuantity =
          existingHolding.quantity + transactionData.quantity
        newCostBasis =
          totalQuantity > 0
            ? (totalOldValue + totalNewValue) / totalQuantity
            : 0
      }

      const { error: updateError } = await supabase
        .from('holdings')
        .update({
          quantity: newQuantity,
          cost_basis: newCostBasis,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingHolding.id)

      if (!updateError) {
        holdingUpdated = true
      }

      // If quantity becomes 0 or negative, mark holding as closed
      if (newQuantity <= 0) {
        await supabase
          .from('holdings')
          .update({ is_active: false })
          .eq('id', existingHolding.id)
      }
    } else if (transactionData.type === 'BUY') {
      // Create new holding for buy transactions
      const { error: createError } = await supabase.from('holdings').insert({
        user_id: userId,
        account_id: accountId,
        stock_id: stockId,
        quantity: transactionData.quantity,
        cost_basis: transactionData.pricePerShare,
        average_cost: transactionData.pricePerShare,
        current_price: transactionData.pricePerShare,
        is_active: true,
      })

      if (!createError) {
        holdingUpdated = true
      }
    }

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        holdingUpdated,
      },
    }
  } catch (error) {
    console.error('Error adding transaction:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get available accounts for a user's portfolio
 */
export async function getPortfolioAccounts(portfolioId: string) {
  try {
    const supabase = createClient()

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(
        `
        id,
        name,
        account_type,
        currency,
        platforms:platform_id (
          name,
          display_name
        )
      `
      )
      .eq('portfolio_id', portfolioId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }

    const formattedAccounts = accounts.map(account => ({
      id: account.id,
      name: account.name,
      platform:
        account.platforms?.display_name || account.platforms?.name || 'Manual',
    }))

    return {
      success: true,
      data: formattedAccounts,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch accounts',
      data: [],
    }
  }
}
