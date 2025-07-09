/**
 * LifeDash Stock Widget Library
 * 
 * A comprehensive collection of stock-specific widgets for the LifeDash platform.
 * These widgets follow the existing LifeDash architecture patterns and provide
 * a consistent user experience with Norwegian localization.
 */

// Core Stock Widgets
export { StockChartWidget } from './stock-chart-widget'
export { NewsFeedWidget } from './news-feed-widget'
export { TransactionsWidget } from './transactions-widget'
export { FundamentalsWidget } from './fundamentals-widget'
export { HoldingsWidget } from './holdings-widget'
export { PerformanceWidget } from './performance-widget'

// Types
export type { StockChartData } from './stock-chart-widget'
export type { Transaction } from './transactions-widget'
export type { Holding } from './holdings-widget'
export type { PerformanceData, PerformanceMetrics } from './performance-widget'

// Widget configurations for the widget registry
export const STOCK_WIDGET_CONFIGS = {
  STOCK_CHART: {
    type: 'STOCK_CHART',
    displayName: 'Aksjekurs Graf',
    description: 'Interaktiv aksjekurs graf med tekniske indikatorer',
    category: 'STOCKS',
    minSize: 'MEDIUM',
    maxSize: 'HERO',
    recommendedSize: 'LARGE',
    features: {
      exportable: true,
      configurable: true,
      realTimeUpdates: true,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: false,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: true,
    },
  },
  NEWS_FEED: {
    type: 'NEWS_FEED',
    displayName: 'Nyhetsfeed',
    description: 'Siste finansnyheter og markedsinformasjon',
    category: 'STOCKS',
    minSize: 'MEDIUM',
    maxSize: 'LARGE',
    recommendedSize: 'MEDIUM',
    features: {
      exportable: false,
      configurable: true,
      realTimeUpdates: true,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: false,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: true,
    },
  },
  TRANSACTIONS_LIST: {
    type: 'TRANSACTIONS_LIST',
    displayName: 'Transaksjonshistorikk',
    description: 'Fullstendig transaksjonslogg med filtering',
    category: 'STOCKS',
    minSize: 'LARGE',
    maxSize: 'HERO',
    recommendedSize: 'LARGE',
    features: {
      exportable: true,
      configurable: true,
      realTimeUpdates: true,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: true,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: false,
    },
  },
  FUNDAMENTALS: {
    type: 'FUNDAMENTALS',
    displayName: 'Fundamentale Nøkkeltall',
    description: 'Finansielle nøkkeltall og selskapsinfo',
    category: 'STOCKS',
    minSize: 'MEDIUM',
    maxSize: 'HERO',
    recommendedSize: 'LARGE',
    features: {
      exportable: true,
      configurable: true,
      realTimeUpdates: false,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: false,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: true,
    },
  },
  HOLDINGS: {
    type: 'HOLDINGS',
    displayName: 'Aksjebeholdninger',
    description: 'Oversikt over aksjebeholdninger med P&L',
    category: 'STOCKS',
    minSize: 'LARGE',
    maxSize: 'HERO',
    recommendedSize: 'LARGE',
    features: {
      exportable: true,
      configurable: true,
      realTimeUpdates: true,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: true,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: true,
    },
  },
  PERFORMANCE: {
    type: 'PERFORMANCE',
    displayName: 'Ytelsesanalyse',
    description: 'Detaljert ytelsesanalyse og risikometrikker',
    category: 'STOCKS',
    minSize: 'LARGE',
    maxSize: 'HERO',
    recommendedSize: 'LARGE',
    features: {
      exportable: true,
      configurable: true,
      realTimeUpdates: true,
      caching: true,
      responsive: true,
    },
    dataRequirements: {
      requiresPortfolio: true,
      requiresStock: true,
      requiresAccount: false,
      requiresInternetConnection: true,
    },
  },
} as const

// Widget themes for consistent styling
export const STOCK_WIDGET_THEMES = {
  primary: '#6366f1',
  secondary: '#a855f7',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  chartColors: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
    volume: '#94a3b8',
  },
} as const

