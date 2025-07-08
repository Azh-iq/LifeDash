'use server'

import { createClient } from '@/lib/supabase/server'

export interface HoldingForSale {
  id: string
  symbol: string
  name: string
  company_name: string
  exchange: string
  currency: string
  sector?: string
  industry?: string
  country?: string
  is_popular: boolean
  // Holdings-specific data
  quantity: number
  average_cost: number
  total_cost: number
  current_price?: number
  market_value?: number
  account_id: string
  account_name: string
  account_platform: string
}

export interface FetchHoldingsResult {
  success: boolean
  error?: string
  data?: HoldingForSale[]
}

/**
 * Fetch user's current holdings for sale transaction filtering
 */
export async function fetchUserHoldingsForSale(portfolioId?: string): Promise<FetchHoldingsResult> {
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

    // Build query to fetch holdings with stock info
    let query = supabase
      .from('holdings')
      .select(`
        id,
        quantity,
        average_cost,
        total_cost,
        current_price,
        market_value,
        account_id,
        stock:stocks!inner(
          id,
          symbol,
          name,
          company_name,
          exchange,
          currency,
          sector,
          industry,
          country,
          is_popular
        ),
        account:accounts!inner(
          id,
          name,
          platform,
          portfolio_id
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('quantity', 0) // Only holdings with positive quantity

    // Filter by portfolio if provided
    if (portfolioId) {
      query = query.eq('account.portfolio_id', portfolioId)
    }

    const { data: holdings, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching holdings:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch holdings',
      }
    }

    // Transform holdings data for stock search
    const holdingsForSale: HoldingForSale[] = (holdings || []).map((holding: any) => ({
      id: holding.stock.id,
      symbol: holding.stock.symbol,
      name: holding.stock.name,
      company_name: holding.stock.company_name,
      exchange: holding.stock.exchange,
      currency: holding.stock.currency,
      sector: holding.stock.sector,
      industry: holding.stock.industry,
      country: holding.stock.country,
      is_popular: holding.stock.is_popular,
      // Holdings-specific data
      quantity: holding.quantity,
      average_cost: holding.average_cost,
      total_cost: holding.total_cost,
      current_price: holding.current_price,
      market_value: holding.market_value,
      account_id: holding.account_id,
      account_name: holding.account.name,
      account_platform: holding.account.platform,
    }))

    return {
      success: true,
      data: holdingsForSale,
    }
  } catch (error) {
    console.error('Fetch holdings error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}