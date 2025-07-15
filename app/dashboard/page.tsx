'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingState } from '@/components/ui/loading-states'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'
import { useMultiBrokerPortfolioState } from '@/lib/hooks/use-multi-broker-portfolio-state'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  PlusCircle,
  BarChart3,
  Search,
  Download
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: any } | null>(null)

  // Use real portfolio data
  const { portfolios, loading: portfoliosLoading, error: portfoliosError } = usePortfoliosState()
  
  // Use multi-broker portfolio data
  const {
    summary: multiBrokerSummary,
    aggregationStatus,
    isLoading: multiBrokerLoading,
    error: multiBrokerError,
    isAggregating,
    triggerAggregation,
    getAssetClassBreakdown,
    getBrokerBreakdown,
    needsAggregation,
    hasData: hasMultiBrokerData,
    isReady: multiBrokerReady
  } = useMultiBrokerPortfolioState()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUser(session.user)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Show loading while checking auth or loading portfolios
  if (isLoading || portfoliosLoading || multiBrokerLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState
            variant="widget"
            size="lg"
            text="Laster Portfolio Manager..."
            className="text-center"
          />
        </div>
      </div>
    )
  }

  // Calculate real portfolio values - prefer multi-broker data if available
  const totalPortfolioValue = hasMultiBrokerData 
    ? multiBrokerSummary?.totalValue || 0 
    : portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0)
  
  const totalPortfolioChange = hasMultiBrokerData
    ? multiBrokerSummary?.totalGainLoss || 0
    : 0
  
  const totalPortfolioChangePercent = hasMultiBrokerData
    ? multiBrokerSummary?.totalGainLossPercent || 0
    : portfolios.reduce((sum, p) => sum + (p.daily_change_percent || 0), 0) / Math.max(portfolios.length, 1)
  
  // Format currency with Norwegian locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get asset allocation data
  const assetBreakdown = getAssetClassBreakdown()

  // Get some sample holdings data for the table
  const sampleHoldings = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Aksje', value: 456780, change: 2.3, allocation: 16.0 },
    { symbol: 'BTC', name: 'Bitcoin', type: 'Krypto', value: 287400, change: 5.7, allocation: 10.1 },
    { symbol: 'NHY.OL', name: 'Norsk Hydro', type: 'Aksje', value: 234560, change: -1.2, allocation: 8.2 },
    { symbol: 'EM-001', name: 'Edvard Munch Print', type: 'Kunst', value: 185000, change: 12.1, allocation: 6.5 },
    { symbol: 'ETH', name: 'Ethereum', type: 'Krypto', value: 145670, change: 3.4, allocation: 5.1 }
  ]

  // Recent activity data
  const recentActivity = [
    { type: 'buy', symbol: 'AAPL', action: 'Kjøpt Apple Inc.', details: '15 aksjer @ $187.45', amount: -28750, time: 'I dag, 14:32' },
    { type: 'dividend', symbol: 'NHY.OL', action: 'Utbytte mottatt', details: 'Norsk Hydro ASA', amount: 2340, time: 'I går, 09:15' },
    { type: 'sell', symbol: 'BTC', action: 'Solgt Bitcoin', details: '0.05 BTC @ $43,200', amount: 21850, time: '3 dager siden' }
  ]

  return (
    <DashboardLayout>
      <NorwegianBreadcrumb />
      
      {/* Main Header with Portfolio Value - Wireframe Style */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Din portefølje</h1>
            <p className="text-gray-600">
              Oppdatert for {aggregationStatus?.lastUpdated ? '2 minutter siden' : 'aldri'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalPortfolioValue)}
            </div>
            <div className={`text-lg font-semibold flex items-center justify-end gap-1 ${
              totalPortfolioChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalPortfolioChange >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {totalPortfolioChange >= 0 ? '+' : ''}{formatCurrency(totalPortfolioChange)} ({totalPortfolioChangePercent >= 0 ? '+' : ''}{totalPortfolioChangePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* 2x1 Grid: Portfolio Chart + Asset Allocation - Wireframe Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Development Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Porteføljeutvikling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <div className="font-medium">Interaktivt chart: Porteføljeverdi over tid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Aktivafordeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assetBreakdown.length > 0 ? (
                  assetBreakdown.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold">
                          {asset.displayName === 'Aksjer' ? '📈' : 
                           asset.displayName === 'Crypto' ? '₿' : 
                           asset.displayName === 'Alternative' ? '🎨' : '💰'}
                        </div>
                        <div>
                          <div className="font-medium">{asset.displayName}</div>
                          <div className="text-sm text-gray-600">{asset.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(asset.value)}
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback data when no multi-broker data available
                  <>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">📈</div>
                        <div>
                          <div className="font-medium">Aksjer</div>
                          <div className="text-sm text-gray-600">67.2%</div>
                        </div>
                      </div>
                      <div className="font-semibold">{formatCurrency(totalPortfolioValue * 0.672)}</div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center text-yellow-600">₿</div>
                        <div>
                          <div className="font-medium">Krypto</div>
                          <div className="text-sm text-gray-600">18.7%</div>
                        </div>
                      </div>
                      <div className="font-semibold">{formatCurrency(totalPortfolioValue * 0.187)}</div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-100 rounded flex items-center justify-center text-pink-600">🎨</div>
                        <div>
                          <div className="font-medium">Alternativ</div>
                          <div className="text-sm text-gray-600">11.5%</div>
                        </div>
                      </div>
                      <div className="font-semibold">{formatCurrency(totalPortfolioValue * 0.115)}</div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-green-600">💰</div>
                        <div>
                          <div className="font-medium">Kontanter</div>
                          <div className="text-sm text-gray-600">2.6%</div>
                        </div>
                      </div>
                      <div className="font-semibold">{formatCurrency(totalPortfolioValue * 0.026)}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table + Quick Actions - Wireframe Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Største beholdninger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Aktiva</th>
                        <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Verdi</th>
                        <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Endring</th>
                        <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Andel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleHoldings.map((holding, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3">
                            <div>
                              <div className="font-semibold">{holding.name}</div>
                              <div className="text-sm text-gray-600">
                                {holding.symbol} • {holding.type}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-semibold">
                            {formatCurrency(holding.value)}
                          </td>
                          <td className="py-3">
                            <span className={`font-semibold ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.change >= 0 ? '+' : ''}{holding.change}%
                            </span>
                          </td>
                          <td className="py-3">
                            {holding.allocation}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Hurtighandlinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => router.push('/stocks/add-transaction')}
                  >
                    <PlusCircle className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">Legg til transaksjon</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => triggerAggregation('NOK')}
                    disabled={isAggregating}
                  >
                    <RefreshCw className={`w-4 h-4 mr-3 ${isAggregating ? 'animate-spin' : ''}`} />
                    <div>
                      <div className="font-medium">Synkroniser kontoer</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => router.push('/reports')}
                  >
                    <Download className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">Generer rapport</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => router.push('/stocks')}
                  >
                    <Search className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">Søk aktiva</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity - Wireframe Style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Siste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      activity.type === 'buy' ? 'bg-green-600' : 
                      activity.type === 'sell' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {activity.type === 'buy' ? 'K' : activity.type === 'sell' ? 'S' : 'D'}
                    </div>
                    <div>
                      <div className="font-semibold">{activity.action}</div>
                      <div className="text-sm text-gray-600">{activity.details}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.amount >= 0 ? '+' : ''}{formatCurrency(activity.amount)}
                    </div>
                    <div className="text-sm text-gray-600">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}