// Norwegian labels for all widgets
export const STOCK_WIDGET_LABELS = {
  common: {
    loading: 'Laster...',
    error: 'Feil ved lasting',
    noData: 'Ingen data tilgjengelig',
    refresh: 'Oppdater',
    export: 'Eksporter',
    configure: 'Konfigurer',
    close: 'Lukk',
    save: 'Lagre',
    cancel: 'Avbryt',
    search: 'Søk',
    filter: 'Filter',
    sort: 'Sorter',
    more: 'Mer',
  },
  stockChart: {
    title: 'Aksjekurs',
    timeRanges: {
      '4h': 'Siste 4 timer',
      'D': 'I dag',
      'W': 'Denne uken',
      'M': 'Denne måneden',
      '3M': 'Siste 3 måneder',
      'YTD': 'År til dato',
      '1Y': 'Siste år',
    },
    chartTypes: {
      area: 'Område',
      line: 'Linje',
      candlestick: 'Lysestake',
    },
    indicators: {
      volume: 'Volum',
      ma: 'Glidende gjennomsnitt',
      rsi: 'RSI',
      macd: 'MACD',
    },
  },
  newsFeed: {
    title: 'Nyheter',
    categories: {
      all: 'Alle',
      general: 'Generelt',
      business: 'Næringsliv',
      technology: 'Teknologi',
    },
    sentiment: {
      positive: 'Positiv',
      negative: 'Negativ',
      neutral: 'Nøytral',
    },
    actions: {
      readMore: 'Les mer',
      loadMore: 'Last flere',
    },
  },
  transactions: {
    title: 'Transaksjoner',
    types: {
      buy: 'Kjøp',
      sell: 'Salg',
      dividend: 'Utbytte',
      split: 'Splitt',
      spinoff: 'Spinoff',
    },
    columns: {
      date: 'Dato',
      type: 'Type',
      quantity: 'Antall',
      price: 'Pris',
      amount: 'Beløp',
      fees: 'Avgifter',
      account: 'Konto',
      actions: 'Handlinger',
    },
  },
  fundamentals: {
    title: 'Fundamentals',
    sections: {
      overview: 'Oversikt',
      ratios: 'Nøkkeltall',
      market: 'Marked',
      performance: 'Ytelse',
    },
    metrics: {
      pe: 'P/E Ratio',
      pb: 'P/B Ratio',
      roe: 'Egenkapitalrentabilitet',
      roa: 'Avkastning på eiendeler',
      beta: 'Beta',
      marketCap: 'Markedsverdi',
    },
  },
  holdings: {
    title: 'Beholdninger',
    columns: {
      symbol: 'Symbol',
      quantity: 'Antall',
      avgPrice: 'Snittprip',
      currentPrice: 'Aktuell pris',
      marketValue: 'Markedsverdi',
      pnl: 'P&L',
      dayChange: 'Dagens endring',
      account: 'Konto',
    },
    actions: {
      buyMore: 'Kjøp mer',
      sell: 'Selg',
      viewDetails: 'Vis detaljer',
    },
  },
  performance: {
    title: 'Ytelsesanalyse',
    views: {
      returns: 'Avkastning',
      comparison: 'Sammenligning',
      metrics: 'Nøkkeltall',
      risk: 'Risiko',
    },
    metrics: {
      totalReturn: 'Total avkastning',
      annualizedReturn: 'Annualisert avkastning',
      volatility: 'Volatilitet',
      sharpeRatio: 'Sharpe Ratio',
      maxDrawdown: 'Max Drawdown',
      alpha: 'Alpha',
      beta: 'Beta',
      winRate: 'Vinnrate',
    },
  },
} as const

// Helper function to get widget configuration
export function getStockWidgetConfig(widgetType: keyof typeof STOCK_WIDGET_CONFIGS) {
  return STOCK_WIDGET_CONFIGS[widgetType]
}

// Helper function to get widget theme
export function getStockWidgetTheme() {
  return STOCK_WIDGET_THEMES
}

// Helper function to get Norwegian labels
export function getStockWidgetLabels(section?: keyof typeof STOCK_WIDGET_LABELS) {
  return section ? STOCK_WIDGET_LABELS[section] : STOCK_WIDGET_LABELS
}