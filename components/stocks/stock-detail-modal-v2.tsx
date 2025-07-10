'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import { cn } from '@/lib/utils/cn'
import {
  getStockDetail,
  type StockTransaction,
} from '@/lib/actions/stocks/stock-detail'
import { StockChartWidget } from '@/components/widgets/stock/stock-chart-widget'
import { NewsFeedWidget } from '@/components/widgets/stock/news-feed-widget'
import { HoldingsWidget } from '@/components/widgets/stock/holdings-widget'
import { TransactionsWidget } from '@/components/widgets/stock/transactions-widget'
import { WidgetGrid } from '@/components/widgets/base/widget-grid'
import { Widget } from '@/components/widgets/widget-types'

// Types
interface StockDetailModalV2Props {
  isOpen: boolean
  onClose: () => void
  stockData: HoldingWithMetrics
  portfolioId?: string
}

// Sample data generators for widgets
const generateChartData = (symbol: string, currentPrice: number) => {
  const data = []
  const now = new Date()
  const basePrice = currentPrice > 0 ? currentPrice : 150

  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const variation = (Math.random() - 0.5) * (basePrice * 0.05)
    const price = Math.max(basePrice + variation, 0.01)
    data.push({
      timestamp: timestamp.toISOString(),
      price: price,
      change: variation,
      changePercent: (variation / basePrice) * 100,
    })
  }
  return data
}

const generateMockNews = (symbol: string) => [
  {
    id: 1,
    category: 'general',
    datetime: Math.floor(Date.now() / 1000) - 3600,
    headline: `${symbol} Q3 earnings report released`,
    image: '',
    related: symbol,
    source: 'Reuters',
    summary:
      'Company reports strong quarterly performance with revenue growth.',
    url: '#',
  },
  {
    id: 2,
    category: 'business',
    datetime: Math.floor(Date.now() / 1000) - 7200,
    headline: `Stock buy alert triggered for ${symbol}`,
    image: '',
    related: symbol,
    source: 'Bloomberg',
    summary: 'Technical analysis suggests potential buying opportunity.',
    url: '#',
  },
  {
    id: 3,
    category: 'general',
    datetime: Math.floor(Date.now() / 1000) - 14400,
    headline: `${symbol} price target updated by analysts`,
    image: '',
    related: symbol,
    source: 'MarketWatch',
    summary: 'Analysts revise price targets following market analysis.',
    url: '#',
  },
]

const generateMockHoldings = (
  symbol: string,
  stockData: HoldingWithMetrics
) => [
  {
    id: '1',
    symbol: symbol,
    companyName: stockData.stocks?.name || symbol,
    quantity: stockData.quantity || 100,
    averagePrice: stockData.average_cost || 150,
    currentPrice: stockData.current_price || 160,
    marketValue: (stockData.current_price || 160) * (stockData.quantity || 100),
    costBasis: (stockData.average_cost || 150) * (stockData.quantity || 100),
    unrealizedPnL: stockData.unrealized_pnl || 1000,
    unrealizedPnLPercent: stockData.unrealized_pnl_percent || 6.67,
    dayChange: stockData.daily_change || 240,
    dayChangePercent: stockData.daily_change_percent || 1.5,
    account: 'Nordnet',
    currency: stockData.stocks?.currency || 'NOK',
    lastUpdated: new Date().toISOString(),
    sector: 'Technology',
    country: 'US',
  },
]

const generateMockTransactions = (
  symbol: string,
  stockData: HoldingWithMetrics
) => [
  {
    id: '1',
    date: '2024-01-15',
    type: 'buy' as const,
    symbol: symbol,
    quantity: 50,
    price: stockData.average_cost || 150,
    fees: 99,
    total: (stockData.average_cost || 150) * 50 + 99,
    account: 'Nordnet',
    currency: stockData.stocks?.currency || 'NOK',
  },
  {
    id: '2',
    date: '2024-01-20',
    type: 'buy' as const,
    symbol: symbol,
    quantity: 50,
    price: stockData.average_cost || 150,
    fees: 99,
    total: (stockData.average_cost || 150) * 50 + 99,
    account: 'Nordnet',
    currency: stockData.stocks?.currency || 'NOK',
  },
]

