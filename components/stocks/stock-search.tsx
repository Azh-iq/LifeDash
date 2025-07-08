'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Building2, TrendingUp, Loader2, Star, Package, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchUserHoldingsForSale, type HoldingForSale } from '@/lib/actions/holdings/fetch-holdings'

export interface StockSearchResult {
  id: string
  symbol: string
  name: string
  company_name: string
  exchange: string
  currency: string
  sector?: string
  industry?: string
  country?: string
  is_popular: boolean
  // Holdings-specific data (when in holdings mode)
  quantity?: number
  average_cost?: number
  total_cost?: number
  current_price?: number
  market_value?: number
  account_id?: string
  account_name?: string
  account_platform?: string
}

interface StockSearchProps {
  value?: string
  onSelect: (stock: StockSearchResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  exchangeFilter?: string // Filter by specific exchange (e.g., 'OSLO', 'NASDAQ')
  holdingsOnly?: boolean // Only show stocks from user's holdings
  portfolioId?: string // Filter holdings by portfolio
}

export function StockSearch({
  value = '',
  onSelect,
  placeholder = 'Søk etter aksjer...',
  className,
  disabled = false,
  exchangeFilter,
  holdingsOnly = false,
  portfolioId,
}: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [popularStocks, setPopularStocks] = useState<StockSearchResult[]>([])
  const [userHoldings, setUserHoldings] = useState<StockSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showPopular, setShowPopular] = useState(false)
  const [showHoldings, setShowHoldings] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Fetch user holdings for sale
  const fetchUserHoldings = useCallback(async () => {
    if (!holdingsOnly) return

    try {
      const result = await fetchUserHoldingsForSale(portfolioId)
      if (result.success && result.data) {
        setUserHoldings(result.data)
      } else {
        setUserHoldings([])
      }
    } catch (error) {
      console.error('User holdings error:', error)
      setUserHoldings([])
    }
  }, [holdingsOnly, portfolioId])

