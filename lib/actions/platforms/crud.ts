'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database, Tables } from '@/lib/types/database.types'

// Type definitions
type Platform = Tables<'platforms'>
type Account = Tables<'accounts'> & {
  platform: Platform
  portfolio: Tables<'portfolios'>
}
type Portfolio = Tables<'portfolios'>

// Validation schemas
const platformCreateSchema = z.object({
  name: z.string().min(1, 'Platform name is required').max(100),
  display_name: z.string().min(1, 'Display name is required').max(100),
  type: z.enum([
    'BROKER',
    'BANK',
    'CRYPTO_EXCHANGE',
    'ROBO_ADVISOR',
    'MANUAL',
    'IMPORT_ONLY',
  ]),
  default_currency: z
    .enum(['USD', 'EUR', 'GBP', 'NOK', 'SEK', 'DKK'])
    .default('USD'),
  stock_commission: z.number().min(0).default(0),
  etf_commission: z.number().min(0).default(0),
  option_commission: z.number().min(0).default(0),
  crypto_commission_percent: z.number().min(0).max(100).default(0),
  fx_spread_percent: z.number().min(0).max(100).default(0),
  country_code: z.string().length(2).optional(),
})

const platformUpdateSchema = platformCreateSchema.extend({
  id: z.string().uuid('Invalid platform ID'),
  is_active: z.boolean().optional(),
})

const accountCreateSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  portfolio_id: z.string().uuid('Invalid portfolio ID'),
  platform_id: z.string().uuid('Invalid platform ID'),
  account_type: z.enum([
    'TAXABLE',
    'TRADITIONAL_IRA',
    'ROTH_IRA',
    'SEP_IRA',
    'SIMPLE_IRA',
    '401K',
    'ROTH_401K',
    '403B',
    '457',
    'HSA',
    'TFSA',
    'RRSP',
    'RESP',
    'ISA',
    'PENSION',
    'TRUST',
    'JOINT',
    'INDIVIDUAL',
    'CORPORATE',
    'CRYPTO',
    'SAVINGS',
    'CHECKING',
  ]),
  currency: z.enum(['USD', 'EUR', 'GBP', 'NOK', 'SEK', 'DKK']).default('USD'),
  account_number: z.string().optional(),
  opening_balance: z.number().min(0).default(0),
  opening_date: z.string().optional(), // ISO date string
  auto_sync: z.boolean().default(false),
  sync_frequency: z.number().min(1).max(168).optional(),
})

const accountUpdateSchema = accountCreateSchema.extend({
  id: z.string().uuid('Invalid account ID'),
  is_active: z.boolean().optional(),
})

export interface PlatformResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Get all platforms (public data)
 */
