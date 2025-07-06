'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard, NumberCounter } from '@/components/animated'
import { entranceVariants } from '@/components/animated'

interface HoldingWithStock {
  id: string
  symbol: string
  companyName: string
  platform: string
  account: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  totalCost: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  currency: string
  lastUpdate: string
}

interface PortfolioStats {
  totalValue: number
  todayChange: number
  todayChangePercent: number
  totalPositions: number
  platforms: string[]
}

interface MobilePortfolioViewProps {
  holdings: HoldingWithStock[]
  portfolioStats: PortfolioStats
  selectedAccount?: any
  onRefresh?: () => void
  isLoading?: boolean
  pricesLoading?: boolean
  className?: string
}

export function MobilePortfolioView({
  holdings,
  portfolioStats,
  selectedAccount,
  onRefresh,
  isLoading = false,
  pricesLoading = false,
  className = ""
}: MobilePortfolioViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'stats'>('overview')
  const [expandedHolding, setExpandedHolding] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'symbol'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sort holdings based on selected criteria
  const sortedHoldings = [...holdings].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    switch (sortBy) {
      case 'value':
        aValue = a.marketValue
        bValue = b.marketValue
        break
      case 'pnl':
        aValue = a.unrealizedPnlPercent
        bValue = b.unrealizedPnlPercent
        break
      case 'symbol':
        aValue = a.symbol
        bValue = b.symbol
        break
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Group holdings by platform for better organization
  const platformGroups = sortedHoldings.reduce((acc, holding) => {
    if (!acc[holding.platform]) {
      acc[holding.platform] = []
    }
    acc[holding.platform].push(holding)
    return acc
  }, {} as Record<string, HoldingWithStock[]>)

  const handleSort = (criteria: 'value' | 'pnl' | 'symbol') => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(criteria)
      setSortOrder('desc')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'NOK') => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('no-NO').format(num)
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-50 border-green-200'
    if (change < 0) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {selectedAccount ? selectedAccount.name : 'Portefølje'}
              </h1>
              <p className="text-sm text-white/80">
                {selectedAccount 
                  ? `${selectedAccount.platform.display_name}`
                  : `${portfolioStats.totalPositions} posisjoner`
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {pricesLoading && (
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-white/60 animate-pulse"></div>
                  <span className="text-xs text-white/80">Oppdaterer</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="text-white hover:bg-white/10"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-white/20">
          {[
            { id: 'overview', label: 'Oversikt', icon: '📊' },
            { id: 'holdings', label: 'Beholdning', icon: '📈' },
            { id: 'stats', label: 'Statistikk', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white bg-white/20 border-b-2 border-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Portfolio Value Card */}
              <AnimatedCard className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedAccount ? 'Kontoverdi' : 'Total Porteføljeverdi'}
                    </p>
                    <div className="mb-4">
                      <NumberCounter
                        value={portfolioStats.totalValue}
                        className="text-3xl font-bold text-gray-900"
                        formatter={(value) => formatCurrency(value)}
                      />
                    </div>
                    <div className={`inline-flex items-center space-x-2 rounded-full px-4 py-2 ${getChangeBgColor(portfolioStats.todayChange)}`}>
                      <svg
                        className={`h-4 w-4 ${getChangeColor(portfolioStats.todayChange)}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {portfolioStats.todayChange >= 0 ? (
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span className={`font-semibold ${getChangeColor(portfolioStats.todayChange)}`}>
                        {portfolioStats.todayChange >= 0 ? '+' : ''}
                        {portfolioStats.todayChangePercent.toFixed(2)}%
                      </span>
                      <span className={`text-sm ${getChangeColor(portfolioStats.todayChange)}`}>
                        ({portfolioStats.todayChange >= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(portfolioStats.todayChange))})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <AnimatedCard className="bg-white border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Posisjoner</p>
                    <p className="text-xl font-bold text-gray-900">{portfolioStats.totalPositions}</p>
                  </CardContent>
                </AnimatedCard>

                <AnimatedCard className="bg-white border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Plattformer</p>
                    <p className="text-xl font-bold text-gray-900">{portfolioStats.platforms.length}</p>
                  </CardContent>
                </AnimatedCard>
              </div>

              {/* Top Holdings Preview */}
              <AnimatedCard className="bg-white border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Største Beholdninger</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('holdings')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Se alle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sortedHoldings.slice(0, 3).map((holding) => (
                      <div key={holding.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">
                              {holding.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{holding.symbol}</p>
                            <p className="text-xs text-gray-600">{formatNumber(holding.quantity)} stk</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 text-sm">
                            {formatCurrency(holding.marketValue)}
                          </p>
                          <p className={`text-xs ${getChangeColor(holding.unrealizedPnlPercent)}`}>
                            {holding.unrealizedPnlPercent >= 0 ? '+' : ''}
                            {holding.unrealizedPnlPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          )}

          {activeTab === 'holdings' && (
            <motion.div
              key="holdings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Sort Controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Beholdninger</h3>
                <div className="flex items-center space-x-2">
                  {['value', 'pnl', 'symbol'].map((criteria) => (
                    <Button
                      key={criteria}
                      variant={sortBy === criteria ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort(criteria as any)}
                      className="text-xs"
                    >
                      {criteria === 'value' ? 'Verdi' : criteria === 'pnl' ? 'P&L' : 'Symbol'}
                      {sortBy === criteria && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Holdings List */}
              <div className="space-y-3">
                {Object.entries(platformGroups).map(([platform, platformHoldings]) => (
                  <div key={platform}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                        <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{platform}</span>
                      <Badge variant="secondary" className="text-xs">
                        {platformHoldings.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {platformHoldings.map((holding) => (
                        <AnimatedCard
                          key={holding.id}
                          className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => setExpandedHolding(expandedHolding === holding.id ? null : holding.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-bold text-blue-600">
                                    {holding.symbol.substring(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{holding.symbol}</p>
                                  <p className="text-xs text-gray-600">{holding.companyName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatNumber(holding.quantity)} stk @ {holding.currentPrice.toFixed(2)} {holding.currency}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency(holding.marketValue)}</p>
                                <div className={`inline-flex items-center space-x-1 text-xs ${getChangeColor(holding.unrealizedPnlPercent)}`}>
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    {holding.unrealizedPnlPercent >= 0 ? (
                                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    ) : (
                                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    )}
                                  </svg>
                                  <span className="font-medium">
                                    {holding.unrealizedPnlPercent >= 0 ? '+' : ''}
                                    {holding.unrealizedPnlPercent.toFixed(1)}%
                                  </span>
                                </div>
                                <p className={`text-xs ${getChangeColor(holding.unrealizedPnl)}`}>
                                  {holding.unrealizedPnl >= 0 ? '+' : ''}
                                  {formatCurrency(Math.abs(holding.unrealizedPnl))}
                                </p>
                              </div>
                            </div>
                            
                            {/* Expanded Details */}
                            <AnimatePresence>
                              {expandedHolding === holding.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-4 pt-4 border-t border-gray-100"
                                >
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">Gjennomsnittspris</p>
                                      <p className="font-medium">{holding.avgCost.toFixed(2)} {holding.currency}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Totalkostnad</p>
                                      <p className="font-medium">{formatCurrency(holding.totalCost)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Konto</p>
                                      <p className="font-medium">{holding.account}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Sist oppdatert</p>
                                      <p className="font-medium text-xs">
                                        {new Date(holding.lastUpdate).toLocaleString('no-NO')}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Porteføljestatistikk</h3>
              
              {/* Performance Stats */}
              <div className="grid grid-cols-1 gap-4">
                <AnimatedCard className="bg-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Investeringssum</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(holdings.reduce((sum, h) => sum + h.totalCost, 0))}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </AnimatedCard>

                <AnimatedCard className="bg-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Urealisert P&L</p>
                        <p className={`text-xl font-bold ${getChangeColor(portfolioStats.todayChange)}`}>
                          {portfolioStats.todayChange >= 0 ? '+' : ''}
                          {formatCurrency(Math.abs(portfolioStats.todayChange))}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        portfolioStats.todayChange >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <svg className={`h-6 w-6 ${getChangeColor(portfolioStats.todayChange)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>

              {/* Platform Distribution */}
              <AnimatedCard className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <h4 className="font-semibold text-gray-900">Plattformfordeling</h4>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries(platformGroups).map(([platform, platformHoldings]) => {
                      const platformValue = platformHoldings.reduce((sum, h) => sum + h.marketValue, 0)
                      const percentage = (platformValue / portfolioStats.totalValue) * 100
                      
                      return (
                        <div key={platform} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 rounded bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-700">{platform}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(platformValue)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MobilePortfolioView