  // Fetch popular stocks
  const fetchPopularStocks = useCallback(async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('stock_registry')
        .select(
          'id, symbol, name, company_name, exchange, currency, sector, industry, country, is_popular'
        )
        .eq('is_popular', true)
        .eq('is_active', true)
        .order('country', { ascending: true }) // Norwegian stocks first
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(12)

      // Apply exchange filter if provided
      if (exchangeFilter) {
        query = query.eq('exchange', exchangeFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Popular stocks error:', error)
        setPopularStocks([])
      } else {
        setPopularStocks(data || [])
      }
    } catch (error) {
      console.error('Popular stocks error:', error)
      setPopularStocks([])
    }
  }, [exchangeFilter])

  // Search stocks function
  const searchStocks = useCallback(
    async (term: string) => {
      if (term.trim().length < 1) {
        setResults([])
        if (holdingsOnly) {
          setShowHoldings(true)
          setShowPopular(false)
        } else {
          setShowPopular(true)
          setShowHoldings(false)
        }
        return
      }

      setShowPopular(false)
      setShowHoldings(false)
      setIsLoading(true)
      
      try {
        if (holdingsOnly) {
          // Filter holdings by search term
          const filtered = userHoldings.filter(holding => 
            holding.symbol.toLowerCase().includes(term.toLowerCase()) ||
            holding.name.toLowerCase().includes(term.toLowerCase()) ||
            holding.company_name.toLowerCase().includes(term.toLowerCase())
          )
          setResults(filtered)
        } else {
          // Regular stock search
          const supabase = createClient()
          const { data, error } = await supabase.rpc('search_stocks', {
            search_term: term,
            limit_count: 10,
            exchange_filter: exchangeFilter || null,
          })

          if (error) {
            console.error('Stock search error:', error)
            setResults([])
          } else {
            setResults(data || [])
          }
        }
      } catch (error) {
        console.error('Stock search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [exchangeFilter, holdingsOnly, userHoldings]
  )

  // Load popular stocks and holdings on mount
  useEffect(() => {
    if (holdingsOnly) {
      fetchUserHoldings()
    } else {
      fetchPopularStocks()
    }
  }, [fetchUserHoldings, fetchPopularStocks, holdingsOnly])

  // Debounced search (faster response time)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      searchStocks(searchTerm)
    }, 200) // Reduced from 300ms to 200ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchTerm, searchStocks])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)

    // Show appropriate default list when input is empty
    if (newValue.trim().length === 0) {
      if (holdingsOnly) {
        setShowHoldings(true)
        setShowPopular(false)
      } else {
        setShowPopular(true)
        setShowHoldings(false)
      }
      setResults([])
    } else {
      setShowPopular(false)
      setShowHoldings(false)
    }
  }

  // Handle result selection
  const handleSelect = (stock: StockSearchResult) => {
    setSearchTerm(`${stock.symbol} - ${stock.name}`)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(stock)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const currentResults = showPopular ? popularStocks : showHoldings ? userHoldings : results
    const maxIndex = currentResults.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && currentResults[selectedIndex]) {
          handleSelect(currentResults[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        setShowPopular(false)
        setShowHoldings(false)
        inputRef.current?.blur()
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Flag emoji helper
  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      NO: '🇳🇴',
      US: '🇺🇸',
      DE: '🇩🇪',
      CH: '🇨🇭',
      NL: '🇳🇱',
      FR: '🇫🇷',
      GB: '🇬🇧',
      CA: '🇨🇦',
      JP: '🇯🇵',
    }
    return flags[country] || '🌍'
  }

  // Highlight matching text in search results
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    )
    const parts = text.split(regex)

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <span
              key={index}
              className="bg-yellow-100 font-medium text-yellow-800"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true)
            if (searchTerm.trim().length === 0) {
              if (holdingsOnly) {
                setShowHoldings(true)
              } else {
                setShowPopular(true)
              }
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm',
            'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            isLoading && 'cursor-wait'
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto',
            'rounded-lg border border-gray-200 bg-white shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {showPopular && popularStocks.length > 0 ? (
            <div>
              <div className="border-b border-gray-100 px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Populære aksjer
                </div>
              </div>
              <div className="py-1">
                {popularStocks.map((stock, index) => (
                  <button
                    key={stock.id}
                    onClick={() => handleSelect(stock)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors',
                      'hover:bg-purple-50 focus:bg-purple-50 focus:outline-none',
                      selectedIndex === index && 'bg-purple-100',
                      'border-b border-gray-50 last:border-b-0'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {stock.symbol}
                          </span>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-gray-500">
                            {getCountryFlag(stock.country || '')}{' '}
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="truncate text-sm text-gray-700">
                          {stock.name}
                        </div>
                        {stock.sector && (
                          <div className="mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {stock.sector}
                              {stock.industry && ` • ${stock.industry}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-600">
                          {stock.currency}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : showHoldings && userHoldings.length > 0 ? (
            <div>
              <div className="border-b border-gray-100 px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Package className="h-3 w-3 text-blue-500" />
                  Dine beholdninger
                </div>
              </div>
              <div className="py-1">
                {userHoldings.map((holding, index) => (
                  <button
                    key={holding.id}
                    onClick={() => handleSelect(holding)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors',
                      'hover:bg-purple-50 focus:bg-purple-50 focus:outline-none',
                      selectedIndex === index && 'bg-purple-100',
                      'border-b border-gray-50 last:border-b-0'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {holding.symbol}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getCountryFlag(holding.country || '')}{' '}
                            {holding.exchange}
                          </span>
                        </div>
                        <div className="truncate text-sm text-gray-700">
                          {holding.name}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{holding.quantity} aksjer</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            <span>{holding.account_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-600">
                          {holding.currency}
                        </div>
                        <div className="text-xs text-gray-500">
                          Snitt: {holding.average_cost?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((stock, index) => (
                <button
                  key={stock.id}
                  onClick={() => handleSelect(stock)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    'hover:bg-purple-50 focus:bg-purple-50 focus:outline-none',
                    selectedIndex === index && 'bg-purple-100',
                    'border-b border-gray-50 last:border-b-0'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {highlightMatch(stock.symbol, searchTerm)}
                        </span>
                        {stock.is_popular && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {getCountryFlag(stock.country || '')} {stock.exchange}
                        </span>
                      </div>
                      <div className="truncate text-sm text-gray-700">
                        {highlightMatch(stock.name, searchTerm)}
                      </div>
                      {stock.sector && (
                        <div className="mt-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {stock.sector}
                            {stock.industry && ` • ${stock.industry}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-600">
                        {stock.currency}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading && searchTerm.length >= 1 ? (
            <div className="px-4 py-6 text-center">
              <div className="mb-2 text-sm text-gray-500">
                {holdingsOnly 
                  ? `Ingen beholdninger funnet for "${searchTerm}"` 
                  : `Ingen aksjer funnet for "${searchTerm}"`
                }
              </div>
              <div className="text-xs text-gray-400">
                {holdingsOnly
                  ? 'Prøv å søke på symbol eller navn på aksjer du eier'
                  : 'Prøv søk på symbol (f.eks. AAPL) eller bedriftsnavn (f.eks. Apple)'
                }
              </div>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {holdingsOnly ? 'Laster beholdninger...' : 'Søker...'}
              </div>
            </div>
          ) : showHoldings && userHoldings.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <div className="mb-2 text-sm text-gray-500">
                Ingen beholdninger funnet
              </div>
              <div className="text-xs text-gray-400">
                Du har ikke noen aksjer å selge i denne porteføljen
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
