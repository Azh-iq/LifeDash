'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  Cog6ToothIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Separator } from '@/components/ui/separator'
import { AnimatedCard } from '@/components/animated'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { formatCurrency } from '@/components/charts'

interface PortfolioHeaderProps {
  portfolioId: string
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}

export default function PortfolioHeader({
  portfolioId,
  onBack,
  onEdit,
  onDelete,
  onShare
}: PortfolioHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const { portfolio, loading, error } = usePortfolioState(portfolioId)

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
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
          <div className="text-red-600">
            {error || 'Fant ikke porteføljen'}
          </div>
        </div>
      </div>
    )
  }

  const getPortfolioTypeColor = (type: string) => {
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
  }

  const getPortfolioTypeLabel = (type: string) => {
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
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          {/* Left side - Portfolio info */}
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Tilbake
              </Button>
            )}
            
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {portfolio.name}
                </h1>
                <Badge 
                  variant="secondary" 
                  className={getPortfolioTypeColor(portfolio.type)}
                >
                  {getPortfolioTypeLabel(portfolio.type)}
                </Badge>
                {portfolio.is_public && (
                  <Badge variant="outline">
                    Offentlig
                  </Badge>
                )}
              </div>
              
              {portfolio.description && (
                <p className="text-gray-600 mt-1">
                  {portfolio.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>
                  Opprettet: {new Date(portfolio.created_at).toLocaleDateString('nb-NO')}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  {portfolio.holdings_count || 0} beholdninger
                </span>
                {portfolio.total_value && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="font-medium text-gray-900">
                      {formatCurrency(portfolio.total_value)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="hover:bg-gray-50"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Del
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Rediger
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="hover:bg-gray-50"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
              
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onEdit?.()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PencilIcon className="h-4 w-4 mr-3" />
                      Rediger portefølje
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowShareModal(true)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ShareIcon className="h-4 w-4 mr-3" />
                      Del portefølje
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        // Add export functionality
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Eksporter data
                    </button>
                    <Separator />
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onDelete?.()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-3" />
                      Slett portefølje
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Del portefølje"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Del din portefølje med andre ved å sende dem lenken nedenfor.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <code className="text-sm">
              {typeof window !== 'undefined' 
                ? `${window.location.origin}/portfolios/${portfolioId}/share`
                : '#'
              }
            </code>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(false)}
            >
              Avbryt
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/portfolios/${portfolioId}/share`
                )
                setShowShareModal(false)
              }}
            >
              Kopier lenke
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}