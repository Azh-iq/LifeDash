'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AnimatedCard,
  NumberCounter,
  CurrencyCounter,
  PercentageCounter,
} from '@/components/animated'
import { formatCurrency, formatPercentage } from '@/components/charts'
import {
  usePortfolioState,
  HoldingWithMetrics,
} from '@/lib/hooks/use-portfolio-state'
import { cn } from '@/lib/utils/cn'

interface HoldingsSectionProps {
  portfolioId: string
  className?: string
  onStockClick?: (holding: HoldingWithMetrics) => void
}

interface TableColumn {
  key: keyof HoldingWithMetrics | 'stocks.name' | 'stocks.sector'
  label: string
  sortable: boolean
  width: string
  align: 'left' | 'center' | 'right'
  formatter?: (value: any, holding: HoldingWithMetrics) => React.ReactNode
}

interface FilterState {
  search: string
  sector: string
  currency: string
  minValue: string
  maxValue: string
  showOnlyProfitable: boolean
  showOnlyLosers: boolean
  showSmallHoldings: boolean
}

const TABLE_COLUMNS: TableColumn[] = [
  {
    key: 'stocks.name',
    label: 'Selskap',
    sortable: true,
    width: 'w-64',
    align: 'left',
    formatter: (_, holding) => (
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">
            {holding.stocks?.name || holding.symbol}
          </span>
          {holding.weight > 10 && (
            <Badge variant="outline" className="text-xs">
              Top holding
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <span className="text-sm text-gray-500">{holding.symbol}</span>
          {holding.stocks?.currency && (
            <Badge variant="secondary" className="text-xs">
              {holding.stocks.currency}
            </Badge>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'quantity',
    label: 'Antall',
    sortable: true,
    width: 'w-24',
    align: 'right',
    formatter: value => (
      <NumberCounter value={value} className="text-sm font-medium" />
    ),
  },
  {
    key: 'current_price',
    label: 'Kurs',
    sortable: true,
    width: 'w-28',
    align: 'right',
    formatter: (value, holding) => (
      <div className="text-right">
        <CurrencyCounter
          value={value}
          currency={holding.stocks?.currency || 'NOK'}
          className="text-sm font-medium"
        />
        {holding.daily_change_percent && (
          <div
            className={cn(
              'mt-1 flex items-center justify-end text-xs',
              holding.daily_change_percent >= 0
                ? 'text-green-600'
                : 'text-red-600'
            )}
          >
            {holding.daily_change_percent >= 0 ? (
              <ArrowTrendingUpIcon className="mr-1 h-3 w-3" />
            ) : (
              <ArrowTrendingDownIcon className="mr-1 h-3 w-3" />
            )}
            <PercentageCounter value={Math.abs(holding.daily_change_percent)} />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'current_value',
    label: 'Markedsverdi',
    sortable: true,
    width: 'w-32',
    align: 'right',
    formatter: (value, holding) => (
      <div className="text-right">
        <CurrencyCounter
          value={value}
          currency="NOK"
          className="text-sm font-medium"
        />
        <div className="mt-1 text-xs text-gray-500">
          {formatPercentage(holding.weight)}
        </div>
      </div>
    ),
  },
  {
    key: 'cost_basis',
    label: 'Kostbasis',
    sortable: true,
    width: 'w-28',
    align: 'right',
    formatter: value => (
      <CurrencyCounter
        value={value}
        currency="NOK"
        className="text-sm text-gray-600"
      />
    ),
  },
  {
    key: 'gain_loss',
    label: 'Gevinst/Tap',
    sortable: true,
    width: 'w-32',
    align: 'right',
    formatter: (value, holding) => (
      <div className="text-right">
        <CurrencyCounter
          value={value}
          currency="NOK"
          className={cn(
            'text-sm font-medium',
            value >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        />
        <PercentageCounter
          value={holding.gain_loss_percent}
          className={cn(
            'mt-1 text-xs',
            holding.gain_loss_percent >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        />
      </div>
    ),
  },
  {
    key: 'stocks.sector',
    label: 'Sektor',
    sortable: true,
    width: 'w-28',
    align: 'left',
    formatter: (_, holding) => (
      <Badge variant="outline" className="text-xs">
        {holding.stocks?.sector || 'Ukjent'}
      </Badge>
    ),
  },
]

export default function HoldingsSection({
  portfolioId,
  className,
  onStockClick,
}: HoldingsSectionProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedHoldings, setSelectedHoldings] = useState<Set<string>>(
    new Set()
  )
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

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

  // Local filter state for controlled inputs
  const [localFilters, setLocalFilters] = useState<FilterState>({
    search: '',
    sector: '',
    currency: '',
    minValue: '',
    maxValue: '',
    showOnlyProfitable: false,
    showOnlyLosers: false,
    showSmallHoldings: true,
  })

  // Available filter options
  const filterOptions = useMemo(() => {
    const sectors = new Set<string>()
    const currencies = new Set<string>()

    sortedHoldings.forEach(holding => {
      if (holding.stocks?.sector) sectors.add(holding.stocks.sector)
      if (holding.stocks?.currency) currencies.add(holding.stocks.currency)
    })

    return {
      sectors: Array.from(sectors).sort(),
      currencies: Array.from(currencies).sort(),
    }
  }, [sortedHoldings])

  // Apply filters
  const applyFilters = useCallback(() => {
    setFilters({
      search: localFilters.search,
      sector: localFilters.sector,
      currency: localFilters.currency,
      minValue: localFilters.minValue ? parseFloat(localFilters.minValue) : 0,
      maxValue: localFilters.maxValue ? parseFloat(localFilters.maxValue) : 0,
      showOnlyProfitable: localFilters.showOnlyProfitable,
      showOnlyLosers: localFilters.showOnlyLosers,
    })
  }, [localFilters, setFilters])

  // Clear filters
  const clearFilters = useCallback(() => {
    const resetFilters = {
      search: '',
      sector: '',
      currency: '',
      minValue: '',
      maxValue: '',
      showOnlyProfitable: false,
      showOnlyLosers: false,
      showSmallHoldings: true,
    }
    setLocalFilters(resetFilters)
    setFilters({
      search: '',
      sector: '',
      currency: '',
      minValue: 0,
      maxValue: 0,
      showOnlyProfitable: false,
      showOnlyLosers: false,
    })
  }, [setFilters])

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

  // Filter holdings based on small holdings setting
  const displayedHoldings = useMemo(() => {
    if (localFilters.showSmallHoldings) {
      return sortedHoldings
    }
    return sortedHoldings.filter(holding => holding.weight >= 1) // Only show holdings > 1%
  }, [sortedHoldings, localFilters.showSmallHoldings])

  // Handle row selection
  const handleSelectHolding = useCallback((holdingId: string) => {
    setSelectedHoldings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(holdingId)) {
        newSet.delete(holdingId)
      } else {
        newSet.add(holdingId)
      }
      return newSet
    })
  }, [])

  const handleSelectAllHoldings = useCallback(() => {
    if (selectedHoldings.size === displayedHoldings.length) {
      setSelectedHoldings(new Set())
    } else {
      setSelectedHoldings(new Set(displayedHoldings.map(h => h.id)))
    }
  }, [selectedHoldings.size, displayedHoldings])

  // Handle stock detail click
  const handleStockClick = useCallback(
    (holding: HoldingWithMetrics, event: React.MouseEvent) => {
      // Prevent click when clicking on checkbox or if no handler provided
      if (!onStockClick) return

      const target = event.target as HTMLElement
      if (
        target.type === 'checkbox' ||
        target.closest('input[type="checkbox"]')
      ) {
        return
      }

      onStockClick(holding)
    },
    [onStockClick]
  )

  // Get filter stats
  const filterStats = useMemo(() => {
    const total = sortedHoldings.length
    const filtered = displayedHoldings.length
    const profitable = displayedHoldings.filter(h => h.gain_loss > 0).length
    const losing = displayedHoldings.filter(h => h.gain_loss < 0).length

    return { total, filtered, profitable, losing }
  }, [sortedHoldings, displayedHoldings])

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
      {/* Header with stats and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Beholdninger</h3>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
            <span>{filterStats.total} totalt</span>
            {filterStats.filtered !== filterStats.total && (
              <span>({filterStats.filtered} vist)</span>
            )}
            <span className="text-green-600">
              {filterStats.profitable} lønnsom
            </span>
            <span className="text-red-600">{filterStats.losing} tapende</span>
            {isPricesConnected && (
              <div className="flex items-center space-x-1 text-green-600">
                <SparklesIcon className="h-4 w-4" />
                <span>Live priser</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
          >
            <FunnelIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatedCard className="bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Søk
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      placeholder="Selskap eller symbol..."
                      value={localFilters.search}
                      onChange={e =>
                        setLocalFilters(prev => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sector */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sektor
                  </label>
                  <Select
                    value={localFilters.sector}
                    onValueChange={value =>
                      setLocalFilters(prev => ({
                        ...prev,
                        sector: value,
                      }))
                    }
                  >
                    <option value="">Alle sektorer</option>
                    {filterOptions.sectors.map(sector => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Currency */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Valuta
                  </label>
                  <Select
                    value={localFilters.currency}
                    onValueChange={value =>
                      setLocalFilters(prev => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <option value="">Alle valutaer</option>
                    {filterOptions.currencies.map(currency => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Value Range */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Verdiområde (NOK)
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Min"
                      value={localFilters.minValue}
                      onChange={e =>
                        setLocalFilters(prev => ({
                          ...prev,
                          minValue: e.target.value,
                        }))
                      }
                      type="number"
                    />
                    <Input
                      placeholder="Maks"
                      value={localFilters.maxValue}
                      onChange={e =>
                        setLocalFilters(prev => ({
                          ...prev,
                          maxValue: e.target.value,
                        }))
                      }
                      type="number"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Toggles */}
              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex flex-wrap items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={localFilters.showOnlyProfitable}
                      onCheckedChange={checked =>
                        setLocalFilters(prev => ({
                          ...prev,
                          showOnlyProfitable: checked,
                          showOnlyLosers: checked ? false : prev.showOnlyLosers,
                        }))
                      }
                    />
                    <label className="text-sm text-gray-700">
                      Kun lønnsomme
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={localFilters.showOnlyLosers}
                      onCheckedChange={checked =>
                        setLocalFilters(prev => ({
                          ...prev,
                          showOnlyLosers: checked,
                          showOnlyProfitable: checked
                            ? false
                            : prev.showOnlyProfitable,
                        }))
                      }
                    />
                    <label className="text-sm text-gray-700">Kun tapende</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={localFilters.showSmallHoldings}
                      onCheckedChange={checked =>
                        setLocalFilters(prev => ({
                          ...prev,
                          showSmallHoldings: checked,
                        }))
                      }
                    />
                    <label className="text-sm text-gray-700">
                      Vis små beholdninger
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Nullstill
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Anvend filter
                  </Button>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holdings Table */}
      <AnimatedCard className="overflow-hidden">
        {holdingsLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : displayedHoldings.length === 0 ? (
          <div className="p-12 text-center">
            <InformationCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Ingen beholdninger funnet
            </h3>
            <p className="text-gray-600">
              {sortedHoldings.length === 0
                ? 'Denne porteføljen har ingen beholdninger ennå.'
                : 'Prøv å justere filtrene for å se flere beholdninger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedHoldings.size === displayedHoldings.length &&
                        displayedHoldings.length > 0
                      }
                      onChange={handleSelectAllHoldings}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {TABLE_COLUMNS.map(column => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm font-medium text-gray-900',
                        column.width,
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.sortable && 'cursor-pointer hover:bg-gray-100'
                      )}
                      onClick={() =>
                        column.sortable &&
                        handleSort(column.key as keyof HoldingWithMetrics)
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                        )}
                        {sortConfig.key === column.key &&
                          (sortConfig.direction === 'desc' ? (
                            <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {displayedHoldings.map((holding, index) => (
                    <motion.tr
                      key={holding.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={e => handleStockClick(holding, e)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-gray-50',
                        selectedHoldings.has(holding.id) && 'bg-blue-50',
                        onStockClick && 'hover:bg-blue-50'
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedHoldings.has(holding.id)}
                          onChange={() => handleSelectHolding(holding.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {TABLE_COLUMNS.map(column => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3',
                            column.width,
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.formatter
                            ? column.formatter(
                                column.key.includes('.')
                                  ? column.key
                                      .split('.')
                                      .reduce(
                                        (obj, key) => obj?.[key],
                                        holding as any
                                      )
                                  : holding[
                                      column.key as keyof HoldingWithMetrics
                                    ],
                                holding
                              )
                            : column.key.includes('.')
                              ? column.key
                                  .split('.')
                                  .reduce(
                                    (obj, key) => obj?.[key],
                                    holding as any
                                  )
                              : holding[column.key as keyof HoldingWithMetrics]}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Selection Actions */}
        <AnimatePresence>
          {selectedHoldings.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedHoldings.size} beholdning
                  {selectedHoldings.size !== 1 ? 'er' : ''} valgt
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Eksporter valgte
                  </Button>
                  <Button variant="outline" size="sm">
                    Rediger valgte
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
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedCard>
    </div>
  )
}
