'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadZone } from '@/components/features/import/upload-zone'
import { FieldMapper } from '@/components/features/import/field-mapper'
import { usePortfolios } from '@/lib/hooks/use-portfolio'
import { 
  type CSVParseResult, 
  type ColumnMapping, 
  type ImportValidationResult 
} from '@/lib/utils/csv/parser'
import { cn } from '@/lib/utils'

// Define target field schemas for different import types
const PORTFOLIO_FIELDS = [
  { key: 'name', label: 'Portfolio Name', required: true, dataType: 'string' as const, description: 'The name of the portfolio', example: 'My Investment Portfolio' },
  { key: 'description', label: 'Description', required: false, dataType: 'string' as const, description: 'Optional portfolio description' },
  { key: 'type', label: 'Portfolio Type', required: true, dataType: 'string' as const, description: 'INVESTMENT, RETIREMENT, SAVINGS, or TRADING', example: 'INVESTMENT' },
  { key: 'is_public', label: 'Public', required: false, dataType: 'boolean' as const, description: 'Whether the portfolio is public', example: 'false' },
]

const HOLDINGS_FIELDS = [
  { key: 'portfolio_name', label: 'Portfolio Name', required: true, dataType: 'string' as const, description: 'Name of the portfolio to add holdings to' },
  { key: 'symbol', label: 'Stock Symbol', required: true, dataType: 'string' as const, description: 'Stock ticker symbol', example: 'AAPL' },
  { key: 'quantity', label: 'Quantity', required: true, dataType: 'number' as const, description: 'Number of shares', example: '100' },
  { key: 'average_cost', label: 'Average Cost', required: true, dataType: 'number' as const, description: 'Average cost per share', example: '150.00' },
  { key: 'purchase_date', label: 'Purchase Date', required: false, dataType: 'date' as const, description: 'Date of purchase', example: '2023-01-15' },
]

const TRANSACTIONS_FIELDS = [
  { key: 'date', label: 'Date', required: true, dataType: 'date' as const, description: 'Transaction date', example: '2023-01-15' },
  { key: 'type', label: 'Type', required: true, dataType: 'string' as const, description: 'BUY, SELL, or DIVIDEND', example: 'BUY' },
  { key: 'symbol', label: 'Symbol', required: true, dataType: 'string' as const, description: 'Stock ticker symbol', example: 'AAPL' },
  { key: 'quantity', label: 'Quantity', required: true, dataType: 'number' as const, description: 'Number of shares', example: '100' },
  { key: 'price', label: 'Price', required: true, dataType: 'number' as const, description: 'Price per share', example: '150.00' },
  { key: 'portfolio_name', label: 'Portfolio', required: true, dataType: 'string' as const, description: 'Portfolio name for the transaction' },
  { key: 'notes', label: 'Notes', required: false, dataType: 'string' as const, description: 'Optional transaction notes' },
]

type ImportType = 'portfolio' | 'holdings' | 'transactions'
type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ImportProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: string[]
}

