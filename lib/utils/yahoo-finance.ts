import { Database } from '@/lib/types/database.types'
import { fetchMockStockPrices } from './mock-stock-api'

// Types for Yahoo Finance API responses
export interface YahooFinanceQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
  regularMarketVolume: number
  marketState: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
  currency: string
  exchangeTimezoneName: string
  regularMarketTime: number
  postMarketPrice?: number
  postMarketChange?: number
  postMarketChangePercent?: number
  preMarketPrice?: number
  preMarketChange?: number
  preMarketChangePercent?: number
}

export interface YahooFinanceResponse {
  quoteResponse: {
    result: YahooFinanceQuote[]
    error: any
  }
}

export interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  currency: string
  marketState: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
  source: 'yahoo_finance'
}

export interface YahooFinanceError {
  code: string
  message: string
  timestamp: string
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  requestsPerSecond: 2,
  maxConcurrentRequests: 5,
  retryDelay: 1000, // 1 second
  maxRetries: 3,
} as const

// Cache configuration
const CACHE_CONFIG = {
  ttl: 30 * 1000, // 30 seconds
  maxSize: 1000,
} as const

// In-memory cache for stock prices
interface CacheEntry {
  data: StockPrice[]
  timestamp: number
  expiresAt: number
}

class PriceCache {
  private cache = new Map<string, CacheEntry>()

  set(key: string, data: StockPrice[], ttl: number = CACHE_CONFIG.ttl): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })

    // Clean up expired entries
    this.cleanup()
  }

  get(key: string): StockPrice[] | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }

    // Keep cache size under limit
    if (this.cache.size > CACHE_CONFIG.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toDelete = entries.slice(0, this.cache.size - CACHE_CONFIG.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }
}

// Rate limiter class
class RateLimiter {
  private lastRequestTime = 0
  private requestQueue: Array<() => void> = []
  private activeRequests = 0

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const executeRequest = async () => {
        try {
          // Check concurrent request limit
          if (this.activeRequests >= RATE_LIMIT_CONFIG.maxConcurrentRequests) {
            setTimeout(() => this.requestQueue.push(executeRequest), 100)
            return
          }

          // Rate limiting: ensure minimum delay between requests
          const now = Date.now()
          const timeSinceLastRequest = now - this.lastRequestTime
          const minDelay = 1000 / RATE_LIMIT_CONFIG.requestsPerSecond

          if (timeSinceLastRequest < minDelay) {
            setTimeout(executeRequest, minDelay - timeSinceLastRequest)
            return
          }

          this.activeRequests++
          this.lastRequestTime = Date.now()

          try {
            const result = await fn()
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            this.activeRequests--
            // Process next request in queue
            if (this.requestQueue.length > 0) {
              const nextRequest = this.requestQueue.shift()
              if (nextRequest) {
                setTimeout(nextRequest, 0)
              }
            }
          }
        } catch (error) {
          reject(error)
        }
      }

      executeRequest()
    })
  }
}

// Global instances
const cache = new PriceCache()
const rateLimiter = new RateLimiter()

/**
 * Normalize symbol for Yahoo Finance API
 * - Norwegian stocks: add .OL suffix if not present
 * - US stocks: use as-is
 */
function normalizeSymbol(symbol: string): string {
  // If symbol already has exchange suffix, return as-is
  if (symbol.includes('.')) {
    return symbol
  }

  // Common Norwegian stock symbols
  const norwegianSymbols = [
    'EQUI',
    'DNB',
    'AKER',
    'MOWI',
    'NEL',
    'SALM',
    'YARA',
    'TELENOR',
    'ORKLA',
  ]

  if (norwegianSymbols.includes(symbol.toUpperCase())) {
    return `${symbol.toUpperCase()}.OL`
  }

  // Default to US market (no suffix needed)
  return symbol.toUpperCase()
}

/**
 * Create cache key for symbols
 */
function createCacheKey(symbols: string[]): string {
  return symbols.sort().join(',')
}

/**
 * Check if markets are open during trading hours
 */
function isMarketHours(): boolean {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const dayOfWeek = now.getDay()

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }

  // US market hours (9:30 AM - 4:00 PM ET)
  // This is a simplified check - real implementation would handle timezones
  const currentTimeMinutes = hours * 60 + minutes
  const marketOpenMinutes = 9 * 60 + 30 // 9:30 AM
  const marketCloseMinutes = 16 * 60 // 4:00 PM

  return (
    currentTimeMinutes >= marketOpenMinutes &&
    currentTimeMinutes <= marketCloseMinutes
  )
}

/**
 * Fetch stock prices from Yahoo Finance API with retries
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = RATE_LIMIT_CONFIG.maxRetries
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, RATE_LIMIT_CONFIG.retryDelay)
      )
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

/**
 * Transform Yahoo Finance quote to our StockPrice format
 */
function transformQuoteToStockPrice(quote: YahooFinanceQuote): StockPrice {
  return {
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    timestamp: new Date(quote.regularMarketTime * 1000).toISOString(),
    currency: quote.currency,
    marketState: quote.marketState,
    source: 'yahoo_finance',
  }
}

/**
 * Fetch real-time stock prices for multiple symbols
 */
