'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Minus,
  Settings,
  Filter,
  Search,
  AlertCircle,
  Building2,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export interface Holding {
  id: string
  symbol: string
  companyName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  costBasis: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayChange: number
  dayChangePercent: number
  account: string
  currency: string
  lastUpdated: string
  sector?: string
  country?: string
}

interface HoldingsWidgetProps {
  symbol: string
  companyName: string
  holdings: Holding[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onViewDetails?: (holding: Holding) => void
  onBuyMore?: (holding: Holding) => void
  onSell?: (holding: Holding) => void
  className?: string
}

const BROKER_COLORS = {
  Nordnet: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DNB: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Schwab:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
} as const

const SORT_OPTIONS = [
  { value: 'market-value-desc', label: 'Markedsverdi (høy-lav)' },
  { value: 'market-value-asc', label: 'Markedsverdi (lav-høy)' },
  { value: 'pnl-desc', label: 'P&L (høy-lav)' },
  { value: 'pnl-asc', label: 'P&L (lav-høy)' },
  { value: 'pnl-percent-desc', label: 'P&L% (høy-lav)' },
  { value: 'pnl-percent-asc', label: 'P&L% (lav-høy)' },
  { value: 'quantity-desc', label: 'Antall (høy-lav)' },
  { value: 'quantity-asc', label: 'Antall (lav-høy)' },
] as const

function HoldingCard({
  holding,
  onViewDetails,
  onBuyMore,
  onSell,
}: {
  holding: Holding
  onViewDetails: (holding: Holding) => void
  onBuyMore: (holding: Holding) => void
  onSell: (holding: Holding) => void
}) {
  const isPositive = holding.unrealizedPnL > 0
  const isNegative = holding.unrealizedPnL < 0
  const isDayPositive = holding.dayChange > 0
  const isDayNegative = holding.dayChange < 0

  const pnlColor = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400'

  const dayChangeColor = isDayPositive
    ? 'text-green-600 dark:text-green-400'
    : isDayNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-gray-400'

  const brokerColor =
    BROKER_COLORS[holding.account as keyof typeof BROKER_COLORS] ||
    BROKER_COLORS.Other

  return (
    <Card className="group border-l-4 border-l-purple-500 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {holding.symbol}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {holding.companyName}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', brokerColor)}>
              {holding.account}
            </Badge>
            {holding.country && (
              <Badge variant="outline" className="text-xs">
                {holding.country === 'NO'
                  ? '🇳🇴'
                  : holding.country === 'US'
                    ? '🇺🇸'
                    : holding.country}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Position Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Antall
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {holding.quantity.toLocaleString('nb-NO')}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Snittprip
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(holding.averagePrice, holding.currency)}
            </div>
          </div>
        </div>

        {/* Current Price & Day Change */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Aktuell pris
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(holding.currentPrice, holding.currency)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Dagens endring
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-lg font-semibold',
                dayChangeColor
              )}
            >
              {isDayPositive && <TrendingUp className="h-4 w-4" />}
              {isDayNegative && <TrendingDown className="h-4 w-4" />}
              {formatPercentage(holding.dayChangePercent)}
            </div>
          </div>
        </div>

        {/* Market Value & P&L */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Markedsverdi
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(holding.marketValue, holding.currency)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              P&L
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xl font-bold',
                pnlColor
              )}
            >
              {isPositive && <TrendingUp className="h-4 w-4" />}
              {isNegative && <TrendingDown className="h-4 w-4" />}
              <div>
                {formatCurrency(holding.unrealizedPnL, holding.currency)}
                <div className="text-sm font-medium">
                  ({formatPercentage(holding.unrealizedPnLPercent)})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Kostbasis</span>
            <span>Markedsverdi</span>
          </div>
          <Progress
            value={
              holding.marketValue > holding.costBasis
                ? 100
                : (holding.marketValue / holding.costBasis) * 100
            }
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatCurrency(holding.costBasis, holding.currency)}</span>
            <span>{formatCurrency(holding.marketValue, holding.currency)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBuyMore(holding)}
              className="h-8 px-3 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Kjøp mer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSell(holding)}
              className="h-8 px-3 text-xs"
              disabled={holding.quantity <= 0}
            >
              <Minus className="mr-1 h-3 w-3" />
              Selg
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(holding)}
            className="h-8 px-3 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Eye className="mr-1 h-3 w-3" />
            Detaljer
          </Button>
        </div>

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          Sist oppdatert:{' '}
          {formatDate(holding.lastUpdated, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function HoldingsSummary({ holdings }: { holdings: Holding[] }) {
  const summary = useMemo(() => {
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0)
    const totalUnrealizedPnL = holdings.reduce(
      (sum, h) => sum + h.unrealizedPnL,
      0
    )
    const totalDayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0)
    const totalUnrealizedPnLPercent =
      totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0

    return {
      totalMarketValue,
      totalCostBasis,
      totalUnrealizedPnL,
      totalDayChange,
      totalUnrealizedPnLPercent,
      avgHoldingSize:
        holdings.length > 0 ? totalMarketValue / holdings.length : 0,
      positionsInProfit: holdings.filter(h => h.unrealizedPnL > 0).length,
      positionsInLoss: holdings.filter(h => h.unrealizedPnL < 0).length,
    }
  }, [holdings])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total markedsverdi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(summary.totalMarketValue, 'NOK')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'flex items-center gap-1 text-2xl font-bold',
              summary.totalUnrealizedPnL > 0
                ? 'text-green-600 dark:text-green-400'
                : summary.totalUnrealizedPnL < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {summary.totalUnrealizedPnL > 0 && (
              <TrendingUp className="h-5 w-5" />
            )}
            {summary.totalUnrealizedPnL < 0 && (
              <TrendingDown className="h-5 w-5" />
            )}
            {formatCurrency(summary.totalUnrealizedPnL, 'NOK')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatPercentage(summary.totalUnrealizedPnLPercent)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Dagens endring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'flex items-center gap-1 text-2xl font-bold',
              summary.totalDayChange > 0
                ? 'text-green-600 dark:text-green-400'
                : summary.totalDayChange < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {summary.totalDayChange > 0 && <TrendingUp className="h-5 w-5" />}
            {summary.totalDayChange < 0 && <TrendingDown className="h-5 w-5" />}
            {formatCurrency(summary.totalDayChange, 'NOK')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Posisjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {holdings.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {summary.positionsInProfit} gevinst, {summary.positionsInLoss} tap
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function HoldingsWidget({
  symbol,
  companyName,
  holdings = [],
  loading = false,
  error = null,
  onRefresh,
  onViewDetails,
  onBuyMore,
  onSell,
  className,
}: HoldingsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('market-value-desc')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedHoldings = useMemo(() => {
    let filtered = holdings.filter(h => h.symbol === symbol)

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        h =>
          h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.account.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by account
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(h => h.account === selectedAccount)
    }

    // Sort holdings
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'market-value-desc':
          return b.marketValue - a.marketValue
        case 'market-value-asc':
          return a.marketValue - b.marketValue
        case 'pnl-desc':
          return b.unrealizedPnL - a.unrealizedPnL
        case 'pnl-asc':
          return a.unrealizedPnL - b.unrealizedPnL
        case 'pnl-percent-desc':
          return b.unrealizedPnLPercent - a.unrealizedPnLPercent
        case 'pnl-percent-asc':
          return a.unrealizedPnLPercent - b.unrealizedPnLPercent
        case 'quantity-desc':
          return b.quantity - a.quantity
        case 'quantity-asc':
          return a.quantity - b.quantity
        default:
          return 0
      }
    })

    return sorted
  }, [holdings, symbol, searchTerm, selectedAccount, sortBy])

  const availableAccounts = useMemo(() => {
    const accounts = [...new Set(holdings.map(h => h.account))]
    return accounts.sort()
  }, [holdings])

  const handleViewDetails = (holding: Holding) => {
    onViewDetails?.(holding)
  }

  const handleBuyMore = (holding: Holding) => {
    onBuyMore?.(holding)
  }

  const handleSell = (holding: Holding) => {
    onSell?.(holding)
  }

  return (
    <StockWidget
      title={`Beholdninger - ${symbol}`}
      description={`Dine posisjoner i ${companyName}`}
      icon={<Wallet className="h-5 w-5" />}
      size="large"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={cn('min-h-[800px]', className)}
      refreshLabel="Oppdater beholdninger"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 px-2 text-xs"
          >
            <Filter className="h-3 w-3" />
            {showFilters ? 'Skjul' : 'Filter'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary */}
        <HoldingsSummary holdings={filteredAndSortedHoldings} />

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 border-b border-gray-200 pb-4 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Søk i beholdninger..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-8 pl-10 text-sm"
                  />
                </div>

                {/* Account Filter */}
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Alle konti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle konti</SelectItem>
                    {availableAccounts.map(account => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Sorter etter" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Holdings List */}
        {filteredAndSortedHoldings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedAccount !== 'all'
                ? 'Ingen beholdninger funnet med gjeldende filter'
                : `Ingen beholdninger i ${symbol}`}
            </p>
            {(searchTerm || selectedAccount !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedAccount('all')
                }}
                className="mt-2"
              >
                Fjern filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredAndSortedHoldings.map((holding, index) => (
                <motion.div
                  key={holding.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <HoldingCard
                    holding={holding}
                    onViewDetails={handleViewDetails}
                    onBuyMore={handleBuyMore}
                    onSell={handleSell}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </StockWidget>
  )
}
