'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  fetchRealStockPrices, 
  fetchRealStockPrice, 
  fetchCompanyProfile, 
  fetchBasicFinancials,
  fetchCompanyNews,
  type StockPrice,
  type CompanyProfile,
  type BasicFinancials,
  type CompanyNews,
  type FinnhubError
} from '@/lib/utils/finnhub-api'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format'

/**
 * Centralized widget data service for LifeDash
 * Provides unified API for all widget data needs including:
 * - Finnhub stock data integration
 * - Supabase real-time data
 * - Portfolio and holdings management
 * - News and fundamentals
 * - Caching and optimization
 */

// ===== INTERFACES =====

export interface WidgetDataService {
  // Stock data
  getStockPrices: (symbols: string[]) => Promise<WidgetStockPricesResult>
  getStockPrice: (symbol: string) => Promise<WidgetStockPriceResult>
  getCompanyProfile: (symbol: string) => Promise<WidgetCompanyProfileResult>
  getBasicFinancials: (symbol: string) => Promise<WidgetBasicFinancialsResult>
  getCompanyNews: (symbol: string, days?: number) => Promise<WidgetCompanyNewsResult>
  
  // Portfolio data
  getPortfolioOverview: (portfolioId: string) => Promise<WidgetPortfolioOverviewResult>
  getPortfolioHoldings: (portfolioId: string) => Promise<WidgetPortfolioHoldingsResult>
  getPortfolioPerformance: (portfolioId: string) => Promise<WidgetPortfolioPerformanceResult>
  getPortfolioTransactions: (portfolioId: string, limit?: number) => Promise<WidgetTransactionsResult>
  
  // Analytics data
  getPortfolioAnalytics: (portfolioId: string) => Promise<WidgetPortfolioAnalyticsResult>
  getStockAnalytics: (symbol: string) => Promise<WidgetStockAnalyticsResult>
  
  // Real-time subscriptions
  subscribeToPortfolioUpdates: (portfolioId: string, callback: (data: any) => void) => () => void
  subscribeToStockPrices: (symbols: string[], callback: (data: StockPrice[]) => void) => () => void
  
  // Cache management
  clearCache: (pattern?: string) => void
  getCacheStats: () => WidgetCacheStats
}

export interface WidgetStockPricesResult {
  success: boolean
  data: StockPrice[]
  errors: FinnhubError[]
  fromCache: boolean
  timestamp: string
}

export interface WidgetStockPriceResult {
  success: boolean
  data: StockPrice | null
  error: FinnhubError | null
  fromCache: boolean
  timestamp: string
}

export interface WidgetCompanyProfileResult {
  success: boolean
  data: CompanyProfile | null
  error: FinnhubError | null
  fromCache: boolean
  timestamp: string
}

export interface WidgetBasicFinancialsResult {
  success: boolean
  data: BasicFinancials | null
  error: FinnhubError | null
  fromCache: boolean
  timestamp: string
}

export interface WidgetCompanyNewsResult {
  success: boolean
  data: CompanyNews[]
  error: FinnhubError | null
  fromCache: boolean
  timestamp: string
  totalCount: number
}

export interface WidgetPortfolioOverviewResult {
  success: boolean
  data: WidgetPortfolioOverview | null
  error: string | null
  timestamp: string
}

export interface WidgetPortfolioHoldingsResult {
  success: boolean
  data: HoldingWithMetrics[]
  error: string | null
  timestamp: string
  totalCount: number
}

export interface WidgetPortfolioPerformanceResult {
  success: boolean
  data: WidgetPortfolioPerformance | null
  error: string | null
  timestamp: string
}

export interface WidgetTransactionsResult {
  success: boolean
  data: WidgetTransaction[]
  error: string | null
  timestamp: string
  totalCount: number
  hasMore: boolean
}

export interface WidgetPortfolioAnalyticsResult {
  success: boolean
  data: WidgetPortfolioAnalytics | null
  error: string | null
  timestamp: string
}

export interface WidgetStockAnalyticsResult {
  success: boolean
  data: WidgetStockAnalytics | null
  error: string | null
  timestamp: string
}

export interface WidgetCacheStats {
  totalEntries: number
  hitRate: number
  totalSize: number
  maxSize: number
  oldestEntry: string
  newestEntry: string
}

// ===== DATA MODELS =====

