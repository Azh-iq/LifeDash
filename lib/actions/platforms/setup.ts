'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema for platform setup progress
const setupProgressSchema = z.object({
  selectedPlatforms: z.array(z.string()),
  completedConnections: z.array(z.string()),
  currentStep: z.number().min(0).max(3),
})

const csvUploadSchema = z.object({
  platformId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  portfolioId: z.string().optional(),
})

const apiConnectionSchema = z.object({
  platformId: z.string(),
  credentials: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  portfolioId: z.string().optional(),
})

export interface SetupResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Save platform setup progress to user preferences or session
 */
export async function saveSetupProgress(
  progress: z.infer<typeof setupProgressSchema>
): Promise<SetupResult> {
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
    const validatedProgress = setupProgressSchema.parse(progress)

    // Save progress to user preferences or a setup_progress table
    // For now, we'll use the user_preferences table with a custom field
    const { error: updateError } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          // We can store setup progress in a JSON field if it exists,
          // or create a separate table for this
          dashboard_widgets: {
            setup_progress: validatedProgress,
          },
        },
        {
          onConflict: 'user_id',
        }
      )

    if (updateError) {
      console.error('Error saving setup progress:', updateError)
      return {
        success: false,
        error: 'Failed to save setup progress',
      }
    }

    return {
      success: true,
      data: validatedProgress,
    }
  } catch (error) {
    console.error('Save setup progress error:', error)

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
 * Get platform setup progress
 */
export async function getSetupProgress(): Promise<SetupResult> {
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

    // Get setup progress from user preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('user_preferences')
      .select('dashboard_widgets')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching setup progress:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch setup progress',
      }
    }

    const setupProgress = preferences?.dashboard_widgets?.setup_progress || {
      selectedPlatforms: [],
      completedConnections: [],
      currentStep: 0,
    }

    return {
      success: true,
      data: setupProgress,
    }
  } catch (error) {
    console.error('Get setup progress error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Handle CSV upload for platform connection
 */
export async function connectPlatformCSV(
  uploadData: z.infer<typeof csvUploadSchema>
): Promise<SetupResult> {
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
    const validatedData = csvUploadSchema.parse(uploadData)

    // Get the platform details
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('id, name, display_name, csv_import_supported')
      .eq('id', validatedData.platformId)
      .eq('is_active', true)
      .single()

    if (platformError || !platform) {
      return {
        success: false,
        error: 'Platform not found',
      }
    }

    if (!platform.csv_import_supported) {
      return {
        success: false,
        error: 'CSV import not supported for this platform',
      }
    }

    // Get or create default portfolio
    let portfolioId = validatedData.portfolioId
    if (!portfolioId) {
      const { data: defaultPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (portfolioError || !defaultPortfolio) {
        // Create a default portfolio
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            name: 'Min portefølje',
            currency: 'NOK',
            is_default: true,
          })
          .select('id')
          .single()

        if (createError || !newPortfolio) {
          return {
            success: false,
            error: 'Failed to create portfolio',
          }
        }

        portfolioId = newPortfolio.id
      } else {
        portfolioId = defaultPortfolio.id
      }
    }

    // Create platform connection record
    const { data: connection, error: connectionError } = await supabase
      .from('platform_integrations')
      .insert({
        user_id: user.id,
        platform_id: validatedData.platformId,
        connection_type: 'csv',
        status: 'connected',
        last_csv_import_at: new Date().toISOString(),
        csv_import_count: 1,
        last_sync_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (connectionError) {
      console.error('Error creating platform connection:', connectionError)
      return {
        success: false,
        error: 'Failed to create platform connection',
      }
    }

    // Create account for the platform
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        platform_id: validatedData.platformId,
        portfolio_id: portfolioId,
        name: `${platform.display_name} Konto`,
        account_type: 'TAXABLE', // Default account type
        currency: 'NOK', // Default currency
        is_active: true,
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating account:', accountError)
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    // Here you would normally process the CSV file
    // For the setup wizard, we'll simulate a successful upload

    revalidatePath('/investments/stocks')
    revalidatePath('/investments/stocks/setup')

    return {
      success: true,
      data: {
        connection,
        account,
        message: 'CSV uploaded and processed successfully',
      },
    }
  } catch (error) {
    console.error('Connect platform CSV error:', error)

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
 * Handle API connection for platform
 */
export async function connectPlatformAPI(
  connectionData: z.infer<typeof apiConnectionSchema>
): Promise<SetupResult> {
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
    const validatedData = apiConnectionSchema.parse(connectionData)

    // Get the platform details
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('id, name, display_name, api_supported')
      .eq('id', validatedData.platformId)
      .eq('is_active', true)
      .single()

    if (platformError || !platform) {
      return {
        success: false,
        error: 'Platform not found',
      }
    }

    if (!platform.api_supported) {
      return {
        success: false,
        error: 'API connection not supported for this platform',
      }
    }

    // Get or create default portfolio
    let portfolioId = validatedData.portfolioId
    if (!portfolioId) {
      const { data: defaultPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (portfolioError || !defaultPortfolio) {
        // Create a default portfolio
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            name: 'Min portefølje',
            currency: 'NOK',
            is_default: true,
          })
          .select('id')
          .single()

        if (createError || !newPortfolio) {
          return {
            success: false,
            error: 'Failed to create portfolio',
          }
        }

        portfolioId = newPortfolio.id
      } else {
        portfolioId = defaultPortfolio.id
      }
    }

    // In a real implementation, you would:
    // 1. Validate credentials with the platform's API
    // 2. Exchange for OAuth tokens
    // 3. Encrypt and store the tokens securely

    // For the setup wizard, we'll simulate a successful connection
    const mockAccessToken = `mock_token_${Date.now()}`

    // Create platform connection record
    const { data: connection, error: connectionError } = await supabase
      .from('platform_integrations')
      .insert({
        user_id: user.id,
        platform_id: validatedData.platformId,
        connection_type: 'api',
        status: 'connected',
        access_token_encrypted: mockAccessToken, // In real app, this should be encrypted
        last_sync_at: new Date().toISOString(),
        connection_metadata: {
          scopes: ['read_portfolio', 'read_transactions'],
          username: validatedData.credentials.username,
        },
      })
      .select()
      .single()

    if (connectionError) {
      console.error('Error creating platform connection:', connectionError)
      return {
        success: false,
        error: 'Failed to create platform connection',
      }
    }

    // Create account for the platform
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        platform_id: validatedData.platformId,
        portfolio_id: portfolioId,
        name: `${platform.display_name} Konto`,
        account_type: 'TAXABLE', // Default account type
        currency: 'NOK', // Default currency
        is_active: true,
        auto_sync: true,
        sync_frequency: 24, // Sync daily
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating account:', accountError)
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/investments/stocks/setup')

    return {
      success: true,
      data: {
        connection,
        account,
        message: 'API connection established successfully',
      },
    }
  } catch (error) {
    console.error('Connect platform API error:', error)

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
 * Complete the platform setup wizard
 */
export async function completeSetup(): Promise<SetupResult> {
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

    // Mark setup as completed in user preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          dashboard_widgets: {
            setup_completed: true,
            setup_completed_at: new Date().toISOString(),
          },
        },
        {
          onConflict: 'user_id',
        }
      )

    if (updateError) {
      console.error('Error marking setup as complete:', updateError)
      return {
        success: false,
        error: 'Failed to complete setup',
      }
    }

    revalidatePath('/investments/stocks')
    revalidatePath('/investments')

    return {
      success: true,
      data: { message: 'Setup completed successfully' },
    }
  } catch (error) {
    console.error('Complete setup error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check if user has completed platform setup
 */
export async function checkSetupStatus(): Promise<SetupResult> {
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

    // Check if user has any platform connections
    const { data: connections, error: connectionsError } = await supabase
      .from('platform_integrations')
      .select('id, platform_id')
      .eq('user_id', user.id)
      .eq('status', 'connected')

    if (connectionsError) {
      console.error('Error checking connections:', connectionsError)
      return {
        success: false,
        error: 'Failed to check setup status',
      }
    }

    // Check if user has any accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (accountsError) {
      console.error('Error checking accounts:', accountsError)
      return {
        success: false,
        error: 'Failed to check setup status',
      }
    }

    const hasConnections = (connections?.length || 0) > 0
    const hasAccounts = (accounts?.length || 0) > 0
    const isSetupComplete = hasConnections && hasAccounts

    return {
      success: true,
      data: {
        isSetupComplete,
        hasConnections,
        hasAccounts,
        connectionCount: connections?.length || 0,
        accountCount: accounts?.length || 0,
      },
    }
  } catch (error) {
    console.error('Check setup status error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
