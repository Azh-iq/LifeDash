'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  usePortfolioState,
  HoldingWithMetrics,
} from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { useSmartRefresh } from '@/lib/hooks/use-smart-refresh'
import { getUserPortfolios } from '@/lib/actions/portfolio/crud'
import StockDetailModalV2 from '@/components/stocks/stock-detail-modal-v2'
import CSVImportModal from '@/components/stocks/csv-import-modal'
import FinnhubTest from '@/components/stocks/finnhub-test'
import { calculatePortfolioMetrics, generatePortfolioHistoryData } from '@/lib/utils/portfolio-calculations'
import MobilePortfolioDashboard from '@/components/mobile/mobile-portfolio-dashboard'
import { StockChartWidget } from '@/components/stocks/stock-chart-widget'
import { NorwegianHoldingsTable } from '@/components/stocks/norwegian-holdings-table'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Button } from '@/components/ui/button'
import {
  EmptyPortfolioState,
  ErrorPortfolioState,
  LoadingPortfolioState,
} from '@/components/states'
import { checkSetupStatus } from '@/lib/actions/platforms/setup'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Simple responsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile }
}

export default function StocksPage() {
  const router = useRouter()
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stock detail modal state
  const [selectedStock, setSelectedStock] = useState<HoldingWithMetrics | null>(
    null
  )
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  
  // CSV import modal state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)

  // Chart and table state (handlers)
  const setChartTimeRange = () => {} // Placeholder for chart time range changes
  const setTableTimeRange = () => {} // Placeholder for table time range changes

  // All hooks must be called before any early returns
  const { isMobile } = useResponsive()

  // Memoize hook options to prevent re-initialization
  const portfolioStateOptions = useMemo(
    () => ({
      enableRealtime: true,
      includeHoldings: true,
      autoRefresh: true,
    }),
    []
  )

  const realtimeUpdatesOptions = useMemo(
    () => ({
      autoConnect: !!portfolioId,
      batchUpdates: true,
    }),
    [portfolioId]
  )

  const smartRefreshOptions = useMemo(
    () => ({
      interval: 30000,
    }),
    []
  )

  // Always call hooks with consistent values to avoid conditional hook calls
  // Use empty string as default to ensure hooks are called consistently
  const safePortfolioId = portfolioId || ''
  const portfolioState = usePortfolioState(
    safePortfolioId,
    portfolioStateOptions
  )

  // Enhanced real-time updates - called consistently with safe portfolio ID
  useRealtimeUpdates(safePortfolioId, realtimeUpdatesOptions)

  // Smart refresh for better performance - use consistent key
  const smartRefreshKey = useMemo(
    () => `portfolio-${safePortfolioId}`,
    [safePortfolioId]
  )

  const smartRefreshFetcher = useCallback(async () => {
    if (portfolioState.refresh && safePortfolioId) {
      return await portfolioState.refresh()
    }
  }, [portfolioState, safePortfolioId])

  const { refresh: smartRefresh } = useSmartRefresh(
    smartRefreshKey,
    smartRefreshFetcher,
    smartRefreshOptions
  )

  // Navigation handlers (kept for potential future use)

  // Handle stock detail modal
  const handleStockClick = useCallback((holding: HoldingWithMetrics) => {
    setSelectedStock(holding)
    setIsStockModalOpen(true)
  }, [])

  const handleCloseStockModal = useCallback(() => {
    setIsStockModalOpen(false)
    setSelectedStock(null)
  }, [])

  // Memoize component props to prevent unnecessary re-renders

  const stockModalProps = useMemo(
    () => ({
      isOpen: isStockModalOpen,
      onClose: handleCloseStockModal,
      stockData: selectedStock,
      isMobile,
    }),
    [isStockModalOpen, handleCloseStockModal, selectedStock, isMobile]
  )

  // Authentication and setup check
  const initializeApp = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUser(session.user)

      // Check if user has skipped setup
      const urlParams = new URLSearchParams(window.location.search)
      const isSkippedViaUrl = urlParams.get('skip') === 'true'
      const isSkippedViaSession =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('setupSkipped') === 'true'
      const isSetupSkipped = isSkippedViaUrl || isSkippedViaSession

      // Check platform setup status only if not skipped
      if (!isSetupSkipped) {
        const setupResult = await checkSetupStatus()
        if (setupResult.success && !setupResult.data?.isSetupComplete) {
          router.replace('/investments/stocks/setup')
          return
        }
      }

      // Fetch user's portfolios
      const portfoliosResult = await getUserPortfolios()
      if (portfoliosResult.success && portfoliosResult.data) {
        const portfolios = portfoliosResult.data

        if (portfolios.length === 0) {
          // No portfolios found - redirect to setup
          router.replace('/investments/stocks/setup')
          return
        }

        // Select the first portfolio (or you could add logic to select a default one)
        const firstPortfolio = portfolios[0]
        setPortfolioId(firstPortfolio.id)
      } else {
        setError('Kunne ikke hente porteføljer. Prøv igjen.')
        setIsInitialLoading(false)
        return
      }

      setIsInitialLoading(false)
    } catch (err) {
      console.error('Initialization error:', err)
      setError('Kunne ikke laste applikasjonen. Prøv igjen.')
      setIsInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  const handleRefresh = useCallback(async () => {
    await smartRefresh()
  }, [smartRefresh])

  // State initialization guards
  const isValidPortfolioId = portfolioId && portfolioId.trim().length > 0
  const hasPortfolioData = portfolioState.portfolio && !portfolioState.loading
  const hasHoldingsData =
    portfolioState.holdings && portfolioState.holdings.length > 0

  // Error handling with proper state checks
  if (error || (isValidPortfolioId && portfolioState.error)) {
    return (
      <ErrorPortfolioState
        error={error || portfolioState.error || 'Ukjent feil'}
        title="Noe gikk galt"
        subtitle="Vi kunne ikke laste porteføljedataene dine"
        onRetry={handleRefresh}
        showRetry={!!user}
        retryLabel="Prøv igjen"
        className="min-h-screen"
      />
    )
  }

  // DEMO MODE: Skip loading/empty states for FASE 3-6 demonstration
  // Uncomment the below code blocks to restore original portfolio-dependent behavior
  
  /*
  // Loading states - show loading if we don't have a portfolio ID yet or if portfolio is loading
  if (
    isInitialLoading ||
    !isValidPortfolioId ||
    (isValidPortfolioId && portfolioState.loading)
  ) {
    return (
      <LoadingPortfolioState
        type="initial"
        message="Laster aksjeportefølje..."
        className="min-h-screen"
      />
    )
  }

  // Empty state - only show if we have valid portfolio but no holdings
  if (isValidPortfolioId && hasPortfolioData && !hasHoldingsData) {
    return (
      <EmptyPortfolioState
        title="Ingen aksjer funnet"
        subtitle="Kom i gang med investeringene dine"
        description="Start med å sette opp investeringskontoene dine og legge til aksjeposisjoner for å få en komplett oversikt over porteføljen din."
        onSetupPlatform={() => router.push('/investments/stocks/setup')}
        onManualSetup={() => router.push('/investments/stocks/setup')}
        onGoToPortfolios={() => router.push('/investments')}
        className="min-h-screen"
      />
    )
  }
  */

  // Mobile view
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobilePortfolioDashboard
          portfolioId={safePortfolioId}
          initialView="overview"
          showNavigation={true}
          showTopBar={true}
        />
      </ErrorBoundary>
    )
  }

  // Calculate real portfolio metrics using live prices
  
  const realTimeMetrics = calculatePortfolioMetrics(
    portfolioState.holdings || [],
    portfolioState.realtimePrices || {}
  )
  
  const portfolioChartData = generatePortfolioHistoryData(
    portfolioState.holdings || [],
    portfolioState.realtimePrices || {},
    30
  )
  
  const currentValue = realTimeMetrics.totalValue || portfolioState.portfolio?.total_value || 1847250
  const changePercent = realTimeMetrics.dailyChangePercent || portfolioState.portfolio?.daily_change_percent || 0

  // Debug Yahoo Finance prices
  console.log('Portfolio Debug Info:', {
    loading: portfolioState.loading,
    holdingsCount: portfolioState.holdings?.length || 0,
    pricesConnected: portfolioState.isPricesConnected,
    realTimePricesCount: Object.keys(portfolioState.realtimePrices || {}).length,
    realTimePrices: portfolioState.realtimePrices,
    portfolioValue: portfolioState.portfolio?.total_value,
    calculatedValue: realTimeMetrics.totalValue,
    calculatedChange: realTimeMetrics.dailyChangePercent,
    holdings: portfolioState.holdings?.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity,
      costBasis: h.cost_basis,
      currentPrice: h.current_price,
      currentValue: h.current_value,
      dailyChange: h.daily_change
    }))
  })

  // Desktop view - Main portfolio view with new Norwegian components
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <NorwegianBreadcrumb />
        </div>

        {/* Top Menu Bar */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Aksjer</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                🧙‍♂️ Platform Wizard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCSVModalOpen(true)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                📥 Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                📤 Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left Column - Chart and Holdings */}
            <div className="space-y-6 lg:col-span-3">
              {/* Stock Chart Widget */}
              <ErrorBoundary>
                <StockChartWidget
                  title="Portefølje Utvikling"
                  data={portfolioChartData}
                  currentValue={currentValue}
                  changePercent={changePercent}
                  onTimeRangeChange={setChartTimeRange}
                  loading={portfolioState.loading}
                  error={portfolioState.error}
                />
              </ErrorBoundary>

              {/* Norwegian Holdings Table */}
              <ErrorBoundary>
                <NorwegianHoldingsTable
                  holdings={portfolioState.holdings}
                  loading={portfolioState.loading}
                  error={portfolioState.error}
                  onHoldingClick={handleStockClick}
                  onTimeRangeChange={setTableTimeRange}
                />
              </ErrorBoundary>
            </div>

            {/* Right Column - Feed and KPI */}
            <div className="space-y-6 lg:col-span-1">
              {/* Feed Panel */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Feed (Patreon)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">
                      Tesla Q3 resultater
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">
                      Equinor dividend
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-600">
                      DNB banknotater
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Panel */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Nøkkeltall
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Verdi</p>
                    <p className="text-lg font-bold text-gray-900">
                      NOK {(currentValue).toLocaleString('no-NO', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Dagens Endring</p>
                    <p className={`text-lg font-bold ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Avkastning</p>
                    <p className={`text-lg font-bold ${(portfolioState.portfolio?.total_gain_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(portfolioState.portfolio?.total_gain_loss_percent || 0) >= 0 ? '+' : ''}{(portfolioState.portfolio?.total_gain_loss_percent || 15.8).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Antall Posisjoner</p>
                    <p className="text-lg font-bold text-gray-900">
                      {portfolioState.holdings?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Finnhub API Test (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6">
                  <FinnhubTest />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <ErrorBoundary>
          <StockDetailModalV2
            isOpen={isStockModalOpen}
            onClose={handleCloseStockModal}
            stockData={selectedStock}
          />
        </ErrorBoundary>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={(result) => {
          console.log('CSV import completed:', result)
          // Here you would refresh the portfolio data
          if (portfolioState.refresh) {
            portfolioState.refresh()
          }
        }}
      />
    </ErrorBoundary>
  )
}
