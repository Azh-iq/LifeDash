'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from '@/lib/utils/format'
import { Widget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import { AnimatedHoldingsActionsMenu } from './holdings-actions-menu'
import { toast } from 'sonner'

export interface NorwegianHolding {
  id: string
  broker: string
  brokerLogo?: string
  brokerIds?: string[] // For multi-broker consolidation
  accountCount?: number // Number of accounts holding this stock
  stock: string
  stockSymbol: string
  quantity: number
  costBasis: number
  currentPrice: number
  change: number
  changePercent: number
  pnl: number
  pnlPercent: number
  marketValue: number
  country: 'NO' | 'US' | 'EU' | 'OTHER'
  isDuplicate?: boolean // If this holding is consolidated from multiple brokers
  isConsolidated?: boolean // If this is a consolidated view
}

interface ConsolidatedHolding {
  symbol: string
  total_quantity: number
  total_market_value: number
  total_cost_basis: number
  account_count: number
  broker_ids: string[]
  is_duplicate: boolean
  last_updated: string
  avg_market_price: number
  asset_class: string
  currency: string
}

interface NorwegianHoldingsTableProps {
  holdings?: HoldingWithMetrics[]
  consolidatedHoldings?: ConsolidatedHolding[] // Multi-broker consolidated data
  showConsolidated?: boolean // Toggle between individual and consolidated view
  onToggleConsolidated?: (consolidated: boolean) => void // Callback for toggle changes
  loading?: boolean
  error?: string | null
  onHoldingClick?: (holding: HoldingWithMetrics) => void
  onTimeRangeChange?: (range: string) => void
  className?: string
  // Refresh and update handlers
  onRefresh?: () => Promise<void>
  onOptimisticUpdate?: (
    holding: HoldingWithMetrics,
    updates: Partial<HoldingWithMetrics>
  ) => void
  isProcessingTransaction?: boolean
  transactionSuccess?: boolean
  transactionError?: string | null
  onTransactionComplete?: () => void
  // Action handlers
  onBuyMore?: (holding: HoldingWithMetrics) => void
  onSell?: (holding: HoldingWithMetrics) => void
  onViewDetails?: (holding: HoldingWithMetrics) => void
  onEditPosition?: (holding: HoldingWithMetrics) => void
  onSetAlert?: (holding: HoldingWithMetrics) => void
  onAddNote?: (holding: HoldingWithMetrics) => void
  onViewHistory?: (holding: HoldingWithMetrics) => void
  onRemovePosition?: (holding: HoldingWithMetrics) => void
}

type SortField =
  | 'broker'
  | 'stock'
  | 'quantity'
  | 'currentPrice'
  | 'marketValue'
  | 'costBasis'
  | 'pnl'
  | 'pnlPercent'
  | 'change'
type SortDirection = 'asc' | 'desc'

const HOLDINGS_TIME_RANGES = [
  { value: 'D', label: 'D', description: 'I dag' },
  { value: 'W', label: 'W', description: 'Denne uken' },
  { value: 'M', label: 'M', description: 'Denne måneden' },
] as const

const NORWEGIAN_BROKERS = {
  Nordnet: { logo: '🏛️', country: 'NO' },
  DNB: { logo: '🏦', country: 'NO' },
  Skandiabanken: { logo: '🏛️', country: 'NO' },
  Storebrand: { logo: '🏢', country: 'NO' },
  Schwab: { logo: '🇺🇸', country: 'US' },
  'Interactive Brokers': { logo: '🌐', country: 'US' },
}

const BROKER_DISPLAY_NAMES = {
  'plaid': 'Plaid',
  'schwab': 'Schwab', 
  'interactive_brokers': 'IBKR',
  'nordnet': 'Nordnet'
}

const BROKER_LOGOS = {
  'plaid': '🇺🇸',
  'schwab': '🏦', 
  'interactive_brokers': '🌐',
  'nordnet': '🏛️'
}

// Sample holdings removed - all data now comes from actual user portfolio

// Convert HoldingWithMetrics to NorwegianHolding format
const convertToNorwegianHolding = (
  holding: HoldingWithMetrics
): NorwegianHolding => {
  // Safe symbol check - provide fallback if symbol is undefined
  const symbol = holding.symbol || ''

  // Determine country based on symbol
  const country = symbol.includes('.OL') ? 'NO' : 'US'

  console.log('Converting holding to Norwegian format:', {
    symbol,
    currentPrice: holding.current_price,
    dailyChange: holding.daily_change,
    dailyChangePercent: holding.daily_change_percent,
    country,
  })

  return {
    id: holding.id,
    broker: 'Nordnet', // Default broker, could be extracted from account data
    stock: holding.stocks?.name || symbol || 'Unknown',
    stockSymbol: symbol,
    quantity: holding.quantity || 0,
    costBasis: holding.cost_basis || 0,
    currentPrice: holding.current_price || 0,
    change: holding.daily_change || 0,
    changePercent: holding.daily_change_percent || 0,
    pnl: holding.gain_loss || 0,
    pnlPercent: holding.gain_loss_percent || 0,
    marketValue: holding.current_value || 0,
    country: country as 'NO' | 'US' | 'EU' | 'OTHER',
  }
}

// Convert ConsolidatedHolding to NorwegianHolding format
const convertConsolidatedToNorwegian = (
  consolidated: ConsolidatedHolding
): NorwegianHolding => {
  const symbol = consolidated.symbol || ''
  const country = symbol.includes('.OL') ? 'NO' : 'US'
  
  // Calculate P&L
  const pnl = consolidated.total_market_value - consolidated.total_cost_basis
  const pnlPercent = consolidated.total_cost_basis > 0 
    ? (pnl / consolidated.total_cost_basis) * 100 
    : 0

  return {
    id: `consolidated-${symbol}`,
    broker: consolidated.broker_ids.length > 1 
      ? `${consolidated.broker_ids.length} meglere` 
      : (BROKER_DISPLAY_NAMES as Record<string, string>)[consolidated.broker_ids[0]] || consolidated.broker_ids[0],
    brokerIds: consolidated.broker_ids,
    accountCount: consolidated.account_count,
    stock: symbol, // We'd need to join with stocks table for full name
    stockSymbol: symbol,
    quantity: consolidated.total_quantity,
    costBasis: consolidated.total_cost_basis,
    currentPrice: consolidated.avg_market_price,
    change: 0, // Would need daily price data
    changePercent: 0, // Would need daily price data
    pnl,
    pnlPercent,
    marketValue: consolidated.total_market_value,
    country: country as 'NO' | 'US' | 'EU' | 'OTHER',
    isDuplicate: consolidated.is_duplicate,
    isConsolidated: true,
  }
}

export function NorwegianHoldingsTable({
  holdings,
  consolidatedHoldings = [],
  showConsolidated = false,
  onToggleConsolidated,
  loading = false,
  error = null,
  onHoldingClick,
  onTimeRangeChange,
  className,
  // Refresh and update handlers
  onRefresh,
  onOptimisticUpdate,
  isProcessingTransaction = false,
  transactionSuccess = false,
  transactionError = null,
  onTransactionComplete,
  // Action handlers with defaults
  onBuyMore = () => {},
  onSell = () => {},
  onViewDetails = () => {},
  onEditPosition = () => {},
  onSetAlert = () => {},
  onAddNote = () => {},
  onViewHistory = () => {},
  onRemovePosition = () => {},
}: NorwegianHoldingsTableProps) {
  const [selectedRange, setSelectedRange] = useState<string>('M')
  const [sortField, setSortField] = useState<SortField>('marketValue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [optimisticHoldings, setOptimisticHoldings] = useState<
    HoldingWithMetrics[]
  >([])

  // Auto-refresh holdings when new data arrives
  useEffect(() => {
    if (holdings && holdings.length > 0) {
      setOptimisticHoldings(holdings)
      setLastUpdateTime(new Date())
    }
  }, [holdings])

  // Handle transaction completion effects
  useEffect(() => {
    if (transactionSuccess) {
      toast.success('Transaksjon fullført!', {
        description: 'Beholdningene dine er oppdatert',
        duration: 3000,
      })
      onTransactionComplete?.()
    }
  }, [transactionSuccess, onTransactionComplete])

  useEffect(() => {
    if (transactionError) {
      toast.error('Transaksjon feilet', {
        description: transactionError,
        duration: 5000,
      })
      onTransactionComplete?.()
    }
  }, [transactionError, onTransactionComplete])

  const handleRangeChange = (range: string) => {
    setSelectedRange(range)
    onTimeRangeChange?.(range)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastUpdateTime(new Date())
      toast.success('Beholdninger oppdatert', {
        duration: 2000,
      })
    } catch (error) {
      toast.error('Kunne ikke oppdatere beholdninger', {
        description: 'Prøv igjen senere',
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  // Handle optimistic updates
  const handleOptimisticUpdate = useCallback(
    (holding: HoldingWithMetrics, updates: Partial<HoldingWithMetrics>) => {
      setOptimisticHoldings(prev =>
        prev.map(h => (h.id === holding.id ? { ...h, ...updates } : h))
      )
      onOptimisticUpdate?.(holding, updates)
    },
    [onOptimisticUpdate]
  )

  // Use optimistic holdings for immediate UI feedback, or consolidated holdings if enabled
  const displayHoldings = useMemo(() => {
    if (showConsolidated && consolidatedHoldings.length > 0) {
      console.log('Using consolidated holdings data:', consolidatedHoldings.length, 'consolidated holdings')
      return consolidatedHoldings.map(convertConsolidatedToNorwegian)
    }
    
    const holdingsToUse =
      optimisticHoldings.length > 0 ? optimisticHoldings : holdings || []
    if (holdingsToUse.length > 0) {
      console.log('Using individual holdings data:', holdingsToUse.length, 'holdings')
      return holdingsToUse.map(convertToNorwegianHolding)
    }
    console.log('No holdings found - showing empty state')
    return []
  }, [optimisticHoldings, holdings, showConsolidated, consolidatedHoldings])

  const sortedHoldings = useMemo(() => {
    return [...displayHoldings].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'nb-NO')
          : bValue.localeCompare(aValue, 'nb-NO')
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [displayHoldings, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-purple-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-purple-600" />
    )
  }

  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 0)
      return <TrendingUp className="h-4 w-4 text-green-500" />
    if (changePercent < 0)
      return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendArrow = (changePercent: number) => {
    if (changePercent > 0) return '↑'
    if (changePercent < 0) return '↓'
    return '—'
  }

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'NO':
        return '🇳🇴'
      case 'US':
        return '🇺🇸'
      case 'EU':
        return '🇪🇺'
      default:
        return '🌍'
    }
  }

  return (
    <Widget
      title="Beholdninger"
      size="large"
      category="stocks"
      loading={loading}
      error={error}
      className={cn('min-h-[500px]', className)}
      actions={
        <div className="flex items-center gap-3">
          {/* Consolidated view toggle */}
          {consolidatedHoldings.length > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <Button
                variant={!showConsolidated ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onToggleConsolidated?.(false)}
                className="h-8 px-3 text-xs font-medium transition-all duration-200"
              >
                Individuell
              </Button>
              <Button
                variant={showConsolidated ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onToggleConsolidated?.(true)}
                className="h-8 px-3 text-xs font-medium transition-all duration-200"
              >
                Konsolidert
              </Button>
            </div>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Oppdater</span>
          </Button>

          {/* Last updated indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>
              Oppdatert{' '}
              {lastUpdateTime.toLocaleTimeString('nb-NO', {
                timeStyle: 'short',
              })}
            </span>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {HOLDINGS_TIME_RANGES.map(range => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleRangeChange(range.value)}
                className={cn(
                  'h-8 px-3 text-xs font-medium transition-all duration-200',
                  selectedRange === range.value
                    ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary with transaction status */}
        <div className="space-y-4">
          {/* Transaction status banner */}
          <AnimatePresence>
            {isProcessingTransaction && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4"
              >
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Behandler transaksjon...
                  </p>
                  <p className="text-sm text-blue-600">
                    Beholdningene vil oppdateres automatisk
                  </p>
                </div>
              </motion.div>
            )}

            {transactionSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Transaksjon fullført!
                  </p>
                  <p className="text-sm text-green-600">
                    Beholdningene er oppdatert
                  </p>
                </div>
              </motion.div>
            )}

            {transactionError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Transaksjon feilet</p>
                  <p className="text-sm text-red-600">{transactionError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Totalt antall
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(displayHoldings.length)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total verdi
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(
                  displayHoldings.reduce((sum, h) => sum + h.marketValue, 0),
                  'NOK'
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total P&L
              </p>
              <p
                className={cn(
                  'text-lg font-bold',
                  displayHoldings.reduce((sum, h) => sum + h.pnl, 0) > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCurrency(
                  displayHoldings.reduce((sum, h) => sum + h.pnl, 0),
                  'NOK'
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Gjennomsnittlig endring
              </p>
              <p
                className={cn(
                  'text-lg font-bold',
                  displayHoldings.reduce((sum, h) => sum + h.changePercent, 0) /
                    displayHoldings.length >
                    0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatPercentage(
                  displayHoldings.reduce((sum, h) => sum + h.changePercent, 0) /
                    displayHoldings.length
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead
                  className="cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-2">
                    Aksje
                    <SortIcon field="stock" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Antall
                    <SortIcon field="quantity" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('currentPrice')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Gjeldende pris
                    <SortIcon field="currentPrice" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('marketValue')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Markedsverdi
                    <SortIcon field="marketValue" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('costBasis')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Kostnad
                    <SortIcon field="costBasis" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end gap-2">
                    P&L
                    <SortIcon field="pnl" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('pnlPercent')}
                >
                  <div className="flex items-center justify-end gap-2">
                    P&L%
                    <SortIcon field="pnlPercent" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Daglig endring
                    <SortIcon field="change" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('broker')}
                >
                  <div className="flex items-center gap-2">
                    Megler
                    <SortIcon field="broker" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    Handlinger
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedHoldings.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <TableCell colSpan={10} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl text-gray-400">📊</div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                          Ingen beholdninger funnet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Legg til transaksjon for å se dine aksjer her
                        </p>
                      </div>
                    </TableCell>
                  </motion.tr>
                ) : (
                  sortedHoldings.map((holding, index) => {
                    // Find original holding if available
                    const originalHolding = holdings?.find(
                      h => h.id === holding.id
                    )
                    return (
                      <motion.tr
                        key={holding.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={cn(
                          'cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50',
                          onHoldingClick &&
                            'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        )}
                        onClick={() => {
                          if (originalHolding) {
                            onHoldingClick?.(originalHolding)
                          }
                        }}
                      >
                        {/* Stock column */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {holding.stock}
                              </span>
                              <span>{getCountryFlag(holding.country)}</span>
                              {holding.isConsolidated && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  Konsolidert
                                </Badge>
                              )}
                              {holding.isDuplicate && (
                                <Badge variant="outline" className="text-xs px-1 py-0 text-yellow-600 border-yellow-300">
                                  Duplikat
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {holding.stockSymbol}
                              {holding.accountCount && holding.accountCount > 1 && (
                                <span className="ml-2 text-xs text-blue-600">
                                  • {holding.accountCount} kontoer
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Quantity column */}
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {formatNumber(holding.quantity)}
                          </div>
                        </TableCell>

                        {/* Current Price column */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {formatCurrency(holding.currentPrice, 'NOK')}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                per aksje
                              </div>
                            </div>
                            {holding.currentPrice > 0 && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="h-2 w-2 animate-pulse rounded-full bg-green-500"
                                  title="Live pris"
                                />
                                <span className="text-xs font-medium text-green-600">
                                  LIVE
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Market Value column */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(holding.marketValue, 'NOK')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatNumber(holding.marketValue, {
                                notation: 'compact',
                              })} NOK
                            </div>
                          </div>
                        </TableCell>

                        {/* Cost Basis column */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(holding.costBasis, 'NOK')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              per aksje
                            </div>
                          </div>
                        </TableCell>

                        {/* P&L column */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div
                              className={cn(
                                'font-medium',
                                holding.pnl > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : holding.pnl < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {formatCurrency(holding.pnl, 'NOK')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              total gevinst
                            </div>
                          </div>
                        </TableCell>

                        {/* P&L% column */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div
                              className={cn(
                                'text-lg font-medium',
                                holding.pnlPercent > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : holding.pnlPercent < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {formatPercentage(holding.pnlPercent)}
                            </div>
                            <Badge
                              variant={
                                holding.pnlPercent > 0
                                  ? 'default'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {holding.pnlPercent > 0 ? 'Gevinst' : 'Tap'}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Daily Change column */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className={cn(
                                    'font-medium',
                                    holding.changePercent > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : holding.changePercent < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                  )}
                                >
                                  {getTrendArrow(holding.changePercent)}
                                </span>
                                <span
                                  className={cn(
                                    'font-medium',
                                    holding.changePercent > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : holding.changePercent < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                  )}
                                >
                                  {formatPercentage(holding.changePercent)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(holding.change, 'NOK')}
                              </div>
                            </div>
                            {getTrendIcon(holding.changePercent)}
                          </div>
                        </TableCell>

                        {/* Broker column with multi-broker support */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {holding.isConsolidated && holding.brokerIds && holding.brokerIds.length > 1 ? (
                              // Multi-broker consolidated view
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  {holding.brokerIds.slice(0, 3).map((brokerId, index) => (
                                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                      <span className="mr-1">
                                        {(BROKER_LOGOS as Record<string, string>)[brokerId] || '🏛️'}
                                      </span>
                                      {(BROKER_DISPLAY_NAMES as Record<string, string>)[brokerId] || brokerId}
                                    </Badge>
                                  ))}
                                  {holding.brokerIds.length > 3 && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      +{holding.brokerIds.length - 3}
                                    </Badge>
                                  )}
                                </div>
                                {holding.accountCount && holding.accountCount > 1 && (
                                  <div className="text-xs text-gray-500">
                                    {holding.accountCount} kontoer
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Single broker view
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {NORWEGIAN_BROKERS[
                                    holding.broker as keyof typeof NORWEGIAN_BROKERS
                                  ]?.logo || '🏛️'}
                                </span>
                                <span className="font-medium">
                                  {holding.broker}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions column */}
                        <TableCell className="text-right">
                          <AnimatedHoldingsActionsMenu
                            holding={
                              originalHolding || ({} as HoldingWithMetrics)
                            }
                            onBuyMore={onBuyMore}
                            onSell={onSell}
                            onViewDetails={onViewDetails}
                            onEditPosition={onEditPosition}
                            onSetAlert={onSetAlert}
                            onAddNote={onAddNote}
                            onViewHistory={onViewHistory}
                            onRemovePosition={onRemovePosition}
                            disabled={!originalHolding}
                          />
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    </Widget>
  )
}
