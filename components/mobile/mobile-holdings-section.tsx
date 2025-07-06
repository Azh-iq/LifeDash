'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AnimatedCard,
  NumberCounter,
  CurrencyCounter,
  PercentageCounter,
} from '@/components/animated'
import MobileActionSheet, {
  useActionSheet,
} from '@/components/mobile/mobile-action-sheet'
import {
  usePortfolioState,
  HoldingWithMetrics,
} from '@/lib/hooks/use-portfolio-state'
import { formatCurrency, formatPercentage } from '@/components/charts'
import { cn } from '@/lib/utils/cn'

interface MobileHoldingsSectionProps {
  portfolioId: string
  onAddHolding?: () => void
  onEditHolding?: (holding: HoldingWithMetrics) => void
  onDeleteHolding?: (holding: HoldingWithMetrics) => void
  onBuyMore?: (holding: HoldingWithMetrics) => void
  onStockClick?: (holding: HoldingWithMetrics) => void
  className?: string
}

interface GroupingOption {
  key: string
  label: string
  getValue: (holding: HoldingWithMetrics) => string
}

interface SwipeAction {
  id: string
  label: string
  icon: React.ElementType
  color: string
  action: (holding: HoldingWithMetrics) => void
}

const SWIPE_THRESHOLD = 80
const SWIPE_ACTIONS_WIDTH = 180

const groupingOptions: GroupingOption[] = [
  {
    key: 'none',
    label: 'Ingen gruppering',
    getValue: () => 'all',
  },
  {
    key: 'sector',
    label: 'Etter sektor',
    getValue: holding => holding.stocks?.sector || 'Ukjent sektor',
  },
  {
    key: 'currency',
    label: 'Etter valuta',
    getValue: holding => holding.stocks?.currency || 'NOK',
  },
  {
    key: 'performance',
    label: 'Etter ytelse',
    getValue: holding =>
      holding.gain_loss_percent >= 10
        ? 'Høy gevinst (>10%)'
        : holding.gain_loss_percent >= 0
          ? 'Positiv'
          : holding.gain_loss_percent >= -10
            ? 'Negativ'
            : 'Høyt tap (<-10%)',
  },
]

// Virtual scrolling for large lists
const ITEM_HEIGHT = 120
const VIEWPORT_HEIGHT = 400

interface VirtualizedListProps {
  items: HoldingWithMetrics[]
  renderItem: (item: HoldingWithMetrics, index: number) => React.ReactNode
  height: number
  itemHeight: number
}

function VirtualizedList({
  items,
  renderItem,
  height,
  itemHeight,
}: VirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(height / itemHeight) + 2,
    items.length
  )
  const visibleItems = items.slice(visibleStart, visibleEnd)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  )
}

interface SwipeableHoldingCardProps {
  holding: HoldingWithMetrics
  onSwipeAction: (action: string, holding: HoldingWithMetrics) => void
  viewMode: 'list' | 'grid'
  isSelected: boolean
  onSelect: (holding: HoldingWithMetrics) => void
  onStockClick?: (holding: HoldingWithMetrics) => void
}

