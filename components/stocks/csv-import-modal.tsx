'use client'

import { useState } from 'react'
import { X, FileUp, Check, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVUploadZone } from '@/components/features/import/csv-upload'
import { NordnetParseResult } from '@/lib/integrations/nordnet/types'
import { importNordnetTransactions } from '@/lib/actions/transactions/csv-import'
import { createClient } from '@/lib/supabase/client'
import SimpleManualMapper from './simple-manual-mapper'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: CSVImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<NordnetParseResult | null>(
    null
  )
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<boolean>(false)
  const [showManualMapper, setShowManualMapper] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    createdTransactions: number
    createdAccounts: number
    skippedRows: number
    errors: string[]
    warnings: string[]
  } | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (file: File, result: NordnetParseResult) => {
    setSelectedFile(file)
    setParseResult(result)
    setImportError(null)
  }

  const handleError = (error: string) => {
    setImportError(error)
    setSelectedFile(null)
    setParseResult(null)
  }

  const handleImport = async () => {
    if (!parseResult) return

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(false)

    try {
      // CRITICAL FIX: Simplified CSV import - authentication handled server-side
      console.log('Starting CSV import...')
      const result = await importNordnetTransactions(parseResult)

      console.log('CSV Import result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        debug: result.debug
      })

      // Log debug info to console only
      if (result.debug) {
        console.log('🔍 CSV Import Debug Info:', {
          parsedRows: result.debug.parsedRows,
          transformedRows: result.debug.transformedRows,
          transformErrors: result.debug.transformErrors,
          sampleTransactions: result.debug.sampleTransactions,
          platformId: result.debug.platformId
        })
      }

      if (result.success && result.data) {
        // Import was successful
        setImportSuccess(true)
        setImportSummary({
          createdTransactions: result.data.createdTransactions,
          createdAccounts: result.data.createdAccounts,
          skippedRows: result.data.skippedRows,
          errors: result.data.errors,
          warnings: result.data.warnings,
        })

        // Notify parent component to refresh data
        onImportComplete?.()

        // Show success for a moment, then close
        setTimeout(() => {
          onClose()
          // Reset state
          setSelectedFile(null)
          setParseResult(null)
          setImportError(null)
          setImportSuccess(false)
          setImportSummary(null)
        }, 3000)
      } else {
        // Import failed - provide detailed error information
        const errorMsg = result.error || 'Import failed with unknown error'
        console.error('CSV Import Failed:', result.error)
        setImportError(errorMsg)
      }
    } catch (error) {
      console.error('CSV Import Exception:', error)
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Import failed with unknown error'
      setImportError(errorMsg)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null)
      setParseResult(null)
      setImportError(null)
      setImportSuccess(false)
      setShowManualMapper(false)
      setImportSummary(null)
      onClose()
    }
  }

  const handleManualMapping = () => {
    setShowManualMapper(true)
    setImportError(null)
  }

  const handleMappingComplete = async (mappings: any) => {
    if (!parseResult) return

    console.log('🔧 Manual mappings received:', mappings)
    console.log('🔧 Parse result:', parseResult)
    
    // For now, just close the manual mapper and show a message
    setShowManualMapper(false)
    setImportError('Manual mapping er klar! (TODO: Implementer faktisk import med mappings)')
    
    // DO NOT call onImportComplete() yet - that triggers portfolio refresh!
    // onImportComplete?.()
  }

  const handleBackToUpload = () => {
    setShowManualMapper(false)
    setImportError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${
        showManualMapper ? 'max-w-6xl' : 'max-w-2xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <FileUp className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Import CSV</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          {showManualMapper && parseResult ? (
            <SimpleManualMapper
              csvHeaders={parseResult.headers}
              sampleRow={parseResult.rows[0] || {}}
              onComplete={handleMappingComplete}
              onCancel={handleBackToUpload}
            />
          ) : (
            <div className="space-y-6">
            {/* Instructions */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h3 className="mb-2 font-medium text-purple-900">
                Støttede formater:
              </h3>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Nordnet CSV eksport</li>
                <li>• DNB CSV eksport (kommer snart)</li>
                <li>• Generisk CSV format</li>
              </ul>
            </div>

            {/* Upload Zone */}
            <CSVUploadZone
              onFileSelect={handleFileSelect}
              onError={handleError}
              disabled={isImporting}
            />

            {/* Success Display */}
            {importSuccess && importSummary && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">
                    Import vellykket!
                  </h3>
                </div>
                <div className="space-y-1 text-sm text-green-800">
                  <p>
                    • {importSummary.createdTransactions} transaksjoner
                    opprettet
                  </p>
                  <p>• {importSummary.createdAccounts} kontoer opprettet</p>
                  {importSummary.skippedRows > 0 && (
                    <p>• {importSummary.skippedRows} rader hoppet over</p>
                  )}
                  {importSummary.warnings.length > 0 && (
                    <p>• {importSummary.warnings.length} advarsler</p>
                  )}
                </div>
                {importSummary.warnings.length > 0 && (
                  <div className="mt-2 rounded border border-yellow-200 bg-yellow-50 p-2">
                    <p className="mb-1 text-xs font-medium text-yellow-800">
                      Advarsler:
                    </p>
                    {importSummary.warnings
                      .slice(0, 3)
                      .map((warning, index) => (
                        <p key={index} className="text-xs text-yellow-700">
                          • {warning}
                        </p>
                      ))}
                    {importSummary.warnings.length > 3 && (
                      <p className="text-xs text-yellow-700">
                        ... og {importSummary.warnings.length - 3} flere
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-900">Import feilet</h3>
                </div>
                <p className="text-sm text-red-800 mb-3">{importError}</p>
                
                {/* Manual Mapping Option */}
                {parseResult && !showManualMapper && (
                  <div className="border-t border-red-200 pt-3">
                    <p className="text-sm text-red-700 mb-2">
                      Prøv manuell feltmapping for å løse problemet:
                    </p>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleManualMapping()
                      }}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Åpne Manuell Mapping
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Import Actions */}
            {parseResult && !importSuccess && (
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isImporting}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isImporting ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importerer...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      Importer {parseResult.totalRows} transaksjoner
                    </div>
                  )}
                </Button>
              </div>
            )}

            {/* Success Actions */}
            {importSuccess && (
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  onClick={handleClose}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Ferdig
                </Button>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
