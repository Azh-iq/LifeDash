'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CSVParser, type CSVParseResult } from '@/lib/utils/csv/parser'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFileUploaded: (result: CSVParseResult, file: File) => void
  onError: (error: string) => void
  acceptedTypes?: string[]
  maxSizeBytes?: number
  className?: string
}

export function UploadZone({
  onFileUploaded,
  onError,
  acceptedTypes = ['.csv', '.txt'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  className
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      const result = await CSVParser.parseCSV(file)
      if (result.errors.length > 0 && result.rows.length === 0) {
        onError(result.errors[0])
      } else {
        onFileUploaded(result, file)
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }, [onFileUploaded, onError])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the dropzone itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    handleFile(file)
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    handleFile(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const downloadSample = useCallback((type: 'portfolio' | 'holdings' | 'transactions') => {
    const csv = CSVParser.generateSampleCSV(type)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sample-${type}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <Card
        className={cn(
          'relative border-2 border-dashed transition-all duration-200 cursor-pointer',
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          isProcessing && 'pointer-events-none opacity-60'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="p-8 text-center">
          {isProcessing ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Processing file...</h3>
                <p className="text-sm text-gray-600">Please wait while we parse your CSV data</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragging ? 'Drop your CSV file here' : 'Upload your CSV file'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge variant="secondary">CSV files only</Badge>
                  <Badge variant="secondary">Max {formatFileSize(maxSizeBytes)}</Badge>
                </div>

                <Button variant="outline" className="mb-4">
                  Choose File
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sample Files */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Don't have a CSV file? Download a sample:
        </h4>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSample('portfolio')}
            disabled={isProcessing}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Portfolio Sample
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSample('holdings')}
            disabled={isProcessing}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Holdings Sample
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSample('transactions')}
            disabled={isProcessing}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Transactions Sample
          </Button>
        </div>
      </div>

      {/* File Requirements */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">File Requirements:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• CSV format with comma-separated values</li>
          <li>• First row must contain column headers</li>
          <li>• Maximum file size: {formatFileSize(maxSizeBytes)}</li>
          <li>• Supported file extensions: {acceptedTypes.join(', ')}</li>
          <li>• Use double quotes for values containing commas</li>
        </ul>
      </div>
    </div>
  )
}

// Simplified upload zone for inline use
export function SimpleUploadZone({ 
  onFileUploaded, 
  onError,
  className 
}: Pick<UploadZoneProps, 'onFileUploaded' | 'onError' | 'className'>) {
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      const result = await CSVParser.parseCSV(file)
      if (result.errors.length > 0 && result.rows.length === 0) {
        onError(result.errors[0])
      } else {
        onFileUploaded(result, file)
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }, [onFileUploaded, onError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    handleFile(files[0])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  return (
    <div className={cn('inline-block', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        loading={isProcessing}
        disabled={isProcessing}
        variant="outline"
      >
        {isProcessing ? 'Processing...' : 'Upload CSV'}
      </Button>
    </div>
  )
}