'use client';

import { createClient } from '@/lib/supabase/client';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  timestamp: number;
}

interface HistoricalPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PriceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly REAL_TIME_TTL = 15 * 1000; // 15 seconds for real-time prices
  private readonly QUOTE_TTL = 60 * 1000; // 1 minute for detailed quotes
  private readonly HISTORICAL_TTL = 5 * 60 * 1000; // 5 minutes for historical data
  private readonly MARKET_DATA_TTL = 30 * 60 * 1000; // 30 minutes for market data

  private updateQueue = new Set<string>();
  private isUpdating = false;

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
    // Process update queue every 10 seconds
    setInterval(() => this.processUpdateQueue(), 10 * 1000);
  }

  private generateKey(prefix: string, params: Record<string, any> = {}): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${prefix}${paramString ? ':' + paramString : ''}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  // Real-time price methods
  async getPrice(symbol: string): Promise<PriceData | null> {
    const key = this.generateKey('price', { symbol });
    const cached = this.get<PriceData>(key);
    
    if (cached) {
      return cached;
    }

    // Add to update queue for batch processing
    this.updateQueue.add(symbol);
    
    try {
      // Try to get from database first
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      const priceData = this.transformPriceData(data);
      this.set(key, priceData, this.REAL_TIME_TTL);
      return priceData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  async getPrices(symbols: string[]): Promise<Record<string, PriceData>> {
    const prices: Record<string, PriceData> = {};
    const uncachedSymbols: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const key = this.generateKey('price', { symbol });
      const cached = this.get<PriceData>(key);
      
      if (cached) {
        prices[symbol] = cached;
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('stock_prices')
          .select('*')
          .in('symbol', uncachedSymbols)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Group by symbol and take the latest price
        const latestPrices = new Map<string, any>();
        for (const price of data) {
          if (!latestPrices.has(price.symbol) || 
              price.timestamp > latestPrices.get(price.symbol).timestamp) {
            latestPrices.set(price.symbol, price);
          }
        }

        // Cache and add to results
        for (const [symbol, priceData] of latestPrices) {
          const key = this.generateKey('price', { symbol });
          const transformedData = this.transformPriceData(priceData);
          this.set(key, transformedData, this.REAL_TIME_TTL);
          prices[symbol] = transformedData;
        }
      } catch (error) {
        console.error('Error fetching multiple prices:', error);
      }
    }

    return prices;
  }

  // Historical price methods
  async getHistoricalPrices(
    symbol: string, 
    period: string = '1M',
    interval: string = '1d'
  ): Promise<HistoricalPrice[] | null> {
    const key = this.generateKey('historical', { symbol, period, interval });
    const cached = this.get<HistoricalPrice[]>(key);
    
    if (cached) {
      return cached;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_historical_prices', {
          p_symbol: symbol,
          p_period: period,
          p_interval: interval
        });

      if (error) throw error;

      const historicalData = data.map(this.transformHistoricalData);
      this.set(key, historicalData, this.HISTORICAL_TTL);
      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical prices for ${symbol}:`, error);
      return null;
    }
  }

  // Market data methods
  async getMarketData(symbol: string): Promise<any | null> {
    const key = this.generateKey('market-data', { symbol });
    const cached = this.get<any>(key);
    
    if (cached) {
      return cached;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) throw error;

      this.set(key, data, this.MARKET_DATA_TTL);
      return data;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  // Batch update processing
  private async processUpdateQueue(): Promise<void> {
    if (this.isUpdating || this.updateQueue.size === 0) {
      return;
    }

    this.isUpdating = true;
    const symbols = Array.from(this.updateQueue);
    this.updateQueue.clear();

    try {
      await this.fetchLatestPrices(symbols);
    } catch (error) {
      console.error('Error processing update queue:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private async fetchLatestPrices(symbols: string[]): Promise<void> {
    // In a real implementation, this would call external APIs
    // For now, we'll use cached data or database
    try {
      const prices = await this.getPrices(symbols);
      
      // Emit price updates to listeners
      for (const [symbol, priceData] of Object.entries(prices)) {
        this.emitPriceUpdate(symbol, priceData);
      }
    } catch (error) {
      console.error('Error fetching latest prices:', error);
    }
  }

  // Price streaming and real-time updates
  private listeners = new Map<string, Set<(data: PriceData) => void>>();

  subscribeToPrice(symbol: string, callback: (data: PriceData) => void): () => void {
    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, new Set());
    }
    
    this.listeners.get(symbol)!.add(callback);
    
    // Immediately provide cached data if available
    const cached = this.get<PriceData>(this.generateKey('price', { symbol }));
    if (cached) {
      callback(cached);
    }

    // Return unsubscribe function
    return () => {
      const symbolListeners = this.listeners.get(symbol);
      if (symbolListeners) {
        symbolListeners.delete(callback);
        if (symbolListeners.size === 0) {
          this.listeners.delete(symbol);
        }
      }
    };
  }

  private emitPriceUpdate(symbol: string, data: PriceData): void {
    const symbolListeners = this.listeners.get(symbol);
    if (symbolListeners) {
      symbolListeners.forEach(callback => callback(data));
    }
  }

  // Cache invalidation
  invalidatePrice(symbol: string): void {
    const key = this.generateKey('price', { symbol });
    this.cache.delete(key);
  }

  invalidateHistoricalPrices(symbol: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`historical:symbol:${symbol}`)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateMarketData(symbol: string): void {
    const key = this.generateKey('market-data', { symbol });
    this.cache.delete(key);
  }

  // Preload methods
  async preloadPrices(symbols: string[]): Promise<void> {
    const promises = symbols.map(symbol => this.getPrice(symbol));
    await Promise.allSettled(promises);
  }

  async preloadHistoricalData(symbols: string[], periods: string[] = ['1M']): Promise<void> {
    const promises = symbols.flatMap(symbol => 
      periods.map(period => this.getHistoricalPrices(symbol, period))
    );
    await Promise.allSettled(promises);
  }

  // Helper methods
  private transformPriceData(rawData: any): PriceData {
    return {
      symbol: rawData.symbol,
      price: rawData.price || 0,
      change: rawData.change || 0,
      changePercent: rawData.change_percent || 0,
      volume: rawData.volume || 0,
      marketCap: rawData.market_cap,
      pe: rawData.pe_ratio,
      dividend: rawData.dividend_yield,
      timestamp: new Date(rawData.timestamp).getTime()
    };
  }

  private transformHistoricalData(rawData: any): HistoricalPrice {
    return {
      symbol: rawData.symbol,
      date: rawData.date,
      open: rawData.open || 0,
      high: rawData.high || 0,
      low: rawData.low || 0,
      close: rawData.close || 0,
      volume: rawData.volume || 0,
      timestamp: new Date(rawData.date).getTime()
    };
  }

  // Statistics and monitoring
  getCacheStats(): {
    totalEntries: number;
    priceEntries: number;
    historicalEntries: number;
    marketDataEntries: number;
    activeSubscriptions: number;
    memoryUsage: string;
  } {
    let priceEntries = 0;
    let historicalEntries = 0;
    let marketDataEntries = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('price:')) priceEntries++;
      else if (key.startsWith('historical:')) historicalEntries++;
      else if (key.startsWith('market-data:')) marketDataEntries++;
    }

    const activeSubscriptions = Array.from(this.listeners.values())
      .reduce((total, listeners) => total + listeners.size, 0);

    return {
      totalEntries: this.cache.size,
      priceEntries,
      historicalEntries,
      marketDataEntries,
      activeSubscriptions,
      memoryUsage: `${Math.round(this.cache.size * 0.3)}KB`
    };
  }

  // Market hours helper
  isMarketOpen(): boolean {
    const now = new Date();
    const eastern = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = eastern.getHours();
    const day = eastern.getDay();
    
    // Market is open Monday-Friday, 9:30 AM to 4:00 PM ET
    return day >= 1 && day <= 5 && hour >= 9.5 && hour < 16;
  }

  // Adaptive TTL based on market hours
  private getAdaptiveTTL(baseClass: 'price' | 'historical' | 'market'): number {
    const isOpen = this.isMarketOpen();
    
    switch (baseClass) {
      case 'price':
        return isOpen ? this.REAL_TIME_TTL : this.QUOTE_TTL;
      case 'historical':
        return this.HISTORICAL_TTL;
      case 'market':
        return this.MARKET_DATA_TTL;
      default:
        return this.QUOTE_TTL;
    }
  }
}

// Singleton instance
const priceCache = new PriceCache();

export default priceCache;

// Hook for React components
export const usePriceCache = () => {
  return {
    getPrice: priceCache.getPrice.bind(priceCache),
    getPrices: priceCache.getPrices.bind(priceCache),
    getHistoricalPrices: priceCache.getHistoricalPrices.bind(priceCache),
    getMarketData: priceCache.getMarketData.bind(priceCache),
    subscribeToPrice: priceCache.subscribeToPrice.bind(priceCache),
    invalidatePrice: priceCache.invalidatePrice.bind(priceCache),
    invalidateHistoricalPrices: priceCache.invalidateHistoricalPrices.bind(priceCache),
    preloadPrices: priceCache.preloadPrices.bind(priceCache),
    preloadHistoricalData: priceCache.preloadHistoricalData.bind(priceCache),
    getCacheStats: priceCache.getCacheStats.bind(priceCache),
    isMarketOpen: priceCache.isMarketOpen.bind(priceCache)
  };
};

// Export types
export type { PriceData, HistoricalPrice };