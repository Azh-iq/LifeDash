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
import type { Database } from '@/lib/types/database.types'

export interface CSVImportActionResult {
  success: boolean
  data?: NordnetImportResult
  error?: string
}

/**
 * Imports transactions from a parsed Nordnet CSV result
 * This function is called from the client-side and uses server-side session auth
 */
export async function importNordnetTransactions(
  parseResult: NordnetParseResult,
  config?: Partial<NordnetImportConfig>
): Promise<CSVImportActionResult> {
  console.log('🚀 CSV Import Server Action - Starting...')
  console.log('Parameters received:', {
    hasParseResult: !!parseResult,
    rowCount: parseResult?.totalRows,
  })

  try {
    // CRITICAL FIX: Use server-side Supabase client for authentication
    const supabase = createClient()

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Authentication error:', sessionError)
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
      }
    }

    const userId = session.user.id
    console.log('Authenticated user:', userId)

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
      userId,
      'nordnet', // platform ID - you might want to make this configurable
      supabase
    )

    // Import transactions to database
    const result = await transformer.importToSupabase(transformedTransactions, {
      batchSize: 50,
      ...config,
    })

    console.log('CSV Import completed:', {
      success: result.success,
      imported: result.data?.summary?.imported || 0,
      errors: result.data?.summary?.errors || 0,
    })

    return {
      success: result.success,
      data: result.data,
      error: result.error,
    }
  } catch (error) {
    console.error('Unexpected error in CSV import:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? `Import failed: ${error.message}`
          : 'An unexpected error occurred during import.',
    }
  }
}