export interface WidgetPortfolioOverview {
  id: string
  name: string
  description?: string
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercent: number
  dailyChange: number
  dailyChangePercent: number
  holdingsCount: number
  currency: string
  lastUpdated: string
  formattedTotalValue: string
  formattedTotalGainLoss: string
  formattedTotalGainLossPercent: string
  formattedDailyChange: string
  formattedDailyChangePercent: string
}

export interface WidgetPortfolioPerformance {
  portfolioId: string
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
  
  // Performance metrics
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  sharpeRatio: number
  volatility: number
  maxDrawdown: number
  
  // Sector allocation
  sectorAllocation: { sector: string; value: number; percent: number }[]
  
  // Currency allocation
  currencyAllocation: { currency: string; value: number; percent: number }[]
  
  // Top performers
  topPerformers: {
    symbol: string
    name: string
    gainLoss: number
    gainLossPercent: number
    contribution: number
  }[]
  
  // Historical data for charts
  historicalData: {
    date: string
    value: number
    change: number
    changePercent: number
  }[]
  
  // Formatted values
  formattedTotalReturn: string
  formattedTotalReturnPercent: string
  formattedAnnualizedReturn: string
  formattedVolatility: string
  formattedMaxDrawdown: string
}

export interface WidgetTransaction {
  id: string
  portfolioId: string
  accountId: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER'
  quantity: number
  price: number
  totalAmount: number
  fees: number
  date: string
  notes?: string
  
  // Joined data
  stockName?: string
  accountName?: string
  
  // Formatted values
  formattedQuantity: string
  formattedPrice: string
  formattedTotalAmount: string
  formattedFees: string
  formattedDate: string
}

export interface WidgetPortfolioAnalytics {
  portfolioId: string
  
  // Risk metrics
  beta: number
  alpha: number
  correlationToMarket: number
  
  // Diversification metrics
  concentrationRisk: number
  sectorConcentration: number
  currencyExposure: { [currency: string]: number }
  
  // Performance attribution
  securitySelection: number
  assetAllocation: number
  interaction: number
  
  // ESG metrics (if available)
  esgScore?: number
  esgRating?: string
  
  // Benchmark comparison
  benchmarkComparison: {
    benchmarkSymbol: string
    benchmarkName: string
    portfolioReturn: number
    benchmarkReturn: number
    activeReturn: number
    trackingError: number
  }
}

export interface WidgetStockAnalytics {
  symbol: string
  
  // Technical indicators
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  bollinger: { upper: number; middle: number; lower: number }
  
  // Fundamental ratios
  peRatio: number
  pbRatio: number
  psRatio: number
  pegRatio: number
  
  // Valuation metrics
  intrinsicValue: number
  fairValue: number
  margin: number
  
  // Analyst data
  analystRating: 'BUY' | 'HOLD' | 'SELL'
  analystTargetPrice: number
  analystCount: number
  
  // Sentiment indicators
  sentimentScore: number
  socialMentions: number
  newsScore: number
}

// ===== CACHE CONFIGURATION =====

interface CacheConfig {
  ttl: number
  maxSize: number
  cleanupInterval: number
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  stockPrices: { ttl: 60 * 1000, maxSize: 100, cleanupInterval: 5 * 60 * 1000 }, // 1 minute
  companyProfiles: { ttl: 24 * 60 * 60 * 1000, maxSize: 50, cleanupInterval: 60 * 60 * 1000 }, // 24 hours
  basicFinancials: { ttl: 6 * 60 * 60 * 1000, maxSize: 50, cleanupInterval: 60 * 60 * 1000 }, // 6 hours
  companyNews: { ttl: 60 * 60 * 1000, maxSize: 50, cleanupInterval: 10 * 60 * 1000 }, // 1 hour
  portfolioData: { ttl: 30 * 1000, maxSize: 20, cleanupInterval: 5 * 60 * 1000 }, // 30 seconds
  analytics: { ttl: 10 * 60 * 1000, maxSize: 30, cleanupInterval: 10 * 60 * 1000 }, // 10 minutes
}

// ===== ENHANCED CACHE SYSTEM =====

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  hits: number
  size: number
}

class WidgetDataCache {
  private cache = new Map<string, CacheEntry<any>>()
  private hitStats = { hits: 0, misses: 0 }
  private cleanupIntervals = new Map<string, NodeJS.Timeout>()

