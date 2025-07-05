'use client'

import { useState, useRef, useEffect } from 'react'
import { searchStocks } from '@/lib/actions/stocks/crud'
import { fetchStockPrice } from '@/lib/utils/yahoo-finance'

interface Stock {
  id: string
  symbol: string
  name: string
  company_name?: string
  exchange: string
  currency: string
  current_price?: number
  sector?: string
  industry?: string
  market_cap?: number
}

interface StockSearchProps {
  onSelectStock: (stock: Stock) => void
  onClose?: () => void
  placeholder?: string
  className?: string
}

export default function StockSearch({
  onSelectStock,
  onClose,
  placeholder = 'Search stocks by symbol or name...',
  className = '',
}: StockSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Stock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 1) {
        performSearch(query.trim())
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await searchStocks(searchQuery, 8)

      if (result.success) {
        setResults(result.data || [])
        setIsOpen(true)
        setSelectedIndex(-1)
      } else {
        setError(result.error || 'Search failed')
        setResults([])
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('An error occurred while searching')
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectStock(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelectStock = async (stock: Stock) => {
    try {
      setIsLoading(true)

      // Try to get current price from Yahoo Finance
      if (!stock.current_price) {
        const priceResult = await fetchStockPrice(stock.symbol)
        if (priceResult.success && priceResult.data) {
          stock = {
            ...stock,
            current_price: priceResult.data.price,
          }
        }
      }

      onSelectStock(stock)
      setQuery('')
      setResults([])
      setIsOpen(false)
      setSelectedIndex(-1)

      if (onClose) {
        onClose()
      }
    } catch (err) {
      console.error('Error selecting stock:', err)
      // Still proceed with selection even if price fetch fails
      onSelectStock(stock)
      setQuery('')
      setResults([])
      setIsOpen(false)
      setSelectedIndex(-1)

      if (onClose) {
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return null

    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`
    }
    return `$${marketCap.toLocaleString()}`
  }

  const formatPrice = (price?: number, currency = 'USD') => {
    if (!price) return 'N/A'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NOK' ? 'NOK' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
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
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />

        {/* Loading/Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          ) : query.length > 0 ? (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
                setIsOpen(false)
                setSelectedIndex(-1)
                inputRef.current?.focus()
              }}
              className="h-5 w-5 text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-red-200 bg-red-50 p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="h-4 w-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((stock, index) => (
            <button
              key={stock.id}
              onClick={() => handleSelectStock(stock)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <span className="text-sm font-bold text-blue-600">
                        {stock.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {stock.symbol}
                        </p>
                        <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                          {stock.exchange}
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-600">
                        {stock.company_name || stock.name}
                      </p>
                      {stock.sector && (
                        <p className="truncate text-xs text-gray-500">
                          {stock.sector}
                          {stock.industry && ` • ${stock.industry}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-1">
                  {stock.current_price && (
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(stock.current_price, stock.currency)}
                    </p>
                  )}
                  {stock.market_cap && (
                    <p className="text-xs text-gray-500">
                      {formatMarketCap(stock.market_cap)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{stock.currency}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query.length >= 1 && !isLoading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No stocks found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try searching with a different symbol or company name.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
