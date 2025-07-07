'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'

export interface NorwegianHolding {
  id: string
  broker: string
  brokerLogo?: string
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
}

interface NorwegianHoldingsTableProps {
  holdings?: HoldingWithMetrics[]
  loading?: boolean
  error?: string | null
  onHoldingClick?: (holding: HoldingWithMetrics) => void
  onTimeRangeChange?: (range: string) => void
  className?: string
}

type SortField =
  | 'broker'
  | 'stock'
  | 'quantity'
  | 'costBasis'
  | 'change'
  | 'pnl'
  | 'marketValue'
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

const SAMPLE_HOLDINGS: NorwegianHolding[] = [
  {
    id: '1',
    broker: 'Nordnet',
    stock: 'Equinor ASA',
    stockSymbol: 'EQNR.OL',
    quantity: 500,
    costBasis: 280.5,
    currentPrice: 295.75,
    change: 2.25,
    changePercent: 0.77,
    pnl: 7625,
    pnlPercent: 5.44,
    marketValue: 147875,
    country: 'NO',
  },
  {
    id: '2',
    broker: 'DNB',
    stock: 'DNB ASA',
    stockSymbol: 'DNB.OL',
    quantity: 200,
    costBasis: 185.2,
    currentPrice: 192.3,
    change: -1.45,
    changePercent: -0.75,
    pnl: 1420,
    pnlPercent: 3.83,
    marketValue: 38460,
    country: 'NO',
  },
  {
    id: '3',
    broker: 'Schwab',
    stock: 'Apple Inc.',
    stockSymbol: 'AAPL',
    quantity: 50,
    costBasis: 180.25,
    currentPrice: 189.7,
    change: 1.25,
    changePercent: 0.66,
    pnl: 472.5,
    pnlPercent: 5.24,
    marketValue: 9485,
    country: 'US',
  },
  {
    id: '4',
    broker: 'Nordnet',
    stock: 'Telenor ASA',
    stockSymbol: 'TEL.OL',
    quantity: 300,
    costBasis: 165.8,
    currentPrice: 171.25,
    change: 0.85,
    changePercent: 0.5,
    pnl: 1635,
    pnlPercent: 3.29,
    marketValue: 51375,
    country: 'NO',
  },
  {
    id: '5',
    broker: 'DNB',
    stock: 'Norsk Hydro ASA',
    stockSymbol: 'NHY.OL',
    quantity: 800,
    costBasis: 58.5,
    currentPrice: 61.75,
    change: -0.25,
    changePercent: -0.4,
    pnl: 2600,
    pnlPercent: 5.56,
    marketValue: 49400,
    country: 'NO',
  },
]

// Convert HoldingWithMetrics to NorwegianHolding format
const convertToNorwegianHolding = (
  holding: HoldingWithMetrics
): NorwegianHolding => {
  // Determine country based on symbol
  const country = holding.symbol.includes('.OL') ? 'NO' : 'US'
  
  console.log('Converting holding to Norwegian format:', {
    symbol: holding.symbol,
    currentPrice: holding.current_price,
    dailyChange: holding.daily_change,
    dailyChangePercent: holding.daily_change_percent,
    country,
  })

  return {
    id: holding.id,
    broker: 'Nordnet', // Default broker, could be extracted from account data
    stock: holding.stocks?.name || holding.symbol,
    stockSymbol: holding.symbol,
    quantity: holding.quantity,
    costBasis: holding.cost_basis,
    currentPrice: holding.current_price,
    change: holding.daily_change || 0,
    changePercent: holding.daily_change_percent || 0,
    pnl: holding.gain_loss,
    pnlPercent: holding.gain_loss_percent,
    marketValue: holding.current_value,
    country: country as 'NO' | 'US' | 'EU' | 'OTHER',
  }
}

export function NorwegianHoldingsTable({
  holdings,
  loading = false,
  error = null,
  onHoldingClick,
  onTimeRangeChange,
  className,
}: NorwegianHoldingsTableProps) {
  const [selectedRange, setSelectedRange] = useState<string>('M')
  const [sortField, setSortField] = useState<SortField>('marketValue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  // Use real holdings data when available
  const displayHoldings = useMemo(() => {
    if (holdings && holdings.length > 0) {
      console.log('Using real holdings data:', holdings.length, 'holdings')
      return holdings.map(convertToNorwegianHolding)
    }
    // Only use sample data if no real holdings exist (for demo/empty state)
    console.log('No real holdings found, using sample data for demo')
    return SAMPLE_HOLDINGS
  }, [holdings])

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
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {HOLDINGS_TIME_RANGES.map(range => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'ghost'}
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
      }
    >
      <div className="space-y-4">
        {/* Summary */}
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

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead
                  className="cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('broker')}
                >
                  <div className="flex items-center gap-2">
                    Megler
                    <SortIcon field="broker" />
                  </div>
                </TableHead>
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
                  onClick={() => handleSort('costBasis')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Kostnad
                    <SortIcon field="costBasis" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Endring
                    <SortIcon field="change" />
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
                {sortedHoldings.map((holding, index) => {
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {NORWEGIAN_BROKERS[
                              holding.broker as keyof typeof NORWEGIAN_BROKERS
                            ]?.logo || '🏛️'}
                          </span>
                          <span className="font-medium">{holding.broker}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{holding.stock}</span>
                            <span>{getCountryFlag(holding.country)}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {holding.stockSymbol}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatNumber(holding.quantity)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(holding.currentPrice, 'NOK')}
                            {holding.currentPrice > 0 && (
                              <div
                                className="h-2 w-2 animate-pulse rounded-full bg-green-500"
                                title="Live price"
                              />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(holding.costBasis, 'NOK')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(
                              holding.costBasis * holding.quantity,
                              'NOK',
                              { compact: true }
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getTrendIcon(holding.changePercent)}
                          <div className="space-y-1">
                            <div
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
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(holding.change, 'NOK')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
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
                          <Badge
                            variant={
                              holding.pnlPercent > 0 ? 'default' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {formatPercentage(holding.pnlPercent)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    </Widget>
  )
}
