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
    time: '2 minutes ago'
  },
  {
    id: 2,
    type: 'alert',
    color: 'yellow', 
    text: 'Stock buy alert triggered',
    time: '15 minutes ago'
  },
  {
    id: 3,
    type: 'alert',
    color: 'blue',
    text: 'Price target updated',
    time: '1 hour ago'
  },
  {
    id: 4,
    type: 'news',
    color: 'green',
    text: 'Market analysis update',
    time: '2 hours ago'
  }
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
    pnlCurrency: 'NOK'
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
    pnlCurrency: 'NOK'
  }
]

// Generate sample price data for chart
const generateChartData = (symbol: string) => {
  const basePrice = symbol === 'EQUINOR' ? 280 : symbol === 'DNB' ? 185 : 150
  const data = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const variation = (Math.random() - 0.5) * 20
    const price = basePrice + variation
    data.push({
      timestamp: timestamp.toISOString(),
      price: price,
      change: variation,
      changePercent: (variation / basePrice) * 100
    })
  }
  
  return data
}

export default function StockDetailModalV2({ isOpen, onClose, stockData }: StockDetailModalV2Props) {
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
  
  // Get chart data
  const chartData = generateChartData(symbol)
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-6">
        {/* Chart Container */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Price</h3>
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setActiveTimeRange(range.id)}
                  className={cn(
                    'px-4 py-2 border rounded-lg text-sm font-semibold transition-all',
                    activeTimeRange === range.id
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-600 hover:text-purple-600'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="h-[300px] bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex flex-col justify-center items-center text-white relative">
            <div className="text-5xl font-bold font-mono mb-2">
              {formatCurrency(latestPrice, stock?.currency || 'NOK')}
            </div>
            <div className="text-lg opacity-80">Interactive Chart kommer snart</div>
            
            {/* Price change indicator */}
            <div className={cn(
              'absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold',
              isPositive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{formatPercentage(dailyChangePercent)}
            </div>
          </div>
        </div>

        {/* Feed Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 max-h-[400px] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Feed (Patreon)</h3>
          
          <div className="space-y-5">
            {feedItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  item.color === 'green' && 'bg-green-500',
                  item.color === 'yellow' && 'bg-yellow-500',
                  item.color === 'blue' && 'bg-blue-500'
                )} />
                <div className="flex-1">
                  <div className="text-sm text-gray-900 mb-1">{item.text}</div>
                  <div className="text-xs text-gray-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Holdings</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Broker</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Change</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">P&L %</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">P&L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-3 font-semibold text-gray-900">{holding.broker}</td>
                  <td className="py-4 px-3 text-gray-700">{holding.stock}</td>
                  <td className="py-4 px-3 font-mono font-semibold">{holding.quantity.toLocaleString()}</td>
                  <td className="py-4 px-3 font-mono font-semibold">
                    {formatCurrency(holding.cost, holding.costCurrency)}
                  </td>
                  <td className={cn(
                    'py-4 px-3 font-mono font-semibold',
                    holding.change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {holding.change >= 0 ? '+' : ''}{holding.change}%
                  </td>
                  <td className={cn(
                    'py-4 px-3 font-mono font-semibold',
                    holding.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent}%
                  </td>
                  <td className={cn(
                    'py-4 px-3 font-mono font-semibold',
                    holding.pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {holding.pnlAmount >= 0 ? '+' : ''}{formatCurrency(holding.pnlAmount, holding.pnlCurrency)}
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Feed (Patreon)</h3>
        
        <div className="space-y-5">
          {feedItems.concat(feedItems).map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0">
              <div className={cn(
                'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                item.color === 'green' && 'bg-green-500',
                item.color === 'yellow' && 'bg-yellow-500',
                item.color === 'blue' && 'bg-blue-500'
              )} />
              <div className="flex-1">
                <div className="text-sm text-gray-900 mb-1">{item.text}</div>
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
      <div className="text-center py-20 text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Transaksjoner kommer snart</h3>
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">
      <div className="w-full max-w-7xl max-h-[90vh] bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div className="text-4xl font-bold font-mono">{symbol}</div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white/80 px-6 py-2 text-sm border-t border-white/20">
          <span className="hover:text-white cursor-pointer">Dashboard</span>
          <span className="mx-2">›</span>
          <span className="hover:text-white cursor-pointer">Investeringer</span>
          <span className="mx-2">›</span>
          <span className="hover:text-white cursor-pointer">Aksjer</span>
          <span className="mx-2">›</span>
          <span className="text-white font-semibold">{symbol}</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-4 px-6 text-base font-semibold transition-all border-b-3',
                activeTab === tab.id
                  ? 'text-purple-600 bg-white border-purple-600'
                  : 'text-gray-500 bg-gray-50 border-transparent hover:text-gray-700 hover:bg-gray-100'
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