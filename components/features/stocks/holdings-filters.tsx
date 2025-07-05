'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export type SortField =
  | 'symbol'
  | 'companyName'
  | 'platform'
  | 'marketValue'
  | 'unrealizedPnl'
  | 'unrealizedPnlPercent'
export type SortDirection = 'asc' | 'desc'

export interface FilterOptions {
  platforms: string[]
  currencies: string[]
  accountTypes: string[]
  performanceFilter: 'all' | 'winners' | 'losers'
  searchTerm: string
}

export interface SortOptions {
  field: SortField
  direction: SortDirection
}

interface HoldingsFiltersProps {
  filters: FilterOptions
  sorting: SortOptions
  onFiltersChange: (filters: FilterOptions) => void
  onSortingChange: (sorting: SortOptions) => void
  onClearFilters: () => void
  availablePlatforms: string[]
  availableCurrencies: string[]
  availableAccountTypes: string[]
}

export function HoldingsFilters({
  filters,
  sorting,
  onFiltersChange,
  onSortingChange,
  onClearFilters,
  availablePlatforms,
  availableCurrencies,
  availableAccountTypes,
}: HoldingsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchTerm: value,
    })
  }

  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform]

    onFiltersChange({
      ...filters,
      platforms: newPlatforms,
    })
  }

  const handleCurrencyToggle = (currency: string) => {
    const newCurrencies = filters.currencies.includes(currency)
      ? filters.currencies.filter(c => c !== currency)
      : [...filters.currencies, currency]

    onFiltersChange({
      ...filters,
      currencies: newCurrencies,
    })
  }

  const handleAccountTypeToggle = (accountType: string) => {
    const newAccountTypes = filters.accountTypes.includes(accountType)
      ? filters.accountTypes.filter(a => a !== accountType)
      : [...filters.accountTypes, accountType]

    onFiltersChange({
      ...filters,
      accountTypes: newAccountTypes,
    })
  }

  const handlePerformanceFilterChange = (
    performanceFilter: 'all' | 'winners' | 'losers'
  ) => {
    onFiltersChange({
      ...filters,
      performanceFilter,
    })
  }

  const handleSortFieldChange = (field: SortField) => {
    if (sorting.field === field) {
      // Toggle direction if same field
      onSortingChange({
        field,
        direction: sorting.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      // Set new field with default direction
      onSortingChange({
        field,
        direction: 'desc',
      })
    }
  }

  const getActiveFilterCount = () => {
    return (
      filters.platforms.length +
      filters.currencies.length +
      filters.accountTypes.length +
      (filters.performanceFilter !== 'all' ? 1 : 0) +
      (filters.searchTerm.length > 0 ? 1 : 0)
    )
  }

  const getSortIcon = (field: SortField) => {
    if (sorting.field !== field) {
      return (
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    return sorting.direction === 'asc' ? (
      <svg
        className="h-4 w-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    ) : (
      <svg
        className="h-4 w-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m-4 4l4 4m-4-4v-12"
        />
      </svg>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar and Main Controls */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Søk etter symbol eller selskap..."
            value={filters.searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            leftIcon={
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
              />
            </svg>
            Filtre
            {getActiveFilterCount() > 0 && (
              <Badge
                variant="destructive"
                size="sm"
                className="absolute -right-2 -top-2 min-w-0 px-1"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Nullstill
            </Button>
          )}
        </div>
      </div>

      {/* Quick Performance Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.performanceFilter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handlePerformanceFilterChange('all')}
        >
          Alle
        </Button>
        <Button
          variant={
            filters.performanceFilter === 'winners' ? 'primary' : 'outline'
          }
          size="sm"
          onClick={() => handlePerformanceFilterChange('winners')}
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Vinnere
        </Button>
        <Button
          variant={
            filters.performanceFilter === 'losers' ? 'primary' : 'outline'
          }
          size="sm"
          onClick={() => handlePerformanceFilterChange('losers')}
          className="border-red-600 text-red-600 hover:bg-red-50"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
          Tapere
        </Button>
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-600">Sortér etter:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSortFieldChange('marketValue')}
          className="flex items-center gap-1"
        >
          Markedsverdi
          {getSortIcon('marketValue')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSortFieldChange('unrealizedPnl')}
          className="flex items-center gap-1"
        >
          P&L
          {getSortIcon('unrealizedPnl')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSortFieldChange('unrealizedPnlPercent')}
          className="flex items-center gap-1"
        >
          P&L %{getSortIcon('unrealizedPnlPercent')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSortFieldChange('symbol')}
          className="flex items-center gap-1"
        >
          Symbol
          {getSortIcon('symbol')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSortFieldChange('platform')}
          className="flex items-center gap-1"
        >
          Plattform
          {getSortIcon('platform')}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Platform Filters */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Plattformer
                </h4>
                <div className="space-y-2">
                  {availablePlatforms.map(platform => (
                    <label
                      key={platform}
                      className="flex cursor-pointer items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.platforms.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency Filters */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Valuta
                </h4>
                <div className="space-y-2">
                  {availableCurrencies.map(currency => (
                    <label
                      key={currency}
                      className="flex cursor-pointer items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.currencies.includes(currency)}
                        onChange={() => handleCurrencyToggle(currency)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{currency}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Type Filters */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Kontotype
                </h4>
                <div className="space-y-2">
                  {availableAccountTypes.map(accountType => (
                    <label
                      key={accountType}
                      className="flex cursor-pointer items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.accountTypes.includes(accountType)}
                        onChange={() => handleAccountTypeToggle(accountType)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {accountType}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Aktive filtre:</span>

          {filters.searchTerm && (
            <Badge
              variant="info"
              removable
              onRemove={() => handleSearchChange('')}
            >
              Søk: {filters.searchTerm}
            </Badge>
          )}

          {filters.performanceFilter !== 'all' && (
            <Badge
              variant="info"
              removable
              onRemove={() => handlePerformanceFilterChange('all')}
            >
              {filters.performanceFilter === 'winners' ? 'Vinnere' : 'Tapere'}
            </Badge>
          )}

          {filters.platforms.map(platform => (
            <Badge
              key={platform}
              variant="secondary"
              removable
              onRemove={() => handlePlatformToggle(platform)}
            >
              {platform}
            </Badge>
          ))}

          {filters.currencies.map(currency => (
            <Badge
              key={currency}
              variant="secondary"
              removable
              onRemove={() => handleCurrencyToggle(currency)}
            >
              {currency}
            </Badge>
          ))}

          {filters.accountTypes.map(accountType => (
            <Badge
              key={accountType}
              variant="secondary"
              removable
              onRemove={() => handleAccountTypeToggle(accountType)}
            >
              {accountType}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
