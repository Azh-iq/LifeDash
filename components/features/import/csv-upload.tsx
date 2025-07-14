'use client'

// CSV Upload Component
// Drag & drop CSV upload with visual feedback and Nordnet-specific validation

import React, { useState, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors duration-200',
          uploadState.isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer hover:border-gray-400'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          {uploadState.isUploading ? (
            <div className="space-y-4">
              <div className="text-sm">Prosesserer...</div>
            </div>
          ) : uploadState.file ? (
            <div className="space-y-4">
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
                {uploadState.parseResult && (
                  <div className="text-sm text-gray-500">
                    {uploadState.parseResult.totalRows} rader funnet
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Upload CSV</p>
                <p className="text-sm text-gray-500">
                  Dra og slipp CSV-filen her, eller klikk for å velge
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Simple Status */}
      {uploadState.validationResult && uploadState.parseResult && (
        <div className="mt-4">
          {uploadState.validationResult.errors.length > 0 ? (
            <div className="text-sm text-red-600">
              Feil i CSV-filen. Bruk manuell mapping.
            </div>
          ) : (
            <div className="text-sm text-green-600">
              ✓ {uploadState.parseResult.totalRows} transaksjoner klare for import
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CSVUploadZone