export async function getPlatforms(): Promise<PlatformResult> {
  try {
    const supabase = createClient()

    const { data: platforms, error: fetchError } = await supabase
      .from('platforms')
      .select('*')
      .eq('is_active', true)
      .order('display_name')

    if (fetchError) {
      console.error('Error fetching platforms:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch platforms',
      }
    }

    return {
      success: true,
      data: platforms || [],
    }
  } catch (error) {
    console.error('Get platforms error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new platform (admin-only in real scenarios, but allowing for demo)
 */
export async function createPlatform(
  platformData: z.infer<typeof platformCreateSchema>
): Promise<PlatformResult> {
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
    const validatedData = platformCreateSchema.parse(platformData)

    // Check if platform name already exists
    const { data: existingPlatform } = await supabase
      .from('platforms')
      .select('id')
      .eq('name', validatedData.name)
      .single()

    if (existingPlatform) {
      return {
        success: false,
        error: 'Platform with this name already exists',
      }
    }

    // Create platform
    const { data: newPlatform, error: createError } = await supabase
      .from('platforms')
      .insert([validatedData])
      .select()
      .single()

    if (createError) {
      console.error('Error creating platform:', createError)
      return {
        success: false,
        error: 'Failed to create platform',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/portfolios')

    return {
      success: true,
      data: newPlatform,
    }
  } catch (error) {
    console.error('Create platform error:', error)

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
 * Update an existing platform
 */
export async function updatePlatform(
  platformData: z.infer<typeof platformUpdateSchema>
): Promise<PlatformResult> {
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
    const validatedData = platformUpdateSchema.parse(platformData)

    // Update platform
    const { data: updatedPlatform, error: updateError } = await supabase
      .from('platforms')
      .update(validatedData)
      .eq('id', validatedData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating platform:', updateError)
      return {
        success: false,
        error: 'Failed to update platform',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/portfolios')

    return {
      success: true,
      data: updatedPlatform,
    }
  } catch (error) {
    console.error('Update platform error:', error)

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
 * Get user's accounts with platform and portfolio data
 */
export async function getAccounts(userId: string): Promise<PlatformResult> {
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

    // Fetch accounts with related data
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select(
        `
        *,
        platform:platforms(*),
        portfolio:portfolios(
          id,
          name,
          currency,
          is_default
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

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
    console.error('Get accounts error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new account
 */
export async function createAccount(
  accountData: z.infer<typeof accountCreateSchema>
): Promise<PlatformResult> {
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
    const validatedData = accountCreateSchema.parse(accountData)

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', validatedData.portfolio_id)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Verify platform exists
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('id')
      .eq('id', validatedData.platform_id)
      .eq('is_active', true)
      .single()

    if (platformError || !platform) {
      return {
        success: false,
        error: 'Platform not found',
      }
    }

    // Check if account name already exists for this user and portfolio
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('portfolio_id', validatedData.portfolio_id)
      .eq('name', validatedData.name)
      .single()

    if (existingAccount) {
      return {
        success: false,
        error: 'Account with this name already exists in this portfolio',
      }
    }

    // Create account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert([
        {
          ...validatedData,
          user_id: user.id,
          opening_date: validatedData.opening_date
            ? new Date(validatedData.opening_date).toISOString().split('T')[0]
            : null,
        },
      ])
      .select(
        `
        *,
        platform:platforms(*),
        portfolio:portfolios(
          id,
          name,
          currency,
          is_default
        )
      `
      )
      .single()

    if (createError) {
      console.error('Error creating account:', createError)
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/portfolios')

    return {
      success: true,
      data: newAccount,
    }
  } catch (error) {
    console.error('Create account error:', error)

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
 * Update an existing account
 */
export async function updateAccount(
  accountData: z.infer<typeof accountUpdateSchema>
): Promise<PlatformResult> {
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
    const validatedData = accountUpdateSchema.parse(accountData)

    // Check if account belongs to user
    const { data: existingAccount, error: accountError } = await supabase
      .from('accounts')
      .select('id, user_id')
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !existingAccount) {
      return {
        success: false,
        error: 'Account not found or access denied',
      }
    }

    // Verify portfolio belongs to user (if being changed)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', validatedData.portfolio_id)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: 'Portfolio not found or access denied',
      }
    }

    // Update account
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        ...validatedData,
        opening_date: validatedData.opening_date
          ? new Date(validatedData.opening_date).toISOString().split('T')[0]
          : null,
      })
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .select(
        `
        *,
        platform:platforms(*),
        portfolio:portfolios(
          id,
          name,
          currency,
          is_default
        )
      `
      )
      .single()

    if (updateError) {
      console.error('Error updating account:', updateError)
      return {
        success: false,
        error: 'Failed to update account',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/portfolios')

    return {
      success: true,
      data: updatedAccount,
    }
  } catch (error) {
    console.error('Update account error:', error)

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
 * Delete an account (soft delete by setting is_active to false)
 */
export async function deleteAccount(
  accountId: string
): Promise<PlatformResult> {
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

    // Check if account belongs to user and has no active holdings
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(
        `
        id,
        user_id,
        name,
        holdings!inner(id)
      `
      )
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return {
        success: false,
        error: 'Account not found or access denied',
      }
    }

    // Check if account has active holdings
    const { data: activeHoldings, error: holdingsError } = await supabase
      .from('holdings')
      .select('id')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .gt('quantity', 0)

    if (holdingsError) {
      console.error('Error checking holdings:', holdingsError)
      return {
        success: false,
        error: 'Failed to verify account holdings',
      }
    }

    if (activeHoldings && activeHoldings.length > 0) {
      return {
        success: false,
        error: 'Cannot delete account with active holdings',
      }
    }

    // Soft delete the account
    const { error: deleteError } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting account:', deleteError)
      return {
        success: false,
        error: 'Failed to delete account',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/portfolios')

    return {
      success: true,
      data: { message: 'Account deleted successfully' },
    }
  } catch (error) {
    console.error('Delete account error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's portfolios for account creation
 */
export async function getPortfolios(userId: string): Promise<PlatformResult> {
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

    // Fetch portfolios
    const { data: portfolios, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, name, currency, is_default, created_at')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching portfolios:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch portfolios',
      }
    }

    return {
      success: true,
      data: portfolios || [],
    }
  } catch (error) {
    console.error('Get portfolios error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
