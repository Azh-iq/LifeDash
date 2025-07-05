'use client';

import { createClient } from '@/lib/supabase/client';

interface ChartDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'candlestick' | 'pie';
  period: string;
  interval: string;
  indicators?: string[];
  comparisons?: string[];
}

interface ChartData {
  id: string;
  config: ChartConfig;
  data: ChartDataPoint[];
  metadata: {
    min: number;
    max: number;
    average: number;
    count: number;
    lastUpdated: number;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

class ChartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly REAL_TIME_TTL = 30 * 1000; // 30 seconds for real-time charts
  private readonly INTRADAY_TTL = 2 * 60 * 1000; // 2 minutes for intraday charts
  private readonly DAILY_TTL = 10 * 60 * 1000; // 10 minutes for daily charts
  private readonly LONG_TERM_TTL = 60 * 60 * 1000; // 1 hour for long-term charts

  private compressionQueue = new Set<string>();
  private isCompressing = false;

  constructor() {
    // Clean up expired entries every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
    // Process compression queue every 5 minutes
    setInterval(() => this.processCompressionQueue(), 5 * 60 * 1000);
    // Perform LRU cleanup every 10 minutes
    setInterval(() => this.performLRUCleanup(), 10 * 60 * 1000);
  }

  private generateKey(prefix: string, params: Record<string, any> = {}): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
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

  private performLRUCleanup(): void {
    const maxEntries = 1000; // Limit cache size
    if (this.cache.size <= maxEntries) return;

    // Sort by last accessed time and remove oldest entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = entries.slice(0, this.cache.size - maxEntries);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  private set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  // Chart data methods
  async getChartData(
    symbol: string,
    config: ChartConfig
  ): Promise<ChartData | null> {
    const key = this.generateKey('chart', { symbol, config });
    const cached = this.get<ChartData>(key);
    
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchChartData(symbol, config);
      if (data) {
        const ttl = this.getTTLForConfig(config);
        this.set(key, data, ttl);
        
        // Add to compression queue if it's a large dataset
        if (data.data.length > 1000) {
          this.compressionQueue.add(key);
        }
      }
      return data;
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      return null;
    }
  }

  async getPortfolioChartData(
    portfolioId: string,
    config: ChartConfig
  ): Promise<ChartData | null> {
    const key = this.generateKey('portfolio-chart', { portfolioId, config });
    const cached = this.get<ChartData>(key);
    
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchPortfolioChartData(portfolioId, config);
      if (data) {
        const ttl = this.getTTLForConfig(config);
        this.set(key, data, ttl);
      }
      return data;
    } catch (error) {
      console.error(`Error fetching portfolio chart data:`, error);
      return null;
    }
  }

