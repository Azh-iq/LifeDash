'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  usePortfolioState,
  HoldingWithMetrics,
} from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { useSmartRefresh } from '@/lib/hooks/use-smart-refresh'
import { getUserPortfolios } from '@/lib/actions/portfolio/crud'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import PortfolioMetrics from '@/components/portfolio/portfolio-metrics'
import PortfolioChartSection from '@/components/portfolio/portfolio-chart-section'
import HoldingsSection from '@/components/portfolio/holdings-section'
import RecentActivity from '@/components/portfolio/recent-activity'
import QuickActions from '@/components/portfolio/quick-actions'
import StockDetailModal from '@/components/stocks/stock-detail-modal'
import MobilePortfolioDashboard from '@/components/mobile/mobile-portfolio-dashboard'
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

  // Only initialize portfolio state if we have a valid portfolio ID
  const portfolioState = usePortfolioState(
    portfolioId || '',
    portfolioStateOptions
  )

  // Enhanced real-time updates - only when we have a portfolio ID
  useRealtimeUpdates(portfolioId || '', realtimeUpdatesOptions)

  // Smart refresh for better performance - only when we have a portfolio ID
  const smartRefreshKey = useMemo(
    () => (portfolioId ? `portfolio-${portfolioId}` : 'no-portfolio'),
    [portfolioId]
  )

  const smartRefreshFetcher = useCallback(async () => {
    if (portfolioState.refresh) {
      return await portfolioState.refresh()
    }
  }, [portfolioState])

  const { refresh: smartRefresh } = useSmartRefresh(
    smartRefreshKey,
    smartRefreshFetcher,
    smartRefreshOptions
  )

  // Memoize navigation handlers to prevent unnecessary re-renders
  const handleBack = useCallback(() => router.back(), [router])
  const handleEdit = useCallback(
    () => router.push('/investments/stocks/setup'),
    [router]
  )
  const handleShare = useCallback(() => {
    // implement share functionality
  }, [])

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
  const portfolioHeaderProps = useMemo(
    () => ({
      portfolioId: portfolioId!,
      onBack: handleBack,
      onEdit: handleEdit,
      onShare: handleShare,
    }),
    [portfolioId, handleBack, handleEdit, handleShare]
  )

  const holdingsSectionProps = useMemo(
    () => ({
      portfolioId: portfolioId!,
      onStockClick: handleStockClick,
    }),
    [portfolioId, handleStockClick]
  )

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

      // Check platform setup status
      const setupResult = await checkSetupStatus()
      if (setupResult.success && !setupResult.data?.isSetupComplete) {
        router.replace('/investments/stocks/setup')
        return
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

  // Mobile view
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobilePortfolioDashboard
          portfolioId={portfolioId!}
          initialView="overview"
          showNavigation={true}
          showTopBar={true}
        />
      </ErrorBoundary>
    )
  }

  // Desktop view - Main portfolio view with new components
  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <ErrorBoundary>
          <PortfolioHeader {...portfolioHeaderProps} />
        </ErrorBoundary>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-8">
            <ErrorBoundary>
              <PortfolioMetrics portfolioId={portfolioId!} />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuickActions portfolioId={portfolioId!} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PortfolioChartSection portfolioId={portfolioId!} />
            </ErrorBoundary>
            <ErrorBoundary>
              <HoldingsSection {...holdingsSectionProps} />
            </ErrorBoundary>
            <ErrorBoundary>
              <RecentActivity portfolioId={portfolioId!} />
            </ErrorBoundary>
          </div>
        </div>
      </motion.div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <ErrorBoundary>
          <StockDetailModal {...stockModalProps} />
        </ErrorBoundary>
      )}
    </ErrorBoundary>
  )
}
