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

export default function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<NordnetParseResult | null>(null)
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileUp className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Import CSV</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Støttede formater:</h3>
              <ul className="text-sm text-purple-700 space-y-1">
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{importError}</p>
              </div>
            )}

            {/* Import Actions */}
            {parseResult && (
              <div className="flex justify-end gap-3 pt-4 border-t">
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
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Importerer...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
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