'use server'

import {
  NordnetTransactionTransformer,
  NordnetFieldMapper,
  NordnetParseResult,
  NordnetImportResult,
  NordnetImportConfig,
  NordnetTransactionData,
} from '@/lib/integrations/nordnet'
import { createClient } from '@/lib/supabase/server'

export interface CSVImportActionResult {
  success: boolean
  data?: NordnetImportResult
  error?: string
}

/**
 * Imports transactions from a parsed Nordnet CSV result
 */
export async function importNordnetTransactions(
  parseResult: NordnetParseResult,
  config?: Partial<NordnetImportConfig>
): Promise<CSVImportActionResult> {
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

    // Create transformer instance
    const transformer = new NordnetTransactionTransformer(
      user.id,
      'nordnet' // platform ID - you might want to make this configurable
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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to import CSV data',
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
