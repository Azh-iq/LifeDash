'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Widget, WidgetContainer } from '@/components/ui/widget'
import { LoadingState } from '@/components/ui/loading-states'
import { TrendingUp, Heart, DollarSign, Wrench, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState
            variant="widget"
            size="lg"
            text="Laster LifeDash..."
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

  const dashboardCards = [
    {
      id: 'investments',
      title: 'Investeringer',
      description: 'Portfolio oversikt og aksjeanalyser',
      value: `NOK ${totalPortfolioValue.toLocaleString('no-NO')}`,
      change: `${totalPortfolioChange >= 0 ? '+' : ''}${totalPortfolioChange.toFixed(1)}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'stocks' as const,
      href: '/investments',
    },
    {
      id: 'hobby',
      title: 'Hobby prosjekter',
      description: 'Kreative prosjekter og hobbyer',
      value: '12 aktive',
      change: '+2 nye',
      icon: <Heart className="h-6 w-6" />,
      category: 'art' as const,
      href: '/hobby',
    },
    {
      id: 'economy',
      title: 'Økonomi',
      description: 'Budsjett og økonomisk oversikt',
      value: 'NOK 45,230',
      change: '+8.1%',
      icon: <DollarSign className="h-6 w-6" />,
      category: 'crypto' as const,
      href: '/economy',
    },
    {
      id: 'tools',
      title: 'Verktøy',
      description: 'Kalkulatorer og nyttige verktøy',
      value: '8 verktøy',
      change: 'Tilgjengelig',
      icon: <Wrench className="h-6 w-6" />,
      category: 'other' as const,
      href: '/tools',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <NorwegianBreadcrumb />
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
              <span className="text-xl font-bold text-white">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LifeDash</h1>
              <p className="text-sm text-gray-600">
                Din personlige kontrollpanel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Velkommen tilbake</p>
              <p className="font-semibold text-gray-900">
                {user?.user_metadata?.full_name ||
                  user?.email?.split('@')[0] ||
                  'Bruker'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.replace('/login')
              }}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 bg-clip-text text-4xl font-bold text-transparent">
            Velkommen til LifeDash
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Din personlige kontrollpanel for å holde oversikt over
            investeringer, hobby prosjekter, økonomi og nyttige verktøy.
          </p>
        </div>

        {/* Dashboard Cards */}
        <WidgetContainer columns={2} gap="lg" className="mb-8">
          {dashboardCards.map(card => (
            <Widget
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon}
              size="medium"
              category={card.category}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => router.push(card.href)}
            >
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      card.change.startsWith('+')
                        ? 'text-green-600'
                        : card.change.startsWith('-')
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {card.change}
                  </div>
                </div>
              </div>
            </Widget>
          ))}
        </WidgetContainer>

        {/* Quick Stats */}
        <WidgetContainer columns={3} gap="md">
          <Widget title="Total Verdi" size="small" category="stocks">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">NOK {totalPortfolioValue.toLocaleString('no-NO')}</p>
              <p className={`text-sm ${totalPortfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPortfolioChange >= 0 ? '+' : ''}{totalPortfolioChange.toFixed(1)}% denne måneden
              </p>
            </div>
          </Widget>

          <Widget title="Aktive Posisjoner" size="small" category="art">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{totalHoldings}</p>
              <p className="text-sm text-blue-600">{portfolios.length} porteføljer</p>
            </div>
          </Widget>

          <Widget title="Porteføljer" size="small" category="other">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{portfolios.length}</p>
              <p className="text-sm text-purple-600">Sist oppdatert i dag</p>
            </div>
          </Widget>
        </WidgetContainer>
      </main>
    </div>
  )
}
