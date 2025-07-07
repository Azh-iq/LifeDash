'use client'

import { useState } from 'react'
import { X, FileUp, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVUploadZone } from '@/components/features/import/csv-upload'
import { NordnetParseResult } from '@/lib/integrations/nordnet/types'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: (result: NordnetParseResult) => void
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
    try {
      // Here you would normally save the data to your database
      // For now we'll just simulate the import
      await new Promise(resolve => setTimeout(resolve, 2000))

      onImportComplete?.(parseResult)
      onClose()

      // Reset state
      setSelectedFile(null)
      setParseResult(null)
      setImportError(null)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null)
      setParseResult(null)
      setImportError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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

            {/* Error Display */}
            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{importError}</p>
              </div>
            )}

            {/* Import Actions */}
            {parseResult && (
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
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importerer...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Importer {parseResult.totalRows} transaksjoner
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
