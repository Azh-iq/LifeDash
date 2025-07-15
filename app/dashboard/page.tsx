'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout, DashboardHeader, DashboardContent } from '@/components/layout/dashboard-layout'
import { LoadingState } from '@/components/ui/loading-states'
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: any } | null>(null)

  // Use real portfolio data
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

  // Show loading while checking auth or loading portfolios
  if (isLoading || portfoliosLoading) {
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

  // Calculate real portfolio values
  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0)
  const totalPortfolioChange = portfolios.reduce((sum, p) => sum + (p.daily_change_percent || 0), 0) / Math.max(portfolios.length, 1)
  const totalHoldings = portfolios.reduce((sum, p) => sum + (p.holdings_count || 0), 0)

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Dashboard"
        subtitle={`Velkommen tilbake, ${user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'}`}
      />
      
      <DashboardContent>
        {/* Portfolio Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Verdi
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">NOK {totalPortfolioValue.toLocaleString('no-NO')}</div>
              <p className={`text-xs ${totalPortfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPortfolioChange >= 0 ? '+' : ''}{totalPortfolioChange.toFixed(1)}% denne måneden
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Posisjoner
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHoldings}</div>
              <p className="text-xs text-muted-foreground">
                {portfolios.length} porteføljer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Porteføljer
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolios.length}</div>
              <p className="text-xs text-muted-foreground">
                Sist oppdatert i dag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ytelse
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground">
                År til dato
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Portfolio Oversikt</CardTitle>
              <CardDescription>
                Din investeringsportefølje de siste 6 månedene
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
              <CardTitle>Siste Aktivitet</CardTitle>
              <CardDescription>
                Nylige transaksjoner og endringer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolios.slice(0, 5).map((portfolio, index) => (
                  <div key={portfolio.id} className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                      {portfolio.name?.charAt(0) || 'P'}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {portfolio.name || `Portfolio ${index + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        NOK {(portfolio.total_value || 0).toLocaleString('no-NO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}
