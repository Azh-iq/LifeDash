'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NordnetCSVParser } from '@/lib/integrations/nordnet/csv-parser'
import { importNordnetTransactions } from '@/lib/actions/transactions/csv-import'

export default function DebugCSVPage() {
  const [log, setLog] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const handleTestCSVImport = async () => {
    setIsProcessing(true)
    setLog([])

    try {
      addLog('🔍 Starting CSV Import Debug Test')

      // Step 1: Check authentication
      addLog('📋 Step 1: Checking authentication...')
      const supabase = createClient()
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`)
        return
      }

      if (!session) {
        addLog('❌ No session found - user not logged in')
        return
      }

      addLog(`✅ User authenticated: ${session.user.email}`)
      addLog(`✅ Access token length: ${session.access_token.length}`)
      addLog(
        `✅ Session expires: ${new Date(session.expires_at! * 1000).toISOString()}`
      )

      // Step 2: Load and parse CSV file
      addLog('📁 Step 2: Loading CSV file...')

      const response = await fetch('/transactions-and-notes-export.csv')
      if (!response.ok) {
        addLog('❌ CSV file not found in public folder')
        addLog(
          '⚠️  Please copy the CSV file to public/transactions-and-notes-export.csv'
        )
        return
      }

      const csvText = await response.text()
      const file = new File([csvText], 'transactions-and-notes-export.csv', {
        type: 'text/csv',
      })

      addLog(`✅ CSV file loaded: ${csvText.length} characters`)

      // Step 3: Parse CSV
      addLog('🔄 Step 3: Parsing CSV...')
      const parseResult = await NordnetCSVParser.parseFile(file)

      addLog(`✅ Parse result: ${parseResult.totalRows} transactions`)
      addLog(`✅ Headers: ${parseResult.headers?.length} columns`)
      addLog(`✅ Errors: ${parseResult.errors?.length || 0}`)
      addLog(`✅ Warnings: ${parseResult.warnings?.length || 0}`)

      if (parseResult.warnings?.length > 0) {
        parseResult.warnings.forEach(warning => {
          addLog(`⚠️  Warning: ${warning}`)
        })
      }

      // Step 4: Test import
      addLog('💾 Step 4: Testing import...')

      const importResult = await importNordnetTransactions(
        parseResult,
        session.access_token,
        session.user.id
      )

      addLog(`📊 Import result: ${importResult.success ? 'SUCCESS' : 'FAILED'}`)

      if (importResult.success && importResult.data) {
        addLog(
          `✅ Created transactions: ${importResult.data.createdTransactions}`
        )
        addLog(`✅ Created accounts: ${importResult.data.createdAccounts}`)
        addLog(`✅ Skipped rows: ${importResult.data.skippedRows}`)
        addLog(`✅ Errors: ${importResult.data.errors.length}`)
        addLog(`✅ Warnings: ${importResult.data.warnings.length}`)

        if (importResult.data.errors.length > 0) {
          importResult.data.errors.forEach(error => {
            addLog(`❌ Error: ${error}`)
          })
        }
      } else {
        addLog(`❌ Import failed: ${importResult.error}`)
      }

      addLog('🎉 Debug test completed!')
    } catch (error) {
      addLog(
        `💥 Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.error('Debug test error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">CSV Import Debug Test</h1>

        <div className="mb-6">
          <button
            onClick={handleTestCSVImport}
            disabled={isProcessing}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isProcessing ? 'Processing...' : 'Test CSV Import'}
          </button>
        </div>

        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Debug Log:</h2>
          <div className="max-h-96 space-y-1 overflow-y-auto font-mono text-sm">
            {log.length === 0 ? (
              <p className="text-gray-400">
                Click &quot;Test CSV Import&quot; to start debugging...
              </p>
            ) : (
              log.map((entry, index) => (
                <div key={index} className="text-green-400">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-400">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ol className="ml-6 list-decimal space-y-1">
            <li>Make sure you&apos;re logged in to the application</li>
            <li>
              Copy your CSV file to{' '}
              <code>public/transactions-and-notes-export.csv</code>
            </li>
            <li>Click &quot;Test CSV Import&quot; button</li>
            <li>Watch the debug log for detailed information</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
