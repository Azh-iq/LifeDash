'use client'

// CSV Upload Component
// Drag & drop CSV upload with visual feedback and Nordnet-specific validation

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { NordnetCSVParser } from '@/lib/integrations/nordnet/csv-parser'
import { NordnetParseResult } from '@/lib/integrations/nordnet/types'

interface CSVUploadProps {
  onFileSelect: (file: File, parseResult: NordnetParseResult) => void
  onError: (error: string) => void
  acceptedExtensions?: string[]
  maxFileSizeMB?: number
  disabled?: boolean
  className?: string
}

interface UploadState {
  isDragOver: boolean
  isUploading: boolean
  progress: number
  file: File | null
  parseResult: NordnetParseResult | null
  validationResult: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null
}

export function CSVUploadZone({
  onFileSelect,
  onError,
  acceptedExtensions = ['.csv', '.txt'],
  maxFileSizeMB = 50,
  disabled = false,
  className,
}: CSVUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    progress: 0,
    file: null,
    parseResult: null,
    validationResult: null,
  })

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setUploadState(prev => ({ ...prev, isDragOver: true }))
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUploadState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setUploadState(prev => ({ ...prev, isDragOver: false }))

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelection(files[0])
      }
    },
    [disabled, handleFileSelection]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelection(files[0])
      }
    },
    [handleFileSelection]
  )

  const handleFileSelection = useCallback(
    async (file: File) => {
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        file,
        parseResult: null,
        validationResult: null,
      }))

      try {
        // Validate file
        const validation = NordnetCSVParser.validateFile(file)
        if (!validation.valid) {
          onError(validation.error!)
          setUploadState(prev => ({ ...prev, isUploading: false }))
          return
        }

        // Simulate progress
        setUploadState(prev => ({ ...prev, progress: 25 }))

        // Parse the CSV
        const parseResult = await NordnetCSVParser.parseFile(file)
        setUploadState(prev => ({ ...prev, progress: 75 }))

        // Validate results
        const validationResult = {
          isValid: parseResult.errors.length === 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        }

        setUploadState(prev => ({
          ...prev,
          progress: 100,
          parseResult,
          validationResult,
          isUploading: false,
        }))

        // Call success callback if valid
        if (validationResult.isValid) {
          onFileSelect(file, parseResult)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'
        onError(errorMessage)
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          progress: 0,
        }))
      }
    },
    [onFileSelect, onError]
  )

  const handleRemoveFile = useCallback(() => {
    setUploadState({
      isDragOver: false,
      isUploading: false,
      progress: 0,
      file: null,
      parseResult: null,
      validationResult: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <motion.div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors duration-200',
          uploadState.isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled &&
            'cursor-pointer hover:border-gray-400 dark:hover:border-gray-600'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
      >
        <div className="p-8 text-center">
          <AnimatePresence mode="wait">
            {uploadState.isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="mx-auto h-12 w-12 text-blue-500">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Upload className="h-12 w-12" />
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processing CSV file...</p>
                  <Progress value={uploadState.progress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    {uploadState.progress}% complete
                  </p>
                </div>
              </motion.div>
            ) : uploadState.file ? (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{uploadState.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploadState.parseResult && (
                    <div className="flex items-center justify-center space-x-4 text-xs">
                      <Badge variant="secondary">
                        {uploadState.parseResult.totalRows} rows
                      </Badge>
                      <Badge variant="secondary">
                        {uploadState.parseResult.headers.length} columns
                      </Badge>
                      <Badge variant="secondary">
                        {uploadState.parseResult.detectedEncoding}
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload Nordnet CSV</p>
                  <p className="text-sm text-gray-500">
                    Drag and drop your Nordnet CSV export file here, or click to
                    browse
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <span>Supports: {acceptedExtensions.join(', ')}</span>
                    <span>•</span>
                    <span>Max: {maxFileSizeMB}MB</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </motion.div>

      {/* Validation Results */}
      {uploadState.validationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          {uploadState.validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="space-y-1 text-sm">
                    {uploadState.validationResult.errors.map((error, index) => (
                      <li key={index} className="list-inside list-disc">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {uploadState.validationResult.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Warnings:</p>
                  <ul className="space-y-1 text-sm">
                    {uploadState.validationResult.warnings.map(
                      (warning, index) => (
                        <li key={index} className="list-inside list-disc">
                          {warning}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {uploadState.validationResult.isValid && uploadState.parseResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    CSV file processed successfully!
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <div>
                      <span className="font-medium">Transactions:</span>{' '}
                      {uploadState.parseResult.totalRows}
                    </div>
                    <div>
                      <span className="font-medium">Portfolios:</span>{' '}
                      {uploadState.parseResult.portfolios.length}
                    </div>
                    <div>
                      <span className="font-medium">Currencies:</span>{' '}
                      {uploadState.parseResult.currencies.length}
                    </div>
                    <div>
                      <span className="font-medium">Stocks:</span>{' '}
                      {uploadState.parseResult.isinCodes.length}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      )}

      {/* File Details */}
      {uploadState.parseResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Summary</CardTitle>
              <CardDescription>
                Detected {uploadState.parseResult.totalRows} transactions from{' '}
                {uploadState.parseResult.portfolios.length} portfolios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portfolios */}
              {uploadState.parseResult.portfolios.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Portfolios Found:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {uploadState.parseResult.portfolios.map(
                      (portfolio, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {portfolio}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Types */}
              {uploadState.parseResult.transactionTypes.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Transaction Types:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {uploadState.parseResult.transactionTypes.map(
                      (type, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {type}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Currencies */}
              {uploadState.parseResult.currencies.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Currencies:</h4>
                  <div className="flex flex-wrap gap-1">
                    {uploadState.parseResult.currencies.map(
                      (currency, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {currency}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="space-y-1 border-t pt-2 text-xs text-gray-500">
                <div>Encoding: {uploadState.parseResult.detectedEncoding}</div>
                <div>
                  Delimiter: &quot;{uploadState.parseResult.detectedDelimiter}
                  &quot;
                </div>
                <div>
                  Norwegian Characters:{' '}
                  {uploadState.parseResult.hasNorwegianCharacters
                    ? 'Yes'
                    : 'No'}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default CSVUploadZone