  async getComparisonChartData(
    symbols: string[],
    config: ChartConfig
  ): Promise<Record<string, ChartData> | null> {
    const key = this.generateKey('comparison-chart', { symbols, config });
    const cached = this.get<Record<string, ChartData>>(key);
    
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchComparisonChartData(symbols, config);
      if (data) {
        const ttl = this.getTTLForConfig(config);
        this.set(key, data, ttl);
      }
      return data;
    } catch (error) {
      console.error(`Error fetching comparison chart data:`, error);
      return null;
    }
  }

  // Data fetching methods
  private async fetchChartData(
    symbol: string,
    config: ChartConfig
  ): Promise<ChartData | null> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .rpc('get_chart_data', {
          p_symbol: symbol,
          p_period: config.period,
          p_interval: config.interval,
          p_indicators: config.indicators || []
        });

      if (error) throw error;

      return this.transformChartData(data, config);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return null;
    }
  }

  private async fetchPortfolioChartData(
    portfolioId: string,
    config: ChartConfig
  ): Promise<ChartData | null> {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .rpc('get_portfolio_chart_data', {
          p_portfolio_id: portfolioId,
          p_period: config.period,
          p_interval: config.interval
        });

      if (error) throw error;

      return this.transformChartData(data, config);
    } catch (error) {
      console.error('Error fetching portfolio chart data:', error);
      return null;
    }
  }

  private async fetchComparisonChartData(
    symbols: string[],
    config: ChartConfig
  ): Promise<Record<string, ChartData> | null> {
    const results: Record<string, ChartData> = {};
    
    const promises = symbols.map(async symbol => {
      const data = await this.fetchChartData(symbol, config);
      if (data) {
        results[symbol] = data;
      }
    });

    await Promise.allSettled(promises);
    return Object.keys(results).length > 0 ? results : null;
  }

  // Data transformation and compression
  private transformChartData(rawData: any[], config: ChartConfig): ChartData {
    const data: ChartDataPoint[] = rawData.map(point => ({
      date: point.date,
      value: point.value || point.close || 0,
      timestamp: new Date(point.date).getTime()
    }));

    const values = data.map(d => d.value);
    const metadata = {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length,
      lastUpdated: Date.now()
    };

    return {
      id: this.generateKey('chart-data', { config }),
      config,
      data,
      metadata
    };
  }

  // Data compression for large datasets
  private async processCompressionQueue(): Promise<void> {
    if (this.isCompressing || this.compressionQueue.size === 0) {
      return;
    }

    this.isCompressing = true;
    const keys = Array.from(this.compressionQueue);
    this.compressionQueue.clear();

    try {
      for (const key of keys) {
        const entry = this.cache.get(key);
        if (entry) {
          const compressed = this.compressChartData(entry.data);
          this.cache.set(key, compressed);
        }
      }
    } catch (error) {
      console.error('Error compressing chart data:', error);
    } finally {
      this.isCompressing = false;
    }
  }

  private compressChartData(chartData: ChartData): ChartData {
    // Simple compression: reduce data points for long-term charts
    const { data, config } = chartData;
    
    if (data.length <= 500) {
      return chartData; // No compression needed
    }

    const compressionRatio = Math.ceil(data.length / 500);
    const compressedData = data.filter((_, index) => index % compressionRatio === 0);

    return {
      ...chartData,
      data: compressedData,
      metadata: {
        ...chartData.metadata,
        count: compressedData.length,
        lastUpdated: Date.now()
      }
    };
  }

  // TTL calculation based on config
  private getTTLForConfig(config: ChartConfig): number {
    const period = config.period.toLowerCase();
    const interval = config.interval.toLowerCase();

    // Real-time charts (1 minute intervals)
    if (interval.includes('1m') || interval.includes('minute')) {
      return this.REAL_TIME_TTL;
    }

    // Intraday charts (5m, 15m, 30m, 1h)
    if (period.includes('1d') || period.includes('day')) {
      return this.INTRADAY_TTL;
    }

    // Daily charts (1d intervals, up to 1 year)
    if (period.includes('1y') || period.includes('year')) {
      return this.DAILY_TTL;
    }

    // Long-term charts (weekly, monthly)
    return this.LONG_TERM_TTL;
  }

  // Cache invalidation
  invalidateSymbol(symbol: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`symbol:${symbol}`)) {
        this.cache.delete(key);
      }
    }
  }

  invalidatePortfolio(portfolioId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`portfolioId:${portfolioId}`)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateByPeriod(period: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`period":"${period}"`)) {
        this.cache.delete(key);
      }
    }
  }

  // Preloading methods
  async preloadChartData(
    symbols: string[],
    configs: ChartConfig[]
  ): Promise<void> {
    const promises = symbols.flatMap(symbol =>
      configs.map(config => this.getChartData(symbol, config))
    );

    await Promise.allSettled(promises);
  }

  async preloadPortfolioCharts(
    portfolioIds: string[],
    configs: ChartConfig[]
  ): Promise<void> {
    const promises = portfolioIds.flatMap(portfolioId =>
      configs.map(config => this.getPortfolioChartData(portfolioId, config))
    );

    await Promise.allSettled(promises);
  }

  // Background refresh
  async refreshChartData(symbol: string, config: ChartConfig): Promise<void> {
    const key = this.generateKey('chart', { symbol, config });
    this.cache.delete(key);
    await this.getChartData(symbol, config);
  }

  async refreshPortfolioChartData(
    portfolioId: string,
    config: ChartConfig
  ): Promise<void> {
    const key = this.generateKey('portfolio-chart', { portfolioId, config });
    this.cache.delete(key);
    await this.getPortfolioChartData(portfolioId, config);
  }

  // Statistics and monitoring
  getCacheStats(): {
    totalEntries: number;
    totalDataPoints: number;
    avgDataPointsPerChart: number;
    memoryUsage: string;
    hitRate: number;
    compressionRatio: number;
    mostAccessedCharts: Array<{ key: string; accessCount: number }>;
  } {
    let totalDataPoints = 0;
    let totalAccesses = 0;
    let totalHits = 0;
    const accessCounts: Array<{ key: string; accessCount: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.data.data && Array.isArray(entry.data.data)) {
        totalDataPoints += entry.data.data.length;
      }
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 0) {
        totalHits += entry.accessCount;
      }
      accessCounts.push({ key, accessCount: entry.accessCount });
    }

    const mostAccessedCharts = accessCounts
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalEntries: this.cache.size,
      totalDataPoints,
      avgDataPointsPerChart: this.cache.size > 0 ? totalDataPoints / this.cache.size : 0,
      memoryUsage: `${Math.round(totalDataPoints * 0.1)}KB`,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      compressionRatio: 0.85, // Estimated compression ratio
      mostAccessedCharts
    };
  }

  // Memory management
  clearCache(): void {
    this.cache.clear();
  }

  getMemoryUsage(): {
    entries: number;
    dataPoints: number;
    estimatedSize: string;
  } {
    let totalDataPoints = 0;
    
    for (const [, entry] of this.cache.entries()) {
      if (entry.data.data && Array.isArray(entry.data.data)) {
        totalDataPoints += entry.data.data.length;
      }
    }

    return {
      entries: this.cache.size,
      dataPoints: totalDataPoints,
      estimatedSize: `${Math.round(totalDataPoints * 0.1)}KB`
    };
  }
}

