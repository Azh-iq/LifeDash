'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  MinusIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AnimatedCard, CurrencyCounter, NumberCounter } from '@/components/animated'
import MobileActionSheet, { useActionSheet } from '@/components/mobile/mobile-action-sheet'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/components/charts'
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

interface MobileRecentActivityProps {
  portfolioId: string
  maxItems?: number
  showFilters?: boolean
  showSearch?: boolean
  allowInfiniteScroll?: boolean
  showAddTransaction?: boolean
  onAddTransaction?: () => void
  onEditTransaction?: (transaction: Transaction) => void
  className?: string
}

interface ActivityFilter {
  type: string
  symbol: string
  dateRange: string
  sortBy: 'date' | 'amount' | 'symbol'
  sortOrder: 'asc' | 'desc'
  searchQuery: string
}

// Swipe actions for transactions
interface SwipeAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  action: (transaction: Transaction) => void
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
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
    transition: { duration: 0.2 },
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

// Transaction swipeable card component
interface SwipeableTransactionCardProps {
  transaction: Transaction
  onSwipeAction: (action: string, transaction: Transaction) => void
  isNew?: boolean
  showCompact?: boolean
}

function SwipeableTransactionCard({ 
  transaction, 
  onSwipeAction, 
  isNew = false,
  showCompact = false 
}: SwipeableTransactionCardProps) {
  const [swipeX, setSwipeX] = useState(0)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const swipeActions: SwipeAction[] = [
    {
      id: 'view',
      label: 'Vis',
      icon: EyeIcon,
      color: 'bg-blue-500',
      action: (transaction) => onSwipeAction('view', transaction)
    },
    {
      id: 'edit',
      label: 'Rediger',
      icon: PencilIcon,
      color: 'bg-green-500',
      action: (transaction) => onSwipeAction('edit', transaction)
    }
  ]

  const handleSwipe = useCallback((offset: number) => {
    if (offset < -80) {
      setSwipeX(-120)
      setShowActions(true)
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } else {
      setSwipeX(0)
      setShowActions(false)
    }
  }, [])

  const getTransactionTypeInfo = (type: Transaction['type']) => {
    switch (type) {
      case 'BUY':
        return {
          label: 'Kjøp',
          icon: ArrowUpIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        }
      case 'SELL':
        return {
          label: 'Salg',
          icon: ArrowDownIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        }
      case 'DIVIDEND':
        return {
          label: 'Utbytte',
          icon: BanknotesIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        }
      case 'TRANSFER':
        return {
          label: 'Overføring',
          icon: ChartBarSquareIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        }
      case 'FEE':
        return {
          label: 'Gebyr',
          icon: MinusIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
      default:
        return {
          label: type,
          icon: InformationCircleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
    }
  }

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

  const typeInfo = getTransactionTypeInfo(transaction.type)
  const isLargeTransaction = Math.abs(transaction.total_amount) > 50000

  return (
    <div className="relative overflow-hidden">
      <motion.div
        ref={cardRef}
        className={cn(
          'relative bg-white border border-gray-200 rounded-lg transition-all duration-200',
          'touch-none select-none',
          showCompact ? 'p-3' : 'p-4',
          isNew && 'bg-blue-50 border-blue-200 shadow-md',
          showActions && 'shadow-lg'
        )}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setSwipeX(info.offset.x)}
        onDragEnd={(_, info) => handleSwipe(info.offset.x)}
        animate={{ x: swipeX }}
        onClick={() => showActions && setShowActions(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Transaction type icon */}
            <motion.div
              className={cn(
                'p-2 rounded-full border flex-shrink-0',
                typeInfo.bgColor,
                typeInfo.borderColor
              )}
              animate={isNew ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6 }}
            >
              <typeInfo.icon className={cn('h-4 w-4', typeInfo.color)} />
            </motion.div>

            {/* Transaction details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {typeInfo.label} {transaction.stocks?.name || transaction.symbol}
                </span>
                
                {transaction.type !== 'DIVIDEND' && transaction.type !== 'FEE' && (
                  <Badge variant="outline" className="text-xs">
                    <NumberCounter value={transaction.quantity} />
                    {transaction.quantity === 1 ? ' stk' : ' stk'}
                  </Badge>
                )}
                
                {isLargeTransaction && (
                  <motion.div
                    variants={pulseVariants}
                    animate="pulse"
                    className="flex items-center space-x-1 text-orange-600"
                  >
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    {!showCompact && (
                      <span className="text-xs font-medium">Stor</span>
                    )}
                  </motion.div>
                )}
                
                {isNew && (
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

              {!showCompact && (
                <div className="flex items-center space-x-3 text-xs text-gray-600">
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
                </div>
              )}

              {showCompact && (
                <div className="text-xs text-gray-500">
                  {formatDate(transaction.transaction_date)}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <CurrencyCounter
              value={Math.abs(transaction.total_amount)}
              currency={transaction.currency}
              className={cn(
                showCompact ? 'text-sm' : 'text-lg',
                'font-semibold',
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
            
            {!showCompact && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(transaction.transaction_date).toLocaleTimeString('nb-NO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {!showCompact && transaction.notes && (
          <p className="text-sm text-gray-600 mt-2 italic border-t border-gray-100 pt-2">
            {transaction.notes}
          </p>
        )}
      </motion.div>

      {/* Swipe actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 h-full flex"
          >
            {swipeActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action(transaction)
                    setShowActions(false)
                    setSwipeX(0)
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center w-12 h-full text-white transition-colors',
                    action.color,
                    index === swipeActions.length - 1 && 'rounded-r-lg'
                  )}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">{action.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MobileRecentActivity({
  portfolioId,
  maxItems = 10,
  showFilters = true,
  showSearch = true,
  allowInfiniteScroll = false,
  showAddTransaction = false,
  onAddTransaction,
  onEditTransaction,
  className
}: MobileRecentActivityProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [newTransactionId, setNewTransactionId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isOpen: isActionSheetOpen, config, showActionSheet, hideActionSheet } = useActionSheet()

  const [filters, setFilters] = useState<ActivityFilter>({
    type: '',
    symbol: '',
    dateRange: '30',
    sortBy: 'date',
    sortOrder: 'desc',
    searchQuery: ''
  })

  // Available filter options
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

  // Fetch transactions
  const fetchTransactions = useCallback(async (pageNum = 1, append = false) => {
    if (!portfolioId) return

    try {
      if (!append) {
        setLoading(true)
        setError(null)
      }

      const supabase = createClient()
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      if (filters.dateRange !== 'all') {
        startDate.setDate(endDate.getDate() - parseInt(filters.dateRange))
      } else {
        startDate.setFullYear(endDate.getFullYear() - 10)
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

      if (filters.searchQuery) {
        query = query.or(
          `symbol.ilike.%${filters.searchQuery}%,stocks.name.ilike.%${filters.searchQuery}%`
        )
      }

      // Apply sorting
      const sortColumn = filters.sortBy === 'date' ? 'transaction_date' : 
                        filters.sortBy === 'amount' ? 'total_amount' : 'symbol'
      
      query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' })

      // Pagination
      const itemsPerPage = maxItems
      const start = (pageNum - 1) * itemsPerPage
      query = query.range(start, start + itemsPerPage - 1)

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        if (append) {
          setTransactions(prev => [...prev, ...data])
        } else {
          setTransactions(data)
        }
        
        setHasMore(data.length === itemsPerPage)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Kunne ikke laste transaksjonshistorikk')
    } finally {
      setLoading(false)
    }
  }, [portfolioId, filters, maxItems])

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTransactions(nextPage, true)
    }
  }, [hasMore, loading, page, fetchTransactions])

  // Handle swipe actions
  const handleSwipeAction = useCallback((action: string, transaction: Transaction) => {
    switch (action) {
      case 'view':
        // Show transaction details in action sheet
        showActionSheet({
          title: 'Transaksjonsdetaljer',
          subtitle: `${transaction.symbol} - ${transaction.type}`,
          items: [
            {
              id: 'edit',
              label: 'Rediger transaksjon',
              icon: PencilIcon,
              onClick: () => onEditTransaction?.(transaction)
            }
          ]
        })
        break
      case 'edit':
        onEditTransaction?.(transaction)
        break
    }
  }, [showActionSheet, onEditTransaction])

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!filters.searchQuery) return transactions
    
    const query = filters.searchQuery.toLowerCase()
    return transactions.filter(transaction => 
      transaction.symbol.toLowerCase().includes(query) ||
      transaction.stocks?.name?.toLowerCase().includes(query) ||
      transaction.type.toLowerCase().includes(query)
    )
  }, [transactions, filters.searchQuery])

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
          if (payload.new) {
            setNewTransactionId(payload.new.id)
            setTransactions(prev => [payload.new as Transaction, ...prev])
            
            // Haptic feedback
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100])
            }
            
            setTimeout(() => setNewTransactionId(null), 3000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [portfolioId])

  // Initial fetch
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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
    <>
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Siste aktivitet
            </h3>
            {filteredTransactions.length > 0 && (
              <Badge variant="secondary">
                {filteredTransactions.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showAddTransaction && (
              <Button
                size="sm"
                onClick={onAddTransaction}
                className="touch-manipulation"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            )}
            
            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllFilters(!showAllFilters)}
                className={cn('touch-manipulation', showAllFilters && 'bg-blue-50 text-blue-600')}
              >
                <FunnelIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Søk etter transaksjoner..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10 touch-manipulation"
            />
            {filters.searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                    >
                      <option value="">Alle typer</option>
                      <option value="BUY">Kjøp</option>
                      <option value="SELL">Salg</option>
                      <option value="DIVIDEND">Utbytte</option>
                      <option value="TRANSFER">Overføring</option>
                      <option value="FEE">Gebyr</option>
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
                </div>
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity List */}
        <AnimatedCard className="overflow-hidden">
          {loading && filteredTransactions.length === 0 ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ingen aktivitet
              </h3>
              <p className="text-gray-600 mb-4">
                {transactions.length === 0 
                  ? 'Det er ingen transaksjoner å vise ennå.'
                  : 'Ingen transaksjoner matcher søket eller filtrene.'
                }
              </p>
              {showAddTransaction && (
                <Button onClick={onAddTransaction}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Legg til transaksjon
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="divide-y divide-gray-200"
            >
              <div className="p-4 space-y-3">
                <AnimatePresence>
                  {filteredTransactions.slice(0, maxItems).map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layoutId={transaction.id}
                    >
                      <SwipeableTransactionCard
                        transaction={transaction}
                        onSwipeAction={handleSwipeAction}
                        isNew={newTransactionId === transaction.id}
                        showCompact={filteredTransactions.length > 5}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More / Infinite Scroll */}
              {allowInfiniteScroll && hasMore && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full touch-manipulation"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Laster...' : `Last flere (${transactions.length - filteredTransactions.slice(0, maxItems).length} til)`}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatedCard>

        {/* Swipe Hint */}
        {filteredTransactions.length > 0 && (
          <div className="text-center text-xs text-gray-500">
            Dra til venstre for å se handlinger
          </div>
        )}
      </div>

      {/* Action Sheet */}
      <MobileActionSheet
        isOpen={isActionSheetOpen}
        onClose={hideActionSheet}
        title={config.title}
        subtitle={config.subtitle}
        items={config.items}
      />
    </>
  )
}