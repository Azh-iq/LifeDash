'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function EconomyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null) // TODO: Replace with proper User type

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

  // Mock budget data
  const budgetCategories = [
    {
      id: 'income',
      title: 'Inntekt',
      amount: 45000,
      budgeted: 45000,
      type: 'income',
      description: 'Lønn og andre inntekter',
      trend: +5.2,
      transactions: 3,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      id: 'housing',
      title: 'Bolig',
      amount: 15000,
      budgeted: 16000,
      type: 'expense',
      description: 'Husleie, strøm og boligutgifter',
      trend: -2.1,
      transactions: 8,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'food',
      title: 'Mat & Drikke',
      amount: 8500,
      budgeted: 8000,
      type: 'expense',
      description: 'Dagligvarer og restaurant',
      trend: +12.3,
      transactions: 24,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
          />
        </svg>
      ),
    },
    {
      id: 'transport',
      title: 'Transport',
      amount: 3200,
      budgeted: 3500,
      type: 'expense',
      description: 'Bil, kollektivtransport og drivstoff',
      trend: -8.5,
      transactions: 12,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      id: 'savings',
      title: 'Sparing',
      amount: 12000,
      budgeted: 10000,
      type: 'savings',
      description: 'Månedlig sparing og investeringer',
      trend: +20.0,
      transactions: 2,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: 'investments',
      title: 'Investeringer',
      amount: 8000,
      budgeted: 8000,
      type: 'investment',
      description: 'Aksjer, fond og krypto',
      trend: +15.7,
      transactions: 4,
      icon: (
        <svg
          className="ui-icon-lg h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
  ]

  const totalIncome = budgetCategories
    .filter(c => c.type === 'income')
    .reduce((sum, c) => sum + c.amount, 0)
  const totalExpenses = budgetCategories
    .filter(c => c.type === 'expense')
    .reduce((sum, c) => sum + c.amount, 0)
  const totalSavings = budgetCategories
    .filter(c => c.type === 'savings')
    .reduce((sum, c) => sum + c.amount, 0)
  const totalInvestments = budgetCategories
    .filter(c => c.type === 'investment')
    .reduce((sum, c) => sum + c.amount, 0)

  const stats = {
    totalIncome,
    totalExpenses,
    totalSavings,
    totalInvestments,
    netIncome: totalIncome - totalExpenses,
    savingsRate:
      totalIncome > 0
        ? Math.round(((totalSavings + totalInvestments) / totalIncome) * 100)
        : 0,
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-economy-50 to-green-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-economy-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-economy-900">LifeDash</h1>
          <p className="text-economy-600">Laster økonomi oversikt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-economy-50 via-green-50 to-economy-100">
      {/* Enhanced Header with Green Theme */}
      <div className="header-economy border-b border-economy-200/50">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
              >
                <svg
                  className="ui-icon h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Økonomi & Budsjett
                </h1>
                <p className="text-white/80">
                  Budsjettrackning og finansiell oversikt
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-white/70">Finansiell helse</p>
                <p className="font-semibold text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.replace('/login')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition-all duration-200 hover:bg-white/30"
              >
                <svg
                  className="ui-icon h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Financial Overview Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-0 bg-economy-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-economy-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-economy-600">
                Total Inntekt
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-economy-900">
                {stats.totalIncome.toLocaleString('nb-NO')} kr
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-economy-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-economy-600">
                Total Utgifter
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-economy-900">
                {stats.totalExpenses.toLocaleString('nb-NO')} kr
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-economy-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-economy-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-economy-600">
                Netto Inntekt
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-economy-900">
                {stats.netIncome.toLocaleString('nb-NO')} kr
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-economy-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-economy-500 text-white">
                  <svg
                    className="ui-icon h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-economy-600">
                Sparerate
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-economy-900">
                {stats.savingsRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Categories Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {budgetCategories.map((category, index) => (
            <div
              key={category.id}
              className="card-economy card-entrance group transform transition-all duration-300 hover:-translate-y-3"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <Card className="h-full border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-economy-50 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <div className="text-economy-600">{category.icon}</div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${
                          category.trend > 0
                            ? 'bg-green-50 text-green-600'
                            : category.trend < 0
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span>
                          {category.trend > 0 ? '+' : ''}
                          {category.trend}%
                        </span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                              category.trend > 0
                                ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                                : category.trend < 0
                                  ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                                  : 'M5 12h14'
                            }
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-economy-700">
                        {category.title}
                      </h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>

                    {/* Budget vs Actual */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Budsjett vs Faktisk
                        </span>
                        <span className="text-sm font-semibold text-economy-600">
                          {Math.round(
                            (category.amount / category.budgeted) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            category.amount > category.budgeted
                              ? 'bg-red-500'
                              : category.amount < category.budgeted * 0.8
                                ? 'bg-yellow-500'
                                : 'bg-economy-500'
                          }`}
                          style={{
                            width: `${Math.min((category.amount / category.budgeted) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Beløp:</span>
                        <span className="financial-number text-sm font-medium text-gray-900">
                          {category.amount.toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Budsjett:</span>
                        <span className="financial-number text-sm font-medium text-gray-900">
                          {category.budgeted.toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Transaksjoner:
                        </span>
                        <span className="financial-number text-sm font-medium text-gray-900">
                          {category.transactions}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Monthly Trends Section */}
        <div className="mt-8">
          <Card className="border-0 bg-white shadow-xl">
            <CardHeader>
              <h3 className="text-2xl font-bold text-gray-900">
                Månedlige Trender
              </h3>
              <p className="text-gray-600">
                Oversikt over økonomiske trender de siste 6 månedene
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-economy-500 text-white">
                      <svg
                        className="ui-icon h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Inntekt Trend
                  </h4>
                  <p className="financial-number text-2xl font-bold text-economy-600">
                    +5.2%
                  </p>
                  <p className="text-sm text-gray-600">
                    Økning fra forrige måned
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                      <svg
                        className="ui-icon h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Utgifter Trend
                  </h4>
                  <p className="financial-number text-2xl font-bold text-red-600">
                    +3.1%
                  </p>
                  <p className="text-sm text-gray-600">
                    Økning fra forrige måned
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-economy-500 text-white">
                      <svg
                        className="ui-icon h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Sparing Trend
                  </h4>
                  <p className="financial-number text-2xl font-bold text-economy-600">
                    +12.5%
                  </p>
                  <p className="text-sm text-gray-600">
                    Økning fra forrige måned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Budget Category Card */}
        <div className="mt-8">
          <button className="card-economy group w-full transform transition-all duration-300 hover:-translate-y-1">
            <Card className="border-2 border-dashed border-economy-300 shadow-lg hover:border-economy-500 hover:shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-economy-50 transition-colors group-hover:bg-economy-100">
                    <svg
                      className="h-8 w-8 text-economy-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Legg til ny kategori
                </h3>
                <p className="text-gray-600">
                  Opprett en ny budsjett-kategori for bedre oversikt
                </p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    </div>
  )
}
