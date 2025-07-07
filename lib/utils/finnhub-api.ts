'use client'

export interface FinnhubQuote {
  c: number // Current price
  d: number // Change
  dp: number // Percent change
  h: number // High price
  l: number // Low price
  o: number // Open price
  pc: number // Previous close price
  t: number // Timestamp
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
  source: 'finnhub'
}

export interface FinnhubError {
  code: string
  message: string
  timestamp: string
}

export interface CompanyProfile {
  country: string
  currency: string
  exchange: string
  finnhubIndustry: string
  ipo: string
  logo: string
  marketCapitalization: number
  name: string
  phone: string
  shareOutstanding: number
  ticker: string
  weburl: string
}

export interface BasicFinancials {
  metric: {
    '10DayAverageTradingVolume': number
    '13WeekPriceReturnDaily': number
    '26WeekPriceReturnDaily': number
    '3MonthAverageTradingVolume': number
    '52WeekHigh': number
    '52WeekHighDate': string
    '52WeekLow': number
    '52WeekLowDate': string
    '52WeekPriceReturnDaily': number
    '5DayPriceReturnDaily': number
    beta: number
    currentRatio: number
    epsInclExtraItemsAnnual: number
    epsInclExtraItemsTTM: number
    epsNormalizedAnnual: number
    grossMarginAnnual: number
    grossMarginTTM: number
    marketCapitalization: number
    netIncomeEmployeeAnnual: number
    netIncomeEmployeeTTM: number
    netInterestIncomeAnnual: number
    netInterestIncomeTTM: number
    netMarginAnnual: number
    netMarginTTM: number
    operatingMarginAnnual: number
    operatingMarginTTM: number
    payoutRatioAnnual: number
    payoutRatioTTM: number
    peBasicExclExtraTTM: number
    peBasicInclExtraTTM: number
    peNormalizedAnnual: number
    pfcfShareAnnual: number
    pfcfShareTTM: number
    pretaxMarginAnnual: number
    pretaxMarginTTM: number
    psAnnual: number
    psTTM: number
    ptbvAnnual: number
    ptbvQuarterly: number
    quickRatio: number
    receivablesTurnoverAnnual: number
    receivablesTurnoverTTM: number
    revenueEmployeeAnnual: number
    revenueEmployeeTTM: number
    revenueGrowthAnnual: number
    revenueGrowthTTM: number
    revenuePerShareAnnual: number
    revenuePerShareTTM: number
    roaAnnual: number
    roaTTM: number
    roceAnnual: number
    roceTTM: number
    roeAnnual: number
    roeTTM: number
    roiAnnual: number
    roiTTM: number
    tangibleBookValuePerShareAnnual: number
    tangibleBookValuePerShareQuarterly: number
    tbvCagr5Y: number
    totalDebtToEquityAnnual: number
    totalDebtToEquityQuarterly: number
    totalDebtToTotalCapitalAnnual: number
    totalDebtToTotalCapitalQuarterly: number
  }
  series: {
    annual: {
      currentRatio: Array<{ period: string; v: number }>
      salesPerShare: Array<{ period: string; v: number }>
      netMargin: Array<{ period: string; v: number }>
    }
    quarterly: {
      currentRatio: Array<{ period: string; v: number }>
      salesPerShare: Array<{ period: string; v: number }>
      netMargin: Array<{ period: string; v: number }>
    }
  }
}

export interface CompanyNews {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

// Rate limiting configuration for Finnhub (60 calls/minute free tier)
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 60,
  requestsPerSecond: 1,
  maxConcurrentRequests: 5,
  retryDelay: 1000,
  maxRetries: 3,
} as const

// Cache configuration
const CACHE_CONFIG = {
  ttl: 60 * 1000, // 1 minute for real-time data
  maxSize: 100,
  companyProfileTTL: 24 * 60 * 60 * 1000, // 24 hours for company profiles
  basicFinancialsTTL: 6 * 60 * 60 * 1000, // 6 hours for basic financials
  companyNewsTTL: 60 * 60 * 1000, // 1 hour for company news
} as const

// In-memory cache for Finnhub data
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expiresAt: number
}

class FinnhubCache {
  private cache = new Map<string, CacheEntry>()

  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.ttl): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
    this.cleanup()
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
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

    if (this.cache.size > CACHE_CONFIG.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, this.cache.size - CACHE_CONFIG.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }
}

