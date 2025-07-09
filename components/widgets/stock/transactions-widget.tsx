'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  Download, 
  Eye, 
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export interface Transaction {
  id: string
  date: string
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'spinoff'
  symbol: string
  quantity: number
  price: number
  fees: number
  total: number
  account: string
  notes?: string
  currency: string
}

interface TransactionsWidgetProps {
  symbol: string
  companyName: string
  transactions: Transaction[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onExport?: () => void
  onViewDetails?: (transaction: Transaction) => void
  className?: string
}

const TRANSACTION_TYPES = [
  { value: 'all', label: 'Alle typer' },
  { value: 'buy', label: 'Kjøp' },
  { value: 'sell', label: 'Salg' },
  { value: 'dividend', label: 'Utbytte' },
  { value: 'split', label: 'Splitt' },
  { value: 'spinoff', label: 'Spinoff' },
] as const

const ACCOUNT_TYPES = [
  { value: 'all', label: 'Alle konti' },
  { value: 'Nordnet', label: 'Nordnet' },
  { value: 'DNB', label: 'DNB' },
  { value: 'Schwab', label: 'Schwab' },
  { value: 'Other', label: 'Annet' },
] as const

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Nyeste først' },
  { value: 'date-asc', label: 'Eldste først' },
  { value: 'amount-desc', label: 'Høyeste beløp' },
  { value: 'amount-asc', label: 'Laveste beløp' },
  { value: 'quantity-desc', label: 'Høyeste antall' },
  { value: 'quantity-asc', label: 'Laveste antall' },
] as const

function TransactionTypeIcon({ type }: { type: Transaction['type'] }) {
  const iconClass = "h-4 w-4"
  
  switch (type) {
    case 'buy':
      return <ArrowUpCircle className={cn(iconClass, "text-green-500")} />
    case 'sell':
      return <ArrowDownCircle className={cn(iconClass, "text-red-500")} />
    case 'dividend':
      return <TrendingUp className={cn(iconClass, "text-blue-500")} />
    case 'split':
      return <TrendingDown className={cn(iconClass, "text-purple-500")} />
    case 'spinoff':
      return <Receipt className={cn(iconClass, "text-orange-500")} />
    default:
      return <Receipt className={cn(iconClass, "text-gray-500")} />
  }
}

function TransactionTypeBadge({ type }: { type: Transaction['type'] }) {
  const variants = {
    buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    dividend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    split: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    spinoff: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  }

  const labels = {
    buy: 'Kjøp',
    sell: 'Salg',
    dividend: 'Utbytte',
    split: 'Splitt',
    spinoff: 'Spinoff',
  }

  return (
    <Badge variant="outline" className={cn('text-xs', variants[type])}>
      {labels[type]}
    </Badge>
  )
}

