'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CSVParser, type CSVRow, type ColumnMapping, type ImportValidationResult } from '@/lib/utils/csv/parser'
import { cn } from '@/lib/utils'

interface FieldDefinition {
  key: string
  label: string
  required: boolean
  dataType: 'string' | 'number' | 'date' | 'boolean'
  description?: string
  example?: string
}

interface FieldMapperProps {
  headers: string[]
  rows: CSVRow[]
  targetFields: FieldDefinition[]
  onMappingComplete: (mappings: ColumnMapping[], validationResult: ImportValidationResult) => void
  onBack: () => void
  className?: string
}

const DATA_TYPE_COLORS = {
  string: 'bg-blue-100 text-blue-800',
  number: 'bg-green-100 text-green-800',
  date: 'bg-purple-100 text-purple-800',
  boolean: 'bg-yellow-100 text-yellow-800',
}

const DATA_TYPE_ICONS = {
  string: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-2l-4 4z" />
    </svg>
  ),
  number: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  date: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  boolean: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function FieldMapper({
  headers,
  rows,
  targetFields,
  onMappingComplete,
  onBack,
  className
}: FieldMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [previewRows, setPreviewRows] = useState(5)

  // Auto-detect column mappings on mount
  useEffect(() => {
    const autoMappings: ColumnMapping[] = targetFields.map(field => {
      // Try to find exact match first
      let csvColumn = headers.find(header => 
        header.toLowerCase() === field.key.toLowerCase() ||
        header.toLowerCase() === field.label.toLowerCase()
      )

      // Try partial matches
      if (!csvColumn) {
        csvColumn = headers.find(header => {
          const headerLower = header.toLowerCase()
          const fieldLower = field.key.toLowerCase()
          return headerLower.includes(fieldLower) || fieldLower.includes(headerLower)
        })
      }

      return {
        csvColumn: csvColumn || '',
        targetField: field.key,
        required: field.required,
        dataType: field.dataType,
      }
    })

    setMappings(autoMappings)
  }, [headers, targetFields])

  // Validate mappings whenever they change
  useEffect(() => {
    if (mappings.length > 0) {
      const result = CSVParser.validateAndTransformData(rows, mappings)
      setValidationResult(result)
    }
  }, [mappings, rows])

  // Get sample values for a CSV column
  const getSampleValues = (csvColumn: string) => {
    if (!csvColumn) return []
    return rows.slice(0, 5).map(row => row[csvColumn]).filter(value => value && value.trim() !== '')
  }

  // Auto-detect data type for a CSV column
  const detectDataType = (csvColumn: string) => {
    if (!csvColumn) return 'string'
    const values = rows.slice(0, 20).map(row => row[csvColumn]).filter(v => v && v.trim() !== '')
    return CSVParser.detectDataType(values)
  }

  const updateMapping = (targetField: string, csvColumn: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.targetField === targetField 
          ? { ...mapping, csvColumn }
          : mapping
      )
    )
  }

  const handleContinue = () => {
    if (validationResult) {
      onMappingComplete(mappings, validationResult)
    }
  }

  const requiredMappings = mappings.filter(m => m.required)
  const missingRequired = requiredMappings.filter(m => !m.csvColumn)
  const canContinue = missingRequired.length === 0 && (validationResult?.processedRows.length || 0) > 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Map Your Fields</h2>
          <p className="text-sm text-gray-600 mt-1">
            Match your CSV columns to the target fields. Required fields must be mapped.
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{headers.length}</div>
          <div className="text-sm text-gray-600">CSV Columns</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{rows.length}</div>
          <div className="text-sm text-gray-600">Data Rows</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {mappings.filter(m => m.csvColumn).length}/{targetFields.length}
          </div>
          <div className="text-sm text-gray-600">Fields Mapped</div>
        </Card>
        <Card className="p-4">
          <div className={cn(
            "text-2xl font-bold",
            validationResult?.valid ? "text-green-600" : "text-red-600"
          )}>
            {validationResult?.processedRows.length || 0}
          </div>
          <div className="text-sm text-gray-600">Valid Rows</div>
        </Card>
      </div>

      {/* Field Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Target Fields */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Target Fields</h3>
          <div className="space-y-3">
            {targetFields.map((field) => {
              const mapping = mappings.find(m => m.targetField === field.key)
              const csvColumn = mapping?.csvColumn || ''
              const sampleValues = getSampleValues(csvColumn)
              const detectedType = csvColumn ? detectDataType(csvColumn) : 'string'
              const typeMatch = detectedType === field.dataType

              return (
                <Card key={field.key} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{field.label}</h4>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge className={cn('text-xs', DATA_TYPE_COLORS[field.dataType])}>
                          <div className="flex items-center space-x-1">
                            {DATA_TYPE_ICONS[field.dataType]}
                            <span>{field.dataType}</span>
                          </div>
                        </Badge>
                      </div>
                      {field.description && (
                        <p className="text-xs text-gray-600 mb-2">{field.description}</p>
                      )}
                      {field.example && (
                        <p className="text-xs text-gray-500">Example: {field.example}</p>
                      )}
                    </div>
                  </div>

                  {/* Column Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Map to CSV Column:
                    </label>
                    <select
                      value={csvColumn}
                      onChange={(e) => updateMapping(field.key, e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md text-sm",
                        !csvColumn && field.required 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      )}
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>

                    {/* Data Type Warning */}
                    {csvColumn && !typeMatch && (
                      <div className="flex items-center space-x-1 text-xs text-yellow-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Expected {field.dataType}, detected {detectedType}</span>
                      </div>
                    )}

                    {/* Sample Values */}
                    {sampleValues.length > 0 && (
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Sample values:</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {sampleValues.slice(0, 3).map((value, index) => (
                            <div key={index} className="truncate">{value}</div>
                          ))}
                          {sampleValues.length > 3 && (
                            <div className="text-gray-500">+{sampleValues.length - 3} more...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Show rows:</label>
              <select
                value={previewRows}
                onChange={(e) => setPreviewRows(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* CSV Preview */}
          <Card className="p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Original CSV Data</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {headers.map((header) => (
                      <th key={header} className="text-left p-2 font-medium text-gray-700 bg-gray-50">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, previewRows).map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {headers.map((header) => (
                        <td key={header} className="p-2 text-gray-600 max-w-32 truncate">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mapped Preview */}
          {validationResult && validationResult.processedRows.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Mapped Data Preview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {targetFields.filter(f => mappings.find(m => m.targetField === f.key)?.csvColumn).map((field) => (
                        <th key={field.key} className="text-left p-2 font-medium text-gray-700 bg-gray-50">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.processedRows.slice(0, previewRows).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {targetFields.filter(f => mappings.find(m => m.targetField === f.key)?.csvColumn).map((field) => (
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
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Validation Results</h3>
          
          {validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-800 mb-2">Errors ({validationResult.errors.length})</h4>
              <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                {validationResult.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">{error}</div>
                ))}
                {validationResult.errors.length > 10 && (
                  <div className="text-sm text-red-600 italic">
                    +{validationResult.errors.length - 10} more errors...
                  </div>
                )}
              </div>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Warnings ({validationResult.warnings.length})</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 max-h-32 overflow-y-auto">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-700 mb-1">{warning}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {validationResult.processedRows.length} of {rows.length} rows will be imported
              {validationResult.errors.length > 0 && (
                <span className="text-red-600 ml-2">
                  ({rows.length - validationResult.processedRows.length} rows have errors)
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <div>
          {missingRequired.length > 0 && (
            <p className="text-sm text-red-600">
              Please map all required fields: {missingRequired.map(m => m.targetField).join(', ')}
            </p>
          )}
        </div>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="px-8"
        >
          Continue to Import
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )
}