function SwipeableHoldingCard({
  holding,
  onSwipeAction,
  viewMode,
  isSelected,
  onSelect,
  onStockClick,
}: SwipeableHoldingCardProps) {
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const swipeActions: SwipeAction[] = [
    {
      id: 'edit',
      label: 'Rediger',
      icon: PencilIcon,
      color: 'bg-blue-500',
      action: holding => onSwipeAction('edit', holding),
    },
    {
      id: 'buy',
      label: 'Kjøp mer',
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
      action: holding => onSwipeAction('buy', holding),
    },
    {
      id: 'delete',
      label: 'Slett',
      icon: TrashIcon,
      color: 'bg-red-500',
      action: holding => onSwipeAction('delete', holding),
    },
  ]

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < 0) {
        const newX = Math.max(-SWIPE_ACTIONS_WIDTH, info.offset.x)
        setSwipeX(newX)
      }
    },
    []
  )

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false)

      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        setSwipeX(-SWIPE_ACTIONS_WIDTH)
        setShowActions(true)

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      } else {
        setSwipeX(0)
        setShowActions(false)
      }
    },
    []
  )

  const handleCardTap = useCallback(() => {
    if (showActions) {
      setShowActions(false)
      setSwipeX(0)
    } else {
      // If onStockClick is provided, use it for opening stock details
      // Otherwise fall back to selection behavior
      if (onStockClick) {
        onStockClick(holding)
      } else {
        onSelect(holding)
      }
    }
  }, [showActions, holding, onSelect, onStockClick])

  const handleActionClick = useCallback(
    (action: SwipeAction, e: React.MouseEvent) => {
      e.stopPropagation()
      action.action(holding)
      setShowActions(false)
      setSwipeX(0)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
    },
    [holding]
  )

  const isPositive = holding.gain_loss >= 0

  return (
    <div className="relative overflow-hidden">
      <motion.div
        ref={cardRef}
        className={cn(
          'relative rounded-lg border border-gray-200 bg-white transition-all duration-200',
          viewMode === 'grid' ? 'p-3' : 'p-4',
          isSelected && 'bg-blue-50 ring-2 ring-blue-500',
          isDragging ? 'z-10' : ''
        )}
        drag="x"
        dragConstraints={{ left: -SWIPE_ACTIONS_WIDTH, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeX }}
        onClick={handleCardTap}
        whileTap={{ scale: 0.98 }}
      >
        {viewMode === 'grid' ? (
          // Grid View (Compact)
          <div className="text-center">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{holding.symbol}</span>
              <div
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositive ? '+' : ''}
                <PercentageCounter value={holding.gain_loss_percent} />
              </div>
            </div>

            <div className="mb-2">
              <CurrencyCounter
                value={holding.current_value}
                currency="NOK"
                className="text-lg font-bold"
              />
            </div>

            <div className="text-xs text-gray-500">
              <NumberCounter value={holding.quantity} /> stk
            </div>
          </div>
        ) : (
          // List View (Detailed)
          <div>
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">
                    {holding.symbol}
                  </h3>
                  {holding.stocks?.sector && (
                    <Badge variant="secondary" className="text-xs">
                      {holding.stocks.sector}
                    </Badge>
                  )}
                  {holding.weight > 10 && (
                    <Badge variant="outline" className="text-xs">
                      Top
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm text-gray-600">
                  {holding.stocks?.name || 'Ukjent selskap'}
                </p>
              </div>

              <div className="text-right">
                <CurrencyCounter
                  value={holding.current_value}
                  currency="NOK"
                  className="text-lg font-semibold"
                />
                <div
                  className={cn(
                    'mt-1 flex items-center justify-end text-sm font-medium',
                    isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="mr-1 h-3 w-3" />
                  )}
                  <PercentageCounter
                    value={holding.gain_loss_percent}
                    prefix={isPositive ? '+' : ''}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Antall</div>
                <NumberCounter
                  value={holding.quantity}
                  className="font-medium"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Kurs</div>
                <CurrencyCounter
                  value={holding.current_price}
                  currency={holding.stocks?.currency || 'NOK'}
                  className="font-medium"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500">Vekt</div>
                <PercentageCounter
                  value={holding.weight}
                  className="font-medium"
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Swipe Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 flex h-full"
          >
            {swipeActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  initial={{ x: 60 }}
                  animate={{ x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={e => handleActionClick(action, e)}
                  className={cn(
                    'flex h-full w-14 flex-col items-center justify-center text-white transition-colors',
                    action.color,
                    index === swipeActions.length - 1 && 'rounded-r-lg'
                  )}
                >
                  <Icon className="mb-1 h-5 w-5" />
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

export default function MobileHoldingsSection({
  portfolioId,
  onAddHolding,
  onEditHolding,
  onDeleteHolding,
  onBuyMore,
  onStockClick,
  className,
}: MobileHoldingsSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [groupBy, setGroupBy] = useState('none')
  const [selectedHoldings, setSelectedHoldings] = useState<Set<string>>(
    new Set()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const {
    isOpen: isActionSheetOpen,
    config,
    showActionSheet,
    hideActionSheet,
  } = useActionSheet()

  const {
    sortedHoldings,
    holdingsLoading,
    holdingsError,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    metrics,
    isPricesConnected,
  } = usePortfolioState(portfolioId)

  // Handle search
  const filteredHoldings = useMemo(() => {
    if (!searchQuery) return sortedHoldings

    const query = searchQuery.toLowerCase()
    return sortedHoldings.filter(
      holding =>
        holding.symbol.toLowerCase().includes(query) ||
        holding.stocks?.name?.toLowerCase().includes(query) ||
        holding.stocks?.sector?.toLowerCase().includes(query)
    )
  }, [sortedHoldings, searchQuery])

  // Group holdings
  const groupedHoldings = useMemo(() => {
    const grouping = groupingOptions.find(g => g.key === groupBy)
    if (!grouping || groupBy === 'none') {
      return { all: filteredHoldings }
    }

    const groups: { [key: string]: HoldingWithMetrics[] } = {}
    filteredHoldings.forEach(holding => {
      const groupKey = grouping.getValue(holding)
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(holding)
    })

    return groups
  }, [filteredHoldings, groupBy])

  // Handle swipe actions
  const handleSwipeAction = useCallback(
    (action: string, holding: HoldingWithMetrics) => {
      switch (action) {
        case 'edit':
          onEditHolding?.(holding)
          break
        case 'buy':
          onBuyMore?.(holding)
          break
        case 'delete':
          onDeleteHolding?.(holding)
          break
      }
    },
    [onEditHolding, onBuyMore, onDeleteHolding]
  )

  // Handle selection
  const handleSelectHolding = useCallback((holding: HoldingWithMetrics) => {
    setSelectedHoldings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(holding.id)) {
        newSet.delete(holding.id)
      } else {
        newSet.add(holding.id)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedHoldings.size === filteredHoldings.length) {
      setSelectedHoldings(new Set())
    } else {
      setSelectedHoldings(new Set(filteredHoldings.map(h => h.id)))
    }
  }, [selectedHoldings.size, filteredHoldings])

  // Handle sorting
  const handleSort = useCallback(
    (key: keyof HoldingWithMetrics) => {
      setSortConfig(prev => ({
        key,
        direction:
          prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
      }))
    },
    [setSortConfig]
  )

  // Render holding item
  const renderHoldingItem = useCallback(
    (holding: HoldingWithMetrics, index: number) => (
      <motion.div
        key={holding.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={viewMode === 'grid' ? 'w-full' : 'mb-3'}
      >
        <SwipeableHoldingCard
          holding={holding}
          onSwipeAction={handleSwipeAction}
          viewMode={viewMode}
          isSelected={selectedHoldings.has(holding.id)}
          onSelect={handleSelectHolding}
          onStockClick={onStockClick}
        />
      </motion.div>
    ),
    [
      viewMode,
      selectedHoldings,
      handleSwipeAction,
      handleSelectHolding,
      onStockClick,
    ]
  )

  if (holdingsError) {
    return (
      <AnimatedCard className={cn('p-6', className)}>
        <div className="flex items-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <div>
            <p className="font-medium">Kunne ikke laste beholdninger</p>
            <p className="text-sm text-gray-600">{holdingsError}</p>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Beholdninger</h3>
          <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
            <span>
              {filteredHoldings.length} av {sortedHoldings.length}
            </span>
            {isPricesConnected && (
              <div className="flex items-center space-x-1 text-green-600">
                <SparklesIcon className="h-4 w-4" />
                <span>Live</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add Button */}
          <Button
            size="sm"
            onClick={onAddHolding}
            className="touch-manipulation"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>

          {/* View Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="touch-manipulation"
          >
            {viewMode === 'list' ? (
              <Squares2X2Icon className="h-4 w-4" />
            ) : (
              <ListBulletIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'touch-manipulation',
              showFilters && 'bg-blue-50 text-blue-600'
            )}
          >
            <FunnelIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="Søk etter symbol, navn eller sektor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="touch-manipulation pl-10"
        />
      </div>

      {/* Filters and Controls */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatedCard className="bg-gray-50 p-4">
              <div className="space-y-4">
                {/* Grouping and Sorting */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Grupper etter
                    </label>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                      {groupingOptions.map(option => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Sorter etter
                    </label>
                    <div className="flex space-x-2">
                      <Select
                        value={sortConfig.key}
                        onValueChange={value =>
                          handleSort(value as keyof HoldingWithMetrics)
                        }
                      >
                        <option value="current_value">Verdi</option>
                        <option value="gain_loss_percent">Gevinst %</option>
                        <option value="symbol">Symbol</option>
                        <option value="weight">Vekt</option>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSortConfig(prev => ({
                            ...prev,
                            direction:
                              prev.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                      >
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selection Controls */}
                {selectedHoldings.size > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                    <span className="text-sm text-blue-800">
                      {selectedHoldings.size} valgt
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Eksporter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedHoldings(new Set())}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holdings List */}
      <AnimatedCard className="overflow-hidden">
        {holdingsLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 animate-pulse rounded bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="text-right">
                  <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredHoldings.length === 0 ? (
          <div className="p-12 text-center">
            <InformationCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Ingen beholdninger funnet
            </h3>
            <p className="mb-4 text-gray-600">
              {sortedHoldings.length === 0
                ? 'Legg til din første aksje for å komme i gang.'
                : 'Prøv å justere søket eller filtrene.'}
            </p>
            <Button onClick={onAddHolding}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Legg til aksje
            </Button>
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedHoldings).map(([groupName, holdings]) => (
              <div key={groupName} className="mb-6 last:mb-0">
                {groupBy !== 'none' && (
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{groupName}</h4>
                    <Badge variant="secondary">{holdings.length}</Badge>
                  </div>
                )}

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {holdings.map((holding, index) =>
                      renderHoldingItem(holding, index)
                    )}
                  </div>
                ) : // Use virtual scrolling for large lists
                holdings.length > 20 ? (
                  <VirtualizedList
                    items={holdings}
                    renderItem={renderHoldingItem}
                    height={VIEWPORT_HEIGHT}
                    itemHeight={ITEM_HEIGHT}
                  />
                ) : (
                  <div className="space-y-3">
                    {holdings.map((holding, index) =>
                      renderHoldingItem(holding, index)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* Swipe Hint */}
      {filteredHoldings.length > 0 && (
        <div className="text-center text-xs text-gray-500">
          Dra til venstre for rask tilgang til handlinger
        </div>
      )}

      {/* Action Sheet */}
      <MobileActionSheet
        isOpen={isActionSheetOpen}
        onClose={hideActionSheet}
        title={config.title}
        subtitle={config.subtitle}
        items={config.items}
      />
    </div>
  )
}
