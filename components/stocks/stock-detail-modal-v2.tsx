'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

// Types
interface StockDetailModalV2Props {
  isOpen: boolean
  onClose: () => void
  stockData: HoldingWithMetrics
}

interface TabType {
  id: string
  label: string
  content: React.ReactNode
}

// Time range buttons data
const timeRanges = [
  { id: '4h', label: '4h' },
  { id: 'D', label: 'D' },
  { id: 'W', label: 'W' },
  { id: 'M', label: 'M' },
]

// Feed data
const feedItems = [
  {
    id: 1,
    type: 'news',
    color: 'green',
    text: 'Q3 earnings report released',
    time: '2 minutes ago',
  },
  {
    id: 2,
    type: 'alert',
    color: 'yellow',
    text: 'Stock buy alert triggered',
    time: '15 minutes ago',
  },
  {
    id: 3,
    type: 'alert',
    color: 'blue',
    text: 'Price target updated',
    time: '1 hour ago',
  },
  {
    id: 4,
    type: 'news',
    color: 'green',
    text: 'Market analysis update',
    time: '2 hours ago',
  },
]

// Holdings table data for this specific stock across brokers
const getHoldingsForStock = (stockSymbol: string) => [
  {
    broker: 'Nordnet',
    stock: stockSymbol,
    quantity: 100,
    cost: 45670,
    costCurrency: 'NOK',
    change: 2.4,
    pnlPercent: 12.3,
    pnlAmount: 5612,
    pnlCurrency: 'NOK',
  },
  {
    broker: 'DNB',
    stock: stockSymbol,
    quantity: 50,
    cost: 22500,
    costCurrency: 'NOK',
    change: 2.4,
    pnlPercent: -3.2,
    pnlAmount: -720,
    pnlCurrency: 'NOK',
  },
]

// Generate chart data based on actual stock price
const generateChartData = (symbol: string, currentPrice: number) => {
  const data = []
  const now = new Date()

  // Use current price as baseline instead of hardcoded values
  const basePrice = currentPrice > 0 ? currentPrice : 150

  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    // Generate smaller, more realistic variations around current price
    const variation = (Math.random() - 0.5) * (basePrice * 0.05) // 5% max variation
    const price = Math.max(basePrice + variation, 0.01) // Ensure positive price
    data.push({
      timestamp: timestamp.toISOString(),
      price: price,
      change: variation,
      changePercent: (variation / basePrice) * 100,
    })
  }

  return data
}

export default function StockDetailModalV2({
  isOpen,
  onClose,
  stockData,
}: StockDetailModalV2Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeTimeRange, setActiveTimeRange] = useState('D')

  const stock = stockData.stocks
  const symbol = stock?.symbol || 'N/A'
  const currentPrice = stockData.current_price || 0
  const dailyChange = stockData.daily_change || 0
  const dailyChangePercent = stockData.daily_change_percent || 0
  const isPositive = dailyChange >= 0

  // Get holdings data for this stock
  const holdings = getHoldingsForStock(symbol)

  // Get chart data based on actual current price
  const chartData = generateChartData(symbol, currentPrice)
  const latestPrice = chartData[chartData.length - 1]?.price || currentPrice

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

  const OverviewTab = () => (
    <div className="p-6">
      {/* Main Grid Layout */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Chart Container */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Price</h3>
            <div className="flex gap-2">
              {timeRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setActiveTimeRange(range.id)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-semibold transition-all',
                    activeTimeRange === range.id
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-purple-600 hover:text-purple-600'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative flex h-[300px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <div className="mb-2 font-mono text-5xl font-bold">
              {formatCurrency(latestPrice, stock?.currency || 'NOK')}
            </div>
            <div className="text-lg opacity-80">
              Interactive Chart kommer snart
            </div>

            {/* Price change indicator */}
            <div
              className={cn(
                'absolute right-4 top-4 flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold',
                isPositive
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-red-500/20 text-red-100'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? '+' : ''}
              {formatPercentage(dailyChangePercent)}
            </div>
          </div>
        </div>

        {/* Feed Panel */}
        <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">
            Feed (Patreon)
          </h3>

          <div className="space-y-5">
            {feedItems.map(item => (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-2 h-2 w-2 flex-shrink-0 rounded-full',
                    item.color === 'green' && 'bg-green-500',
                    item.color === 'yellow' && 'bg-yellow-500',
                    item.color === 'blue' && 'bg-blue-500'
                  )}
                />
                <div className="flex-1">
                  <div className="mb-1 text-sm text-gray-900">{item.text}</div>
                  <div className="text-xs text-gray-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-900">Holdings</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Broker
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Qty
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cost
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Change
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  P&L %
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-4 font-semibold text-gray-900">
                    {holding.broker}
                  </td>
                  <td className="px-3 py-4 text-gray-700">{holding.stock}</td>
                  <td className="px-3 py-4 font-mono font-semibold">
                    {holding.quantity.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 font-mono font-semibold">
                    {formatCurrency(holding.cost, holding.costCurrency)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-4 font-mono font-semibold',
                      holding.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {holding.change >= 0 ? '+' : ''}
                    {holding.change}%
                  </td>
                  <td
                    className={cn(
                      'px-3 py-4 font-mono font-semibold',
                      holding.pnlPercent >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {holding.pnlPercent >= 0 ? '+' : ''}
                    {holding.pnlPercent}%
                  </td>
                  <td
                    className={cn(
                      'px-3 py-4 font-mono font-semibold',
                      holding.pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {holding.pnlAmount >= 0 ? '+' : ''}
                    {formatCurrency(holding.pnlAmount, holding.pnlCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const FeedTab = () => (
    <div className="p-6">
      <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-900">
          Feed (Patreon)
        </h3>

        <div className="space-y-5">
          {feedItems.concat(feedItems).map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0"
            >
              <div
                className={cn(
                  'mt-2 h-2 w-2 flex-shrink-0 rounded-full',
                  item.color === 'green' && 'bg-green-500',
                  item.color === 'yellow' && 'bg-yellow-500',
                  item.color === 'blue' && 'bg-blue-500'
                )}
              />
              <div className="flex-1">
                <div className="mb-1 text-sm text-gray-900">{item.text}</div>
                <div className="text-xs text-gray-500">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const TransactionsTab = () => (
    <div className="p-6">
      <div className="py-20 text-center text-gray-500">
        <h3 className="mb-2 text-xl font-semibold">
          Transaksjoner kommer snart
        </h3>
        <p>Detaljert transaksjonshistorikk for denne aksjen.</p>
      </div>
    </div>
  )

  const tabs: TabType[] = [
    { id: 'overview', label: 'Overview', content: <OverviewTab /> },
    { id: 'feed', label: 'Feed', content: <FeedTab /> },
    { id: 'transactions', label: 'Transactions', content: <TransactionsTab /> },
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  )
}