export default function ImportUploadPage() {
  const router = useRouter()
  const { portfolios } = usePortfolios()
  
  // State management
  const [step, setStep] = useState<ImportStep>('upload')
  const [importType, setImportType] = useState<ImportType>('portfolio')
  const [csvData, setCsvData] = useState<CSVParseResult | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  })

  const getCurrentFields = () => {
    switch (importType) {
      case 'portfolio': return PORTFOLIO_FIELDS
      case 'holdings': return HOLDINGS_FIELDS
      case 'transactions': return TRANSACTIONS_FIELDS
      default: return PORTFOLIO_FIELDS
    }
  }

  const handleFileUpload = (result: CSVParseResult, file: File) => {
    setCsvData(result)
    setUploadedFile(file)
    setStep('mapping')
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // Could show toast notification here
  }

  const handleMappingComplete = (columnMappings: ColumnMapping[], validation: ImportValidationResult) => {
    setMappings(columnMappings)
    setValidationResult(validation)
    setStep('preview')
  }

  const handleBackToUpload = () => {
    setStep('upload')
    setCsvData(null)
    setUploadedFile(null)
    setMappings([])
    setValidationResult(null)
  }

  const handleBackToMapping = () => {
    setStep('mapping')
  }

  const simulateImport = async () => {
    if (!validationResult) return

    setStep('importing')
    const totalRows = validationResult.processedRows.length
    
    setProgress({
      total: totalRows,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    })

    // Simulate processing each row with delays
    for (let i = 0; i < totalRows; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate processing time
      
      // Simulate some failures (10% chance)
      const isSuccess = Math.random() > 0.1
      
      setProgress(prev => ({
        ...prev,
        processed: i + 1,
        successful: isSuccess ? prev.successful + 1 : prev.successful,
        failed: isSuccess ? prev.failed : prev.failed + 1,
        errors: isSuccess ? prev.errors : [...prev.errors, `Row ${i + 2}: Simulated import error`]
      }))
    }

    // Complete after a short delay
    setTimeout(() => {
      setStep('complete')
    }, 500)
  }

  const handleStartOver = () => {
    setStep('upload')
    setImportType('portfolio')
    setCsvData(null)
    setUploadedFile(null)
    setMappings([])
    setValidationResult(null)
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    })
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload' },
      { key: 'mapping', label: 'Map Fields' },
      { key: 'preview', label: 'Preview' },
      { key: 'importing', label: 'Import' },
      { key: 'complete', label: 'Complete' },
    ]

    const currentIndex = steps.findIndex(s => s.key === step)

    return (
      <div className="flex items-center justify-center space-x-2 mb-8">
        {steps.map((stepItem, index) => (
          <div key={stepItem.key} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              index <= currentIndex 
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            )}>
              {index + 1}
            </div>
            <span className={cn(
              'ml-2 text-sm font-medium',
              index <= currentIndex ? 'text-blue-600' : 'text-gray-500'
            )}>
              {stepItem.label}
            </span>
            {index < steps.length - 1 && (
              <div className={cn(
                'w-12 h-0.5 ml-4',
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Data</h1>
        <p className="text-gray-600">
          Import your portfolios, holdings, or transactions from a CSV file
        </p>
      </div>

      {/* Import Type Selection */}
      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">What would you like to import?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'portfolio' as const, label: 'Portfolios', description: 'Import portfolio information' },
            { type: 'holdings' as const, label: 'Holdings', description: 'Import stock holdings to existing portfolios' },
            { type: 'transactions' as const, label: 'Transactions', description: 'Import transaction history' },
          ].map((option) => (
            <button
              key={option.type}
              onClick={() => setImportType(option.type)}
              className={cn(
                'p-4 border rounded-lg text-left transition-all',
                importType === option.type
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <h3 className="font-medium text-gray-900">{option.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <UploadZone
        onFileUploaded={handleFileUpload}
        onError={handleUploadError}
      />
    </div>
  )

  const renderMappingStep = () => {
    if (!csvData) return null

    return (
      <FieldMapper
        headers={csvData.headers}
        rows={csvData.rows}
        targetFields={getCurrentFields()}
        onMappingComplete={handleMappingComplete}
        onBack={handleBackToUpload}
      />
    )
  }

  const renderPreviewStep = () => {
    if (!validationResult || !csvData || !uploadedFile) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review your data before importing
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToMapping}>
            Back to Mapping
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900">{uploadedFile.name}</div>
            <div className="text-sm text-gray-600">File Name</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900">{csvData.totalRows}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{validationResult.processedRows.length}</div>
            <div className="text-sm text-gray-600">Valid Rows</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </Card>
        </div>

        {/* Validation Summary */}
        {validationResult.errors.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium text-red-800 mb-3">
              Import Errors ({validationResult.errors.length})
            </h3>
            <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
              {validationResult.errors.slice(0, 20).map((error, index) => (
                <div key={index} className="text-sm text-red-700 mb-1">{error}</div>
              ))}
              {validationResult.errors.length > 20 && (
                <div className="text-sm text-red-600 italic">
                  +{validationResult.errors.length - 20} more errors...
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Data Preview */}
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Data Preview (First 10 Rows)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  {getCurrentFields().filter(f => mappings.find(m => m.targetField === f.key)?.csvColumn).map((field) => (
                    <th key={field.key} className="text-left p-2 font-medium text-gray-700 bg-gray-50">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validationResult.processedRows.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    {getCurrentFields().filter(f => mappings.find(m => m.targetField === f.key)?.csvColumn).map((field) => (
                      <td key={field.key} className="p-2 text-gray-600 max-w-32 truncate">
                        {String(row[field.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            onClick={simulateImport}
            disabled={validationResult.processedRows.length === 0}
            className="px-8"
          >
            Start Import ({validationResult.processedRows.length} rows)
          </Button>
        </div>
      </div>
    )
  }

  const renderImportingStep = () => {
    const progressPercent = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Importing Data</h2>
          <p className="text-gray-600">
            Please wait while we import your data...
          </p>
        </div>

        <Card className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.processed}</div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center text-sm text-gray-600">
            {progress.processed < progress.total ? (
              <>Processing row {progress.processed} of {progress.total}...</>
            ) : (
              <>Import completed!</>
            )}
          </div>
        </Card>
      </div>
    )
  }

  const renderCompleteStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
      <p className="text-gray-600 mb-8">
        Your data has been successfully imported.
      </p>

      {/* Final Summary */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
            <div className="text-sm text-gray-600">Rows Imported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
            <div className="text-sm text-gray-600">Rows Failed</div>
          </div>
          <div className="text-center md:col-span-1 col-span-2">
            <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
        </div>

        {progress.failed > 0 && progress.errors.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-red-800 mb-3">Failed Rows</h4>
            <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto text-left">
              {progress.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm text-red-700 mb-1">{error}</div>
              ))}
              {progress.errors.length > 10 && (
                <div className="text-sm text-red-600 italic">
                  +{progress.errors.length - 10} more errors...
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button onClick={handleStartOver} variant="outline">
          Import More Data
        </Button>
        <Button onClick={() => router.push('/portfolios' as any)}>
          View Portfolios
        </Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6">
        {renderStepIndicator()}
        
        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </DashboardLayout>
  )
}