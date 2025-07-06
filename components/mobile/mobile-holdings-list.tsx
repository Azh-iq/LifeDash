'use client'

import { useState, useRef, useCallback, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react'

interface Holding {
  id: string
  symbol: string
  name: string
  quantity: number
  currentPrice: number
  averagePrice: number
  marketValue: number
  unrealizedPL: number
  unrealizedPLPercent: number
  sector?: string
  lastUpdated: Date
}

interface MobileHoldingsListProps {
  holdings: Holding[]
  onEdit?: (holding: Holding) => void
  onDelete?: (holding: Holding) => void
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

interface SwipeActionsProps {
  onEdit: () => void
  onDelete: () => void
  isVisible: boolean
}

const SwipeActions = memo(
  ({ onEdit, onDelete, isVisible }: SwipeActionsProps) => (
    <div
      className={cn(
        'absolute right-0 top-0 flex h-full items-center transition-transform duration-200',
        isVisible ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-full rounded-none bg-blue-500 px-4 text-white hover:bg-blue-600"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-full rounded-none rounded-r-lg bg-red-500 px-4 text-white hover:bg-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
)

SwipeActions.displayName = 'SwipeActions'

interface HoldingCardProps {
  holding: Holding
  onEdit: (holding: Holding) => void
  onDelete: (holding: Holding) => void
  index: number
}

const HoldingCard = memo(
  ({ holding, onEdit, onDelete, index }: HoldingCardProps) => {
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)
    const startX = useRef(0)
    const currentX = useRef(0)

    const isPositive = holding.unrealizedPL >= 0
    const SWIPE_THRESHOLD = 100
    const MAX_SWIPE = 120

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0]
      startX.current = touch.clientX
      currentX.current = touch.clientX
      setIsDragging(true)
    }, [])

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!isDragging) return

        const touch = e.touches[0]
        currentX.current = touch.clientX
        const deltaX = startX.current - currentX.current

        // Only allow swiping left (positive deltaX)
        if (deltaX > 0) {
          const newOffset = Math.min(deltaX, MAX_SWIPE)
          setSwipeOffset(newOffset)
        }
      },
      [isDragging]
    )

    const handleTouchEnd = useCallback(() => {
      setIsDragging(false)

      if (swipeOffset > SWIPE_THRESHOLD) {
        setSwipeOffset(MAX_SWIPE)
        setShowActions(true)
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      } else {
        setSwipeOffset(0)
        setShowActions(false)
      }
    }, [swipeOffset])

    const handleCardTap = useCallback(() => {
      if (showActions) {
        setShowActions(false)
        setSwipeOffset(0)
      }
    }, [showActions])

    const handleEdit = useCallback(() => {
      onEdit(holding)
      setShowActions(false)
      setSwipeOffset(0)
    }, [holding, onEdit])

    const handleDelete = useCallback(() => {
      onDelete(holding)
      setShowActions(false)
      setSwipeOffset(0)
    }, [holding, onDelete])

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
    }

    const formatPercent = (percent: number) => {
      return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
    }

    return (
      <div className="relative overflow-hidden">
        <Card
          ref={cardRef}
          className={cn(
            'relative cursor-pointer touch-none transition-transform duration-200',
            isDragging ? 'transition-none' : ''
          )}
          style={{
            transform: `translateX(-${swipeOffset}px)`,
            animationDelay: `${index * 50}ms`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardTap}
        >
          <div className="p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">{holding.symbol}</h3>
                  {holding.sector && (
                    <Badge variant="secondary" className="text-xs">
                      {holding.sector}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm text-gray-600">{holding.name}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {formatCurrency(holding.marketValue)}
                </div>
                <div
                  className={cn(
                    'flex items-center text-sm font-medium',
                    isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {formatPercent(holding.unrealizedPLPercent)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Quantity</div>
                <div className="font-medium">
                  {holding.quantity.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Current Price</div>
                <div className="font-medium">
                  {formatCurrency(holding.currentPrice)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Avg Price</div>
                <div className="font-medium">
                  {formatCurrency(holding.averagePrice)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">P&L</div>
                <div
                  className={cn(
                    'font-medium',
                    isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatCurrency(holding.unrealizedPL)}
                </div>
              </div>
            </div>

            <div className="mt-3 border-t pt-3 text-xs text-gray-500">
              Last updated: {holding.lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </Card>

        <SwipeActions
          onEdit={handleEdit}
          onDelete={handleDelete}
          isVisible={showActions}
        />
      </div>
    )
  }
)

HoldingCard.displayName = 'HoldingCard'

const MobileHoldingsList = memo(
  ({
    holdings,
    onEdit,
    onDelete,
    onSort,
    onRefresh,
    isRefreshing = false,
    className,
  }: MobileHoldingsListProps) => {
    const [sortField, setSortField] = useState<string>('symbol')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [refreshing, setRefreshing] = useState(false)

    const handleSort = useCallback(
      (field: string) => {
        const newDirection =
          sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
        setSortField(field)
        setSortDirection(newDirection)
        onSort?.(field, newDirection)
      },
      [sortField, sortDirection, onSort]
    )

    const handleRefresh = useCallback(async () => {
      setRefreshing(true)
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }

      try {
        await onRefresh?.()
      } finally {
        setRefreshing(false)
      }
    }, [onRefresh])

    const handleEdit = useCallback(
      (holding: Holding) => {
        onEdit?.(holding)
      },
      [onEdit]
    )

    const handleDelete = useCallback(
      (holding: Holding) => {
        onDelete?.(holding)
      },
      [onDelete]
    )

    const totalValue = holdings.reduce(
      (sum, holding) => sum + holding.marketValue,
      0
    )
    const totalPL = holdings.reduce(
      (sum, holding) => sum + holding.unrealizedPL,
      0
    )
    const totalPLPercent =
      totalValue > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
    }

    return (
      <div className={cn('space-y-4', className)}>
        {/* Summary Header */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Portfolio Holdings</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isRefreshing}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  (refreshing || isRefreshing) && 'animate-spin'
                )}
              />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total P&L</div>
              <div
                className={cn(
                  'flex items-center text-2xl font-bold',
                  totalPL >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {totalPL >= 0 ? (
                  <TrendingUp className="mr-2 h-5 w-5" />
                ) : (
                  <TrendingDown className="mr-2 h-5 w-5" />
                )}
                {formatCurrency(totalPL)}
              </div>
            </div>
          </div>
        </Card>

        {/* Sort Controls */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="whitespace-nowrap text-sm text-gray-500">
              Sort by:
            </span>
            {[
              { key: 'symbol', label: 'Symbol' },
              { key: 'marketValue', label: 'Value' },
              { key: 'unrealizedPLPercent', label: 'P&L %' },
              { key: 'unrealizedPL', label: 'P&L $' },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={sortField === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort(key)}
                className="whitespace-nowrap"
              >
                {label}
                {sortField === key &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp className="ml-1 h-3 w-3" />
                  ) : (
                    <ArrowDown className="ml-1 h-3 w-3" />
                  ))}
              </Button>
            ))}
          </div>
        </Card>

        {/* Holdings List */}
        <div className="space-y-3">
          {holdings.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <div className="mb-2 text-lg font-medium">
                  No holdings found
                </div>
                <div className="text-sm">
                  Start by adding your first stock position
                </div>
              </div>
            </Card>
          ) : (
            holdings.map((holding, index) => (
              <HoldingCard
                key={holding.id}
                holding={holding}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={index}
              />
            ))
          )}
        </div>

        {/* Swipe Hint */}
        {holdings.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Swipe left on any holding to edit or delete
          </div>
        )}
      </div>
    )
  }
)

MobileHoldingsList.displayName = 'MobileHoldingsList'

export default MobileHoldingsList
