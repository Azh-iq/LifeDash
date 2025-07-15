// Currency Conversion Service for Multi-Broker Portfolio Aggregation
// Handles currency conversion with caching and multiple data sources

import { createClient } from '@/lib/supabase/client'

interface ExchangeRate {
  from: string
  to: string
  rate: number
  source: 'fxrates' | 'exchangerate' | 'cached' | 'fallback'
  timestamp: string
  expiresAt: string
}

interface CurrencyConversionResult {
  amount: number
  fromCurrency: string
  toCurrency: string
  exchangeRate: number
  source: string
  timestamp: string
}

interface CachedRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  source: string
  created_at: string
  expires_at: string
}

export class CurrencyConversionService {
  private supabase = createClient()
  private cache = new Map<string, ExchangeRate>()
  private cacheTTL = 60 * 60 * 1000 // 1 hour in milliseconds

  // Fallback exchange rates (updated manually as needed)
  private fallbackRates: Record<string, Record<string, number>> = {
    'USD': {
      'EUR': 0.85,
      'GBP': 0.75,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35,
      'CHF': 0.90,
      'NOK': 8.5,
      'SEK': 9.0,
      'DKK': 6.3,
      'USD': 1.0
    },
    'EUR': {
      'USD': 1.18,
      'GBP': 0.88,
      'NOK': 10.0,
      'SEK': 10.6,
      'DKK': 7.4,
      'EUR': 1.0
    },
    'NOK': {
      'USD': 0.12,
      'EUR': 0.10,
      'SEK': 1.06,
      'DKK': 0.74,
      'NOK': 1.0
    },
    'SEK': {
      'USD': 0.11,
      'EUR': 0.094,
      'NOK': 0.94,
      'DKK': 0.70,
      'SEK': 1.0
    },
    'DKK': {
      'USD': 0.16,
      'EUR': 0.135,
      'NOK': 1.35,
      'SEK': 1.43,
      'DKK': 1.0
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return 1.0
    }

    const cacheKey = `${fromCurrency}-${toCurrency}`
    
    try {
      // Check memory cache first
      const cachedRate = this.cache.get(cacheKey)
      if (cachedRate && new Date(cachedRate.expiresAt) > new Date()) {
        return cachedRate.rate
      }

      // Check database cache
      const dbRate = await this.getCachedRateFromDB(fromCurrency, toCurrency)
      if (dbRate && new Date(dbRate.expires_at) > new Date()) {
        // Update memory cache
        this.cache.set(cacheKey, {
          from: fromCurrency,
          to: toCurrency,
          rate: dbRate.rate,
          source: dbRate.source as any,
          timestamp: dbRate.created_at,
          expiresAt: dbRate.expires_at
        })
        return dbRate.rate
      }

      // Fetch fresh rate from external APIs
      const freshRate = await this.fetchExchangeRate(fromCurrency, toCurrency)
      
      // Cache the result
      await this.cacheExchangeRate(freshRate)
      
      return freshRate.rate

    } catch (error) {
      console.error(`[CurrencyConversion] Error getting exchange rate ${fromCurrency} to ${toCurrency}:`, error)
      
      // Fallback to static rates
      return this.getFallbackRate(fromCurrency, toCurrency)
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversionResult> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency)
    const convertedAmount = amount * rate
    
    return {
      amount: convertedAmount,
      fromCurrency,
      toCurrency,
      exchangeRate: rate,
      source: 'api',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Convert multiple amounts in different currencies to a base currency
   */
  async convertMultipleAmounts(
    amounts: { amount: number; currency: string }[],
    baseCurrency: string
  ): Promise<{ totalAmount: number; conversions: CurrencyConversionResult[] }> {
    const conversions: CurrencyConversionResult[] = []
    let totalAmount = 0

    for (const { amount, currency } of amounts) {
      const conversion = await this.convertAmount(amount, currency, baseCurrency)
      conversions.push(conversion)
      totalAmount += conversion.amount
    }

    return { totalAmount, conversions }
  }

  /**
   * Fetch exchange rate from external APIs
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    // Try primary API (fxrates.io)
    try {
      const rate = await this.fetchFromFxRates(fromCurrency, toCurrency)
      if (rate) return rate
    } catch (error) {
      console.warn('[CurrencyConversion] FxRates API failed:', error)
    }

    // Try secondary API (exchangerate-api.com)
    try {
      const rate = await this.fetchFromExchangeRateApi(fromCurrency, toCurrency)
      if (rate) return rate
    } catch (error) {
      console.warn('[CurrencyConversion] ExchangeRate API failed:', error)
    }

    // Fallback to static rates
    const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency)
    return {
      from: fromCurrency,
      to: toCurrency,
      rate: fallbackRate,
      source: 'fallback',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.cacheTTL).toISOString()
    }
  }

  /**
   * Fetch rate from fxrates.io (free tier: 1000 requests/month)
   */
  private async fetchFromFxRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const apiKey = process.env.FXRATES_API_KEY
    if (!apiKey) {
      console.warn('[CurrencyConversion] FxRates API key not configured')
      return null
    }

    const url = `https://api.fxratesapi.com/convert?from=${fromCurrency}&to=${toCurrency}&amount=1&format=json&api_key=${apiKey}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LifeDash/1.0'
      },
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(`FxRates API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.result || !data.result.rate) {
      throw new Error('Invalid response from FxRates API')
    }

    return {
      from: fromCurrency,
      to: toCurrency,
      rate: data.result.rate,
      source: 'fxrates',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.cacheTTL).toISOString()
    }
  }

  /**
   * Fetch rate from exchangerate-api.com (free tier: 1500 requests/month)
   */
  private async fetchFromExchangeRateApi(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const apiKey = process.env.EXCHANGERATE_API_KEY
    if (!apiKey) {
      console.warn('[CurrencyConversion] ExchangeRate API key not configured')
      return null
    }

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LifeDash/1.0'
      },
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.result !== 'success' || !data.conversion_rate) {
      throw new Error('Invalid response from ExchangeRate API')
    }

    return {
      from: fromCurrency,
      to: toCurrency,
      rate: data.conversion_rate,
      source: 'exchangerate',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.cacheTTL).toISOString()
    }
  }

  /**
   * Get fallback rate from static table
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1.0
    
    // Direct lookup
    const directRate = this.fallbackRates[fromCurrency]?.[toCurrency]
    if (directRate) return directRate
    
    // Inverse lookup
    const inverseRate = this.fallbackRates[toCurrency]?.[fromCurrency]
    if (inverseRate) return 1 / inverseRate
    
    // Cross-currency conversion via USD
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromUsdRate = this.fallbackRates['USD']?.[fromCurrency]
      const toUsdRate = this.fallbackRates[toCurrency]?.[fromCurrency]
      
      if (fromUsdRate && toUsdRate) {
        return (1 / fromUsdRate) * toUsdRate
      }
    }
    
    // Default fallback
    console.warn(`[CurrencyConversion] No fallback rate found for ${fromCurrency} to ${toCurrency}, using 1.0`)
    return 1.0
  }

  /**
   * Cache exchange rate in database
   */
  private async cacheExchangeRate(rate: ExchangeRate): Promise<void> {
    try {
      await this.supabase
        .from('currency_exchange_rates')
        .upsert({
          from_currency: rate.from,
          to_currency: rate.to,
          rate: rate.rate,
          source: rate.source,
          created_at: rate.timestamp,
          expires_at: rate.expiresAt
        }, {
          onConflict: 'from_currency,to_currency'
        })

      // Also cache in memory
      this.cache.set(`${rate.from}-${rate.to}`, rate)
      
    } catch (error) {
      console.error('[CurrencyConversion] Error caching exchange rate:', error)
    }
  }

  /**
   * Get cached rate from database
   */
  private async getCachedRateFromDB(fromCurrency: string, toCurrency: string): Promise<CachedRate | null> {
    try {
      const { data, error } = await this.supabase
        .from('currency_exchange_rates')
        .select('*')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .single()

      if (error || !data) {
        return null
      }

      return data as CachedRate
    } catch (error) {
      console.error('[CurrencyConversion] Error fetching cached rate:', error)
      return null
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF',
      'NOK', 'SEK', 'DKK', 'CHF', 'CNY', 'INR', 'SGD',
      'HKD', 'MXN', 'BRL', 'KRW', 'THB', 'TRY'
    ]
  }

  /**
   * Get currency symbols and names
   */
  getCurrencyInfo(): Record<string, { symbol: string; name: string }> {
    return {
      'USD': { symbol: '$', name: 'US Dollar' },
      'EUR': { symbol: '€', name: 'Euro' },
      'GBP': { symbol: '£', name: 'British Pound' },
      'JPY': { symbol: '¥', name: 'Japanese Yen' },
      'CAD': { symbol: 'C$', name: 'Canadian Dollar' },
      'AUD': { symbol: 'A$', name: 'Australian Dollar' },
      'CHF': { symbol: 'Fr', name: 'Swiss Franc' },
      'NOK': { symbol: 'kr', name: 'Norwegian Krone' },
      'SEK': { symbol: 'kr', name: 'Swedish Krona' },
      'DKK': { symbol: 'kr', name: 'Danish Krone' },
      'CNY': { symbol: '¥', name: 'Chinese Yuan' },
      'INR': { symbol: '₹', name: 'Indian Rupee' },
      'SGD': { symbol: 'S$', name: 'Singapore Dollar' },
      'HKD': { symbol: 'HK$', name: 'Hong Kong Dollar' },
      'MXN': { symbol: '$', name: 'Mexican Peso' },
      'BRL': { symbol: 'R$', name: 'Brazilian Real' },
      'KRW': { symbol: '₩', name: 'South Korean Won' },
      'THB': { symbol: '฿', name: 'Thai Baht' },
      'TRY': { symbol: '₺', name: 'Turkish Lira' }
    }
  }

  /**
   * Format currency amount with proper symbol and locale
   */
  formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
    const currencyInfo = this.getCurrencyInfo()[currency]
    
    if (!currencyInfo) {
      return `${amount.toFixed(2)} ${currency}`
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      // Fallback formatting
      return `${currencyInfo.symbol}${amount.toFixed(2)}`
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredRates(): Promise<void> {
    try {
      await this.supabase
        .from('currency_exchange_rates')
        .delete()
        .lt('expires_at', new Date().toISOString())

      // Clean memory cache
      for (const [key, rate] of this.cache.entries()) {
        if (new Date(rate.expiresAt) <= new Date()) {
          this.cache.delete(key)
        }
      }

      console.log('[CurrencyConversion] Cleaned up expired exchange rates')
    } catch (error) {
      console.error('[CurrencyConversion] Error cleaning up expired rates:', error)
    }
  }

  /**
   * Get conversion history for a currency pair
   */
  async getConversionHistory(
    fromCurrency: string,
    toCurrency: string,
    days: number = 30
  ): Promise<{ date: string; rate: number }[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    try {
      const { data, error } = await this.supabase
        .from('currency_exchange_rates')
        .select('rate, created_at')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      return data?.map(row => ({
        date: row.created_at,
        rate: row.rate
      })) || []
    } catch (error) {
      console.error('[CurrencyConversion] Error fetching conversion history:', error)
      return []
    }
  }
}