import {
  FilterOptions,
  SortOptions,
} from '@/components/features/stocks/holdings-filters'

export type HoldingWithStock = {
  id: string
  symbol: string
  companyName: string
  platform: string
  account: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  totalCost: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  currency: string
  lastUpdate: string
}

/**
 * Filters holdings based on the provided filter options
 */
export function filterHoldings(
  holdings: HoldingWithStock[],
  filters: FilterOptions
): HoldingWithStock[] {
  let filteredHoldings = [...holdings]

  // Filter by search term (symbol or company name)
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase()
    filteredHoldings = filteredHoldings.filter(
      holding =>
        holding.symbol.toLowerCase().includes(searchLower) ||
        holding.companyName.toLowerCase().includes(searchLower)
    )
  }

  // Filter by platforms
  if (filters.platforms.length > 0) {
    filteredHoldings = filteredHoldings.filter(holding =>
      filters.platforms.includes(holding.platform)
    )
  }

  // Filter by currencies
  if (filters.currencies.length > 0) {
    filteredHoldings = filteredHoldings.filter(holding =>
      filters.currencies.includes(holding.currency)
    )
  }

  // Filter by account types
  if (filters.accountTypes.length > 0) {
    filteredHoldings = filteredHoldings.filter(holding =>
      filters.accountTypes.includes(holding.account)
    )
  }

  // Filter by performance
  if (filters.performanceFilter === 'winners') {
    filteredHoldings = filteredHoldings.filter(
      holding => holding.unrealizedPnl > 0
    )
  } else if (filters.performanceFilter === 'losers') {
    filteredHoldings = filteredHoldings.filter(
      holding => holding.unrealizedPnl < 0
    )
  }

  return filteredHoldings
}

/**
 * Sorts holdings based on the provided sort options
 */
export function sortHoldings(
  holdings: HoldingWithStock[],
  sortOptions: SortOptions
): HoldingWithStock[] {
  const sortedHoldings = [...holdings]

  sortedHoldings.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortOptions.field) {
      case 'symbol':
        aValue = a.symbol.toLowerCase()
        bValue = b.symbol.toLowerCase()
        break
      case 'companyName':
        aValue = a.companyName.toLowerCase()
        bValue = b.companyName.toLowerCase()
        break
      case 'platform':
        aValue = a.platform.toLowerCase()
        bValue = b.platform.toLowerCase()
        break
      case 'marketValue':
        aValue = a.marketValue
        bValue = b.marketValue
        break
      case 'unrealizedPnl':
        aValue = a.unrealizedPnl
        bValue = b.unrealizedPnl
        break
      case 'unrealizedPnlPercent':
        aValue = a.unrealizedPnlPercent
        bValue = b.unrealizedPnlPercent
        break
      default:
        aValue = a.marketValue
        bValue = b.marketValue
    }

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortOptions.direction === 'asc' ? comparison : -comparison
    }

    // Handle number comparison
    if (sortOptions.direction === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })

  return sortedHoldings
}

/**
 * Applies both filtering and sorting to holdings
 */
export function processHoldings(
  holdings: HoldingWithStock[],
  filters: FilterOptions,
  sortOptions: SortOptions
): HoldingWithStock[] {
  const filteredHoldings = filterHoldings(holdings, filters)
  return sortHoldings(filteredHoldings, sortOptions)
}

/**
 * Gets unique values for filter options from holdings data
 */
export function getFilterOptions(holdings: HoldingWithStock[]) {
  const platforms = Array.from(new Set(holdings.map(h => h.platform))).sort()
  const currencies = Array.from(new Set(holdings.map(h => h.currency))).sort()
  const accountTypes = Array.from(new Set(holdings.map(h => h.account))).sort()

  return {
    platforms,
    currencies,
    accountTypes,
  }
}

/**
 * Creates default filter options
 */
export function getDefaultFilters(): FilterOptions {
  return {
    platforms: [],
    currencies: [],
    accountTypes: [],
    performanceFilter: 'all',
    searchTerm: '',
  }
}

/**
 * Creates default sort options
 */
export function getDefaultSorting(): SortOptions {
  return {
    field: 'marketValue',
    direction: 'desc',
  }
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: FilterOptions): boolean {
  return (
    filters.platforms.length > 0 ||
    filters.currencies.length > 0 ||
    filters.accountTypes.length > 0 ||
    filters.performanceFilter !== 'all' ||
    filters.searchTerm.length > 0
  )
}

/**
 * Gets a summary of filtered results
 */
export function getFilterSummary(
  originalCount: number,
  filteredCount: number,
  filters: FilterOptions
): string {
  if (!hasActiveFilters(filters)) {
    return `Viser ${originalCount} posisjoner`
  }

  if (filteredCount === 0) {
    return 'Ingen posisjoner funnet med de valgte filtrene'
  }

  if (filteredCount === originalCount) {
    return `Viser alle ${originalCount} posisjoner`
  }

  return `Viser ${filteredCount} av ${originalCount} posisjoner`
}
