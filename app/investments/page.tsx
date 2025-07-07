'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Widget, WidgetContainer } from '@/components/ui/widget'
import { LoadingState } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  DollarSign, 
  Heart, 
  PieChart, 
  LogOut,
  ArrowLeft 
} from 'lucide-react'
import {
  PageErrorBoundary,
  RenderErrorBoundary,
} from '@/components/ui/error-boundaries'

export default function InvestmentsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

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

  // Mock investment data
  const investments = {
    stocks: { value: 245000, change: 5.2, count: 12 },
    crypto: { value: 89000, change: -2.1, count: 8 },
    art: { value: 156000, change: 8.7, count: 4 },
    other: { value: 34000, change: 1.4, count: 6 },
  }

  const totalValue = Object.values(investments).reduce(
    (sum, cat) => sum + cat.value,
    0
  )
  const totalChange = Object.values(investments).reduce(
    (sum, cat) => sum + (cat.value * cat.change) / 100,
    0
  )
  const totalChangePercent = (totalChange / totalValue) * 100

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState 
            variant="widget" 
            size="lg" 
            text="Laster investeringer..."
            className="text-center"
          />
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <NorwegianBreadcrumb />
        </div>

        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Investeringer</h1>
                <p className="text-gray-600">Oversikt over alle dine investeringer</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Portefølje</p>
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
                <LogOut className="h-4 w-4 mr-2" />
                Logg ut
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* Total Portfolio Value */}
          <Widget
            title="Total Porteføljeverdi"
            size="hero"
            category="stocks"
            className="mb-8"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold text-gray-900">
                NOK {totalValue.toLocaleString('no-NO')}
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    totalChangePercent >= 0 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${totalChangePercent < 0 ? 'rotate-180' : ''}`} />
                  <span className="font-semibold">
                    {totalChangePercent >= 0 ? '+' : ''}
                    {totalChangePercent.toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`text-lg font-semibold ${
                    totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalChangePercent >= 0 ? '+' : ''}NOK{' '}
                  {Math.abs(totalChange).toLocaleString('no-NO', {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
                  i dag
                </span>
              </div>
            </div>
          </Widget>

          {/* Investment Categories */}
          <RenderErrorBoundary>
            <WidgetContainer columns={4} gap="lg" className="mb-8">
              {categories.map((category) => (
                <Widget
                  key={category.id}
                  title={category.title}
                  description={category.subtitle}
                  icon={category.icon}
                  size="medium"
                  category={category.category}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => router.push(category.href)}
                >
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          NOK {category.value.toLocaleString('no-NO')}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          category.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {category.change >= 0 ? '+' : ''}
                        {category.change}%
                      </div>
                    </div>
                  </div>
                </Widget>
              ))}
            </WidgetContainer>
          </RenderErrorBoundary>

          {/* Quick Stats */}
          <WidgetContainer columns={3} gap="md">
            <Widget
              title="Beste Kategori"
              size="small"
              category="art"
              icon={<Heart className="h-5 w-5" />}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Kunst</p>
                <p className="text-sm text-green-600">+8.7% i dag</p>
              </div>
            </Widget>

            <Widget
              title="Totalt Posisjoner"
              size="small"
              category="stocks"
              icon={<PieChart className="h-5 w-5" />}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(investments).reduce((sum, cat) => sum + cat.count, 0)}
                </p>
                <p className="text-sm text-gray-600">På tvers av alle kategorier</p>
              </div>
            </Widget>

            <Widget
              title="Månedlig Avkastning"
              size="small"
              category="other"
              icon={<TrendingUp className="h-5 w-5" />}
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">+12.4%</p>
                <p className="text-sm text-gray-600">Denne måneden</p>
              </div>
            </Widget>
          </WidgetContainer>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