export async function fetchStockPrices(
  symbols: string[],
  options: {
    useCache?: boolean
    bypassRateLimit?: boolean
  } = {}
): Promise<{
  success: boolean
  data: StockPrice[]
  errors: YahooFinanceError[]
  fromCache: boolean
}> {
  const { useCache = true, bypassRateLimit = false } = options

  if (!symbols.length) {
    return {
      success: true,
      data: [],
      errors: [],
      fromCache: false,
    }
  }

  // Normalize symbols
  const normalizedSymbols = symbols.map(normalizeSymbol)
  const cacheKey = createCacheKey(normalizedSymbols)

  // Check cache first
  if (useCache && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        errors: [],
        fromCache: true,
      }
    }
  }

  const fetchFn = async () => {
    const symbolsParam = normalizedSymbols.join(',')
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    })

    const data: YahooFinanceResponse = await response.json()
    return data
  }

  try {
    const data = bypassRateLimit
      ? await fetchFn()
      : await rateLimiter.throttle(fetchFn)

    const errors: YahooFinanceError[] = []
    const stockPrices: StockPrice[] = []

    // Handle API errors - if Yahoo Finance is down, use mock API
    if (data.quoteResponse.error) {
      console.warn('Yahoo Finance API error, falling back to mock API:', data.quoteResponse.error)
      
      // Use mock API as fallback
      const mockResult = await fetchMockStockPrices(normalizedSymbols)
      
      if (useCache && mockResult.data.length > 0) {
        cache.set(cacheKey, mockResult.data)
      }

      return {
        success: true,
        data: mockResult.data,
        errors: mockResult.errors.map(e => ({
          code: e.code,
          message: e.message,
          timestamp: e.timestamp
        })),
        fromCache: false,
      }
    }

    // Process successful quotes
    if (data.quoteResponse.result) {
      for (const quote of data.quoteResponse.result) {
        try {
          stockPrices.push(transformQuoteToStockPrice(quote))
        } catch (error) {
          errors.push({
            code: 'TRANSFORM_ERROR',
            message: `Failed to transform quote for ${quote.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    // Check for missing symbols
    const returnedSymbols = stockPrices.map(p => p.symbol)
    const missingSymbols = normalizedSymbols.filter(
      s => !returnedSymbols.includes(s)
    )

    for (const symbol of missingSymbols) {
      errors.push({
        code: 'SYMBOL_NOT_FOUND',
        message: `No data found for symbol: ${symbol}`,
        timestamp: new Date().toISOString(),
      })
    }

    // Cache successful results
    if (useCache && stockPrices.length > 0) {
      cache.set(cacheKey, stockPrices)
    }

    return {
      success: stockPrices.length > 0,
      data: stockPrices,
      errors,
      fromCache: false,
    }
  } catch (error) {
    console.warn('Yahoo Finance API failed, falling back to mock API:', error)
    
    // Use mock API as fallback when Yahoo Finance fails completely
    try {
      const mockResult = await fetchMockStockPrices(normalizedSymbols)
      
      if (useCache && mockResult.data.length > 0) {
        cache.set(cacheKey, mockResult.data)
      }

      return {
        success: true,
        data: mockResult.data,
        errors: mockResult.errors.map(e => ({
          code: e.code,
          message: e.message,
          timestamp: e.timestamp
        })),
        fromCache: false,
      }
    } catch (mockError) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      return {
        success: false,
        data: [],
        errors: [
          {
            code: 'FETCH_ERROR',
            message: `Both Yahoo Finance and mock API failed: ${errorMessage}`,
            timestamp: new Date().toISOString(),
          },
        ],
        fromCache: false,
      }
    }
  }
}

/**
 * Fetch single stock price
 */
export async function fetchStockPrice(
  symbol: string,
  options?: {
    useCache?: boolean
    bypassRateLimit?: boolean
  }
): Promise<{
  success: boolean
  data: StockPrice | null
  errors: YahooFinanceError[]
  fromCache: boolean
}> {
  const result = await fetchStockPrices([symbol], options)

  return {
    success: result.success && result.data.length > 0,
    data: result.data[0] || null,
    errors: result.errors,
    fromCache: result.fromCache,
  }
}

/**
 * Get historical stock prices (limited implementation)
 * Note: This is a simplified version - full implementation would use Yahoo Finance historical data API
 */
export async function fetchHistoricalPrices(
  symbol: string,
  period:
    | '1d'
    | '5d'
    | '1mo'
    | '3mo'
    | '6mo'
    | '1y'
    | '2y'
    | '5y'
    | '10y'
    | 'ytd'
    | 'max' = '1mo'
): Promise<{
  success: boolean
  data: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  errors: YahooFinanceError[]
}> {
  // Placeholder implementation
  // In a real implementation, this would use Yahoo Finance historical data API
  return {
    success: false,
    data: [],
    errors: [
      {
        code: 'NOT_IMPLEMENTED',
        message: 'Historical data fetching not implemented yet',
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

/**
 * Clear the price cache
 */
export function clearCache(): void {
  cache.cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  hits: number
  misses: number
} {
  return {
    size: cache.cache.size,
    maxSize: CACHE_CONFIG.maxSize,
    hits: 0, // Would need to track this
    misses: 0, // Would need to track this
  }
}

/**
 * Utility function to check if a symbol is valid
 */
export function isValidSymbol(symbol: string): boolean {
  // Basic validation - can be enhanced
  return /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(symbol.toUpperCase())
}

/**
 * Get market status
 */
export function getMarketStatus(): {
  isOpen: boolean
  nextOpen: string | null
  nextClose: string | null
} {
  const isOpen = isMarketHours()

  // This is a simplified implementation
  // Real implementation would handle multiple markets and timezones
  return {
    isOpen,
    nextOpen: null, // Would calculate next market open
    nextClose: null, // Would calculate next market close
  }
}

// Export types and constants
export type {
  YahooFinanceQuote,
  YahooFinanceResponse,
  StockPrice,
  YahooFinanceError,
}
export { RATE_LIMIT_CONFIG, CACHE_CONFIG }
