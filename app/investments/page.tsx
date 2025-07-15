'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout, DashboardHeader, DashboardContent } from '@/components/layout/dashboard-layout'
import { LoadingState } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  BarChart3,
  Bitcoin,
  Palette,
  Settings,
  Plus,
  Download,
  Filter,
  DollarSign,
  Heart,
  PieChart,
} from 'lucide-react'
import {
  PageErrorBoundary,
  RenderErrorBoundary,
} from '@/components/ui/error-boundaries'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'

export default function InvestmentsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: any } | null>(null)

  // Use real portfolio data instead of mock data
  const { portfolios, loading: portfoliosLoading, error: portfoliosError } = usePortfoliosState()

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

  // Calculate real investment data from portfolios
  const investments = {
    stocks: { 
      value: portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0),
      change: portfolios.reduce((sum, p) => sum + (p.daily_change_percent || 0), 0) / Math.max(portfolios.length, 1),
      count: portfolios.reduce((sum, p) => sum + (p.holdings_count || 0), 0)
    },
    crypto: { value: 0, change: 0, count: 0 }, // Will be calculated when crypto support is added
    art: { value: 0, change: 0, count: 0 }, // Will be calculated when art support is added
    other: { value: 0, change: 0, count: 0 }, // Will be calculated when other investments are added
  }

  const totalValue = investments.stocks.value
  const totalChange = (totalValue * investments.stocks.change) / 100
  const totalChangePercent = investments.stocks.change

  const categories = [
    {
      id: 'stocks',
      title: 'Aksjer',
      subtitle: `${investments.stocks.count} posisjoner`,
      value: investments.stocks.value,
      change: investments.stocks.change,
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'stocks' as const,
      href: '/investments/stocks',
    },
    {
      id: 'crypto',
      title: 'Crypto',
      subtitle: `${investments.crypto.count} coins`,
      value: investments.crypto.value,
      change: investments.crypto.change,
      icon: <DollarSign className="h-6 w-6" />,
      category: 'crypto' as const,
      href: '/investments/crypto',
    },
    {
      id: 'art',
      title: 'Kunst',
      subtitle: `${investments.art.count} objekter`,
      value: investments.art.value,
      change: investments.art.change,
      icon: <Heart className="h-6 w-6" />,
      category: 'art' as const,
      href: '/investments/art',
    },
    {
      id: 'other',
      title: 'Annet',
      subtitle: `${investments.other.count} investeringer`,
      value: investments.other.value,
      change: investments.other.change,
      icon: <PieChart className="h-6 w-6" />,
      category: 'other' as const,
      href: '/investments/other',
    },
  ]

  if (isLoading || portfoliosLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState
            variant="widget"
            size="lg"
            text="Laster beholdninger..."
            className="text-center"
          />
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary>
      <DashboardLayout>
        <DashboardHeader
          title="Investeringsoversikt"
          subtitle="Oversikt over alle dine investeringsklasser og porteføljer"
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Eksporter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ny posisjon
              </Button>
            </div>
          }
        />

        <DashboardContent>
          {/* Portfolio Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Verdi
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NOK {totalValue.toLocaleString('no-NO')}</div>
                <p className={`text-xs ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(1)}% i dag
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aksjer
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NOK {investments.stocks.value.toLocaleString('no-NO')}</div>
                <p className="text-xs text-muted-foreground">
                  {investments.stocks.count} posisjoner
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Crypto
                </CardTitle>
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NOK {investments.crypto.value.toLocaleString('no-NO')}</div>
                <p className="text-xs text-muted-foreground">
                  {investments.crypto.count} coins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alternativer
                </CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NOK {(investments.art.value + investments.other.value).toLocaleString('no-NO')}</div>
                <p className="text-xs text-muted-foreground">
                  {investments.art.count + investments.other.count} objekter
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Class Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card 
              className="cursor-pointer transition-colors hover:bg-gray-50" 
              onClick={() => router.push('/investments/stocks')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stocks-100">
                      <BarChart3 className="h-5 w-5 text-stocks-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Aksjer</CardTitle>
                      <CardDescription>{investments.stocks.count} posisjoner</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">NOK {investments.stocks.value.toLocaleString('no-NO')}</div>
                <p className={`text-sm ${investments.stocks.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investments.stocks.change >= 0 ? '+' : ''}{investments.stocks.change.toFixed(1)}% i dag
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-colors hover:bg-gray-50" 
              onClick={() => router.push('/investments/crypto')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crypto-100">
                      <Bitcoin className="h-5 w-5 text-crypto-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Crypto</CardTitle>
                      <CardDescription>{investments.crypto.count} coins</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">NOK {investments.crypto.value.toLocaleString('no-NO')}</div>
                <p className={`text-sm ${investments.crypto.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investments.crypto.change >= 0 ? '+' : ''}{investments.crypto.change.toFixed(1)}% i dag
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-colors hover:bg-gray-50" 
              onClick={() => router.push('/investments/art')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-alternatives-100">
                      <Palette className="h-5 w-5 text-alternatives-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Kunst & Samleobjekter</CardTitle>
                      <CardDescription>{investments.art.count} objekter</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">NOK {investments.art.value.toLocaleString('no-NO')}</div>
                <p className={`text-sm ${investments.art.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investments.art.change >= 0 ? '+' : ''}{investments.art.change.toFixed(1)}% i dag
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-colors hover:bg-gray-50" 
              onClick={() => router.push('/investments/other')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cash-100">
                      <Settings className="h-5 w-5 text-cash-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Andre Investeringer</CardTitle>
                      <CardDescription>{investments.other.count} investeringer</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">NOK {investments.other.value.toLocaleString('no-NO')}</div>
                <p className={`text-sm ${investments.other.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investments.other.change >= 0 ? '+' : ''}{investments.other.change.toFixed(1)}% i dag
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Portfolio Details */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Portfolio Utvikling</CardTitle>
                <CardDescription>
                  Total porteføljeverd de siste 6 månedene
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Portfolio chart kommer her
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Asset Allokering</CardTitle>
                <CardDescription>
                  Fordeling av porteføljeverdier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-stocks-500"></div>
                      <span className="text-sm">Aksjer</span>
                    </div>
                    <span className="text-sm font-medium">
                      {totalValue > 0 ? ((investments.stocks.value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-crypto-500"></div>
                      <span className="text-sm">Crypto</span>
                    </div>
                    <span className="text-sm font-medium">
                      {totalValue > 0 ? ((investments.crypto.value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-alternatives-500"></div>
                      <span className="text-sm">Kunst</span>
                    </div>
                    <span className="text-sm font-medium">
                      {totalValue > 0 ? ((investments.art.value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-cash-500"></div>
                      <span className="text-sm">Andre</span>
                    </div>
                    <span className="text-sm font-medium">
                      {totalValue > 0 ? ((investments.other.value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PageErrorBoundary>
  )
}
