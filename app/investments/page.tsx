'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/investments/stocks',
    },
    {
      id: 'crypto',
      title: 'Crypto',
      subtitle: `${investments.crypto.count} coins`,
      value: investments.crypto.value,
      change: investments.crypto.change,
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      gradient: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      href: '/investments/crypto',
    },
    {
      id: 'art',
      title: 'Kunst',
      subtitle: `${investments.art.count} objekter`,
      value: investments.art.value,
      change: investments.art.change,
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a4 4 0 004-4V5a2 2 0 00-2-2h-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 3h2a2 2 0 012 2v12a4 4 0 01-4 4h-2"
          />
        </svg>
      ),
      gradient: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-25',
      textColor: 'text-blue-500',
      href: '/investments/art',
    },
    {
      id: 'other',
      title: 'Annet',
      subtitle: `${investments.other.count} investeringer`,
      value: investments.other.value,
      change: investments.other.change,
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      gradient: 'from-blue-700 to-blue-800',
      bgColor: 'bg-blue-200',
      textColor: 'text-blue-800',
      href: '/investments/other',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-blue-900">LifeDash</h1>
          <p className="text-blue-600">Loading investments...</p>
        </div>
      </div>
    )
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-investments-50 via-blue-50 to-investments-100">
        {/* Enhanced Header with Navy Theme */}
        <div className="header-investments border-b border-investments-200/50">
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
                    Investeringer
                  </h1>
                  <p className="text-white/80">
                    Professionell oversikt over alle dine investeringer
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm text-white/70">Portefølje</p>
                  <p className="font-semibold text-white">
                    {user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Bruker'}
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
          {/* Enhanced Total Value Section */}
          <Card className="header-investments mb-8 border-0 shadow-2xl">
            <CardContent className="p-10">
              <div className="text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/80">
                  Total Porteføljeverdi
                </p>
                <h2 className="financial-number mb-6 font-mono text-6xl font-bold text-white">
                  NOK {totalValue.toLocaleString('no-NO')}
                </h2>
                <div className="flex items-center justify-center space-x-3">
                  <div
                    className={`flex items-center space-x-2 rounded-full px-4 py-2 ${totalChangePercent >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                  >
                    {totalChangePercent >= 0 ? (
                      <svg
                        className="ui-icon h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="ui-icon h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-lg font-semibold">
                      {totalChangePercent >= 0 ? '+' : ''}
                      {totalChangePercent.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-white/60">•</span>
                  <span
                    className={`financial-number text-lg font-semibold ${totalChangePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}
                  >
                    {totalChangePercent >= 0 ? '+' : ''}NOK{' '}
                    {Math.abs(totalChange).toLocaleString('no-NO', {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                    i dag
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Categories Grid */}
          <RenderErrorBoundary>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => router.push(category.href)}
                  className="card-investments card-entrance group transform transition-all duration-300 hover:-translate-y-3"
                  style={{
                    animationDelay: `${index * 150}ms`,
                  }}
                >
                  <Card className="h-full border-0 shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.bgColor} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                        >
                          <div className={category.textColor}>
                            {category.icon}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${category.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                          >
                            {category.change >= 0 ? (
                              <svg
                                className="ui-icon h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="ui-icon h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span>
                              {category.change >= 0 ? '+' : ''}
                              {category.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-investments-700">
                          {category.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {category.subtitle}
                        </p>
                        <div className="pt-3">
                          <p className="financial-number font-mono text-3xl font-bold text-gray-900">
                            NOK {category.value.toLocaleString('no-NO')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </RenderErrorBoundary>

          {/* Enhanced Quick Stats */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-0 bg-investments-50 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-investments-500 text-white">
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
                <h4 className="text-sm font-medium uppercase tracking-wide text-investments-600">
                  Beste Kategori
                </h4>
                <p className="financial-number mt-2 text-3xl font-bold text-investments-900">
                  Kunst
                </p>
                <p className="text-sm font-semibold text-green-600">
                  +8.7% i dag
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-investments-50 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-investments-500 text-white">
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm font-medium uppercase tracking-wide text-investments-600">
                  Totalt Posisjoner
                </h4>
                <p className="financial-number mt-2 text-3xl font-bold text-investments-900">
                  {Object.values(investments).reduce(
                    (sum, cat) => sum + cat.count,
                    0
                  )}
                </p>
                <p className="text-sm text-investments-600">
                  På tvers av alle kategorier
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-investments-50 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-investments-500 text-white">
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
                <h4 className="text-sm font-medium uppercase tracking-wide text-investments-600">
                  Månedlig Avkastning
                </h4>
                <p className="financial-number mt-2 text-3xl font-bold text-green-600">
                  +12.4%
                </p>
                <p className="text-sm text-investments-600">Denne måneden</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  )
}
