'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShareIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
  CloudArrowUpIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { AnimatedCard } from '@/components/animated'
import AddStockModal from '@/components/stocks/add-stock-modal'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { cn } from '@/lib/utils/cn'

interface QuickActionsProps {
  portfolioId: string
  className?: string
  variant?: 'compact' | 'full'
  orientation?: 'horizontal' | 'vertical'
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray'
  description?: string
}

interface ExportFormat {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  action: () => void
}

export default function QuickActions({
  portfolioId,
  className,
  variant = 'full',
  orientation = 'horizontal',
}: QuickActionsProps) {
  const [showAddStock, setShowAddStock] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const {
    portfolio,
    refresh,
    loading,
    error,
    metrics,
    holdings,
    isPricesConnected,
  } = usePortfolioState(portfolioId)

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      toast({
        title: 'Oppdatert',
        description: 'Porteføljen er oppdatert med de nyeste dataene.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Feil ved oppdatering',
        description: 'Kunne ikke oppdatere porteføljen. Prøv igjen.',
        variant: 'error',
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [refresh])

  // Handle export functions
  const exportToCSV = useCallback(async () => {
    setIsExporting('csv')
    try {
      // Create CSV content
      const headers = ['Symbol', 'Navn', 'Antall', 'Kostbasis', 'Nåværende kurs', 'Markedsverdi', 'Gevinst/Tap', 'Gevinst/Tap %', 'Vekt %']
      const rows = holdings.map(holding => [
        holding.symbol,
        holding.stocks?.name || '',
        holding.quantity.toString(),
        holding.cost_basis.toString(),
        holding.current_price.toString(),
        holding.current_value.toString(),
        holding.gain_loss.toString(),
        holding.gain_loss_percent.toFixed(2),
        holding.weight.toFixed(2),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${portfolio?.name || 'portfolio'}_beholdninger.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Eksportert til CSV',
        description: 'Beholdningene er eksportert til CSV-fil.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Eksport feilet',
        description: 'Kunne ikke eksportere til CSV. Prøv igjen.',
        variant: 'error',
      })
    } finally {
      setIsExporting(null)
      setShowExportModal(false)
    }
  }, [holdings, portfolio?.name])

  const exportToPDF = useCallback(async () => {
    setIsExporting('pdf')
    try {
      // In a real implementation, you would use a PDF library like jsPDF
      toast({
        title: 'PDF eksport',
        description: 'PDF eksport er ikke implementert ennå.',
        variant: 'info',
      })
    } catch (error) {
      toast({
        title: 'Eksport feilet',
        description: 'Kunne ikke eksportere til PDF. Prøv igjen.',
        variant: 'error',
      })
    } finally {
      setIsExporting(null)
      setShowExportModal(false)
    }
  }, [])

  const exportToExcel = useCallback(async () => {
    setIsExporting('excel')
    try {
      // In a real implementation, you would use a library like SheetJS
      toast({
        title: 'Excel eksport',
        description: 'Excel eksport er ikke implementert ennå.',
        variant: 'info',
      })
    } catch (error) {
      toast({
        title: 'Eksport feilet',
        description: 'Kunne ikke eksportere til Excel. Prøv igjen.',
        variant: 'error',
      })
    } finally {
      setIsExporting(null)
      setShowExportModal(false)
    }
  }, [])

  // Handle share functionality
  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/portfolios/${portfolioId}/share`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${portfolio?.name} - LifeDash`,
          text: 'Sjekk ut min investeringsportefølje',
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopiedToClipboard(true)
        setTimeout(() => setCopiedToClipboard(false), 2000)
        toast({
          title: 'Lenke kopiert',
          description: 'Portefølje-lenken er kopiert til utklippstavlen.',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Kunne ikke kopiere',
          description: 'Lenken kunne ikke kopieres til utklippstavlen.',
          variant: 'error',
        })
      }
    }
  }, [portfolioId, portfolio?.name])

  // Export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'csv',
      label: 'CSV',
      description: 'Kommaseparerte verdier - åpnes i Excel/Sheets',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      action: exportToCSV,
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Profesjonell rapport for utskrift',
      icon: <PrinterIcon className="h-5 w-5" />,
      action: exportToPDF,
    },
    {
      id: 'excel',
      label: 'Excel',
      description: 'Regneark med formler og diagrammer',
      icon: <CloudArrowUpIcon className="h-5 w-5" />,
      action: exportToExcel,
    },
  ]

  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'add-stock',
      label: variant === 'compact' ? 'Legg til' : 'Legg til aksje',
      icon: <PlusIcon className="h-4 w-4" />,
      shortcut: 'Ctrl+N',
      action: () => setShowAddStock(true),
      variant: 'primary',
      color: 'blue',
      description: 'Legg til en ny aksje i porteføljen',
    },
    {
      id: 'refresh',
      label: variant === 'compact' ? 'Oppdater' : 'Oppdater priser',
      icon: <ArrowPathIcon className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />,
      shortcut: 'Ctrl+R',
      action: handleRefresh,
      loading: isRefreshing,
      variant: 'outline',
      color: 'green',
      description: 'Hent de nyeste aksjekursene',
    },
    {
      id: 'export',
      label: 'Eksporter',
      icon: <ArrowDownTrayIcon className="h-4 w-4" />,
      shortcut: 'Ctrl+E',
      action: () => setShowExportModal(true),
      variant: 'outline',
      color: 'orange',
      description: 'Eksporter porteføljadata',
      disabled: holdings.length === 0,
    },
    {
      id: 'share',
      label: 'Del',
      icon: copiedToClipboard ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />,
      action: () => setShowShareModal(true),
      variant: 'ghost',
      color: 'gray',
      description: 'Del porteføljen med andre',
    },
  ]

  // Additional actions for full variant
  const additionalActions: QuickAction[] = [
    {
      id: 'analytics',
      label: 'Analyse',
      icon: <ChartBarIcon className="h-4 w-4" />,
      action: () => {
        toast({
          title: 'Analyse',
          description: 'Porteføljeanalyse er ikke implementert ennå.',
          variant: 'info',
        })
      },
      variant: 'ghost',
      color: 'gray',
      description: 'Avansert porteføljeanalyse',
    },
    {
      id: 'settings',
      label: 'Innstillinger',
      icon: <Cog6ToothIcon className="h-4 w-4" />,
      action: () => {
        toast({
          title: 'Innstillinger',
          description: 'Porteføljeinnstillinger er ikke implementert ennå.',
          variant: 'info',
        })
      },
      variant: 'ghost',
      color: 'gray',
      description: 'Porteføljeinnstillinger',
    },
  ]

  const allActions = variant === 'full' 
    ? [...quickActions, ...additionalActions]
    : quickActions

  const containerClass = cn(
    'flex gap-2',
    orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
    className
  )

  const buttonClass = (action: QuickAction) => cn(
    'transition-all duration-200',
    orientation === 'vertical' && 'justify-start',
    action.loading && 'opacity-75 cursor-not-allowed'
  )

  return (
    <>
      <div className={containerClass}>
        {/* Connection Status Indicator */}
        {variant === 'full' && (
          <div className="flex items-center space-x-2 text-sm">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isPricesConnected ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            <span className="text-gray-600">
              {isPricesConnected ? 'Live priser' : 'Offline modus'}
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        {allActions.map((action) => (
          <motion.div
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={action.variant}
              size={variant === 'compact' ? 'sm' : 'default'}
              onClick={action.action}
              disabled={action.disabled || action.loading}
              className={buttonClass(action)}
              title={action.description}
            >
              {action.icon}
              {variant === 'full' && (
                <span className="ml-2">{action.label}</span>
              )}
              {action.shortcut && variant === 'full' && (
                <span className="ml-auto text-xs text-gray-500">
                  {action.shortcut}
                </span>
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStock}
        onClose={() => setShowAddStock(false)}
        portfolioId={portfolioId}
        onSuccess={() => {
          setShowAddStock(false)
          refresh()
          toast({
            title: 'Aksje lagt til',
            description: 'Aksjen er lagt til i porteføljen.',
            variant: 'success',
          })
        }}
      />

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Eksporter portefølje"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Velg format for å eksportere porteføljedataene dine.
          </p>

          <div className="space-y-3">
            {exportFormats.map((format) => (
              <motion.button
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={format.action}
                disabled={isExporting === format.id}
                className={cn(
                  'w-full p-4 border border-gray-200 rounded-lg text-left transition-all',
                  'hover:border-blue-300 hover:bg-blue-50',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isExporting === format.id && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">
                    {isExporting === format.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      format.icon
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {format.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
            >
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Del portefølje"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Del din portefølje med andre ved å sende dem lenken nedenfor.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-800 flex-1 truncate">
                  {typeof window !== 'undefined' 
                    ? `${window.location.origin}/portfolios/${portfolioId}/share`
                    : '#'
                  }
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="ml-2"
                >
                  {copiedToClipboard ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Personvernmerknader</p>
                <p>
                  Når du deler porteføljen, vil mottakere kun se beholdninger og 
                  ytelse - ikke personlig informasjon eller transaksjonshistorikk.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(false)}
            >
              Lukk
            </Button>
            <Button onClick={handleShare}>
              {navigator.share ? 'Del' : 'Kopier lenke'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}