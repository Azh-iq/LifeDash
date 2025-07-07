'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Building2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

interface StockSearchProps {
  value?: string
  onSelect: (stock: StockSearchResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  exchangeFilter?: string // Filter by specific exchange (e.g., 'OSLO', 'NASDAQ')
}

export function StockSearch({
  value = '',
  onSelect,
  placeholder = 'Søk etter aksjer...',
  className,
  disabled = false,
  exchangeFilter,
}: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Search stocks function
  const searchStocks = useCallback(
    async (term: string) => {
      if (term.trim().length < 1) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
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
      } catch (error) {
        console.error('Stock search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [exchangeFilter]
  )

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      searchStocks(searchTerm)
    }, 300)

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

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
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
          onFocus={() => setIsOpen(true)}
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600"></div>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && searchTerm.length >= 1 && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto',
            'rounded-lg border border-gray-200 bg-white shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((stock, index) => (
                <button
                  key={stock.id}
                  onClick={() => handleSelect(stock)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                    selectedIndex === index && 'bg-purple-50',
                    'border-b border-gray-100 last:border-b-0'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {stock.symbol}
                        </span>
                        {stock.is_popular && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {getCountryFlag(stock.country || '')} {stock.exchange}
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
          ) : !isLoading && searchTerm.length >= 1 ? (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              Ingen aksjer funnet for "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