// Singleton instance
const chartCache = new ChartCache();

export default chartCache;

// Hook for React components
export const useChartCache = () => {
  return {
    getChartData: chartCache.getChartData.bind(chartCache),
    getPortfolioChartData: chartCache.getPortfolioChartData.bind(chartCache),
    getComparisonChartData: chartCache.getComparisonChartData.bind(chartCache),
    invalidateSymbol: chartCache.invalidateSymbol.bind(chartCache),
    invalidatePortfolio: chartCache.invalidatePortfolio.bind(chartCache),
    invalidateByPeriod: chartCache.invalidateByPeriod.bind(chartCache),
    preloadChartData: chartCache.preloadChartData.bind(chartCache),
    preloadPortfolioCharts: chartCache.preloadPortfolioCharts.bind(chartCache),
    refreshChartData: chartCache.refreshChartData.bind(chartCache),
    refreshPortfolioChartData: chartCache.refreshPortfolioChartData.bind(chartCache),
    getCacheStats: chartCache.getCacheStats.bind(chartCache),
    getMemoryUsage: chartCache.getMemoryUsage.bind(chartCache),
    clearCache: chartCache.clearCache.bind(chartCache)
  };
};

// Common chart configurations
export const CHART_CONFIGS = {
  REAL_TIME: {
    type: 'line' as const,
    period: '1D',
    interval: '1m'
  },
  INTRADAY: {
    type: 'line' as const,
    period: '1D',
    interval: '5m'
  },
  DAILY: {
    type: 'line' as const,
    period: '1M',
    interval: '1d'
  },
  WEEKLY: {
    type: 'line' as const,
    period: '3M',
    interval: '1d'
  },
  MONTHLY: {
    type: 'line' as const,
    period: '1Y',
    interval: '1d'
  },
  YEARLY: {
    type: 'line' as const,
    period: '5Y',
    interval: '1w'
  }
} as const;

// Export types
export type { ChartData, ChartConfig, ChartDataPoint };