'use client'

// Import Preview Component
// Preview transformed data before importing to database

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Download,
  Filter,
  Search,
  Eye,
  Database,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  NordnetTransactionData,
  NordnetFieldMapping,
  NordnetParseResult,
  NordnetImportConfig
} from '@/lib/integrations/nordnet/types'
import { NordnetFieldMapper } from '@/lib/integrations/nordnet/field-mapping'
import { NordnetTransactionTransformer } from '@/lib/integrations/nordnet/transaction-transformer'

interface ImportPreviewProps {
  parseResult: NordnetParseResult
  mappings: NordnetFieldMapping[]
  onImport: (config: NordnetImportConfig) => Promise<void>
  onCancel: () => void
  className?: string
}

interface PreviewState {
  transformedData: NordnetTransactionData[]
  filteredData: NordnetTransactionData[]
  searchTerm: string
  filterType: 'all' | 'valid' | 'warnings' | 'errors'
  selectedRows: Set<number>
  currentPage: number
  pageSize: number
  isTransforming: boolean
  transformProgress: number
  stats: {
    total: number
    valid: number
    warnings: number
    errors: number
    portfolios: Set<string>
    transactionTypes: Set<string>
    currencies: Set<string>
    totalAmount: number
  }
}

export function ImportPreview({
  parseResult,
  mappings,
  onImport,
  onCancel,
  className
}: ImportPreviewProps) {
  const [state, setState] = useState<PreviewState>({
    transformedData: [],
    filteredData: [],
    searchTerm: '',
    filterType: 'all',
    selectedRows: new Set(),
    currentPage: 0,
    pageSize: 50,
    isTransforming: false,
    transformProgress: 0,
    stats: {
      total: 0,
      valid: 0,
      warnings: 0,
      errors: 0,
      portfolios: new Set(),
      transactionTypes: new Set(),
      currencies: new Set(),
      totalAmount: 0
    }
  })

  // Transform data when mappings change
  useEffect(() => {
    transformData()
  }, [parseResult, mappings])

  // Filter data when search or filter changes
  useEffect(() => {
    filterData()
  }, [state.transformedData, state.searchTerm, state.filterType])

  const transformData = async () => {
    setState(prev => ({ ...prev, isTransforming: true, transformProgress: 0 }))

    try {
      const batchSize = 100
      const transformedData: NordnetTransactionData[] = []
      
      for (let i = 0; i < parseResult.rows.length; i += batchSize) {
        const batch = parseResult.rows.slice(i, i + batchSize)
        
        // Transform each row in the batch
        for (const row of batch) {
          const transformed = NordnetFieldMapper.transformRow(row, mappings)
          transformedData.push(transformed)
        }
        
        // Update progress
        const progress = Math.min(((i + batchSize) / parseResult.rows.length) * 100, 100)
        setState(prev => ({ ...prev, transformProgress: progress }))
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Calculate statistics
      const stats = calculateStats(transformedData)

      setState(prev => ({
        ...prev,
        transformedData,
        stats,
        isTransforming: false,
        transformProgress: 100
      }))

    } catch (error) {
      console.error('Error transforming data:', error)
      setState(prev => ({ ...prev, isTransforming: false }))
    }
  }

  const filterData = () => {
    let filtered = [...state.transformedData]

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      )
    }

    // Apply type filter
    switch (state.filterType) {
      case 'valid':
        filtered = filtered.filter(row => 
          row.validation_errors.length === 0 && row.validation_warnings.length === 0
        )
        break
      case 'warnings':
        filtered = filtered.filter(row => row.validation_warnings.length > 0)
        break
      case 'errors':
        filtered = filtered.filter(row => row.validation_errors.length > 0)
        break
    }

    setState(prev => ({ ...prev, filteredData: filtered, currentPage: 0 }))
  }

  const calculateStats = (data: NordnetTransactionData[]) => {
    const portfolios = new Set<string>()
    const transactionTypes = new Set<string>()
    const currencies = new Set<string>()
    let totalAmount = 0
    let valid = 0
    let warnings = 0
    let errors = 0

    for (const row of data) {
      if (row.portfolio_name) portfolios.add(row.portfolio_name)
      if (row.internal_transaction_type) transactionTypes.add(row.internal_transaction_type)
      if (row.currency) currencies.add(row.currency)
      if (row.amount) totalAmount += Math.abs(row.amount)

      if (row.validation_errors.length === 0 && row.validation_warnings.length === 0) {
        valid++
      } else if (row.validation_errors.length > 0) {
        errors++
      } else if (row.validation_warnings.length > 0) {
        warnings++
      }
    }

    return {
      total: data.length,
      valid,
      warnings,
      errors,
      portfolios,
      transactionTypes,
      currencies,
      totalAmount
    }
  }

  const handleImport = async () => {
    const config = NordnetTransactionTransformer.generateDefaultConfig()
    await onImport(config)
  }

  const handleExport = () => {
    const dataToExport = state.selectedRows.size > 0 
      ? state.filteredData.filter((_, index) => state.selectedRows.has(index))
      : state.filteredData

    const csvContent = generateCSV(dataToExport)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nordnet-import-preview.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateCSV = (data: NordnetTransactionData[]) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0]).filter(key => 
      !['validation_errors', 'validation_warnings'].includes(key)
    )
    
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header as keyof NordnetTransactionData]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value?.toString() || ''
      }).join(',')
    )

    return [csvHeaders, ...csvRows].join('\n')
  }

  const paginatedData = useMemo(() => {
    const start = state.currentPage * state.pageSize
    const end = start + state.pageSize
    return state.filteredData.slice(start, end)
  }, [state.filteredData, state.currentPage, state.pageSize])

  const totalPages = Math.ceil(state.filteredData.length / state.pageSize)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>
                Review transformed data before importing to database
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleExport} disabled={state.filteredData.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={state.stats.errors > 0 || state.transformedData.length === 0}
              >
                <Database className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transformation Progress */}
      <AnimatePresence>
        {state.isTransforming && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Transforming data...</p>
                  <Progress value={state.transformProgress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    {Math.round(state.transformProgress)}% complete
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      {!state.isTransforming && state.transformedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{state.stats.total}</p>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{state.stats.valid}</p>
                  <p className="text-sm text-gray-500">Valid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{state.stats.warnings}</p>
                  <p className="text-sm text-gray-500">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{state.stats.errors}</p>
                  <p className="text-sm text-gray-500">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      {!state.isTransforming && state.transformedData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={state.filterType}
                onValueChange={(value: any) => setState(prev => ({ ...prev, filterType: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({state.stats.total})</SelectItem>
                  <SelectItem value="valid">Valid ({state.stats.valid})</SelectItem>
                  <SelectItem value="warnings">Warnings ({state.stats.warnings})</SelectItem>
                  <SelectItem value="errors">Errors ({state.stats.errors})</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={state.pageSize.toString()}
                onValueChange={(value) => setState(prev => ({ ...prev, pageSize: parseInt(value), currentPage: 0 }))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {!state.isTransforming && state.transformedData.length > 0 && (
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Security</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Portfolio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row, index) => (
                        <TableRow key={index} className={
                          row.validation_errors.length > 0 
                            ? 'bg-red-50 dark:bg-red-950/20' 
                            : row.validation_warnings.length > 0 
                            ? 'bg-yellow-50 dark:bg-yellow-950/20' 
                            : ''
                        }>
                          <TableCell>
                            {row.validation_errors.length > 0 ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : row.validation_warnings.length > 0 ? (
                              <Info className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {row.booking_date}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.internal_transaction_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {row.security_name || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.quantity?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.price?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.currency}</Badge>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {row.portfolio_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {state.currentPage * state.pageSize + 1} to{' '}
                      {Math.min((state.currentPage + 1) * state.pageSize, state.filteredData.length)} of{' '}
                      {state.filteredData.length} transactions
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={state.currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {state.currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={state.currentPage >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(state.stats.portfolios).map((portfolio) => (
                      <div key={portfolio} className="flex items-center justify-between">
                        <span className="text-sm truncate">{portfolio}</span>
                        <Badge variant="outline" className="text-xs">
                          {state.transformedData.filter(t => t.portfolio_name === portfolio).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(state.stats.transactionTypes).map((type) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <Badge variant="secondary" className="text-xs">
                          {state.transformedData.filter(t => t.internal_transaction_type === type).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Currencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(state.stats.currencies).map((currency) => (
                      <div key={currency} className="flex items-center justify-between">
                        <span className="text-sm">{currency}</span>
                        <Badge variant="outline" className="text-xs">
                          {state.transformedData.filter(t => t.currency === currency).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues">
            <div className="space-y-4">
              {/* Errors */}
              {state.transformedData.some(t => t.validation_errors.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Validation Errors</CardTitle>
                    <CardDescription>
                      These transactions have errors and will be skipped during import
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {state.transformedData
                          .filter(t => t.validation_errors.length > 0)
                          .map((transaction, index) => (
                            <div key={index} className="p-3 border border-red-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Transaction {transaction.id}</span>
                                <Badge variant="destructive" className="text-xs">
                                  {transaction.validation_errors.length} errors
                                </Badge>
                              </div>
                              <ul className="text-sm text-red-600 space-y-1">
                                {transaction.validation_errors.map((error, errorIndex) => (
                                  <li key={errorIndex} className="list-disc list-inside">
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {state.transformedData.some(t => t.validation_warnings.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-yellow-600">Validation Warnings</CardTitle>
                    <CardDescription>
                      These transactions have warnings but will still be imported
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {state.transformedData
                          .filter(t => t.validation_warnings.length > 0)
                          .map((transaction, index) => (
                            <div key={index} className="p-3 border border-yellow-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Transaction {transaction.id}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.validation_warnings.length} warnings
                                </Badge>
                              </div>
                              <ul className="text-sm text-yellow-600 space-y-1">
                                {transaction.validation_warnings.map((warning, warningIndex) => (
                                  <li key={warningIndex} className="list-disc list-inside">
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default ImportPreview