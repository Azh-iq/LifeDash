'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout, DashboardHeader, DashboardContent } from '@/components/layout/dashboard-layout'
import { LoadingState } from '@/components/ui/loading-states'
import { TrendingUp, BarChart3, Users, Target, Search, Bell, User, Lightbulb, Wrench } from 'lucide-react'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'
import { useMultiBrokerPortfolioState } from '@/lib/hooks/use-multi-broker-portfolio-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button-system'
import { Input } from '@/components/ui/input'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

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
  const totalPortfolioChange = portfolios.reduce((sum, p) => sum + (p.daily_change_percent || 0), 0) / Math.max(portfolios.length, 1)
  const totalHoldings = portfolios.reduce((sum, p) => sum + (p.holdings_count || 0), 0)
  
  // Format currency with Norwegian locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Get aggregation status badge
  const getAggregationStatusBadge = () => {
    if (!aggregationStatus) return null
    
    switch (aggregationStatus.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Synkronisert</Badge>
      case 'running':
        return <Badge variant="secondary" className="text-xs"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Synkroniserer</Badge>
      case 'failed':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Feil</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-xs">Venter</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Aldri kjørt</Badge>
    }
  }

  return (
    <DashboardLayout>
      <NorwegianBreadcrumb />
      
      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-[300px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Søk i dashboard..."
                className="border-none bg-transparent p-0 text-sm focus:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <User className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      <DashboardContent>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-2xl p-8 text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            WELCOME TO THE DASHBOARD
          </h2>
        </div>

        {/* 2x2 Dashboard Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Investeringer Card - Multi-Broker Integration */}
          <Card className="bg-gradient-to-br from-[#f3f4ff] to-[#f0f0ff] border-[#6366f1]/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6366f1]/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[#6366f1]" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold text-xl text-gray-900 hover:text-[#6366f1] hover:bg-transparent"
                      onClick={() => router.push('/investments/aggregation')}
                    >
                      Investeringer
                    </Button>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getAggregationStatusBadge()}
                  {needsAggregation() && !isAggregating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerAggregation('NOK')}
                      className="h-8 px-2"
                      title="Synkroniser portfolio data"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 mb-5">
                {/* Show multi-broker data if available, otherwise fallback to single broker */}
                {hasMultiBrokerData && multiBrokerSummary ? (
                  <>
                    {/* Asset Class Breakdown */}
                    {getAssetClassBreakdown().length > 0 ? (
                      getAssetClassBreakdown().map((asset, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                          <span className="font-medium text-gray-700">{asset.displayName}</span>
                          <div className="text-right">
                            <span className="font-semibold text-[#6366f1] font-mono">
                              {formatCurrency(asset.value)}
                            </span>
                            <div className="text-xs text-gray-500">
                              {asset.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="font-medium text-gray-700">Total Portfolio</span>
                        <span className="font-semibold text-[#6366f1] font-mono">
                          {formatCurrency(multiBrokerSummary.totalValue)}
                        </span>
                      </div>
                    )}
                    
                    {/* Broker Breakdown Section */}
                    {getBrokerBreakdown().length > 1 && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-medium text-gray-600 mb-2">BROKER FORDELING</div>
                        {getBrokerBreakdown().map((broker, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md border mb-1">
                            <span className="text-sm text-gray-600">{broker.displayName}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-800">
                                {formatCurrency(broker.value)}
                              </span>
                              <div className="text-xs text-gray-500">
                                {broker.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Fallback to single broker data */}
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Aksjer</span>
                      <span className="font-semibold text-[#6366f1] font-mono">
                        {formatCurrency(totalPortfolioValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Crypto</span>
                      <span className="font-semibold text-[#6366f1] font-mono">-</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Kunst</span>
                      <span className="font-semibold text-[#6366f1] font-mono">-</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Gull</span>
                      <span className="font-semibold text-[#6366f1] font-mono">-</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Status and Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                {hasMultiBrokerData && aggregationStatus ? (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-3">
                      {aggregationStatus.consolidatedHoldings} unike beholdninger fra {aggregationStatus.totalHoldings} totalt
                    </div>
                    {aggregationStatus.duplicatesDetected > 0 && (
                      <div className="text-xs text-yellow-600 mb-2">
                        {aggregationStatus.duplicatesDetected} duplikater oppdaget
                      </div>
                    )}
                    {multiBrokerError && (
                      <div className="text-xs text-red-600 mb-2">
                        Feil: {multiBrokerError}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/investments/aggregation')}
                      className="h-7 text-xs px-3"
                    >
                      Se detaljer
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm min-h-[60px] flex flex-col items-center justify-center">
                    <div className="mb-2">📊 Multi-broker portfolio</div>
                    <div className="text-xs mb-3">Koble til flere meglere for automatisk aggregering</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/investments/connections')}
                      className="h-7 text-xs px-3"
                    >
                      Koble til meglere
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Økonomi Card */}
          <Card className="bg-gray-50 border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Økonomi
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex-1 flex items-center justify-center text-center min-h-[240px]">
                <div className="text-lg font-semibold text-gray-500 uppercase tracking-wide">
                  KOMMER SENERE!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Konseptutvikling Card */}
          <Card className="bg-gray-50 border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-gray-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Konseptutvikling
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex-1 flex items-center justify-center text-center min-h-[240px]">
                <div className="text-lg font-semibold text-gray-500 uppercase tracking-wide">
                  KOMMER SENERE!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verktøy Card */}
          <Card className="bg-gray-50 border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-gray-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Verktøy
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex-1 flex items-center justify-center text-center min-h-[240px]">
                <div className="text-lg font-semibold text-gray-500 uppercase tracking-wide">
                  KOMMER SENERE!
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}