function TransactionRow({ 
  transaction, 
  onViewDetails 
}: { 
  transaction: Transaction
  onViewDetails: (transaction: Transaction) => void 
}) {
  const isInflow = transaction.type === 'buy' || transaction.type === 'dividend'
  const totalAmount = transaction.type === 'sell' ? transaction.total : -transaction.total

  return (
    <TableRow className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <TransactionTypeIcon type={transaction.type} />
          <span>{formatDate(transaction.date)}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <TransactionTypeBadge type={transaction.type} />
      </TableCell>
      
      <TableCell className="text-right">
        {transaction.type !== 'dividend' && (
          <span className="font-mono">
            {transaction.quantity.toLocaleString('nb-NO')}
          </span>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        {transaction.type !== 'dividend' && (
          <span className="font-mono">
            {formatCurrency(transaction.price, transaction.currency)}
          </span>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <span className={cn(
          'font-mono font-medium',
          isInflow 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        )}>
          {isInflow ? '+' : ''}{formatCurrency(totalAmount, transaction.currency)}
        </span>
      </TableCell>
      
      <TableCell className="text-right">
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(transaction.fees, transaction.currency)}
        </span>
      </TableCell>
      
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {transaction.account}
        </Badge>
      </TableCell>
      
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(transaction)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function TransactionsWidget({
  symbol,
  companyName,
  transactions = [],
  loading = false,
  error = null,
  onRefresh,
  onExport,
  onViewDetails,
  className,
}: TransactionsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by transaction type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType)
    }

    // Filter by account
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.account === selectedAccount)
    }

    // Sort transactions
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          return Math.abs(b.total) - Math.abs(a.total)
        case 'amount-asc':
          return Math.abs(a.total) - Math.abs(b.total)
        case 'quantity-desc':
          return b.quantity - a.quantity
        case 'quantity-asc':
          return a.quantity - b.quantity
        default:
          return 0
      }
    })

    return sorted
  }, [transactions, searchTerm, selectedType, selectedAccount, sortBy])

  const handleViewDetails = (transaction: Transaction) => {
    onViewDetails?.(transaction)
  }

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      totalTransactions: filteredAndSortedTransactions.length,
      totalBuys: filteredAndSortedTransactions.filter(t => t.type === 'buy').length,
      totalSells: filteredAndSortedTransactions.filter(t => t.type === 'sell').length,
      totalDividends: filteredAndSortedTransactions.filter(t => t.type === 'dividend').length,
      totalValue: filteredAndSortedTransactions.reduce((sum, t) => sum + Math.abs(t.total), 0),
      totalFees: filteredAndSortedTransactions.reduce((sum, t) => sum + t.fees, 0),
    }
    return stats
  }, [filteredAndSortedTransactions])

  return (
    <StockWidget
      title={`Transaksjoner - ${symbol}`}
      description={`Transaksjonshistorikk for ${companyName}`}
      icon={<Receipt className="h-5 w-5" />}
      size="large"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onExport={onExport}
      className={cn('min-h-[700px]', className)}
      refreshLabel="Oppdater transaksjoner"
      exportLabel="Eksporter til CSV"
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
      <div className="space-y-4">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Søk transaksjoner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8 text-sm"
                  />
                </div>

                {/* Transaction Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Transaksjonstype" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Account Filter */}
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Konto" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(account => (
                      <SelectItem key={account.value} value={account.value}>
                        {account.label}
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Transaksjoner
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summaryStats.totalTransactions}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Kjøp
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summaryStats.totalBuys}
            </div>
          </div>
          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Salg
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summaryStats.totalSells}
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Utbytte
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summaryStats.totalDividends}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedType !== 'all' || selectedAccount !== 'all'
                ? 'Ingen transaksjoner funnet med gjeldende filter'
                : 'Ingen transaksjoner registrert'}
            </p>
            {(searchTerm || selectedType !== 'all' || selectedAccount !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('all')
                  setSelectedAccount('all')
                }}
                className="mt-2"
              >
                Fjern alle filter
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Dato
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Antall</TableHead>
                    <TableHead className="font-semibold text-right">Pris</TableHead>
                    <TableHead className="font-semibold text-right">Beløp</TableHead>
                    <TableHead className="font-semibold text-right">Avgifter</TableHead>
                    <TableHead className="font-semibold">Konto</TableHead>
                    <TableHead className="font-semibold w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAndSortedTransactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        asChild
                      >
                        <TransactionRow
                          transaction={transaction}
                          onViewDetails={handleViewDetails}
                        />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Summary Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          <span>
            Viser {filteredAndSortedTransactions.length} av {transactions.length} transaksjoner
          </span>
          <div className="flex items-center gap-6">
            <span>
              Total verdi: {formatCurrency(summaryStats.totalValue, 'NOK')}
            </span>
            <span>
              Total avgifter: {formatCurrency(summaryStats.totalFees, 'NOK')}
            </span>
          </div>
        </div>
      </div>
    </StockWidget>
  )
}