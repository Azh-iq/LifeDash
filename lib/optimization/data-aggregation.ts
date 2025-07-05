'use client';

import { useMemo } from 'react';

// Data aggregation utilities for performance optimization
export interface AggregationOptions {
  groupBy?: string;
  aggregations?: {
    [key: string]: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export interface TimeSeriesOptions {
  dateField: string;
  valueField: string;
  interval: 'hour' | 'day' | 'week' | 'month' | 'year';
  fillGaps?: boolean;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
}

// Generic data aggregation function
export function aggregateData<T extends Record<string, any>>(
  data: T[],
  options: AggregationOptions
): T[] {
  if (!data || data.length === 0) return [];

  let result = data;

  // Group by field if specified
  if (options.groupBy) {
    const grouped = result.reduce((acc, item) => {
      const key = item[options.groupBy!];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    // Apply aggregations
    result = Object.entries(grouped).map(([key, items]) => {
      const aggregated: any = { [options.groupBy!]: key };
      
      if (options.aggregations) {
        Object.entries(options.aggregations).forEach(([field, type]) => {
          const values = items.map(item => item[field]).filter(v => v != null);
          
          switch (type) {
            case 'sum':
              aggregated[field] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
              break;
            case 'avg':
              aggregated[field] = values.length > 0 
                ? values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length
                : 0;
              break;
            case 'min':
              aggregated[field] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
              break;
            case 'max':
              aggregated[field] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
              break;
            case 'count':
              aggregated[field] = values.length;
              break;
            case 'first':
              aggregated[field] = values[0];
              break;
            case 'last':
              aggregated[field] = values[values.length - 1];
              break;
          }
        });
      }

      return aggregated as T;
    });
  }

  // Sort if specified
  if (options.sort) {
    result.sort((a, b) => {
      const aVal = a[options.sort!.field];
      const bVal = b[options.sort!.field];
      
      if (aVal < bVal) return options.sort!.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return options.sort!.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Limit if specified
  if (options.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

// Time series data aggregation
export function aggregateTimeSeries<T extends Record<string, any>>(
  data: T[],
  options: TimeSeriesOptions
): T[] {
  if (!data || data.length === 0) return [];

  // Sort by date first
  const sortedData = [...data].sort((a, b) => 
    new Date(a[options.dateField]).getTime() - new Date(b[options.dateField]).getTime()
  );

  // Group by time interval
  const grouped = sortedData.reduce((acc, item) => {
    const date = new Date(item[options.dateField]);
    const key = getIntervalKey(date, options.interval);
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  // Aggregate each group
  const result = Object.entries(grouped).map(([key, items]) => {
    const values = items.map(item => Number(item[options.valueField]) || 0);
    let aggregatedValue: number;

    switch (options.aggregation || 'avg') {
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        aggregatedValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        break;
      case 'min':
        aggregatedValue = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        aggregatedValue = values.length > 0 ? Math.max(...values) : 0;
        break;
      case 'first':
        aggregatedValue = values[0] || 0;
        break;
      case 'last':
        aggregatedValue = values[values.length - 1] || 0;
        break;
      default:
        aggregatedValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    return {
      ...items[0],
      [options.dateField]: key,
      [options.valueField]: aggregatedValue
    } as T;
  });

  // Fill gaps if requested
  if (options.fillGaps) {
    return fillTimeSeriesGaps(result, options);
  }

  return result;
}

// Helper function to get interval key
function getIntervalKey(date: Date, interval: TimeSeriesOptions['interval']): string {
  switch (interval) {
    case 'hour':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    case 'day':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return `${date.getFullYear()}`;
    default:
      return date.toISOString().split('T')[0];
  }
}

// Fill gaps in time series data
function fillTimeSeriesGaps<T extends Record<string, any>>(
  data: T[],
  options: TimeSeriesOptions
): T[] {
  if (data.length === 0) return data;

  const result = [...data];
  const sortedData = result.sort((a, b) => 
    new Date(a[options.dateField]).getTime() - new Date(b[options.dateField]).getTime()
  );

  // Generate all dates in the range
  const startDate = new Date(sortedData[0][options.dateField]);
  const endDate = new Date(sortedData[sortedData.length - 1][options.dateField]);
  const allDates = generateDateRange(startDate, endDate, options.interval);

  // Find missing dates and fill them
  const existingDates = new Set(sortedData.map(item => item[options.dateField]));
  
  allDates.forEach(date => {
    if (!existingDates.has(date)) {
      const nearestItem = findNearestItem(sortedData, date, options.dateField);
      result.push({
        ...nearestItem,
        [options.dateField]: date,
        [options.valueField]: 0 // or interpolate
      } as T);
    }
  });

  return result.sort((a, b) => 
    new Date(a[options.dateField]).getTime() - new Date(b[options.dateField]).getTime()
  );
}

// Generate date range
function generateDateRange(
  start: Date,
  end: Date,
  interval: TimeSeriesOptions['interval']
): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(getIntervalKey(current, interval));
    
    switch (interval) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return dates;
}

// Find nearest item for filling gaps
function findNearestItem<T extends Record<string, any>>(
  data: T[],
  targetDate: string,
  dateField: string
): T {
  const target = new Date(targetDate).getTime();
  let nearest = data[0];
  let minDiff = Math.abs(new Date(data[0][dateField]).getTime() - target);

  for (const item of data) {
    const diff = Math.abs(new Date(item[dateField]).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = item;
    }
  }

  return nearest;
}

// Portfolio-specific aggregation functions
export function aggregatePortfolioHoldings(holdings: any[]) {
  return aggregateData(holdings, {
    groupBy: 'sector',
    aggregations: {
      market_value: 'sum',
      unrealized_pl: 'sum',
      quantity: 'sum',
      weight: 'avg'
    },
    sort: {
      field: 'market_value',
      order: 'desc'
    }
  });
}

export function aggregatePortfolioPerformance(
  performance: any[],
  interval: TimeSeriesOptions['interval'] = 'day'
) {
  return aggregateTimeSeries(performance, {
    dateField: 'date',
    valueField: 'value',
    interval,
    fillGaps: true,
    aggregation: 'last'
  });
}

// React hooks for memoized aggregation
export function useAggregatedData<T extends Record<string, any>>(
  data: T[],
  options: AggregationOptions
): T[] {
  return useMemo(() => {
    return aggregateData(data, options);
  }, [data, JSON.stringify(options)]);
}

export function useTimeSeriesAggregation<T extends Record<string, any>>(
  data: T[],
  options: TimeSeriesOptions
): T[] {
  return useMemo(() => {
    return aggregateTimeSeries(data, options);
  }, [data, JSON.stringify(options)]);
}

// Performance monitoring for aggregation
export function measureAggregationPerformance<T extends Record<string, any>>(
  data: T[],
  options: AggregationOptions,
  name: string = 'aggregation'
): T[] {
  const start = performance.now();
  const result = aggregateData(data, options);
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds for ${data.length} items`);
  
  return result;
}

// Data sampling for large datasets
export function sampleData<T>(
  data: T[],
  sampleSize: number,
  method: 'random' | 'systematic' | 'stratified' = 'systematic'
): T[] {
  if (data.length <= sampleSize) return data;

  switch (method) {
    case 'random':
      return data
        .sort(() => Math.random() - 0.5)
        .slice(0, sampleSize);
    
    case 'systematic':
      const step = Math.floor(data.length / sampleSize);
      return data.filter((_, index) => index % step === 0).slice(0, sampleSize);
    
    case 'stratified':
      // Simple stratified sampling - would need more complex logic for real stratification
      return data
        .sort(() => Math.random() - 0.5)
        .slice(0, sampleSize);
    
    default:
      return data.slice(0, sampleSize);
  }
}

// Data compression for large datasets
export function compressData<T extends Record<string, any>>(
  data: T[],
  compressionRatio: number = 0.5
): T[] {
  if (compressionRatio >= 1) return data;
  
  const targetSize = Math.floor(data.length * compressionRatio);
  return sampleData(data, targetSize, 'systematic');
}

// Batch processing for large datasets
export function processBatches<T, R>(
  data: T[],
  batchSize: number,
  processor: (batch: T[]) => R[]
): R[] {
  const results: R[] = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

// Export common aggregation patterns
export const COMMON_AGGREGATIONS = {
  PORTFOLIO_BY_SECTOR: {
    groupBy: 'sector',
    aggregations: {
      market_value: 'sum' as const,
      unrealized_pl: 'sum' as const,
      weight: 'avg' as const
    }
  },
  HOLDINGS_BY_SYMBOL: {
    groupBy: 'symbol',
    aggregations: {
      quantity: 'sum' as const,
      market_value: 'sum' as const,
      average_price: 'avg' as const
    }
  },
  PERFORMANCE_DAILY: {
    dateField: 'date',
    valueField: 'value',
    interval: 'day' as const,
    fillGaps: true,
    aggregation: 'last' as const
  }
} as const;