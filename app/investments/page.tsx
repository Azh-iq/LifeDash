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
  Bell,
  User,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import {
  PageErrorBoundary,
  RenderErrorBoundary,
} from '@/components/ui/error-boundaries'
import { usePortfoliosState } from '@/lib/hooks/use-portfolio-state'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'

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
        <NorwegianBreadcrumb />
        
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Investeringer</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/investments/aggregation')}
                className="h-8 text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Portfolio Aggregering
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/investments/connections')}
                className="h-8 text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Megler-tilkoblinger
              </Button>
              <div className="h-6 w-6 cursor-pointer text-gray-500">
                <Bell className="h-6 w-6" />
              </div>
              <div className="h-6 w-6 cursor-pointer text-gray-500">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <DashboardContent className="bg-gray-50">
          {/* Main Content - 2fr 1fr grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart Section (2fr) */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold">Revenue Over Time</CardTitle>
                    <div className="text-2xl font-bold text-[#8b5cf6]">
                      NOK {totalValue.toLocaleString('no-NO')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg relative overflow-hidden">
                    {/* Chart visualization */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        <svg className="w-full h-full" viewBox="0 0 400 200">
                          <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                              <stop offset="20%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
                              <stop offset="40%" style={{stopColor: '#9333ea', stopOpacity: 1}} />
                              <stop offset="60%" style={{stopColor: '#7c3aed', stopOpacity: 1}} />
                              <stop offset="80%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M0,180 Q50,120 100,140 T200,100 T300,80 T400,60" 
                            stroke="url(#chartGradient)" 
                            strokeWidth="3" 
                            fill="none"
                          />
                          <circle cx="60" cy="140" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                          <circle cx="120" cy="125" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                          <circle cx="200" cy="100" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                          <circle cx="280" cy="80" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                          <circle cx="340" cy="60" r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Panel (1fr) */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-6">
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">Ny bruker registrert</p>
                        <p className="text-xs text-gray-500">2 minutter siden</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">Ordre fullført</p>
                        <p className="text-xs text-gray-500">5 minutter siden</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">Betaling mottatt</p>
                        <p className="text-xs text-gray-500">8 minutter siden</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">Ny portefølje opprettet</p>
                        <p className="text-xs text-gray-500">12 minutter siden</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-900">Aksjepris varsling</p>
                        <p className="text-xs text-gray-500">15 minutter siden</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPI Section - 3fr 1fr grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* KPI Cards (3fr) */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-[#8b5cf6]">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Aksjer</div>
                    <div className="text-2xl font-bold text-gray-900">NOK {investments.stocks.value.toLocaleString('no-NO')}</div>
                    <div className="text-xs text-green-600 mt-1">+5.2%</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#8b5cf6]">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Crypto</div>
                    <div className="text-2xl font-bold text-gray-900">NOK {investments.crypto.value.toLocaleString('no-NO')}</div>
                    <div className="text-xs text-green-600 mt-1">+12.8%</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#8b5cf6]">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Kunst</div>
                    <div className="text-2xl font-bold text-gray-900">NOK {investments.art.value.toLocaleString('no-NO')}</div>
                    <div className="text-xs text-green-600 mt-1">+3.1%</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#8b5cf6]">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Annet</div>
                    <div className="text-2xl font-bold text-gray-900">NOK {investments.other.value.toLocaleString('no-NO')}</div>
                    <div className="text-xs text-green-600 mt-1">+7.5%</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* KPI Sidebar (1fr) */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Total Return</span>
                      <span className="text-sm font-semibold text-gray-900">+8.2%</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Risk Score</span>
                      <span className="text-sm font-semibold text-gray-900">Medium</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Diversification</span>
                      <span className="text-sm font-semibold text-gray-900">Good</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Holdings</span>
                      <span className="text-sm font-semibold text-gray-900">{investments.stocks.count}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Cash</span>
                      <span className="text-sm font-semibold text-gray-900">NOK 12,340</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent News Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600">Date/Time</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600">Source</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 14:30</td>
                      <td className="py-3 px-3 text-sm text-gray-700">E24 Nyheter</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 1,250</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 13:45</td>
                      <td className="py-3 px-3 text-sm text-gray-700">Finansavisen</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 2,100</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 12:15</td>
                      <td className="py-3 px-3 text-sm text-gray-700">DN Børs</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 850</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 11:30</td>
                      <td className="py-3 px-3 text-sm text-gray-700">Kapital</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 3,200</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 10:45</td>
                      <td className="py-3 px-3 text-sm text-gray-700">Hegnar Online</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 1,800</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-700">2025-01-07 09:20</td>
                      <td className="py-3 px-3 text-sm text-gray-700">TDN Finans</td>
                      <td className="py-3 px-3 text-sm text-gray-700">NOK 950</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </DashboardContent>
      </DashboardLayout>
    </PageErrorBoundary>
  )
}
