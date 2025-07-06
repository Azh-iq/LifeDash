'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FunnelIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedCard, CurrencyCounter, NumberCounter } from '@/components/animated'
import { formatCurrency, formatPercentage } from '@/components/charts'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface Transaction {
  id: string
  portfolio_id: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'TRANSFER' | 'FEE'
  quantity: number
  price: number
  total_amount: number
  fee: number
  currency: string
  transaction_date: string
  created_at: string
  notes?: string
  stocks?: {
    symbol: string
    name: string
    currency: string
    asset_type: string
    sector?: string
  }
}

interface RecentActivityProps {
  portfolioId: string
  className?: string
  maxItems?: number
  showFilters?: boolean
}

interface ActivityFilter {
  type: string
  symbol: string
  dateRange: string
  sortBy: 'date' | 'amount' | 'symbol'
  sortOrder: 'asc' | 'desc'
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
}

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
}

export default function RecentActivity({
  portfolioId,
  className,
  maxItems = 10,
  showFilters = true,
}: RecentActivityProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [newTransactionId, setNewTransactionId] = useState<string | null>(null)

  const [filters, setFilters] = useState<ActivityFilter>({
    type: '',
    symbol: '',
    dateRange: '30',
    sortBy: 'date',
    sortOrder: 'desc',
  })

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!portfolioId) return

      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        
        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        
        if (filters.dateRange !== 'all') {
          startDate.setDate(endDate.getDate() - parseInt(filters.dateRange))
        } else {
          startDate.setFullYear(endDate.getFullYear() - 10) // 10 years ago
        }

        let query = supabase
          .from('transactions')
          .select(`
            *,
            stocks (
              symbol,
              name,
              currency,
              asset_type,
              sector
            )
          `)
          .eq('portfolio_id', portfolioId)
          .gte('transaction_date', startDate.toISOString())
          .lte('transaction_date', endDate.toISOString())

        // Apply filters
        if (filters.type) {
          query = query.eq('type', filters.type)
        }

        if (filters.symbol) {
          query = query.eq('symbol', filters.symbol)
        }

        // Apply sorting
        const sortColumn = filters.sortBy === 'date' ? 'transaction_date' : 
                          filters.sortBy === 'amount' ? 'total_amount' : 'symbol'
        
        query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' })

        // Limit results
        query = query.limit(maxItems * 2) // Get more than needed for filtering

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw fetchError
        }

        setTransactions(data || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Kunne ikke laste transaksjonshistorikk')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [portfolioId, filters, maxItems])

  // Real-time subscription for new transactions
  useEffect(() => {
    if (!portfolioId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`transactions_${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        (payload) => {
          console.log('New transaction detected:', payload)
          
          if (payload.new) {
            // Add the new transaction and highlight it
            setNewTransactionId(payload.new.id)
            setTransactions(prev => [payload.new as Transaction, ...prev])
            
            // Remove highlight after animation
            setTimeout(() => setNewTransactionId(null), 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [portfolioId])

  // Get available filter options
  const filterOptions = useMemo(() => {
    const types = new Set<string>()
    const symbols = new Set<string>()

    transactions.forEach(transaction => {
      types.add(transaction.type)
      symbols.add(transaction.symbol)
    })

    return {
      types: Array.from(types).sort(),
      symbols: Array.from(symbols).sort(),
    }
  }, [transactions])

  // Get transaction type info
  const getTransactionTypeInfo = (type: Transaction['type']) => {
    switch (type) {
      case 'BUY':
        return {
          label: 'Kjøp',
          icon: <ArrowUpIcon className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        }
      case 'SELL':
        return {
          label: 'Salg',
          icon: <ArrowDownIcon className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        }
      case 'DIVIDEND':
        return {
          label: 'Utbytte',
          icon: <BanknotesIcon className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        }
      case 'TRANSFER':
        return {
          label: 'Overføring',
          icon: <ChartBarSquareIcon className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        }
      case 'FEE':
        return {
          label: 'Gebyr',
          icon: <MinusIcon className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
      default:
        return {
          label: type,
          icon: <InformationCircleIcon className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'I dag'
    } else if (diffDays === 1) {
      return 'I går'
    } else if (diffDays < 7) {
      return `${diffDays} dager siden`
    } else {
      return date.toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  // Get impact indicator for significant transactions
  const getImpactIndicator = (transaction: Transaction) => {
    const amount = Math.abs(transaction.total_amount)
    
    if (amount > 100000) {
      return (
        <motion.div
          variants={pulseVariants}
          animate="pulse"
          className="flex items-center space-x-1 text-orange-600"
        >
          <ArrowTrendingUpIcon className="h-3 w-3" />
          <span className="text-xs font-medium">Stor transaksjon</span>
        </motion.div>
      )
    }
    
    return null
  }

  if (error) {
    return (
      <AnimatedCard className={cn('p-6', className)}>
        <div className="flex items-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <div>
            <p className="font-medium">Kunne ikke laste aktivitet</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Siste aktivitet
          </h3>
          {transactions.length > 0 && (
            <Badge variant="secondary">
              {transactions.length} transaksjon{transactions.length !== 1 ? 'er' : ''}
            </Badge>
          )}
        </div>

        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllFilters(!showAllFilters)}
            className={showAllFilters ? 'bg-blue-50 text-blue-600' : ''}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        )}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showAllFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatedCard className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <option value="">Alle typer</option>
                    {filterOptions.types.map(type => {
                      const typeInfo = getTransactionTypeInfo(type as Transaction['type'])
                      return (
                        <option key={type} value={type}>
                          {typeInfo.label}
                        </option>
                      )
                    })}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol
                  </label>
                  <Select
                    value={filters.symbol}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, symbol: value }))}
                  >
                    <option value="">Alle symboler</option>
                    {filterOptions.symbols.map(symbol => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periode
                  </label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <option value="7">Siste 7 dager</option>
                    <option value="30">Siste 30 dager</option>
                    <option value="90">Siste 3 måneder</option>
                    <option value="365">Siste år</option>
                    <option value="all">Alt</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sortering
                  </label>
                  <div className="flex space-x-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                    >
                      <option value="date">Dato</option>
                      <option value="amount">Beløp</option>
                      <option value="symbol">Symbol</option>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                      }))}
                    >
                      {filters.sortOrder === 'asc' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      <AnimatedCard className="overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen aktivitet
            </h3>
            <p className="text-gray-600">
              Det er ingen transaksjoner i den valgte perioden.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-200"
          >
            <AnimatePresence>
              {transactions.slice(0, maxItems).map((transaction) => {
                const typeInfo = getTransactionTypeInfo(transaction.type)
                const isNewTransaction = newTransactionId === transaction.id
                const impactIndicator = getImpactIndicator(transaction)

                return (
                  <motion.div
                    key={transaction.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover="hover"
                    layoutId={transaction.id}
                    className={cn(
                      'p-4 transition-all duration-300',
                      isNewTransaction && 'bg-blue-50 border-l-4 border-blue-500'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Transaction Type Icon */}
                        <motion.div
                          className={cn(
                            'p-2 rounded-full border',
                            typeInfo.bgColor,
                            typeInfo.borderColor
                          )}
                          animate={isNewTransaction ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.6 }}
                        >
                          <div className={typeInfo.color}>
                            {typeInfo.icon}
                          </div>
                        </motion.div>

                        {/* Transaction Details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {typeInfo.label} {transaction.stocks?.name || transaction.symbol}
                            </span>
                            
                            {transaction.type !== 'DIVIDEND' && transaction.type !== 'FEE' && (
                              <Badge variant="outline" className="text-xs">
                                <NumberCounter value={transaction.quantity} />
                                {transaction.quantity === 1 ? ' stk' : ' stk'}
                              </Badge>
                            )}
                            
                            {impactIndicator}
                            
                            {isNewTransaction && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-blue-600"
                              >
                                <Badge variant="outline" className="text-blue-600 border-blue-200">
                                  Ny
                                </Badge>
                              </motion.div>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarDaysIcon className="h-3 w-3" />
                              <span>{formatDate(transaction.transaction_date)}</span>
                            </div>
                            
                            {transaction.type !== 'DIVIDEND' && transaction.type !== 'FEE' && (
                              <span>
                                @ <CurrencyCounter
                                  value={transaction.price}
                                  currency={transaction.currency}
                                  className="font-medium"
                                />
                              </span>
                            )}
                            
                            {transaction.fee > 0 && (
                              <span className="text-gray-500">
                                Gebyr: <CurrencyCounter
                                  value={transaction.fee}
                                  currency={transaction.currency}
                                />
                              </span>
                            )}
                            
                            {transaction.stocks?.sector && (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.stocks.sector}
                              </Badge>
                            )}
                          </div>

                          {transaction.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <CurrencyCounter
                          value={Math.abs(transaction.total_amount)}
                          currency={transaction.currency}
                          className={cn(
                            'text-lg font-semibold',
                            transaction.type === 'SELL' || transaction.type === 'DIVIDEND'
                              ? 'text-green-600'
                              : transaction.type === 'FEE'
                              ? 'text-red-600'
                              : 'text-gray-900'
                          )}
                          prefix={
                            transaction.type === 'SELL' || transaction.type === 'DIVIDEND'
                              ? '+'
                              : transaction.type === 'FEE'
                              ? '-'
                              : '-'
                          }
                        />
                        
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.transaction_date).toLocaleTimeString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Show More Button */}
        {transactions.length > maxItems && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Implementation for showing more transactions
                console.log('Show more transactions')
              }}
            >
              Vis flere transaksjoner ({transactions.length - maxItems} til)
            </Button>
          </div>
        )}
      </AnimatedCard>
    </div>
  )
}