'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  usePortfolioState,
  HoldingWithMetrics,
} from '@/lib/hooks/use-portfolio-state'
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime-updates'
import { useSmartRefresh } from '@/lib/hooks/use-smart-refresh'
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
  const [portfolioId] = useState('default')
  const [user, setUser] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stock detail modal state
  const [selectedStock, setSelectedStock] = useState<HoldingWithMetrics | null>(
    null
  )
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)

  // All hooks must be called before any early returns
  const { isMobile } = useResponsive()

  // New portfolio state management
  const portfolioState = usePortfolioState(portfolioId, {
    enableRealtime: true,
    includeHoldings: true,
    autoRefresh: true,
  })

  // Enhanced real-time updates
  useRealtimeUpdates(portfolioId, {
    autoConnect: true,
    batchUpdates: true,
  })

  // Smart refresh for better performance
  const { refresh: smartRefresh } = useSmartRefresh(
    `portfolio-${portfolioId}`,
    () => portfolioState.refresh && portfolioState.refresh(),
    {
      interval: 30000,
    }
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

  // Handle stock detail modal
  const handleStockClick = useCallback((holding: HoldingWithMetrics) => {
    setSelectedStock(holding)
    setIsStockModalOpen(true)
  }, [])

  const handleCloseStockModal = useCallback(() => {
    setIsStockModalOpen(false)
    setSelectedStock(null)
  }, [])

  // Error handling
  if (error || portfolioState.error) {
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

  // Loading states
  if (isInitialLoading || portfolioState.loading) {
    return (
      <LoadingPortfolioState
        type="initial"
        message="Laster aksjeportefølje..."
        className="min-h-screen"
      />
    )
  }

  // Empty state
  if (!portfolioState.portfolio || !portfolioState.holdings?.length) {
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
          portfolioId={portfolioId}
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
          <PortfolioHeader
            portfolioId={portfolioId}
            onBack={() => router.back()}
            onEdit={() => router.push('/investments/stocks/setup')}
            onShare={() => {
              /* implement share */
            }}
          />
        </ErrorBoundary>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-8">
            <ErrorBoundary>
              <PortfolioMetrics portfolioId={portfolioId} />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuickActions portfolioId={portfolioId} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PortfolioChartSection portfolioId={portfolioId} />
            </ErrorBoundary>
            <ErrorBoundary>
              <HoldingsSection
                portfolioId={portfolioId}
                onStockClick={handleStockClick}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <RecentActivity portfolioId={portfolioId} />
            </ErrorBoundary>
          </div>
        </div>
      </motion.div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          isOpen={isStockModalOpen}
          onClose={handleCloseStockModal}
          stockData={selectedStock}
          isMobile={isMobile}
        />
      )}
    </ErrorBoundary>
  )
}