// Rate limiter for Finnhub API
class FinnhubRateLimiter {
  private lastRequestTime = 0
  private requestQueue: Array<() => void> = []
  private activeRequests = 0

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const executeRequest = async () => {
        try {
          if (this.activeRequests >= RATE_LIMIT_CONFIG.maxConcurrentRequests) {
            setTimeout(() => this.requestQueue.push(executeRequest), 100)
            return
          }

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
const cache = new FinnhubCache()
const rateLimiter = new FinnhubRateLimiter()

/**
 * Get Finnhub API key from environment
 */
function getFinnhubApiKey(): string {
  const apiKey =
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new Error(
      'Finnhub API key not found. Please set FINNHUB_API_KEY in environment variables.'
    )
  }
  return apiKey
}

/**
 * Normalize symbol for Finnhub API
 */
function normalizeSymbolForFinnhub(symbol: string): string {
  // Finnhub uses the same format for Norwegian stocks (EQNR.OL, DNB.OL)
  // and US stocks (AAPL, TSLA)
  return symbol.toUpperCase()
}

/**
 * Determine currency based on symbol
 */
function getCurrencyFromSymbol(symbol: string): string {
  if (symbol.includes('.OL')) {
    return 'NOK' // Norwegian stocks
  }
  return 'USD' // Default to USD for US stocks
}

/**
 * Determine market state based on time and symbol
 */
function getMarketState(symbol: string): 'REGULAR' | 'CLOSED' | 'PRE' | 'POST' {
  const now = new Date()
  const currency = getCurrencyFromSymbol(symbol)

  if (currency === 'NOK') {
    // Oslo Stock Exchange: 9:00-16:30 CET
    const hour = now.getHours()
    return hour >= 9 && hour < 17 ? 'REGULAR' : 'CLOSED'
  } else {
    // US markets: 9:30-16:00 EST (rough approximation)
    const hour = now.getHours()
    return hour >= 15 && hour < 22 ? 'REGULAR' : 'CLOSED'
  }
}

/**
 * Fetch stock price from Finnhub API with retries
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
 * Transform Finnhub quote to our StockPrice format
 */
function transformFinnhubQuoteToStockPrice(
  symbol: string,
  quote: FinnhubQuote
): StockPrice {
  return {
    symbol,
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    volume: 0, // Finnhub doesn't provide volume in quote endpoint
    timestamp: new Date(quote.t * 1000).toISOString(),
    currency: getCurrencyFromSymbol(symbol),
    marketState: getMarketState(symbol),
    source: 'finnhub',
  }
}

/**
 * Fetch real-time stock prices from Finnhub API
 */
export async function fetchRealStockPrices(
  symbols: string[],
  options: {
    useCache?: boolean
    bypassRateLimit?: boolean
  } = {}
): Promise<{
  success: boolean
  data: StockPrice[]
  errors: FinnhubError[]
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

  try {
    const apiKey = getFinnhubApiKey()
    const normalizedSymbols = symbols.map(normalizeSymbolForFinnhub)
    const cacheKey = normalizedSymbols.sort().join(',')

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

    const stockPrices: StockPrice[] = []
    const errors: FinnhubError[] = []

    // Fetch each symbol individually (Finnhub doesn't support batch requests)
    for (const symbol of normalizedSymbols) {
      try {
        const fetchFn = async () => {
          const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`

          const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'LifeDash/1.0',
            },
          })

          const quote: FinnhubQuote = await response.json()
          return quote
        }

        const quote = bypassRateLimit
          ? await fetchFn()
          : await rateLimiter.throttle(fetchFn)

        // Check if we got valid data
        if (quote.c && quote.c > 0) {
          stockPrices.push(transformFinnhubQuoteToStockPrice(symbol, quote))
        } else {
          errors.push({
            code: 'NO_DATA',
            message: `No valid data found for symbol: ${symbol}`,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        errors.push({
          code: 'FETCH_ERROR',
          message: `Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        })
      }
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
    return {
      success: false,
      data: [],
      errors: [
        {
          code: 'API_ERROR',
          message: `Finnhub API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        },
      ],
      fromCache: false,
    }
  }
}

/**
 * Fetch single stock price from Finnhub
 */
export async function fetchRealStockPrice(
  symbol: string,
  options?: {
    useCache?: boolean
    bypassRateLimit?: boolean
  }
): Promise<{
  success: boolean
  data: StockPrice | null
  errors: FinnhubError[]
  fromCache: boolean
}> {
  const result = await fetchRealStockPrices([symbol], options)

  return {
    success: result.success && result.data.length > 0,
    data: result.data[0] || null,
    errors: result.errors,
    fromCache: result.fromCache,
  }
}

/**
 * Test Finnhub API connection
 */
export async function testFinnhubConnection(): Promise<{
  success: boolean
  message: string
  testData?: StockPrice
}> {
  try {
    const result = await fetchRealStockPrice('AAPL', { useCache: false })

    if (result.success && result.data) {
      return {
        success: true,
        message: 'Finnhub API connection successful',
        testData: result.data,
      }
    } else {
      return {
        success: false,
        message: `Finnhub API test failed: ${result.errors[0]?.message || 'Unknown error'}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Finnhub API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get supported Norwegian stock symbols
 */
export function getNorwegianStockSymbols(): string[] {
  return [
    'EQNR.OL', // Equinor
    'DNB.OL', // DNB Bank
    'TEL.OL', // Telenor
    'NHY.OL', // Norsk Hydro
    'SALM.OL', // SalMar
    'MOWI.OL', // Mowi
    'YAR.OL', // Yara
    'AKER.OL', // Aker
  ]
}

/**
 * Get supported US stock symbols
 */
export function getUSStockSymbols(): string[] {
  return [
    'AAPL', // Apple
    'TSLA', // Tesla
    'MSFT', // Microsoft
    'GOOGL', // Google
    'AMZN', // Amazon
    'NVDA', // NVIDIA
    'META', // Meta
    'NFLX', // Netflix
  ]
}

/**
 * Fetch company profile from Finnhub API
 */
export async function fetchCompanyProfile(symbol: string): Promise<{
  success: boolean
  data: CompanyProfile | null
  error: FinnhubError | null
}> {
  const normalizedSymbol = normalizeSymbolForFinnhub(symbol)
  const cacheKey = `profile:${normalizedSymbol}`

  try {
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedData = cache.get<CompanyProfile>(cacheKey)
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          error: null,
        }
      }
    }

    const apiKey = getFinnhubApiKey()

    const fetchFn = async () => {
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${normalizedSymbol}&token=${apiKey}`

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LifeDash/1.0',
        },
      })

      const profile: CompanyProfile = await response.json()
      return profile
    }

    const profile = await rateLimiter.throttle(fetchFn)

    // Check if we got valid data
    if (profile.name && profile.ticker) {
      // Cache the result
      cache.set(cacheKey, profile, CACHE_CONFIG.companyProfileTTL)

      return {
        success: true,
        data: profile,
        error: null,
      }
    } else {
      return {
        success: false,
        data: null,
        error: {
          code: 'NO_DATA',
          message: `No company profile found for symbol: ${symbol}`,
          timestamp: new Date().toISOString(),
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'FETCH_ERROR',
        message: `Failed to fetch company profile for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Fetch basic financials from Finnhub API
 */
export async function fetchBasicFinancials(symbol: string): Promise<{
  success: boolean
  data: BasicFinancials | null
  error: FinnhubError | null
}> {
  const normalizedSymbol = normalizeSymbolForFinnhub(symbol)
  const cacheKey = `financials:${normalizedSymbol}`

  try {
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedData = cache.get<BasicFinancials>(cacheKey)
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          error: null,
        }
      }
    }

    const apiKey = getFinnhubApiKey()

    const fetchFn = async () => {
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${normalizedSymbol}&metric=all&token=${apiKey}`

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LifeDash/1.0',
        },
      })

      const financials: BasicFinancials = await response.json()
      return financials
    }

    const financials = await rateLimiter.throttle(fetchFn)

    // Check if we got valid data
    if (financials.metric && Object.keys(financials.metric).length > 0) {
      // Cache the result
      cache.set(cacheKey, financials, CACHE_CONFIG.basicFinancialsTTL)

      return {
        success: true,
        data: financials,
        error: null,
      }
    } else {
      return {
        success: false,
        data: null,
        error: {
          code: 'NO_DATA',
          message: `No financial data found for symbol: ${symbol}`,
          timestamp: new Date().toISOString(),
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'FETCH_ERROR',
        message: `Failed to fetch financial data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Fetch company news from Finnhub API
 */
export async function fetchCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<{
  success: boolean
  data: CompanyNews[] | null
  error: FinnhubError | null
}> {
  const normalizedSymbol = normalizeSymbolForFinnhub(symbol)
  const cacheKey = `news:${normalizedSymbol}:${from}:${to}`

  try {
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedData = cache.get<CompanyNews[]>(cacheKey)
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          error: null,
        }
      }
    }

    const apiKey = getFinnhubApiKey()

    const fetchFn = async () => {
      const url = `https://finnhub.io/api/v1/company-news?symbol=${normalizedSymbol}&from=${from}&to=${to}&token=${apiKey}`

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LifeDash/1.0',
        },
      })

      const news: CompanyNews[] = await response.json()
      return news
    }

    const news = await rateLimiter.throttle(fetchFn)

    // Check if we got valid data
    if (Array.isArray(news) && news.length > 0) {
      // Cache the result
      cache.set(cacheKey, news, CACHE_CONFIG.companyNewsTTL)

      return {
        success: true,
        data: news,
        error: null,
      }
    } else {
      return {
        success: false,
        data: null,
        error: {
          code: 'NO_DATA',
          message: `No news found for symbol: ${symbol}`,
          timestamp: new Date().toISOString(),
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'FETCH_ERROR',
        message: `Failed to fetch news for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Clear the price cache
 */
export function clearFinnhubCache(): void {
  cache.cache.clear()
}

// Export types
export type {
  FinnhubQuote,
  StockPrice,
  FinnhubError,
  CompanyProfile,
  BasicFinancials,
  CompanyNews,
}
