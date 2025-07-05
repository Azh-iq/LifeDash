'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getHoldings } from '@/lib/actions/stocks/crud'
import { useStockPrices } from '@/lib/hooks/use-stock-prices'
import { checkSetupStatus } from '@/lib/actions/platforms/setup'
import AccountSelector from '@/components/features/platforms/account-selector'
import PlatformManagementModal from '@/components/features/platforms/platform-management-modal'
import type { Account } from '@/components/features/platforms/account-card'

// Type definitions for better type safety
type HoldingWithStock = {
  id: string
  symbol: string
  companyName: string
  platform: string
  account: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  totalCost: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  currency: string
  lastUpdate: string
}

type PortfolioStats = {
  totalValue: number
  todayChange: number
  todayChangePercent: number
  totalPositions: number
  platforms: string[]
}

export default function StocksPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [holdings, setHoldings] = useState<HoldingWithStock[]>([])
  const [filteredHoldings, setFilteredHoldings] = useState<HoldingWithStock[]>(
    []
  )
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Platform and account management state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [platformModalTab, setPlatformModalTab] = useState<
    'platforms' | 'accounts'
  >('accounts')

  // Extract symbols from filtered holdings for real-time prices
  const symbols = filteredHoldings.map(holding => holding.symbol)

  // Use real-time stock prices hook
  const { prices, loading: pricesLoading } = useStockPrices(symbols, {
    refreshInterval: 30, // Update every 30 seconds
    enabled: symbols.length > 0,
  })

  // Check authentication and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUser(session.user)

      // Check if user has completed platform setup
      const setupResult = await checkSetupStatus()
      if (setupResult.success && !setupResult.data?.isSetupComplete) {
        // Redirect to setup wizard if not completed
        router.replace('/investments/stocks/setup')
        return
      }

      setIsLoading(false)

      // Load holdings data
      await loadHoldingsData(session.user.id)
    }

    checkAuthAndLoadData()
  }, [router])

  // Function to load holdings data
  const loadHoldingsData = async (userId: string) => {
    try {
      setDataLoading(true)
      setError(null)

      const result = await getHoldings(userId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load holdings')
      }

      // Transform the data to match our interface
      const transformedHoldings: HoldingWithStock[] = (result.data || []).map(
        (holding: any) => {
          const stock = holding.stock || {}
          const account = holding.account || {}

          return {
            id: holding.id,
            symbol: stock.symbol || '',
            companyName: stock.company_name || stock.name || '',
            platform: account.name || 'Unknown',
            account: account.account_type || 'Unknown',
            quantity: holding.quantity || 0,
            avgCost: holding.average_cost || 0,
            currentPrice: holding.current_price || stock.current_price || 0,
            marketValue: holding.market_value || 0,
            totalCost: holding.total_cost || 0,
            unrealizedPnl: holding.unrealized_pnl || 0,
            unrealizedPnlPercent: holding.unrealized_pnl_percent || 0,
            currency: holding.currency || stock.currency || 'USD',
            lastUpdate: holding.last_price_update || new Date().toISOString(),
          }
        }
      )

      setHoldings(transformedHoldings)
    } catch (err) {
      console.error('Error loading holdings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load holdings')
    } finally {
      setDataLoading(false)
    }
  }

  // Filter holdings based on selected account
  useEffect(() => {
    if (!selectedAccount) {
      setFilteredHoldings(holdings)
    } else {
      const accountFiltered = holdings.filter(
        holding => holding.platform === selectedAccount.platform.display_name
      )
      setFilteredHoldings(accountFiltered)
    }
  }, [holdings, selectedAccount])

  // Calculate portfolio stats from filtered holdings
  useEffect(() => {
    calculatePortfolioStats(filteredHoldings)
  }, [filteredHoldings])

  // Function to calculate portfolio statistics
  const calculatePortfolioStats = (holdingsData: HoldingWithStock[]) => {
    if (!holdingsData.length) {
      setPortfolioStats(null)
      return
    }

    const totalValue = holdingsData.reduce(
      (sum, holding) => sum + holding.marketValue,
      0
    )
    const totalCost = holdingsData.reduce(
      (sum, holding) => sum + holding.totalCost,
      0
    )
    const totalPnl = totalValue - totalCost
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

    const platforms = Array.from(
      new Set(holdingsData.map(holding => holding.platform))
    )

    const stats: PortfolioStats = {
      totalValue,
      todayChange: totalPnl, // Using unrealized P&L as today's change for now
      todayChangePercent: totalPnlPercent,
      totalPositions: holdingsData.length,
      platforms,
    }

    setPortfolioStats(stats)
  }

  // Update holdings with real-time prices
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return

    const updatedHoldings = holdings.map(holding => {
      const priceData = prices[holding.symbol]
      if (priceData) {
        const newMarketValue = priceData.price * holding.quantity
        const newUnrealizedPnl = newMarketValue - holding.totalCost
        const newUnrealizedPnlPercent =
          holding.totalCost > 0
            ? (newUnrealizedPnl / holding.totalCost) * 100
            : 0

        return {
          ...holding,
          currentPrice: priceData.price,
          marketValue: newMarketValue,
          unrealizedPnl: newUnrealizedPnl,
          unrealizedPnlPercent: newUnrealizedPnlPercent,
          lastUpdate: priceData.timestamp,
        }
      }
      return holding
    })

    setHoldings(updatedHoldings)
  }, [prices])

  // Handle account selection
  const handleAccountSelect = (account: Account | null) => {
    setSelectedAccount(account)
  }

  // Handle platform management modal
  const handleOpenPlatformModal = (
    tab: 'platforms' | 'accounts' = 'accounts'
  ) => {
    setPlatformModalTab(tab)
    setShowPlatformModal(true)
  }

  const handleClosePlatformModal = () => {
    setShowPlatformModal(false)
    // Refresh data after modal closes
    if (user) {
      loadHoldingsData(user.id)
    }
  }

  // Error and loading states
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-red-900">Error</h1>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => user && loadHoldingsData(user.id)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Group filtered holdings by platform
  const platformGroups = filteredHoldings.reduce(
    (acc, holding) => {
      if (!acc[holding.platform]) {
        acc[holding.platform] = []
      }
      acc[holding.platform].push(holding)
      return acc
    },
    {} as Record<string, typeof filteredHoldings>
  )

  if (isLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-blue-900">LifeDash</h1>
          <p className="text-blue-600">
            {isLoading ? 'Loading stocks...' : 'Fetching portfolio data...'}
          </p>
        </div>
      </div>
    )
  }

  // Show empty state if no holdings
  if (!portfolioStats || holdings.length === 0) {
    return (
      <div className="via-blue-25 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <div className="header-investments-light border-b border-blue-200/50">
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
                  <h1 className="text-3xl font-bold text-white">Stocks</h1>
                  <p className="text-white/80">
                    Detailed overview of all your stock positions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm text-white/70">Portfolio</p>
                  <p className="font-semibold text-white">
                    {user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      'User'}
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

        {/* Empty State */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-12 w-12 text-blue-600"
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
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                No stocks found
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                Start by setting up your investment accounts and adding stock
                positions
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => router.push('/investments/stocks/setup')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Setup Platform Wizard
                </Button>
                <Button
                  onClick={() => handleOpenPlatformModal('accounts')}
                  variant="outline"
                >
                  Manual Setup
                </Button>
                <Button
                  onClick={() => router.push('/portfolios')}
                  variant="outline"
                >
                  Go to Portfolios
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="via-blue-25 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Enhanced Header with Platform Management */}
        <div className="header-investments-light border-b border-blue-200/50">
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
                  <h1 className="text-3xl font-bold text-white">Stocks</h1>
                  <p className="text-white/80">
                    {selectedAccount
                      ? `${selectedAccount.name} - ${selectedAccount.platform.display_name}`
                      : 'All stock positions across platforms'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Account Selector */}
                {user && (
                  <div className="min-w-[200px]">
                    <AccountSelector
                      userId={user.id}
                      selectedAccountId={selectedAccount?.id}
                      onAccountSelect={handleAccountSelect}
                      className="border-white/20 bg-white/10 text-white"
                    />
                  </div>
                )}

                {/* Platform Management Button */}
                <Button
                  onClick={() => handleOpenPlatformModal('accounts')}
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <svg
                    className="mr-2 h-4 w-4"
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
                  Manage
                </Button>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-white/70">Portfolio</p>
                    <p className="font-semibold text-white">
                      {user?.user_metadata?.full_name ||
                        user?.email?.split('@')[0] ||
                        'User'}
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
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Portfolio Overview */}
          <Card className="mb-8 border-0 bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl">
            <CardContent className="p-10">
              <div className="text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/80">
                  {selectedAccount ? 'Account Value' : 'Total Stock Value'}
                </p>
                <h2 className="financial-number mb-6 font-mono text-6xl font-bold text-white">
                  {portfolioStats.totalValue.toLocaleString('no-NO', {
                    style: 'currency',
                    currency: 'NOK',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </h2>
                <div className="flex items-center justify-center space-x-3">
                  <div
                    className={`flex items-center space-x-2 rounded-full px-4 py-2 ${
                      portfolioStats.todayChangePercent >= 0
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {portfolioStats.todayChangePercent >= 0 ? (
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
                      {portfolioStats.todayChangePercent >= 0 ? '+' : ''}
                      {portfolioStats.todayChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-white/60">•</span>
                  <span
                    className={`financial-number text-lg font-semibold ${
                      portfolioStats.todayChangePercent >= 0
                        ? 'text-green-300'
                        : 'text-red-300'
                    }`}
                  >
                    {portfolioStats.todayChangePercent >= 0 ? '+' : ''}
                    {Math.abs(portfolioStats.todayChange).toLocaleString(
                      'no-NO',
                      {
                        style: 'currency',
                        currency: 'NOK',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }
                    )}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                    unrealized P&L
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-0 bg-blue-50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
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
                <h4 className="text-sm font-medium uppercase tracking-wide text-blue-600">
                  Total Positions
                </h4>
                <p className="financial-number mt-2 text-3xl font-bold text-blue-900">
                  {portfolioStats.totalPositions}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-blue-50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
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
                <h4 className="text-sm font-medium uppercase tracking-wide text-blue-600">
                  {selectedAccount ? 'Account' : 'Platforms'}
                </h4>
                <p className="financial-number mt-2 text-3xl font-bold text-blue-900">
                  {selectedAccount
                    ? selectedAccount.platform.display_name
                    : portfolioStats.platforms.length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-blue-50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      portfolioStats.todayChangePercent >= 0
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    } text-white`}
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm font-medium uppercase tracking-wide text-blue-600">
                  P&L
                </h4>
                <p
                  className={`financial-number mt-2 text-3xl font-bold ${
                    portfolioStats.todayChangePercent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {portfolioStats.todayChangePercent >= 0 ? '+' : ''}
                  {portfolioStats.todayChangePercent.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Holdings by Platform */}
          <div className="space-y-8">
            {Object.entries(platformGroups).map(
              ([platform, platformHoldings]) => (
                <Card key={platform} className="border-0 bg-white shadow-xl">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                          <svg
                            className="h-6 w-6 text-blue-600"
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
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {platform}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {platformHoldings.length} positions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Platform value</p>
                        <p className="financial-number text-xl font-bold text-gray-900">
                          {platformHoldings
                            .reduce(
                              (sum, holding) => sum + holding.marketValue,
                              0
                            )
                            .toLocaleString('no-NO', {
                              style: 'currency',
                              currency: 'NOK',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Stock
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              Quantity
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              Avg Cost
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              Current Price
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              Market Value
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                              P&L
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {platformHoldings.map(holding => (
                            <tr
                              key={holding.id}
                              className="transition-colors hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                      <span className="text-sm font-bold text-blue-600">
                                        {holding.symbol.substring(0, 2)}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {holding.symbol}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {holding.companyName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {holding.account}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="financial-number font-medium text-gray-900">
                                  {holding.quantity}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {holding.currency}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="financial-number font-medium text-gray-900">
                                  {holding.avgCost.toFixed(2)}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="financial-number font-medium text-gray-900">
                                  {holding.currentPrice.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    holding.lastUpdate
                                  ).toLocaleTimeString('no-NO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {pricesLoading && (
                                  <div className="mt-1 flex items-center text-xs text-blue-600">
                                    <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                                    updating...
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="financial-number font-bold text-gray-900">
                                  {holding.marketValue.toLocaleString('no-NO', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div
                                  className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${
                                    holding.unrealizedPnlPercent >= 0
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {holding.unrealizedPnlPercent >= 0 ? (
                                    <svg
                                      className="h-4 w-4"
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
                                      className="h-4 w-4"
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
                                    {holding.unrealizedPnlPercent >= 0
                                      ? '+'
                                      : ''}
                                    {holding.unrealizedPnlPercent.toFixed(2)}%
                                  </span>
                                </div>
                                <p
                                  className={`financial-number text-sm font-medium ${
                                    holding.unrealizedPnl >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {holding.unrealizedPnl >= 0 ? '+' : ''}
                                  {holding.unrealizedPnl.toLocaleString(
                                    'no-NO',
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }
                                  )}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>

      {/* Platform Management Modal */}
      <PlatformManagementModal
        open={showPlatformModal}
        onOpenChange={handleClosePlatformModal}
        userId={user?.id || ''}
        initialTab={platformModalTab}
      />
    </>
  )
}
