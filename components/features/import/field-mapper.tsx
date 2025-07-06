'use client'

// Field Mapper Component
// Visual interface for mapping CSV fields to internal database structure

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Info,
  Shuffle,
  RotateCcw,
  Eye,
  EyeOff,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  NordnetFieldMapping,
  NordnetCSVRow,
  NordnetParseResult,
} from '@/lib/integrations/nordnet/types'
import { NordnetFieldMapper } from '@/lib/integrations/nordnet/field-mapping'

interface FieldMapperProps {
  parseResult: NordnetParseResult
  onMappingChange: (mappings: NordnetFieldMapping[]) => void
  onValidationChange: (
    isValid: boolean,
    errors: string[],
    warnings: string[]
  ) => void
  className?: string
}

interface MappingState {
  mappings: NordnetFieldMapping[]
  autoMappings: NordnetFieldMapping[]
  showPreview: boolean
  previewRowIndex: number
  validationResult: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
}

export function FieldMapper({
  parseResult,
  onMappingChange,
  onValidationChange,
  className,
}: FieldMapperProps) {
  const [state, setState] = useState<MappingState>({
    mappings: [],
    autoMappings: [],
    showPreview: false,
    previewRowIndex: 0,
    validationResult: { valid: false, errors: [], warnings: [] },
  })

  // Initialize with auto-detected mappings
  useEffect(() => {
    const autoMappings = NordnetFieldMapper.autoDetectMappings(
      parseResult.headers
    )
    const validation = NordnetFieldMapper.validateMappings(
      autoMappings,
      parseResult.headers
    )

    setState(prev => ({
      ...prev,
      mappings: autoMappings,
      autoMappings,
      validationResult: validation,
    }))

    onMappingChange(autoMappings)
    onValidationChange(validation.valid, validation.errors, validation.warnings)
  }, [parseResult.headers, onMappingChange, onValidationChange])

  const handleMappingChange = useCallback(
    (
      index: number,
      field: 'csvField' | 'internalField' | 'required',
      value: string | boolean
    ) => {
      setState(prev => {
        const newMappings = [...prev.mappings]
        newMappings[index] = { ...newMappings[index], [field]: value }

        const validation = NordnetFieldMapper.validateMappings(
          newMappings,
          parseResult.headers
        )

        onMappingChange(newMappings)
        onValidationChange(
          validation.valid,
          validation.errors,
          validation.warnings
        )

        return {
          ...prev,
          mappings: newMappings,
          validationResult: validation,
        }
      })
    },
    [parseResult.headers, onMappingChange, onValidationChange]
  )

  const handleAddMapping = useCallback(() => {
    const newMapping: NordnetFieldMapping = {
      csvField: '' as keyof NordnetCSVRow,
      internalField: '',
      required: false,
      dataType: 'string',
    }

    setState(prev => ({
      ...prev,
      mappings: [...prev.mappings, newMapping],
    }))
  }, [])

  const handleRemoveMapping = useCallback(
    (index: number) => {
      setState(prev => {
        const newMappings = prev.mappings.filter((_, i) => i !== index)
        const validation = NordnetFieldMapper.validateMappings(
          newMappings,
          parseResult.headers
        )

        onMappingChange(newMappings)
        onValidationChange(
          validation.valid,
          validation.errors,
          validation.warnings
        )

        return {
          ...prev,
          mappings: newMappings,
          validationResult: validation,
        }
      })
    },
    [parseResult.headers, onMappingChange, onValidationChange]
  )

  const handleResetToAuto = useCallback(() => {
    setState(prev => {
      const validation = NordnetFieldMapper.validateMappings(
        prev.autoMappings,
        parseResult.headers
      )

      onMappingChange(prev.autoMappings)
      onValidationChange(
        validation.valid,
        validation.errors,
        validation.warnings
      )

      return {
        ...prev,
        mappings: [...prev.autoMappings],
        validationResult: validation,
      }
    })
  }, [parseResult.headers, onMappingChange, onValidationChange])

  const handleAutoSuggest = useCallback(() => {
    const suggestions = NordnetFieldMapper.generateMappingSuggestions(
      parseResult.headers
    )

    setState(prev => {
      const newMappings = [...prev.mappings]

      // Apply suggestions with high confidence
      for (const suggestion of suggestions) {
        if (suggestion.confidence > 0.7) {
          const existingIndex = newMappings.findIndex(
            m => m.csvField === suggestion.csvField
          )
          if (existingIndex >= 0) {
            newMappings[existingIndex] = {
              ...newMappings[existingIndex],
              internalField: suggestion.suggestedInternalField,
            }
          }
        }
      }

      const validation = NordnetFieldMapper.validateMappings(
        newMappings,
        parseResult.headers
      )

      onMappingChange(newMappings)
      onValidationChange(
        validation.valid,
        validation.errors,
        validation.warnings
      )

      return {
        ...prev,
        mappings: newMappings,
        validationResult: validation,
      }
    })
  }, [parseResult.headers, onMappingChange, onValidationChange])

  const togglePreview = useCallback(() => {
    setState(prev => ({ ...prev, showPreview: !prev.showPreview }))
  }, [])

  const getAvailableInternalFields = useCallback(() => {
    return NordnetFieldMapper.DEFAULT_MAPPINGS.map(m => ({
      value: m.internalField,
      label: m.internalField
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()),
      required: m.required,
      dataType: m.dataType,
    }))
  }, [])

  const getUnmappedHeaders = useCallback(() => {
    const mappedHeaders = new Set(state.mappings.map(m => m.csvField))
    return parseResult.headers.filter(
      header => !mappedHeaders.has(header as keyof NordnetCSVRow)
    )
  }, [parseResult.headers, state.mappings])

  const previewTransformation = useCallback(() => {
    if (parseResult.rows.length === 0) return null

    const sampleRow = parseResult.rows[state.previewRowIndex]
    return NordnetFieldMapper.transformRow(sampleRow, state.mappings)
  }, [parseResult.rows, state.previewRowIndex, state.mappings])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                Map CSV columns to internal fields. {state.mappings.length}{' '}
                mappings configured.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleAutoSuggest}>
                <Shuffle className="mr-2 h-4 w-4" />
                Auto Suggest
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetToAuto}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {state.showPreview ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Results */}
      <AnimatePresence>
        {(state.validationResult.errors.length > 0 ||
          state.validationResult.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {state.validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Mapping Errors:</p>
                    <ul className="space-y-1 text-sm">
                      {state.validationResult.errors.map((error, index) => (
                        <li key={index} className="list-inside list-disc">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {state.validationResult.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Mapping Warnings:</p>
                    <ul className="space-y-1 text-sm">
                      {state.validationResult.warnings.map((warning, index) => (
                        <li key={index} className="list-inside list-disc">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mapping Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Field Mappings</CardTitle>
          <CardDescription>
            Configure how CSV columns map to internal database fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {state.mappings.map((mapping, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  {/* CSV Field */}
                  <div className="flex-1">
                    <Label className="text-xs font-medium">CSV Column</Label>
                    <Select
                      value={mapping.csvField as string}
                      onValueChange={value =>
                        handleMappingChange(index, 'csvField', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CSV column" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseResult.headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Internal Field */}
                  <div className="flex-1">
                    <Label className="text-xs font-medium">
                      Internal Field
                    </Label>
                    <Select
                      value={mapping.internalField}
                      onValueChange={value => {
                        const internalField = getAvailableInternalFields().find(
                          f => f.value === value
                        )
                        handleMappingChange(index, 'internalField', value)
                        if (internalField) {
                          handleMappingChange(
                            index,
                            'required',
                            internalField.required
                          )
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select internal field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableInternalFields().map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <span>{field.label}</span>
                              {field.required && (
                                <Badge variant="secondary" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {field.dataType}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Required Toggle */}
                  <div className="flex flex-shrink-0 items-center space-x-2">
                    <Switch
                      checked={mapping.required}
                      onCheckedChange={checked =>
                        handleMappingChange(index, 'required', checked)
                      }
                    />
                    <Label className="text-xs">Required</Label>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMapping(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}

              {/* Add Mapping Button */}
              <Button
                variant="outline"
                onClick={handleAddMapping}
                className="w-full"
                disabled={getUnmappedHeaders().length === 0}
              >
                Add Mapping
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Unmapped Headers */}
      {getUnmappedHeaders().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unmapped Columns</CardTitle>
            <CardDescription>
              CSV columns that haven&apos;t been mapped yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getUnmappedHeaders().map(header => (
                <Badge
                  key={header}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleAddMapping}
                >
                  {header}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <AnimatePresence>
        {state.showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Transformation Preview
                    </CardTitle>
                    <CardDescription>
                      Preview how the first row will be transformed
                    </CardDescription>
                  </div>
                  {parseResult.rows.length > 1 && (
                    <Select
                      value={state.previewRowIndex.toString()}
                      onValueChange={value =>
                        setState(prev => ({
                          ...prev,
                          previewRowIndex: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {parseResult.rows.slice(0, 10).map((_, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            Row {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Original Data */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Original CSV Data:
                    </h4>
                    <div className="rounded-lg bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(
                          parseResult.rows[state.previewRowIndex],
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  {/* Transformed Data */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Transformed Data:
                    </h4>
                    <div className="rounded-lg bg-blue-50 p-3 font-mono text-sm dark:bg-blue-900/20">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(previewTransformation(), null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Validation Status */}
                  {previewTransformation() && (
                    <div className="flex items-center space-x-2 text-sm">
                      {previewTransformation()!.validation_errors.length ===
                      0 ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">
                            Valid transformation
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">
                            {previewTransformation()!.validation_errors.length}{' '}
                            validation errors
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FieldMapper
