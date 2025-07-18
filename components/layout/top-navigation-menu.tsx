'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  ChevronDownIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils/cn'
import CSVImportModal from '@/components/stocks/csv-import-modal'
import AddBrokerModal from '@/components/brokers/add-broker-modal'

interface TopNavigationMenuProps {
  portfolioId?: string
  className?: string
  onImportComplete?: () => void
}

interface ToolAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  description?: string
}

export default function TopNavigationMenu({
  portfolioId,
  className,
  onImportComplete,
}: TopNavigationMenuProps) {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCSVImportModal, setShowCSVImportModal] = useState(false)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Tool actions
  const handleCSVImport = useCallback(() => {
    setShowToolsDropdown(false)
    setShowCSVImportModal(true)
  }, [])

  const handleCSVExport = useCallback(async () => {
    setShowToolsDropdown(false)
    setIsExporting(true)

    try {
      // TODO: Implement actual CSV export
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate export

      toast({
        title: 'CSV Eksportert',
        description: 'Portefølje data er eksportert som CSV fil.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Eksport Feilet',
        description: 'Kunne ikke eksportere CSV fil. Prøv igjen.',
        variant: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleSharePortfolio = useCallback(() => {
    setShowToolsDropdown(false)
    setShowShareModal(true)
  }, [])

  const handleCopyShareLink = useCallback(() => {
    if (typeof window !== 'undefined' && portfolioId) {
      const shareUrl = `${window.location.origin}/portfolios/${portfolioId}/share`
      navigator.clipboard.writeText(shareUrl)

      toast({
        title: 'Lenke Kopiert',
        description: 'Delingslenke er kopiert til utklippstavlen.',
        variant: 'success',
      })
    }
    setShowShareModal(false)
  }, [portfolioId])

  const handleCSVImportComplete = useCallback(() => {
    setShowCSVImportModal(false)
    onImportComplete?.()
    toast({
      title: 'CSV Import Fullført',
      description: 'Transaksjoner er importert og porteføljen oppdatert.',
      variant: 'success',
    })
  }, [onImportComplete])

  const handleConnectBroker = useCallback(() => {
    setShowToolsDropdown(false)
    setShowBrokerModal(true)
  }, [])

  const handleBrokerConnected = useCallback((connection: any) => {
    setShowBrokerModal(false)
    onImportComplete?.() // Refresh holdings after broker connection
    toast({
      title: 'Megler Tilkoblet',
      description: `${connection.display_name} er nå tilkoblet og synkroniserer dine beholdninger.`,
      variant: 'success',
    })
  }, [onImportComplete])

  // Tool actions configuration
  const toolActions: ToolAction[] = [
    {
      id: 'connect-broker',
      label: 'Koble til Megler',
      icon: <LinkIcon className="h-4 w-4" />,
      action: handleConnectBroker,
      description: 'Koble til din megler for automatisk synkronisering',
    },
    {
      id: 'csv-import',
      label: 'CSV Import',
      icon: <DocumentArrowUpIcon className="h-4 w-4" />,
      action: handleCSVImport,
      description: 'Importer transaksjoner fra CSV fil',
    },
    {
      id: 'csv-export',
      label: 'CSV Eksport',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      action: handleCSVExport,
      description: 'Eksporter portefølje som CSV fil',
    },
    {
      id: 'share',
      label: 'Del Portefølje',
      icon: <ShareIcon className="h-4 w-4" />,
      action: handleSharePortfolio,
      description: 'Del portefølje med andre',
    },
  ]

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-50 w-full border-b border-blue-200/30 bg-gradient-to-r from-blue-900/95 to-blue-800/95 backdrop-blur-sm',
          className
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-white">LifeDash</h1>
            </div>

            {/* Center Navigation */}
            <div className="hidden items-center space-x-6 md:flex">
              {/* Tools Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className="flex items-center space-x-1 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <span>Verktøy</span>
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      showToolsDropdown && 'rotate-180'
                    )}
                  />
                </Button>

                <AnimatePresence>
                  {showToolsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
                    >
                      <div className="p-2">
                        {toolActions.map(tool => (
                          <button
                            key={tool.id}
                            onClick={tool.action}
                            disabled={isExporting && tool.id === 'csv-export'}
                            className="flex w-full items-start space-x-3 rounded-md p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="flex-shrink-0 text-gray-500">
                              {tool.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {tool.label}
                                {isExporting && tool.id === 'csv-export' && (
                                  <span className="ml-2 text-xs text-blue-600">
                                    Eksporterer...
                                  </span>
                                )}
                              </p>
                              {tool.description && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="text-white/90 hover:bg-white/10 hover:text-white"
              >
                <Bars3Icon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {showToolsDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 py-2 md:hidden"
              >
                {toolActions.map(tool => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    disabled={isExporting && tool.id === 'csv-export'}
                    className="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <div className="text-gray-500">{tool.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tool.label}
                        {isExporting && tool.id === 'csv-export' && (
                          <span className="ml-2 text-xs text-blue-600">
                            Eksporterer...
                          </span>
                        )}
                      </p>
                      {tool.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Click outside to close dropdown */}
        {showToolsDropdown && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowToolsDropdown(false)}
          />
        )}
      </nav>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Del Portefølje"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button onClick={handleCopyShareLink} className="w-full">
              Kopier Delingslenke
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={() => setShowCSVImportModal(false)}
        onImportComplete={handleCSVImportComplete}
      />

      {/* Add Broker Modal */}
      <AddBrokerModal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        onSuccess={handleBrokerConnected}
      />
    </>
  )
}
