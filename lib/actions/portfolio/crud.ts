'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Portfolio validation schemas
const createPortfolioSchema = z.object({
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .max(100, 'Portfolio name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  type: z.enum(['INVESTMENT', 'RETIREMENT', 'SAVINGS', 'TRADING'], {
    errorMap: () => ({ message: 'Please select a valid portfolio type' }),
  }),
  is_public: z.boolean().default(false),
})

const updatePortfolioSchema = createPortfolioSchema.partial().extend({
  id: z.string().uuid('Invalid portfolio ID'),
})

export interface PortfolioResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(
  formData: FormData
): Promise<PortfolioResult> {
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

    // Parse and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      is_public: formData.get('is_public') === 'true',
    }

    const validatedData = createPortfolioSchema.parse(rawData)

    // Create portfolio
    const { data: portfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating portfolio:', createError)
      return {
        success: false,
        error: 'Failed to create portfolio',
      }
    }

    // Revalidate the portfolios page
    revalidatePath('/portfolios')

    return {
      success: true,
      data: portfolio,
    }
  } catch (error) {
    console.error('Create portfolio error:', error)

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
 * Update an existing portfolio
 */
export async function updatePortfolio(
  formData: FormData
): Promise<PortfolioResult> {
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

    // Parse and validate form data
    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      is_public: formData.get('is_public') === 'true',
    }

    const validatedData = updatePortfolioSchema.parse(rawData)
    const { id, ...updateData } = validatedData

    // Check if portfolio belongs to user
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingPortfolio) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Update portfolio
    const { data: portfolio, error: updateError } = await supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating portfolio:', updateError)
      return {
        success: false,
        error: 'Failed to update portfolio',
      }
    }

    // Revalidate the portfolios page
    revalidatePath('/portfolios')
    revalidatePath(`/portfolios/${id}`)

    return {
      success: true,
      data: portfolio,
    }
  } catch (error) {
    console.error('Update portfolio error:', error)

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
 * Delete a portfolio
 */
export async function deletePortfolio(
  portfolioId: string
): Promise<PortfolioResult> {
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

    // Validate portfolio ID
    if (!portfolioId || typeof portfolioId !== 'string') {
      return {
        success: false,
        error: 'Invalid portfolio ID',
      }
    }

    // Check if portfolio belongs to user and get holdings count
    const { data: portfolioCheck, error: checkError } = await supabase
      .from('portfolios')
      .select(
        `
        id, 
        user_id, 
        name,
        accounts:accounts(
          holdings:holdings(id)
        )
      `
      )
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (checkError || !portfolioCheck) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Check if portfolio has holdings
    let holdingsCount = 0
    if (Array.isArray(portfolioCheck.accounts)) {
      portfolioCheck.accounts.forEach((account: any) => {
        if (Array.isArray(account.holdings)) {
          holdingsCount += account.holdings.length
        }
      })
    }
    if (holdingsCount > 0) {
      return {
        success: false,
        error:
          'Cannot delete portfolio with existing holdings. Please remove all holdings first.',
      }
    }

    // Delete portfolio
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting portfolio:', deleteError)
      return {
        success: false,
        error: 'Failed to delete portfolio',
      }
    }

    // Revalidate the portfolios page
    revalidatePath('/portfolios')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete portfolio error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's portfolios
 */
export async function getUserPortfolios(): Promise<PortfolioResult> {
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

    // Fetch portfolios with holdings count and total value
    const { data: portfolios, error: fetchError } = await supabase
      .from('portfolios')
      .select(
        `
        *,
        accounts:accounts(
          id,
          holdings:holdings(
            id,
            quantity,
            average_cost,
            stock:stocks(
              symbol,
              current_price
            )
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching portfolios:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch portfolios',
      }
    }

    // Calculate total values for each portfolio
    const portfoliosWithTotals =
      portfolios?.map(portfolio => {
        // Flatten holdings from all accounts
        const allHoldings: any[] = []
        if (Array.isArray(portfolio.accounts)) {
          portfolio.accounts.forEach((account: any) => {
            if (Array.isArray(account.holdings)) {
              allHoldings.push(...account.holdings)
            }
          })
        }

        const totalValue = allHoldings.reduce((sum: number, holding: any) => {
          const currentPrice = holding.stock?.current_price || 0
          return sum + holding.quantity * currentPrice
        }, 0)

        const totalCost = allHoldings.reduce((sum: number, holding: any) => {
          return sum + holding.quantity * holding.average_cost
        }, 0)

        return {
          ...portfolio,
          total_value: totalValue,
          total_cost: totalCost,
          total_gain_loss: totalValue - totalCost,
          holdings_count: allHoldings.length,
          holdings: allHoldings, // Add flattened holdings for compatibility
        }
      }) || []

    return {
      success: true,
      data: portfoliosWithTotals,
    }
  } catch (error) {
    console.error('Get portfolios error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a single portfolio by ID
 */
export async function getPortfolioById(
  portfolioId: string
): Promise<PortfolioResult> {
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

    // Fetch portfolio with detailed holdings
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select(
        `
        *,
        accounts:accounts(
          *,
          holdings:holdings(
            *,
            stock:stocks(*)
          )
        )
      `
      )
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !portfolio) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Calculate portfolio metrics
    const allHoldings: any[] = []
    if (Array.isArray(portfolio.accounts)) {
      portfolio.accounts.forEach((account: any) => {
        if (Array.isArray(account.holdings)) {
          allHoldings.push(...account.holdings)
        }
      })
    }

    const totalValue = allHoldings.reduce((sum: number, holding: any) => {
      const currentPrice = holding.stock?.current_price || 0
      return sum + holding.quantity * currentPrice
    }, 0)

    const totalCost = allHoldings.reduce((sum: number, holding: any) => {
      return sum + holding.quantity * holding.average_cost
    }, 0)

    const portfolioWithMetrics = {
      ...portfolio,
      total_value: totalValue,
      total_cost: totalCost,
      total_gain_loss: totalValue - totalCost,
      holdings_count: allHoldings.length,
      holdings: allHoldings, // Add flattened holdings for compatibility
    }

    return {
      success: true,
      data: portfolioWithMetrics,
    }
  } catch (error) {
    console.error('Get portfolio error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