  constructor() {
    // Start cleanup intervals for different cache types
    Object.entries(CACHE_CONFIGS).forEach(([type, config]) => {
      const interval = setInterval(() => {
        this.cleanupType(type)
      }, config.cleanupInterval)
      this.cleanupIntervals.set(type, interval)
    })
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const config = this.getConfigForKey(key)
    const actualTTL = ttl || config.ttl
    
    // Calculate approximate size (rough estimate)
    const size = JSON.stringify(data).length
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + actualTTL,
      hits: 0,
      size
    })
    
    this.enforceSizeLimit(this.getTypeFromKey(key))
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.hitStats.misses++
      return null
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.hitStats.misses++
      return null
    }
    
    entry.hits++
    this.hitStats.hits++
    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key] of this.cache.entries()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  getStats(): WidgetCacheStats {
    const entries = Array.from(this.cache.entries())
    const totalSize = entries.reduce((sum, [, entry]) => sum + entry.size, 0)
    const hitRate = this.hitStats.hits / (this.hitStats.hits + this.hitStats.misses) || 0
    
    const timestamps = entries.map(([, entry]) => entry.timestamp)
    const oldest = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : ''
    const newest = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : ''
    
    return {
      totalEntries: this.cache.size,
      hitRate,
      totalSize,
      maxSize: Object.values(CACHE_CONFIGS).reduce((sum, config) => sum + config.maxSize, 0),
      oldestEntry: oldest,
      newestEntry: newest
    }
  }

  private getConfigForKey(key: string): CacheConfig {
    const type = this.getTypeFromKey(key)
    return CACHE_CONFIGS[type] || CACHE_CONFIGS.portfolioData
  }

  private getTypeFromKey(key: string): string {
    if (key.startsWith('stock_price:')) return 'stockPrices'
    if (key.startsWith('company_profile:')) return 'companyProfiles'
    if (key.startsWith('basic_financials:')) return 'basicFinancials'
    if (key.startsWith('company_news:')) return 'companyNews'
    if (key.startsWith('portfolio:')) return 'portfolioData'
    if (key.startsWith('analytics:')) return 'analytics'
    return 'portfolioData'
  }

  private enforceSizeLimit(type: string): void {
    const config = CACHE_CONFIGS[type]
    if (!config) return

    const typeEntries = Array.from(this.cache.entries())
      .filter(([key]) => this.getTypeFromKey(key) === type)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    while (typeEntries.length > config.maxSize) {
      const [oldestKey] = typeEntries.shift()!
      this.cache.delete(oldestKey)
    }
  }

  private cleanupType(type: string): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (this.getTypeFromKey(key) === type && now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    this.cleanupIntervals.forEach(interval => clearInterval(interval))
    this.cleanupIntervals.clear()
    this.cache.clear()
  }
}

// ===== WIDGET DATA SERVICE IMPLEMENTATION =====

class WidgetDataServiceImpl implements WidgetDataService {
  private cache = new WidgetDataCache()
  private supabase = createClient()
  private subscriptions = new Map<string, () => void>()

  // ===== STOCK DATA METHODS =====

