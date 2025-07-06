/**
 * Utility functions for formatting currencies, percentages, and numbers
 */

interface FormatCurrencyOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  showCurrencyCode?: boolean
}

interface FormatPercentageOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  showPositiveSign?: boolean
}

interface FormatNumberOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  style?: 'decimal' | 'currency' | 'percent'
  notation?: 'standard' | 'compact'
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'NOK', 
  options: FormatCurrencyOptions = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showCurrencyCode = false
  } = options

  try {
    // Handle edge cases
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '—'
    }

    // Use Norwegian locale as default
    const formatter = new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay: showCurrencyCode ? 'code' : 'symbol'
    })

    return formatter.format(amount)
  } catch (error) {
    // Fallback for unsupported currencies
    console.warn(`Unsupported currency: ${currency}`, error)
    
    const formatter = new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits,
      maximumFractionDigits,
    })
    
    return `${formatter.format(amount)} ${currency.toUpperCase()}`
  }
}

/**
 * Format a number as percentage
 */
export function formatPercentage(
  value: number, 
  options: FormatPercentageOptions = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showPositiveSign = false
  } = options

  try {
    // Handle edge cases
    if (typeof value !== 'number' || isNaN(value)) {
      return '—'
    }

    const formatter = new Intl.NumberFormat('nb-NO', {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
      signDisplay: showPositiveSign ? 'always' : 'auto'
    })

    // Convert to percentage (divide by 100 since Intl.NumberFormat multiplies by 100)
    return formatter.format(value / 100)
  } catch (error) {
    console.warn('Error formatting percentage:', error)
    
    // Fallback formatting
    const sign = showPositiveSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(maximumFractionDigits)}%`
  }
}

/**
 * Format a large number with compact notation (e.g., 1.2M, 1.5B)
 */
export function formatCompactNumber(
  value: number,
  currency?: string,
  options: FormatNumberOptions = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    notation = 'compact'
  } = options

  try {
    // Handle edge cases
    if (typeof value !== 'number' || isNaN(value)) {
      return '—'
    }

    const formatter = new Intl.NumberFormat('nb-NO', {
      notation,
      minimumFractionDigits,
      maximumFractionDigits,
      ...(currency && {
        style: 'currency',
        currency: currency.toUpperCase()
      })
    })

    return formatter.format(value)
  } catch (error) {
    console.warn('Error formatting compact number:', error)
    
    // Fallback to regular number formatting
    return formatNumber(value, { minimumFractionDigits, maximumFractionDigits })
  }
}

/**
 * Format a regular number with thousand separators
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options

  try {
    // Handle edge cases
    if (typeof value !== 'number' || isNaN(value)) {
      return '—'
    }

    const formatter = new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits,
      maximumFractionDigits
    })

    return formatter.format(value)
  } catch (error) {
    console.warn('Error formatting number:', error)
    return value.toString()
  }
}

/**
 * Format a date in Norwegian format
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return '—'
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }

    return new Intl.DateTimeFormat('nb-NO', defaultOptions).format(dateObj)
  } catch (error) {
    console.warn('Error formatting date:', error)
    return '—'
  }
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: string | Date,
  baseDate: Date = new Date()
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return '—'
    }

    const rtf = new Intl.RelativeTimeFormat('nb-NO', { 
      numeric: 'auto',
      style: 'long'
    })

    const diffTime = dateObj.getTime() - baseDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Choose appropriate unit based on time difference
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      if (Math.abs(diffHours) < 1) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60))
        return rtf.format(diffMinutes, 'minute')
      }
      return rtf.format(diffHours, 'hour')
    } else if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day')
    } else if (Math.abs(diffDays) < 30) {
      const diffWeeks = Math.ceil(diffDays / 7)
      return rtf.format(diffWeeks, 'week')
    } else if (Math.abs(diffDays) < 365) {
      const diffMonths = Math.ceil(diffDays / 30)
      return rtf.format(diffMonths, 'month')
    } else {
      const diffYears = Math.ceil(diffDays / 365)
      return rtf.format(diffYears, 'year')
    }
  } catch (error) {
    console.warn('Error formatting relative time:', error)
    return formatDate(date)
  }
}

/**
 * Safely format any value with fallback
 */
export function formatSafe(
  value: any,
  formatter: (val: any) => string,
  fallback: string = '—'
): string {
  try {
    if (value === null || value === undefined) {
      return fallback
    }
    return formatter(value)
  } catch (error) {
    console.warn('Error in safe formatting:', error)
    return fallback
  }
}

/**
 * Format market cap with appropriate units (M, B, T)
 */
export function formatMarketCap(
  marketCap: number,
  currency: string = 'NOK'
): string {
  if (!marketCap || marketCap <= 0) {
    return '—'
  }

  // Convert to appropriate unit
  if (marketCap >= 1e12) {
    return formatCurrency(marketCap / 1e12, currency, { maximumFractionDigits: 1 }) + 'T'
  } else if (marketCap >= 1e9) {
    return formatCurrency(marketCap / 1e9, currency, { maximumFractionDigits: 1 }) + 'B'
  } else if (marketCap >= 1e6) {
    return formatCurrency(marketCap / 1e6, currency, { maximumFractionDigits: 1 }) + 'M'
  } else if (marketCap >= 1e3) {
    return formatCurrency(marketCap / 1e3, currency, { maximumFractionDigits: 1 }) + 'K'
  } else {
    return formatCurrency(marketCap, currency)
  }
}

/**
 * Format volume with appropriate units
 */
export function formatVolume(volume: number): string {
  if (!volume || volume <= 0) {
    return '—'
  }

  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(1) + 'B'
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(1) + 'M'
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(1) + 'K'
  } else {
    return volume.toLocaleString('nb-NO')
  }
}

// Export all functions as a namespace for easier importing
export const Format = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: formatNumber,
  compactNumber: formatCompactNumber,
  date: formatDate,
  relativeTime: formatRelativeTime,
  marketCap: formatMarketCap,
  volume: formatVolume,
  safe: formatSafe
}