'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ToolsPage() {
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

  // Mock tools data with different categories
  const tools = [
    {
      id: 'currency-converter',
      title: 'Valutaomregner',
      category: 'Converters',
      description: 'Konverter mellom ulike valutaer med sanntids kurser',
      usage: 'Daglig',
      lastUsed: '2 timer siden',
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'investment-calculator',
      title: 'Investeringskalkulator',
      category: 'Calculators',
      description: 'Beregn fremtidig verdi av investeringer med rentes rente',
      usage: 'Ukentlig',
      lastUsed: '1 dag siden',
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
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'loan-calculator',
      title: 'Lånekalkulator',
      category: 'Calculators',
      description: 'Beregn månedlige avdrag og totale lånekostnader',
      usage: 'Månedlig',
      lastUsed: '3 dager siden',
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: 'unit-converter',
      title: 'Enhetsomregner',
      category: 'Converters',
      description: 'Konverter mellom ulike måleenheter og størrelser',
      usage: 'Ukentlig',
      lastUsed: '5 timer siden',
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
      id: 'timezone-converter',
      title: 'Tidssoneomregner',
      category: 'Converters',
      description: 'Konverter tid mellom ulike tidssoner og regioner',
      usage: 'Daglig',
      lastUsed: '30 minutter siden',
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'color-picker',
      title: 'Fargevelger',
      category: 'Utilities',
      description: 'Velg farger og generer fargepaletter for design',
      usage: 'Ukentlig',
      lastUsed: '2 dager siden',
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a4 4 0 004-4V5a2 2 0 00-2-2h-2z"
          />
        </svg>
      ),
    },
    {
      id: 'qr-generator',
      title: 'QR-kodegenerator',
      category: 'Utilities',
      description: 'Generer QR-koder for tekst, URL-er og mer',
      usage: 'Månedlig',
      lastUsed: '1 uke siden',
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    {
      id: 'password-generator',
      title: 'Passordgenerator',
      category: 'Utilities',
      description: 'Generer sikre passord med tilpassbare innstillinger',
      usage: 'Ukentlig',
      lastUsed: '4 dager siden',
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
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
    },
    {
      id: 'tax-calculator',
      title: 'Skattekalkulator',
      category: 'Calculators',
      description: 'Beregn skatter og avgifter for Norge',
      usage: 'Årlig',
      lastUsed: '2 måneder siden',
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'json-formatter',
      title: 'JSON Formatter',
      category: 'Utilities',
      description: 'Formater og validere JSON-data',
      usage: 'Ukentlig',
      lastUsed: '1 dag siden',
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      id: 'base64-encoder',
      title: 'Base64 Encoder/Decoder',
      category: 'Converters',
      description: 'Koder og dekoder tekst til/fra Base64',
      usage: 'Sjelden',
      lastUsed: '2 uker siden',
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
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      id: 'hash-generator',
      title: 'Hash Generator',
      category: 'Utilities',
      description: 'Generer MD5, SHA1, SHA256 og andre hash-verdier',
      usage: 'Sjelden',
      lastUsed: '3 uker siden',
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ]

  const categories = {
    Calculators: tools.filter(t => t.category === 'Calculators'),
    Converters: tools.filter(t => t.category === 'Converters'),
    Utilities: tools.filter(t => t.category === 'Utilities'),
    Reference: tools.filter(t => t.category === 'Reference'),
  }

  const stats = {
    totalTools: tools.length,
    categoriesCount: Object.keys(categories).filter(
      key => categories[key as keyof typeof categories].length > 0
    ).length,
    dailyUsage: tools.filter(t => t.usage === 'Daglig').length,
    weeklyUsage: tools.filter(t => t.usage === 'Ukentlig').length,
  }

  const handleToolClick = (toolId: string) => {
    // Future functionality: open tool in modal or navigate to tool page
    console.log(`Opening tool: ${toolId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tools-50 to-orange-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-tools-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-tools-900">LifeDash</h1>
          <p className="text-tools-600">Laster verktøy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tools-50 via-orange-50 to-tools-100">
      {/* Enhanced Header with Orange Theme */}
      <div className="header-tools border-b border-tools-200/50">
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
                  Verktøy & Utilities
                </h1>
                <p className="text-white/80">
                  Nyttige verktøy for daglig bruk og produktivitet
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-white/70">Produktivitet</p>
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
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-0 bg-tools-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tools-500 text-white">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-tools-600">
                Totalt Verktøy
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-tools-900">
                {stats.totalTools}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-tools-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tools-500 text-white">
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
              <h4 className="text-sm font-medium uppercase tracking-wide text-tools-600">
                Kategorier
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-tools-900">
                {stats.categoriesCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-tools-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tools-500 text-white">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-medium uppercase tracking-wide text-tools-600">
                Daglig Bruk
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-tools-900">
                {stats.dailyUsage}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-tools-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tools-500 text-white">
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
              <h4 className="text-sm font-medium uppercase tracking-wide text-tools-600">
                Ukentlig Bruk
              </h4>
              <p className="financial-number mt-2 text-3xl font-bold text-tools-900">
                {stats.weeklyUsage}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid by Category */}
        {Object.entries(categories).map(([categoryName, categoryTools]) => {
          if (categoryTools.length === 0) return null

          return (
            <div key={categoryName} className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-tools-900">
                  {categoryName}
                </h2>
                <span className="text-sm text-tools-600">
                  {categoryTools.length} verktøy
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool, index) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className="card-tools card-entrance group transform text-left transition-all duration-300 hover:-translate-y-2"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <Card className="h-full border-0 shadow-lg hover:shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-tools-50 shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <div className="text-tools-600">{tool.icon}</div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${
                                tool.usage === 'Daglig'
                                  ? 'bg-green-50 text-green-600'
                                  : tool.usage === 'Ukentlig'
                                    ? 'bg-blue-50 text-blue-600'
                                    : tool.usage === 'Månedlig'
                                      ? 'bg-yellow-50 text-yellow-600'
                                      : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              <span>{tool.usage}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-tools-700">
                              {tool.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {tool.description}
                            </p>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Sist brukt:
                              </span>
                              <span className="text-xs font-medium text-gray-900">
                                {tool.lastUsed}
                              </span>
                            </div>
                          </div>

                          {/* Action indicator */}
                          <div className="flex items-center pt-2 text-tools-600 group-hover:text-tools-700">
                            <span className="text-sm font-medium">
                              Åpne verktøy
                            </span>
                            <svg
                              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Add New Tool Card */}
        <div className="mt-12">
          <button className="card-tools group w-full transform transition-all duration-300 hover:-translate-y-1">
            <Card className="border-2 border-dashed border-tools-300 shadow-lg hover:border-tools-500 hover:shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-tools-50 transition-colors group-hover:bg-tools-100">
                    <svg
                      className="h-8 w-8 text-tools-500"
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
                  Foreslå nytt verktøy
                </h3>
                <p className="text-gray-600">
                  Har du et verktøy du vil ha lagt til? Send oss forslag!
                </p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    </div>
  )
}
