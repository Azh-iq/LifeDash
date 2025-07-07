'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateDefaultPortfolioResult {
  success: boolean
  data?: {
    portfolioId: string
    accountId: string
  }
  error?: string
}

/**
 * Creates a default portfolio and account for users who skip setup
 */
export async function createDefaultPortfolio(): Promise<CreateDefaultPortfolioResult> {
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

    // Check if user profile exists, create if not
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      await supabase.from('user_profiles').insert({
        id: userId,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || 'Bruker',
        display_name: session.user.user_metadata?.full_name || 'Bruker',
      })
    }

    // Create default portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Min Portefølje',
        description: 'Standard portefølje for manuelle investeringer',
        currency: 'NOK',
        is_public: false,
        is_default: true,
      })
      .select()
      .single()

    if (portfolioError) {
      console.error('Error creating default portfolio:', portfolioError)
      return {
        success: false,
        error: 'Could not create default portfolio',
      }
    }

    // Get or create a manual platform
    let { data: platform } = await supabase
      .from('platforms')
      .select('*')
      .eq('name', 'manual')
      .single()

    if (!platform) {
      const { data: newPlatform, error: platformError } = await supabase
        .from('platforms')
        .insert({
          name: 'manual',
          display_name: 'Manuell Inntasting',
          type: 'MANUAL',
          default_currency: 'NOK',
          is_active: true,
        })
        .select()
        .single()

      if (platformError) {
        console.error('Error creating manual platform:', platformError)
        return {
          success: false,
          error: 'Could not create manual platform',
        }
      }
      platform = newPlatform
    }

    // Create default manual account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        portfolio_id: portfolio.id,
        platform_id: platform.id,
        name: 'Manuell Konto',
        account_type: 'TAXABLE',
        currency: 'NOK',
        is_active: true,
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating default account:', accountError)
      return {
        success: false,
        error: 'Could not create default account',
      }
    }

    return {
      success: true,
      data: {
        portfolioId: portfolio.id,
        accountId: account.id,
      },
    }
  } catch (error) {
    console.error('Error in createDefaultPortfolio:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
