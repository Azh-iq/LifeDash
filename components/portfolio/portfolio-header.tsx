'use client'

import { useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ShareIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Separator } from '@/components/ui/separator'
import { AnimatedCard } from '@/components/animated'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { formatCurrency } from '@/components/charts'
import { useResponsiveLayout } from '@/lib/hooks/use-responsive-layout'
import {
  MobileResponsiveWrapper,
  ResponsiveVisibility,
} from '@/components/mobile/mobile-responsive-wrapper'

interface PortfolioHeaderProps {
  portfolioId: string
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}

const PortfolioHeader = memo(function PortfolioHeader({
  portfolioId,
  onBack,
  onEdit,
  onDelete,
  onShare,
}: PortfolioHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const { portfolio, loading, error } = usePortfolioState(portfolioId)
  const { isMobile, isTablet } = useResponsiveLayout()

  const handleCloseMenu = useCallback(() => setShowMenu(false), [])
  const handleToggleMenu = useCallback(() => setShowMenu(!showMenu), [showMenu])
  const handleCloseShareModal = useCallback(() => setShowShareModal(false), [])
  const handleOpenShareModal = useCallback(() => setShowShareModal(true), [])

  const handleEditClick = useCallback(() => {
    handleCloseMenu()
    onEdit?.()
  }, [onEdit, handleCloseMenu])

  const handleDeleteClick = useCallback(() => {
    handleCloseMenu()
    onDelete?.()
  }, [onDelete, handleCloseMenu])

  const handleShareClick = useCallback(() => {
    handleCloseMenu()
    handleOpenShareModal()
  }, [handleCloseMenu, handleOpenShareModal])

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(
        `${window.location.origin}/portfolios/${portfolioId}/share`
      )
    }
    handleCloseShareModal()
  }, [portfolioId, handleCloseShareModal])

  if (loading) {
    return (
      <MobileResponsiveWrapper className="mb-6">
        <div
          className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-4' : ''}`}
        >
          <div
            className={`flex items-center space-x-4 ${isMobile ? 'w-full' : ''}`}
          >
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
            <div className="flex-1">
              <div
                className={`${isMobile ? 'h-6 w-32' : 'h-8 w-48'} mb-2 animate-pulse rounded bg-gray-200`}
              />
              <div
                className={`${isMobile ? 'h-3 w-24' : 'h-4 w-32'} animate-pulse rounded bg-gray-200`}
              />
            </div>
          </div>
          <div
            className={`flex space-x-2 ${isMobile ? 'w-full justify-end' : ''}`}
          >
            <div
              className={`${isMobile ? 'h-8 w-16' : 'h-9 w-20'} animate-pulse rounded bg-gray-200`}
            />
            <div
              className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9'} animate-pulse rounded bg-gray-200`}
            />
          </div>
        </div>
      </MobileResponsiveWrapper>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tilbake
          </Button>
          <div className="text-red-600">{error || 'Fant ikke porteføljen'}</div>
        </div>
      </div>
    )
  }

  const getPortfolioTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'INVESTMENT':
        return 'bg-blue-100 text-blue-800'
      case 'RETIREMENT':
        return 'bg-green-100 text-green-800'
      case 'SAVINGS':
        return 'bg-yellow-100 text-yellow-800'
      case 'TRADING':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPortfolioTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'INVESTMENT':
        return 'Investering'
      case 'RETIREMENT':
        return 'Pensjon'
      case 'SAVINGS':
        return 'Sparing'
      case 'TRADING':
        return 'Trading'
      default:
        return type
    }
  }, [])

  return (
    <>
      <MobileResponsiveWrapper className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-4' : ''}`}
          >
            {/* Left side - Portfolio info */}
            <div
              className={`flex items-center space-x-4 ${isMobile ? 'w-full' : ''}`}
            >
              {onBack && (
                <Button
                  variant="ghost"
                  size={isMobile ? 'sm' : 'sm'}
                  onClick={onBack}
                  className="touch-manipulation hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {!isMobile && 'Tilbake'}
                </Button>
              )}

              <div className={`${isMobile ? 'flex-1' : ''}`}>
                <div
                  className={`flex items-center space-x-3 ${isMobile ? 'flex-wrap' : ''}`}
                >
                  <h1
                    className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}
                  >
                    {portfolio.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`${getPortfolioTypeColor(portfolio.type)} ${isMobile ? 'text-xs' : ''}`}
                  >
                    {getPortfolioTypeLabel(portfolio.type)}
                  </Badge>
                  {portfolio.is_public && (
                    <Badge
                      variant="outline"
                      className={isMobile ? 'text-xs' : ''}
                    >
                      Offentlig
                    </Badge>
                  )}
                </div>

                {portfolio.description && (
                  <p
                    className={`mt-1 text-gray-600 ${isMobile ? 'text-sm' : ''}`}
                  >
                    {portfolio.description}
                  </p>
                )}

                <div
                  className={`mt-2 flex items-center space-x-4 text-sm text-gray-500 ${isMobile ? 'flex-wrap text-xs' : ''}`}
                >
                  <span>
                    Opprettet:{' '}
                    {new Date(portfolio.created_at).toLocaleDateString('nb-NO')}
                  </span>
                  <ResponsiveVisibility hideOn={['mobile']}>
                    <Separator orientation="vertical" className="h-4" />
                  </ResponsiveVisibility>
                  <span>{portfolio.holdings_count || 0} beholdninger</span>
                  {portfolio.total_value && (
                    <>
                      <ResponsiveVisibility hideOn={['mobile']}>
                        <Separator orientation="vertical" className="h-4" />
                      </ResponsiveVisibility>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(portfolio.total_value)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div
              className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-end' : ''}`}
            >
              <ResponsiveVisibility hideOn={['mobile']}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenShareModal}
                  className="hover:bg-gray-50"
                >
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Del
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="hover:bg-gray-50"
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Rediger
                </Button>
              </ResponsiveVisibility>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleMenu}
                  className="touch-manipulation hover:bg-gray-50"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg ${isMobile ? 'w-56' : ''}`}
                  >
                    <div className="py-1">
                      <button
                        onClick={handleEditClick}
                        className={`flex w-full touch-manipulation items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isMobile ? 'py-3' : ''}`}
                      >
                        <PencilIcon className="mr-3 h-4 w-4" />
                        Rediger portefølje
                      </button>
                      <button
                        onClick={handleShareClick}
                        className={`flex w-full touch-manipulation items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isMobile ? 'py-3' : ''}`}
                      >
                        <ShareIcon className="mr-3 h-4 w-4" />
                        Del portefølje
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          // Add export functionality
                        }}
                        className={`flex w-full touch-manipulation items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isMobile ? 'py-3' : ''}`}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Eksporter data
                      </button>
                      <Separator />
                      <button
                        onClick={handleDeleteClick}
                        className={`flex w-full touch-manipulation items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${isMobile ? 'py-3' : ''}`}
                      >
                        <TrashIcon className="mr-3 h-4 w-4" />
                        Slett portefølje
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </MobileResponsiveWrapper>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        title="Del portefølje"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Del din portefølje med andre ved å sende dem lenken nedenfor.
          </p>

          <div className="rounded-lg bg-gray-50 p-3">
            <code className="text-sm">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/portfolios/${portfolioId}/share`
                : '#'}
            </code>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCloseShareModal}>
              Avbryt
            </Button>
            <Button onClick={handleCopyLink}>Kopier lenke</Button>
          </div>
        </div>
      </Modal>
    </>
  )
})

export default PortfolioHeader
