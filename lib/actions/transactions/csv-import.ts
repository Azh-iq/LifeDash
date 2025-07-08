'use server'

import {
  NordnetTransactionTransformer,
  NordnetFieldMapper,
  NordnetParseResult,
  NordnetImportResult,
  NordnetImportConfig,
  NordnetTransactionData,
} from '@/lib/integrations/nordnet'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export interface CSVImportActionResult {
  success: boolean
  data?: NordnetImportResult
  error?: string
}

/**
 * Imports transactions from a parsed Nordnet CSV result
 * This function is called from the client-side with authentication context
 */
export async function importNordnetTransactions(
  parseResult: NordnetParseResult,
  userAccessToken: string,
  userId: string,
  config?: Partial<NordnetImportConfig>
): Promise<CSVImportActionResult> {
  console.log('🚀 CSV Import Server Action - Starting...')
  console.log('Parameters received:', {
    hasParseResult: !!parseResult,
    rowCount: parseResult?.totalRows,
    hasAccessToken: !!userAccessToken,
    tokenLength: userAccessToken?.length,
    hasUserId: !!userId,
    userId: userId,
  })

  try {
    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseKey?.length,
    })

    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return {
        success: false,
        error:
          'Configuration error: Supabase URL not configured. Please check server configuration.',
      }
    }

    if (!supabaseKey) {
      console.error(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
      )
      return {
        success: false,
        error:
          'Configuration error: Supabase key not configured. Please check server configuration.',
      }
    }

    // Create Supabase client with provided access token
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      },
    })

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error('Authentication error in CSV import:', authError)
      let authErrorMessage =
        'Authentication failed. Please log in and try again.'

      if (authError) {
        // Provide more specific error messages based on auth error
        if (authError.message.includes('JWT') || authError.code === 'bad_jwt') {
          authErrorMessage =
            'Session expired. Please refresh the page and try again.'
        } else if (
          authError.message.includes('invalid') ||
          authError.message.includes('malformed')
        ) {
          authErrorMessage =
            'Invalid authentication. Please log out and log back in.'
        } else if (
          authError.code === 'no_authorization' ||
          authError.message.includes('Bearer token')
        ) {
          authErrorMessage =
            'Authentication token missing. Please refresh the page and try again.'
        } else {
          authErrorMessage = `Authentication error: ${authError.message}`
        }
      } else if (!user) {
        authErrorMessage = 'No user session found. Please log in and try again.'
      } else if (user.id !== userId) {
        authErrorMessage =
          'User ID mismatch. Please refresh the page and try again.'
      }

      return {
        success: false,
        error: authErrorMessage,
      }
    }

    // Transform CSV rows to transaction data using the field mapper
    const transformedTransactions: NordnetTransactionData[] = []
    const transformErrors: string[] = []

    for (const row of parseResult.rows) {
      try {
        const transactionData = NordnetFieldMapper.transformRow(row)
        transformedTransactions.push(transactionData)
      } catch (error) {
        transformErrors.push(
          `Failed to transform row ${row.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    if (transformErrors.length > 0) {
      console.warn('Transformation errors:', transformErrors)
    }

    // Create transformer instance with Supabase client
    const transformer = new NordnetTransactionTransformer(
      user.id,
      'nordnet', // platform ID - you might want to make this configurable
      supabase
    )

    // Generate default import configuration and merge with provided config
    const defaultConfig = NordnetTransactionTransformer.generateDefaultConfig()
    const importConfig: NordnetImportConfig = {
      ...defaultConfig,
      ...config,
      // Always allow creating missing stocks for CSV imports
      createMissingStocks: true,
      // Skip duplicates by default
      duplicateTransactionHandling: 'skip',
    }

    // Transform and import the data
    const importResult = await transformer.transformAndImport(
      transformedTransactions,
      importConfig
    )

    // Add transformation errors to the result if any
    if (transformErrors.length > 0) {
      importResult.errors.push(...transformErrors)
    }

    return {
      success: importResult.success,
      data: importResult,
    }
  } catch (error) {
    console.error('CSV Import Error:', error)

    // Enhanced error logging
    let errorDetails = 'Failed to import CSV data'

    if (error instanceof Error) {
      errorDetails = error.message
      console.error('Error stack:', error.stack)

      // Log additional error details for debugging
      if ('code' in error) {
        console.error('Error code:', (error as any).code)
      }
      if ('details' in error) {
        console.error('Error details:', (error as any).details)
      }
      if ('hint' in error) {
        console.error('Error hint:', (error as any).hint)
      }
    } else {
      console.error('Non-Error object thrown:', typeof error, error)
    }

    return {
      success: false,
      error: errorDetails,
    }
  }
}

/**
 * Gets the current user's portfolio ID for CSV import
 * This is a helper function to get the portfolio context
 */
export async function getCurrentUserPortfolio(): Promise<{
  success: boolean
  portfolioId?: string
  error?: string
}> {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Get user's first portfolio (you might want to make this more sophisticated)
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)

    if (portfolioError) {
      return {
        success: false,
        error: `Failed to fetch portfolios: ${portfolioError.message}`,
      }
    }

    if (!portfolios || portfolios.length === 0) {
      return {
        success: false,
        error: 'No portfolios found. Please create a portfolio first.',
      }
    }

    return {
      success: true,
      portfolioId: portfolios[0].id,
    }
  } catch (error) {
    console.error('Get portfolio error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get portfolio',
    }
  }
}
