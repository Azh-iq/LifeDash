// Export all chart components for easy importing
export { 
  default as PortfolioPerformanceChart 
} from './portfolio-performance-chart'

export { 
  default as AssetAllocationChart 
} from './asset-allocation-chart'

export { 
  TimeRangeSelector,
  CompactTimeRangeSelector,
  useTimeRange,
  formatTimeRangeDescription,
  DEFAULT_TIME_RANGES,
  type TimeRange 
} from './time-range-selector'

export { 
  ChartControls,
  ChartQuickActions,
  useChartConfig,
  type ChartConfig 
} from './chart-controls'

export { 
  createBenchmarkComparison,
  createPortfolioComparison,
  default as PerformanceComparisonChart 
} from './performance-comparison-chart'

// Re-export commonly used types
// Note: These are defined as interfaces in the individual components
// You can access them by importing the specific component files

// Chart theme utilities
export const CHART_COLORS = {
  primary: '#1e40af',
  secondary: '#3b82f6',
  accent: '#60a5fa',
  success: '#059669',
  warning: '#ea580c',
  error: '#ef4444',
  neutral: '#6b7280',
  
  // Investment theme colors
  investments: {
    50: '#dbeafe',
    100: '#bfdbfe',
    200: '#93c5fd',
    300: '#60a5fa',
    400: '#3b82f6',
    500: '#1e40af',
    600: '#1d4ed8',
    700: '#1e3a8a',
    800: '#1e3a8a',
    900: '#1e3a8a',
  },
  
  // Chart color palette
  palette: [
    '#1e40af', // Deep blue
    '#3b82f6', // Blue
    '#60a5fa', // Light blue
    '#93c5fd', // Lighter blue
    '#1d4ed8', // Darker blue
    '#2563eb', // Medium blue
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#a855f7', // Light purple
    '#059669', // Green
    '#ea580c', // Orange
    '#ef4444', // Red
  ],
}

// Chart configuration presets
export const CHART_PRESETS = {
  minimal: {
    showGrid: false,
    showLegend: false,
    showArea: false,
    showDataLabels: false,
    showVolume: false,
    showComparison: false,
    chartType: 'line' as const,
    timeRange: '1M',
    currency: 'NOK',
    theme: 'auto' as const,
  },
  
  standard: {
    showGrid: true,
    showLegend: true,
    showArea: true,
    showDataLabels: false,
    showVolume: false,
    showComparison: false,
    chartType: 'area' as const,
    timeRange: '1M',
    currency: 'NOK',
    theme: 'auto' as const,
  },
  
  detailed: {
    showGrid: true,
    showLegend: true,
    showArea: true,
    showDataLabels: true,
    showVolume: true,
    showComparison: true,
    chartType: 'area' as const,
    timeRange: '1M',
    currency: 'NOK',
    theme: 'auto' as const,
  },
  
  comparison: {
    showGrid: true,
    showLegend: true,
    showArea: false,
    showDataLabels: false,
    showVolume: false,
    showComparison: true,
    chartType: 'line' as const,
    timeRange: '1Y',
    currency: 'NOK',
    theme: 'auto' as const,
  },
}

// Utility functions for chart formatting
export const formatCurrency = (value: number, currency: string = 'NOK'): string => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = startDate.toLocaleDateString('nb-NO', { 
    month: 'short', 
    day: 'numeric',
    year: endDate.getFullYear() !== startDate.getFullYear() ? 'numeric' : undefined
  })
  const end = endDate.toLocaleDateString('nb-NO', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
  return `${start} - ${end}`
}

// Chart responsiveness utilities
export const getResponsiveHeight = (screenWidth: number): number => {
  if (screenWidth < 640) return 250      // Mobile
  if (screenWidth < 1024) return 300     // Tablet
  return 400                             // Desktop
}

export const getResponsiveMargin = (screenWidth: number) => {
  if (screenWidth < 640) {
    return { top: 10, right: 10, left: 0, bottom: 0 }
  }
  return { top: 10, right: 30, left: 0, bottom: 0 }
}

// Norwegian locale formatting
export const NORWEGIAN_LOCALE = 'nb-NO'

// Common chart options
export const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  locale: NORWEGIAN_LOCALE,
  currency: 'NOK',
  timezone: 'Europe/Oslo',
}

// Export version info
export const CHART_VERSION = '1.0.0'