export default function StockDetailModalV2({
  isOpen,
  onClose,
  stockData,
  portfolioId,
}: StockDetailModalV2Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const stock = stockData.stocks
  const symbol = stock?.symbol || stockData.symbol || 'N/A'
  const companyName = stock?.name || symbol
  const currentPrice = stockData.current_price || 0
  const dailyChange = stockData.daily_change || 0
  const dailyChangePercent = stockData.daily_change_percent || 0

  // Generate data for widgets
  const chartData = generateChartData(symbol, currentPrice)
  const mockNews = generateMockNews(symbol)
  const mockHoldings = generateMockHoldings(symbol, stockData)
  const mockTransactions = generateMockTransactions(symbol, stockData)

  // Define widget configurations for each tab
  const overviewWidgets: Widget[] = [
    {
      id: 'stock-chart',
      type: 'StockChart',
      title: 'Pris',
      category: 'stocks',
      size: { width: 2, height: 1 },
      position: { row: 1, column: 1 },
      configuration: {},
    },
    {
      id: 'news-feed',
      type: 'NewsFeed',
      title: 'Feed',
      category: 'stocks',
      size: { width: 1, height: 1 },
      position: { row: 1, column: 2 },
      configuration: {},
    },
    {
      id: 'holdings',
      type: 'Holdings',
      title: 'Beholdninger',
      category: 'stocks',
      size: { width: 3, height: 1 },
      position: { row: 2, column: 1 },
      configuration: {},
    },
  ]

  const feedWidgets: Widget[] = [
    {
      id: 'news-feed-full',
      type: 'NewsFeed',
      title: 'Feed',
      category: 'stocks',
      size: { width: 1, height: 1 },
      position: { row: 1, column: 1 },
      configuration: {},
    },
  ]

  const transactionsWidgets: Widget[] = [
    {
      id: 'transactions-full',
      type: 'Transactions',
      title: 'Transaksjoner',
      category: 'stocks',
      size: { width: 1, height: 1 },
      position: { row: 1, column: 1 },
      configuration: {},
    },
  ]

  // Fetch transactions when modal opens
  useEffect(() => {
    if (isOpen && symbol && symbol !== 'N/A') {
      fetchTransactions()
    }
  }, [isOpen, symbol])

  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const result = await getStockDetail(symbol, portfolioId)
      if (result.success && result.data) {
        // Transaction data is handled by mock data for now
        console.log('Transactions fetched:', result.data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Widget renderer function
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'StockChart':
        return (
          <StockChartWidget
            symbol={symbol}
            companyName={companyName}
            data={chartData}
            currentPrice={currentPrice}
            priceChange={dailyChange}
            priceChangePercent={dailyChangePercent}
            currency={stock?.currency || 'NOK'}
          />
        )
      case 'NewsFeed':
        return (
          <NewsFeedWidget
            symbol={symbol}
            companyName={companyName}
            news={mockNews}
            className={activeTab === 'feed' ? 'min-h-[500px]' : ''}
          />
        )
      case 'Holdings':
        return (
          <HoldingsWidget
            symbol={symbol}
            companyName={companyName}
            holdings={mockHoldings}
          />
        )
      case 'Transactions':
        return (
          <TransactionsWidget
            symbol={symbol}
            companyName={companyName}
            transactions={mockTransactions}
            loading={loadingTransactions}
          />
        )
      default:
        return <div>Unknown widget type</div>
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'feed', label: 'Feed' },
    { id: 'transactions', label: 'Transactions' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="font-mono text-4xl font-bold">{symbol}</div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="border-t border-white/20 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-2 text-sm text-white/80">
          <span className="cursor-pointer hover:text-white">Dashboard</span>
          <span className="mx-2">›</span>
          <span className="cursor-pointer hover:text-white">Investeringer</span>
          <span className="mx-2">›</span>
          <span className="cursor-pointer hover:text-white">Aksjer</span>
          <span className="mx-2">›</span>
          <span className="font-semibold text-white">{symbol}</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-3 flex-1 px-6 py-4 text-base font-semibold transition-all',
                activeTab === tab.id
                  ? 'border-purple-600 bg-white text-purple-600'
                  : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content with Widgets */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Chart Widget - spans 2 columns */}
              <div className="lg:col-span-2">
                {renderWidget(overviewWidgets[0])}
              </div>
              {/* News Feed Widget - spans 1 column */}
              <div className="lg:col-span-1">
                {renderWidget(overviewWidgets[1])}
              </div>
              {/* Holdings Widget - spans full width */}
              <div className="lg:col-span-3">
                {renderWidget(overviewWidgets[2])}
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="mx-auto max-w-4xl">
              {renderWidget(feedWidgets[0])}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="mx-auto max-w-6xl">
              {renderWidget(transactionsWidgets[0])}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