  async getStockPrices(symbols: string[]): Promise<WidgetStockPricesResult> {
    const cacheKey = `stock_prices:${symbols.sort().join(',')}`
    const cached = this.cache.get<WidgetStockPricesResult>(cacheKey)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const result = await fetchRealStockPrices(symbols)
      
      const widgetResult: WidgetStockPricesResult = {
        success: result.success,
        data: result.data,
        errors: result.errors,
        fromCache: false,
        timestamp: new Date().toISOString()
      }
      
      if (result.success) {
        this.cache.set(cacheKey, widgetResult)
      }
      
      return widgetResult
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }],
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getStockPrice(symbol: string): Promise<WidgetStockPriceResult> {
    const cacheKey = `stock_price:${symbol}`
    const cached = this.cache.get<WidgetStockPriceResult>(cacheKey)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const result = await fetchRealStockPrice(symbol)
      
      const widgetResult: WidgetStockPriceResult = {
        success: result.success,
        data: result.data,
        error: result.errors[0] || null,
        fromCache: false,
        timestamp: new Date().toISOString()
      }
      
      if (result.success) {
        this.cache.set(cacheKey, widgetResult)
      }
      
      return widgetResult
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getCompanyProfile(symbol: string): Promise<WidgetCompanyProfileResult> {
    const cacheKey = `company_profile:${symbol}`
    const cached = this.cache.get<WidgetCompanyProfileResult>(cacheKey)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const result = await fetchCompanyProfile(symbol)
      
      const widgetResult: WidgetCompanyProfileResult = {
        success: result.success,
        data: result.data,
        error: result.error,
        fromCache: false,
        timestamp: new Date().toISOString()
      }
      
      if (result.success) {
        this.cache.set(cacheKey, widgetResult)
      }
      
      return widgetResult
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getBasicFinancials(symbol: string): Promise<WidgetBasicFinancialsResult> {
    const cacheKey = `basic_financials:${symbol}`
    const cached = this.cache.get<WidgetBasicFinancialsResult>(cacheKey)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const result = await fetchBasicFinancials(symbol)
      
      const widgetResult: WidgetBasicFinancialsResult = {
        success: result.success,
        data: result.data,
        error: result.error,
        fromCache: false,
        timestamp: new Date().toISOString()
      }
      
      if (result.success) {
        this.cache.set(cacheKey, widgetResult)
      }
      
      return widgetResult
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        fromCache: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getCompanyNews(symbol: string, days: number = 7): Promise<WidgetCompanyNewsResult> {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const toDate = new Date()
    
    const from = fromDate.toISOString().split('T')[0]
    const to = toDate.toISOString().split('T')[0]
    
    const cacheKey = `company_news:${symbol}:${from}:${to}`
    const cached = this.cache.get<WidgetCompanyNewsResult>(cacheKey)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const result = await fetchCompanyNews(symbol, from, to)
      
      const widgetResult: WidgetCompanyNewsResult = {
        success: result.success,
        data: result.data || [],
        error: result.error,
        fromCache: false,
        timestamp: new Date().toISOString(),
        totalCount: result.data?.length || 0
      }
      
      if (result.success) {
        this.cache.set(cacheKey, widgetResult)
      }
      
      return widgetResult
    } catch (error) {
      return {
        success: false,
        data: [],
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        fromCache: false,
        timestamp: new Date().toISOString(),
        totalCount: 0
      }
    }
  }

  // ===== PORTFOLIO DATA METHODS =====

  async getPortfolioOverview(portfolioId: string): Promise<WidgetPortfolioOverviewResult> {
    const cacheKey = `portfolio:overview:${portfolioId}`
    const cached = this.cache.get<WidgetPortfolioOverviewResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const { data: portfolio, error } = await this.supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single()

      if (error) {
        throw error
      }

      // Get portfolio holdings for calculations
      const holdingsResult = await this.getPortfolioHoldings(portfolioId)
      const holdings = holdingsResult.data || []

      const totalValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0)
      const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.cost_basis), 0)
      const totalGainLoss = totalValue - totalCost
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

      // Calculate daily change from holdings
      const dailyChange = holdings.reduce((sum, holding) => 
        sum + (holding.daily_change || 0) * holding.quantity, 0)
      const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0

      const overview: WidgetPortfolioOverview = {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        dailyChange,
        dailyChangePercent,
        holdingsCount: holdings.length,
        currency: 'NOK',
        lastUpdated: new Date().toISOString(),
        formattedTotalValue: formatCurrency(totalValue, 'NOK'),
        formattedTotalGainLoss: formatCurrency(totalGainLoss, 'NOK'),
        formattedTotalGainLossPercent: formatPercentage(totalGainLossPercent),
        formattedDailyChange: formatCurrency(dailyChange, 'NOK'),
        formattedDailyChangePercent: formatPercentage(dailyChangePercent),
      }

      const result: WidgetPortfolioOverviewResult = {
        success: true,
        data: overview,
        error: null,
        timestamp: new Date().toISOString()
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getPortfolioHoldings(portfolioId: string): Promise<WidgetPortfolioHoldingsResult> {
    const cacheKey = `portfolio:holdings:${portfolioId}`
    const cached = this.cache.get<WidgetPortfolioHoldingsResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { data: holdingsData, error: holdingsError } = await this.supabase
        .from('holdings')
        .select(`
          *,
          stocks (
            symbol,
            name,
            currency,
            asset_class,
            sector,
            market_cap,
            last_updated
          ),
          accounts (
            id,
            portfolio_id
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('quantity', 0)
        .not('accounts', 'is', null)

      if (holdingsError) {
        throw holdingsError
      }

      const filteredHoldings = holdingsData?.filter(
        (holding: any) => holding.accounts?.portfolio_id === portfolioId
      ) || []

      const enhancedHoldings: HoldingWithMetrics[] = filteredHoldings.map((holding: any) => {
        const costBasis = holding.average_cost || 0
        const currentPrice = holding.stocks?.current_price || costBasis
        const currentValue = holding.quantity * currentPrice
        const gainLoss = currentValue - holding.quantity * costBasis
        const gainLossPercent = costBasis > 0 ? (gainLoss / (holding.quantity * costBasis)) * 100 : 0

        return {
          ...holding,
          symbol: holding.stocks?.symbol || '',
          cost_basis: costBasis,
          current_price: currentPrice,
          current_value: currentValue,
          gain_loss: gainLoss,
          gain_loss_percent: gainLossPercent,
          weight: 0,
          daily_change: 0,
          daily_change_percent: 0,
        }
      })

      const result: WidgetPortfolioHoldingsResult = {
        success: true,
        data: enhancedHoldings,
        error: null,
        timestamp: new Date().toISOString(),
        totalCount: enhancedHoldings.length
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        totalCount: 0
      }
    }
  }

  async getPortfolioPerformance(portfolioId: string): Promise<WidgetPortfolioPerformanceResult> {
    const cacheKey = `portfolio:performance:${portfolioId}`
    const cached = this.cache.get<WidgetPortfolioPerformanceResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const holdingsResult = await this.getPortfolioHoldings(portfolioId)
      const holdings = holdingsResult.data || []

      const totalValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0)
      const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.cost_basis), 0)
      const totalReturn = totalValue - totalCost
      const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

      // Calculate sector allocation
      const sectorMap = new Map<string, number>()
      holdings.forEach(holding => {
        const sector = holding.stocks?.sector || 'Unknown'
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.current_value)
      })

      const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
        sector,
        value,
        percent: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))

      // Calculate currency allocation
      const currencyMap = new Map<string, number>()
      holdings.forEach(holding => {
        const currency = holding.stocks?.currency || 'NOK'
        currencyMap.set(currency, (currencyMap.get(currency) || 0) + holding.current_value)
      })

      const currencyAllocation = Array.from(currencyMap.entries()).map(([currency, value]) => ({
        currency,
        value,
        percent: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))

      // Top performers
      const topPerformers = holdings
        .sort((a, b) => b.gain_loss_percent - a.gain_loss_percent)
        .slice(0, 5)
        .map(holding => ({
          symbol: holding.symbol,
          name: holding.stocks?.name || holding.symbol,
          gainLoss: holding.gain_loss,
          gainLossPercent: holding.gain_loss_percent,
          contribution: totalValue > 0 ? (holding.gain_loss / totalValue) * 100 : 0
        }))

      // Mock historical data - in production, this would come from database
      const historicalData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          value: totalValue * (0.95 + Math.random() * 0.1),
          change: (Math.random() - 0.5) * 1000,
          changePercent: (Math.random() - 0.5) * 2
        }
      })

      const performance: WidgetPortfolioPerformance = {
        portfolioId,
        period: '1M',
        totalReturn,
        totalReturnPercent,
        annualizedReturn: totalReturnPercent * 12, // Simplified
        sharpeRatio: Math.random() * 2, // Mock
        volatility: Math.random() * 20, // Mock
        maxDrawdown: Math.random() * -10, // Mock
        sectorAllocation,
        currencyAllocation,
        topPerformers,
        historicalData,
        formattedTotalReturn: formatCurrency(totalReturn, 'NOK'),
        formattedTotalReturnPercent: formatPercentage(totalReturnPercent),
        formattedAnnualizedReturn: formatPercentage(totalReturnPercent * 12),
        formattedVolatility: formatPercentage(Math.random() * 20),
        formattedMaxDrawdown: formatPercentage(Math.random() * -10),
      }

      const result: WidgetPortfolioPerformanceResult = {
        success: true,
        data: performance,
        error: null,
        timestamp: new Date().toISOString()
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getPortfolioTransactions(portfolioId: string, limit: number = 20): Promise<WidgetTransactionsResult> {
    const cacheKey = `portfolio:transactions:${portfolioId}:${limit}`
    const cached = this.cache.get<WidgetTransactionsResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      const { data: transactionsData, error: transactionsError } = await this.supabase
        .from('transactions')
        .select(`
          *,
          stocks (
            name
          ),
          accounts (
            name,
            portfolio_id
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit + 1) // Get one extra to check if there are more

      if (transactionsError) {
        throw transactionsError
      }

      const filteredTransactions = transactionsData?.filter(
        (transaction: any) => transaction.accounts?.portfolio_id === portfolioId
      ) || []

      const hasMore = filteredTransactions.length > limit
      const transactions = filteredTransactions.slice(0, limit)

      const widgetTransactions: WidgetTransaction[] = transactions.map((transaction: any) => ({
        id: transaction.id,
        portfolioId,
        accountId: transaction.account_id,
        symbol: transaction.symbol,
        type: transaction.type,
        quantity: transaction.quantity,
        price: transaction.price,
        totalAmount: transaction.total_amount,
        fees: transaction.fees || 0,
        date: transaction.date,
        notes: transaction.notes,
        stockName: transaction.stocks?.name,
        accountName: transaction.accounts?.name,
        formattedQuantity: formatNumber(transaction.quantity),
        formattedPrice: formatCurrency(transaction.price, 'NOK'),
        formattedTotalAmount: formatCurrency(transaction.total_amount, 'NOK'),
        formattedFees: formatCurrency(transaction.fees || 0, 'NOK'),
        formattedDate: formatDate(transaction.date),
      }))

      const result: WidgetTransactionsResult = {
        success: true,
        data: widgetTransactions,
        error: null,
        timestamp: new Date().toISOString(),
        totalCount: widgetTransactions.length,
        hasMore
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        totalCount: 0,
        hasMore: false
      }
    }
  }

  // ===== ANALYTICS METHODS =====

  async getPortfolioAnalytics(portfolioId: string): Promise<WidgetPortfolioAnalyticsResult> {
    const cacheKey = `analytics:portfolio:${portfolioId}`
    const cached = this.cache.get<WidgetPortfolioAnalyticsResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const holdingsResult = await this.getPortfolioHoldings(portfolioId)
      const holdings = holdingsResult.data || []

      // Calculate mock analytics - in production, these would be calculated from real data
      const analytics: WidgetPortfolioAnalytics = {
        portfolioId,
        beta: Math.random() * 0.5 + 0.8, // 0.8-1.3
        alpha: (Math.random() - 0.5) * 0.1, // -0.05 to 0.05
        correlationToMarket: Math.random() * 0.3 + 0.7, // 0.7-1.0
        concentrationRisk: Math.random() * 0.3 + 0.1, // 0.1-0.4
        sectorConcentration: Math.random() * 0.5 + 0.2, // 0.2-0.7
        currencyExposure: {
          'NOK': Math.random() * 0.4 + 0.3, // 0.3-0.7
          'USD': Math.random() * 0.4 + 0.3, // 0.3-0.7
        },
        securitySelection: (Math.random() - 0.5) * 0.02, // -0.01 to 0.01
        assetAllocation: (Math.random() - 0.5) * 0.015, // -0.0075 to 0.0075
        interaction: (Math.random() - 0.5) * 0.005, // -0.0025 to 0.0025
        esgScore: Math.random() * 40 + 60, // 60-100
        esgRating: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        benchmarkComparison: {
          benchmarkSymbol: 'OSEBX.OL',
          benchmarkName: 'Oslo Børs Benchmark Index',
          portfolioReturn: Math.random() * 0.2 - 0.1, // -0.1 to 0.1
          benchmarkReturn: Math.random() * 0.15 - 0.075, // -0.075 to 0.075
          activeReturn: Math.random() * 0.05 - 0.025, // -0.025 to 0.025
          trackingError: Math.random() * 0.05 + 0.02, // 0.02-0.07
        }
      }

      const result: WidgetPortfolioAnalyticsResult = {
        success: true,
        data: analytics,
        error: null,
        timestamp: new Date().toISOString()
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getStockAnalytics(symbol: string): Promise<WidgetStockAnalyticsResult> {
    const cacheKey = `analytics:stock:${symbol}`
    const cached = this.cache.get<WidgetStockAnalyticsResult>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Mock analytics - in production, these would come from various data sources
      const analytics: WidgetStockAnalytics = {
        symbol,
        rsi: Math.random() * 100,
        macd: {
          value: (Math.random() - 0.5) * 10,
          signal: (Math.random() - 0.5) * 8,
          histogram: (Math.random() - 0.5) * 5,
        },
        bollinger: {
          upper: Math.random() * 50 + 100,
          middle: Math.random() * 30 + 85,
          lower: Math.random() * 20 + 70,
        },
        peRatio: Math.random() * 20 + 10,
        pbRatio: Math.random() * 3 + 1,
        psRatio: Math.random() * 5 + 2,
        pegRatio: Math.random() * 2 + 0.5,
        intrinsicValue: Math.random() * 200 + 100,
        fairValue: Math.random() * 180 + 110,
        margin: (Math.random() - 0.5) * 0.4,
        analystRating: ['BUY', 'HOLD', 'SELL'][Math.floor(Math.random() * 3)] as any,
        analystTargetPrice: Math.random() * 100 + 150,
        analystCount: Math.floor(Math.random() * 15) + 5,
        sentimentScore: Math.random() * 2 - 1,
        socialMentions: Math.floor(Math.random() * 1000),
        newsScore: Math.random() * 2 - 1,
      }

      const result: WidgetStockAnalyticsResult = {
        success: true,
        data: analytics,
        error: null,
        timestamp: new Date().toISOString()
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  subscribeToPortfolioUpdates(portfolioId: string, callback: (data: any) => void): () => void {
    const channel = this.supabase
      .channel(`portfolio_updates_${portfolioId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'portfolios', filter: `id=eq.${portfolioId}` },
        (payload) => {
          this.cache.clear(`portfolio:.*:${portfolioId}`)
          callback(payload)
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'holdings' },
        (payload) => {
          this.cache.clear(`portfolio:.*:${portfolioId}`)
          callback(payload)
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          this.cache.clear(`portfolio:.*:${portfolioId}`)
          callback(payload)
        }
      )
      .subscribe()

    const unsubscribe = () => {
      this.supabase.removeChannel(channel)
    }

    this.subscriptions.set(`portfolio_${portfolioId}`, unsubscribe)
    return unsubscribe
  }

  subscribeToStockPrices(symbols: string[], callback: (data: StockPrice[]) => void): () => void {
    let intervalId: NodeJS.Timeout

    const fetchPrices = async () => {
      const result = await this.getStockPrices(symbols)
      if (result.success) {
        callback(result.data)
      }
    }

    // Initial fetch
    fetchPrices()

    // Set up interval for price updates
    intervalId = setInterval(fetchPrices, 60000) // Update every minute

    const unsubscribe = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    this.subscriptions.set(`stock_prices_${symbols.join(',')}`, unsubscribe)
    return unsubscribe
  }

  // ===== CACHE MANAGEMENT =====

  clearCache(pattern?: string): void {
    this.cache.clear(pattern)
  }

  getCacheStats(): WidgetCacheStats {
    return this.cache.getStats()
  }

  // ===== CLEANUP =====

  destroy(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions.clear()
    this.cache.destroy()
  }
}

// ===== SINGLETON INSTANCE =====

let widgetDataServiceInstance: WidgetDataServiceImpl | null = null

export function getWidgetDataService(): WidgetDataService {
  if (!widgetDataServiceInstance) {
    widgetDataServiceInstance = new WidgetDataServiceImpl()
  }
  return widgetDataServiceInstance
}

export function destroyWidgetDataService(): void {
  if (widgetDataServiceInstance) {
    widgetDataServiceInstance.destroy()
    widgetDataServiceInstance = null
  }
}

// ===== HELPER FUNCTIONS =====

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('nb-NO').format(value)
}

export function createCacheKey(type: string, ...params: string[]): string {
  return `${type}:${params.join(':')}`
}

export function isValidPortfolioId(portfolioId: string): boolean {
  return portfolioId && portfolioId !== 'empty' && portfolioId.length > 0
}

export function isValidSymbol(symbol: string): boolean {
  return symbol && symbol.length > 0 && /^[A-Z0-9.]+$/.test(symbol)
}

// ===== EXPORT TYPES =====

export type {
  WidgetDataService,
  WidgetStockPricesResult,
  WidgetStockPriceResult,
  WidgetCompanyProfileResult,
  WidgetBasicFinancialsResult,
  WidgetCompanyNewsResult,
  WidgetPortfolioOverviewResult,
  WidgetPortfolioHoldingsResult,
  WidgetPortfolioPerformanceResult,
  WidgetTransactionsResult,
  WidgetPortfolioAnalyticsResult,
  WidgetStockAnalyticsResult,
  WidgetCacheStats,
  WidgetPortfolioOverview,
  WidgetPortfolioPerformance,
  WidgetTransaction,
  WidgetPortfolioAnalytics,
  WidgetStockAnalytics,
}

// ===== DEFAULT EXPORT =====

export default getWidgetDataService