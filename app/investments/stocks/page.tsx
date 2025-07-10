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
import AddTransactionModal, {
  TransactionData,
} from '@/components/stocks/add-transaction-modal'
import FinnhubQueueStatus from '@/components/stocks/finnhub-queue-status'
import {
  calculatePortfolioMetrics,
  generatePortfolioHistoryData,
} from '@/lib/utils/portfolio-calculations'
import MobilePortfolioDashboard from '@/components/mobile/mobile-portfolio-dashboard'
import { StockChartWidget } from '@/components/stocks/stock-chart-widget'
import { NorwegianHoldingsTable } from '@/components/stocks/norwegian-holdings-table'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Button } from '@/components/ui/button-system'
import { FinancialIcon } from '@/components/ui/financial-icons'
import { ErrorPortfolioState } from '@/components/states'
import { checkSetupStatus } from '@/lib/actions/platforms/setup'
import {
  addTransaction,
  getPortfolioAccounts,
} from '@/lib/actions/transactions/add-transaction'
import { createDefaultPortfolio } from '@/lib/actions/portfolio/create-default'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { EmptyStocksPage } from '@/components/stocks/empty-stocks-page'
import TopNavigationMenu from '@/components/layout/top-navigation-menu'
import { toast } from 'sonner'

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
  const [, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stock detail modal state
  const [selectedStock, setSelectedStock] = useState<HoldingWithMetrics | null>(
    null
  )
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)

  // CSV import modal state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)

  // Add transaction modal state
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false)
  const [accounts, setAccounts] = useState<
    Array<{ id: string; name: string; platform: string }>
  >([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  // Transaction processing state
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)

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
    console.log('Stock clicked - holding data:', holding)
    setSelectedStock(holding)
    setIsStockModalOpen(true)
  }, [])

  // Handle transaction modal
  const handleOpenTransactionModal = useCallback(async () => {
    setLoadingAccounts(true)
    if (safePortfolioId) {
      const result = await getPortfolioAccounts(safePortfolioId)
      if (result.success) {
        setAccounts(result.data)
      }
    }
    setLoadingAccounts(false)
    setIsAddTransactionModalOpen(true)
  }, [safePortfolioId])

  // Holdings actions handlers
  const handleBuyMore = useCallback(
    (holding: HoldingWithMetrics) => {
      console.log('Buy more:', holding)
      // TODO: Implement buy more functionality
      // Could open transaction modal with pre-filled stock data
      handleOpenTransactionModal()
    },
    [handleOpenTransactionModal]
  )

  const handleSell = useCallback(
    (holding: HoldingWithMetrics) => {
      console.log('Sell:', holding)
      // TODO: Implement sell functionality
      // Could open transaction modal with sell type pre-selected
      handleOpenTransactionModal()
    },
    [handleOpenTransactionModal]
  )

  const handleViewDetails = useCallback(
    (holding: HoldingWithMetrics) => {
      console.log('View details:', holding)
      // Use existing stock detail modal
      handleStockClick(holding)
    },
    [handleStockClick]
  )

  const handleEditPosition = useCallback((holding: HoldingWithMetrics) => {
    console.log('Edit position:', holding)
    // TODO: Implement edit position functionality
    // Could open a modal to edit quantity, cost basis, etc.
  }, [])

  const handleSetAlert = useCallback((holding: HoldingWithMetrics) => {
    console.log('Set alert:', holding)
    // TODO: Implement price alert functionality
    // Could open modal to set price thresholds
  }, [])

  const handleAddNote = useCallback((holding: HoldingWithMetrics) => {
    console.log('Add note:', holding)
    // TODO: Implement note functionality
    // Could open modal to add/edit notes for the holding
  }, [])

  const handleViewHistory = useCallback((holding: HoldingWithMetrics) => {
    console.log('View history:', holding)
    // TODO: Implement transaction history view
    // Could open modal showing all transactions for this stock
  }, [])

  const handleRemovePosition = useCallback((holding: HoldingWithMetrics) => {
    console.log('Remove position:', holding)
    // TODO: Implement remove position functionality
    // Should show confirmation dialog and then remove all holdings
  }, [])

  const handleCloseStockModal = useCallback(() => {
    setIsStockModalOpen(false)
    setSelectedStock(null)
  }, [])

  const handleCloseTransactionModal = useCallback(() => {
    setIsAddTransactionModalOpen(false)
    // Reset transaction states
    setTransactionSuccess(false)
    setTransactionError(null)
  }, [])

  // Handle transaction completion
  const handleTransactionComplete = useCallback(() => {
    setTransactionSuccess(false)
    setTransactionError(null)
  }, [])

  // Handle optimistic updates - bridge to allow holdings table to communicate changes
  const handleOptimisticUpdate = useCallback(
    (holding: HoldingWithMetrics, updates: Partial<HoldingWithMetrics>) => {
      // This function serves as a communication bridge between parent and holdings table
      // The actual optimistic state is managed internally by the NorwegianHoldingsTable component
      console.log(
        'Optimistic update received for holding:',
        holding.symbol,
        'updates:',
        updates
      )
    },
    []
  )

  const handleSubmitTransaction = useCallback(
    async (transactionData: TransactionData) => {
      if (!safePortfolioId) {
        throw new Error('Portfolio ID is required')
      }

      setIsProcessingTransaction(true)
      setTransactionError(null)
      setTransactionSuccess(false)

      try {
        const result = await addTransaction(transactionData, safePortfolioId)

        if (!result.success) {
          throw new Error(result.error || 'Failed to add transaction')
        }

        // Show success state
        setTransactionSuccess(true)

        // Refresh portfolio data to show updated holdings
        if (portfolioState.refresh) {
          await portfolioState.refresh()
        }

        // Auto-close modal after success
        setTimeout(() => {
          setIsAddTransactionModalOpen(false)
        }, 2000)

        return result
      } catch (error) {
        setTransactionError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        )
        throw error
      } finally {
        setIsProcessingTransaction(false)
      }
    },
    [safePortfolioId, portfolioState]
  )

  // Memoize component props to prevent unnecessary re-renders

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

      // Handle successful response
      if (portfoliosResult.success) {
        const portfolios = portfoliosResult.data || []

        if (portfolios.length === 0) {
          // No portfolios found
          if (isSetupSkipped) {
            // User skipped setup - show empty page for manual entry
            setPortfolioId('empty') // Special ID to indicate empty state
            setIsInitialLoading(false)
            return
          } else {
            // User didn't skip setup - redirect to setup
            router.replace('/investments/stocks/setup')
            return
          }
        }

        // Select the first portfolio (or you could add logic to select a default one)
        const firstPortfolio = portfolios[0]
        setPortfolioId(firstPortfolio.id)
      } else {
        // API error occurred
        console.log('Portfolio fetch error:', portfoliosResult.error)

        if (isSetupSkipped) {
          // For skip flow users, if there's an API error, assume no portfolios and show empty page
          console.log('Skip flow user with API error - showing empty page')
          setPortfolioId('empty')
          setIsInitialLoading(false)
          return
        } else {
          // For normal flow users, show the error
          setError('Kunne ikke hente porteføljer. Prøv igjen.')
          setIsInitialLoading(false)
          return
        }
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

  // Handle CSV import completion from top navigation
  const handleTopNavImportComplete = useCallback(async () => {
    console.log('Top navigation CSV import completed')

    // Show loading state
    toast.loading('Oppdaterer portefølje...', {
      duration: 2000,
    })

    try {
      // Refresh the portfolio data to show newly imported transactions
      if (portfolioState.refresh) {
        await portfolioState.refresh()
      }
      // Also trigger smart refresh for consistency
      await smartRefresh()

      toast.success('Portefølje oppdatert!', {
        description: 'Importerte transaksjoner er nå synlige',
        duration: 3000,
      })
    } catch (error) {
      toast.error('Kunne ikke oppdatere portefølje', {
        description: 'Prøv å oppdatere siden manuelt',
        duration: 5000,
      })
    }
  }, [portfolioState, smartRefresh])

  // State initialization guards
  const isValidPortfolioId = portfolioId && portfolioId.trim().length > 0

  // Error handling with proper state checks
  if (error || (isValidPortfolioId && portfolioState.error)) {
    return (
      <ErrorPortfolioState
        error={error || portfolioState.error || 'Ukjent feil'}
        type="data"
        onRetry={handleRefresh}
        showRetry={!!user}
        showContactSupport={true}
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

  // Handle empty state for users who skipped setup
  if (portfolioId === 'empty') {
    const handleTransactionAdded = async (transactionData: TransactionData) => {
      // Create default portfolio when first transaction is added
      const defaultResult = await createDefaultPortfolio()
      if (defaultResult.success && defaultResult.data) {
        // Add the transaction to the new portfolio
        const result = await addTransaction(
          transactionData,
          defaultResult.data.portfolioId
        )
        if (result.success) {
          // Update the portfolioId to show the real portfolio
          setPortfolioId(defaultResult.data.portfolioId)
        }
      }
    }

    const handleCSVImportComplete = async () => {
      console.log('CSV import completed for empty state')
      // Create default portfolio and refresh the page to show the portfolio
      const defaultResult = await createDefaultPortfolio()
      if (defaultResult.success && defaultResult.data) {
        // Update the portfolioId to show the real portfolio
        setPortfolioId(defaultResult.data.portfolioId)
        // Refresh the app to load the new portfolio
        await initializeApp()
      }
    }

    return (
      <ErrorBoundary>
        <EmptyStocksPage
          onTransactionAdded={handleTransactionAdded}
          onImportComplete={handleCSVImportComplete}
        />
      </ErrorBoundary>
    )
  }

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
  const allPrices = {
    ...portfolioState.realtimePrices,
  }

  const realTimeMetrics = calculatePortfolioMetrics(
    portfolioState.holdings || [],
    allPrices
  )

  const portfolioChartData = generatePortfolioHistoryData(
    portfolioState.holdings || [],
    allPrices,
    30
  )

  const currentValue =
    realTimeMetrics.totalValue || portfolioState.portfolio?.total_value || 0
  const changePercent =
    realTimeMetrics.dailyChangePercent ||
    portfolioState.portfolio?.daily_change_percent ||
    0

  // Debug portfolio integration
  console.log('Portfolio Debug Info:', {
    loading: portfolioState.loading,
    holdingsCount: portfolioState.holdings?.length || 0,
    pricesConnected: portfolioState.isPricesConnected,
    realTimePricesCount: Object.keys(portfolioState.realtimePrices || {})
      .length,
    portfolioValue: portfolioState.portfolio?.total_value,
    calculatedValue: realTimeMetrics.totalValue,
    calculatedChange: realTimeMetrics.dailyChangePercent,
    allPricesCount: Object.keys(allPrices).length,
    holdings: portfolioState.holdings?.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity,
      costBasis: h.cost_basis,
      currentPrice: h.current_price,
      currentValue: h.current_value,
      dailyChange: h.daily_change,
    })),
  })

  // Desktop view - Light theme with better proportions
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Menu */}
        <TopNavigationMenu
          portfolioId={safePortfolioId}
          onImportComplete={handleTopNavImportComplete}
        />

        {/* Breadcrumb Navigation */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <NorwegianBreadcrumb />
        </div>

        {/* Page Header with Actions - Original Layout */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Aksjer</h1>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <FinancialIcon name="building" size={16} className="mr-2" />
                Platform Wizard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenTransactionModal}
                disabled={loadingAccounts}
              >
                <FinancialIcon name="plus" size={16} className="mr-2" />
                {loadingAccounts ? 'Laster...' : 'Legg til transaksjon'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCSVModalOpen(true)}
              >
                <FinancialIcon name="receipt" size={16} className="mr-2" />
                Import CSV
              </Button>
              <Button variant="ghost" size="sm">
                <FinancialIcon name="calculator" size={16} className="mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Light theme with adjusted proportions */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left Column - Chart and Holdings with new proportions */}
            <div className="space-y-6 lg:col-span-3">
              {/* Stock Chart Widget - Smaller height */}
              <ErrorBoundary>
                <div className="h-80">
                  <StockChartWidget
                    title="Portefølje Utvikling"
                    data={portfolioChartData}
                    currentValue={currentValue}
                    changePercent={changePercent}
                    onTimeRangeChange={setChartTimeRange}
                    loading={portfolioState.loading}
                    error={portfolioState.error}
                  />
                </div>
              </ErrorBoundary>

              {/* Norwegian Holdings Table - Takes more space */}
              <ErrorBoundary>
                <div className="flex-1">
                  <NorwegianHoldingsTable
                    holdings={portfolioState.holdings}
                    loading={portfolioState.loading}
                    error={portfolioState.error}
                    onHoldingClick={handleStockClick}
                    onTimeRangeChange={setTableTimeRange}
                    onRefresh={handleRefresh}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    isProcessingTransaction={isProcessingTransaction}
                    transactionSuccess={transactionSuccess}
                    transactionError={transactionError}
                    onTransactionComplete={handleTransactionComplete}
                    onBuyMore={handleBuyMore}
                    onSell={handleSell}
                    onViewDetails={handleViewDetails}
                    onEditPosition={handleEditPosition}
                    onSetAlert={handleSetAlert}
                    onAddNote={handleAddNote}
                    onViewHistory={handleViewHistory}
                    onRemovePosition={handleRemovePosition}
                  />
                </div>
              </ErrorBoundary>
            </div>

            {/* Right Column - Feed and KPI */}
            <div className="space-y-6 lg:col-span-1">
              {/* Feed Panel */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FinancialIcon
                    name="info"
                    className="text-blue-600"
                    size={18}
                  />
                  Feed (Patreon)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">
                      Tesla Q3 resultater
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700">
                      Equinor dividend
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">
                      DNB banknotater
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Panel */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FinancialIcon
                    name="pieChart"
                    className="text-blue-600"
                    size={18}
                  />
                  Nøkkeltall
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Verdi</p>
                    <p className="text-lg font-bold text-gray-900">
                      NOK{' '}
                      {currentValue.toLocaleString('no-NO', {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Dagens Endring</p>
                    <p
                      className={`text-lg font-bold ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {changePercent >= 0 ? '+' : ''}
                      {changePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Avkastning</p>
                    <p
                      className={`text-lg font-bold ${(portfolioState.portfolio?.total_gain_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {(portfolioState.portfolio?.total_gain_loss_percent ||
                        0) >= 0
                        ? '+'
                        : ''}
                      {(
                        portfolioState.portfolio?.total_gain_loss_percent || 0
                      ).toFixed(1)}
                      %
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

              {/* Real-time Price Status */}
              <FinnhubQueueStatus
                queueStatus={{
                  total: 0,
                  processing: 0,
                  completed: Object.keys(portfolioState.realtimePrices || {})
                    .length,
                  failed: 0,
                }}
                pricesCount={
                  Object.keys(portfolioState.realtimePrices || {}).length
                }
              />
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
            portfolioId={safePortfolioId}
          />
        </ErrorBoundary>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={async () => {
          console.log('CSV import completed successfully')

          // Show loading state
          toast.loading('Oppdaterer portefølje...', {
            duration: 2000,
          })

          try {
            // Refresh the portfolio data to show newly imported transactions
            if (portfolioState.refresh) {
              await portfolioState.refresh()
            }
            // Also trigger smart refresh for consistency
            await smartRefresh()

            toast.success('CSV import fullført!', {
              description: 'Transaksjoner er lagt til i porteføljen',
              duration: 3000,
            })
          } catch (error) {
            toast.error('Kunne ikke oppdatere portefølje', {
              description: 'Prøv å oppdatere siden manuelt',
              duration: 5000,
            })
          }
        }}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        onSubmit={async (transactionData: TransactionData) => {
          const result = await handleSubmitTransaction(transactionData)
          return
        }}
        accounts={accounts}
        portfolioId={safePortfolioId}
      />
    </ErrorBoundary>
  )
}
