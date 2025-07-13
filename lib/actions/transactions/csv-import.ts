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
  debug?: {
    parsedRows: number
    transformedRows: number
    transformErrors: string[]
    sampleTransactions: any[]
    platformId: string
  }
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

    console.log('🔍 Starting transformation of', parseResult.rows.length, 'rows')

    for (let i = 0; i < parseResult.rows.length; i++) {
      const row = parseResult.rows[i]
      try {
        console.log(`🔍 Transforming row ${i + 1}:`, {
          Id: row.Id,
          Transaksjonstype: row.Transaksjonstype,
          Valuta: row.Valuta,
          Beløp: row.Beløp,
          Portfolio: row.Portefølje,
          allKeys: Object.keys(row),
          rowSample: JSON.stringify(row).substring(0, 200) + '...'
        })
        
        const transactionData = NordnetFieldMapper.transformRow(row)
        
        console.log(`✅ Transformed row ${i + 1}:`, {
          id: transactionData.id,
          transaction_type: transactionData.transaction_type,
          internal_transaction_type: transactionData.internal_transaction_type,
          currency: transactionData.currency,
          amount: transactionData.amount,
          portfolio_name: transactionData.portfolio_name,
          validation_errors: transactionData.validation_errors,
          validation_warnings: transactionData.validation_warnings
        })
        
        transformedTransactions.push(transactionData)
      } catch (error) {
        const errorMsg = `Failed to transform row ${row.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('❌ Transform error:', errorMsg, {
          error: error,
          stack: error instanceof Error ? error.stack : undefined,
          rowData: row
        })
        transformErrors.push(errorMsg)
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

    console.log('🚀 About to import', transformedTransactions.length, 'transformed transactions')
    
    // Import transactions to database
    const result = await transformer.transformAndImport(transformedTransactions, {
      batchSize: 50,
      ...config,
    })

    const debugInfo = {
      parsedRows: parseResult.rows.length,
      transformedRows: transformedTransactions.length,
      transformErrors,
      sampleTransactions: transformedTransactions.slice(0, 3).map(t => ({
        id: t.id,
        type: t.transaction_type,
        internal_type: t.internal_transaction_type,
        amount: t.amount,
        currency: t.currency,
        portfolio: t.portfolio_name,
        validation_errors: t.validation_errors,
        validation_warnings: t.validation_warnings
      })),
      platformId: 'nordnet' // We know it's nordnet since we're using NordnetTransactionTransformer
    }

    console.log('📊 CSV Import completed:', {
      success: result.success,
      parsedRows: result.parsedRows,
      transformedRows: result.transformedRows,
      createdAccounts: result.createdAccounts,
      createdTransactions: result.createdTransactions,
      skippedRows: result.skippedRows,
      errors: result.errors?.length || 0,
      errorDetails: result.errors,
      debugInfo
    })

    return {
      success: result.success,
      data: result,
      error: result.errors?.length > 0 ? result.errors.join('; ') : undefined,
      debug: debugInfo
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