'use client'

import { useState, useCallback, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  ShareIcon,
  DocumentTextIcon,
  PrinterIcon,
  CloudArrowUpIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  InformationCircleIcon,
  DocumentArrowUpIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
  TableCellsIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { AnimatedCard } from '@/components/animated/animated-card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import AddStockModal from '@/components/stocks/add-stock-modal'
// import { CSVUploadZone } from '@/components/features/import/csv-upload'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'
import { cn } from '@/lib/utils/cn'
// import { NordnetParseResult } from '@/lib/integrations/nordnet/types'

interface PortfolioToolsSectionProps {
  portfolioId: string
  className?: string
  defaultExpanded?: boolean
}

interface Tool {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  description: string
  loading?: boolean
  disabled?: boolean
  badge?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

interface ToolCategory {
  id: string
  label: string
  icon: React.ReactNode
  tools: Tool[]
}

const PortfolioToolsSection = memo(function PortfolioToolsSection({
  portfolioId,
  className,
  defaultExpanded = false,
}: PortfolioToolsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showAddStock, setShowAddStock] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const { portfolio, refresh, holdings, isPricesConnected } =
    usePortfolioState(portfolioId)

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

  // Export functions
  const exportToCSV = useCallback(async () => {
    setIsExporting('csv')
    try {
      const headers = [
        'Symbol',
        'Navn',
        'Antall',
        'Kostbasis',
        'Nåværende kurs',
        'Markedsverdi',
        'Gevinst/Tap',
        'Gevinst/Tap %',
        'Vekt %',
      ]
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
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `${portfolio?.name || 'portefolje'}_beholdninger.csv`
      )
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
      toast({
        title: 'PDF eksport',
        description: 'PDF eksport er under utvikling.',
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
      toast({
        title: 'Excel eksport',
        description: 'Excel eksport er under utvikling.',
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

  // Tool categories
  const toolCategories: ToolCategory[] = useMemo(
    () => [
      {
        id: 'export',
        label: 'Eksport',
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        tools: [
          {
            id: 'export-csv',
            label: 'Eksporter CSV',
            icon: <DocumentTextIcon className="h-4 w-4" />,
            action: () => setShowExportModal(true),
            description: 'Last ned porteføljedata som CSV-fil',
            disabled: holdings.length === 0,
            variant: 'outline',
          },
          {
            id: 'export-excel',
            label: 'Eksporter Excel',
            icon: <TableCellsIcon className="h-4 w-4" />,
            action: () => setShowExportModal(true),
            description: 'Last ned som Excel-arbeidsbok',
            disabled: holdings.length === 0,
            variant: 'outline',
          },
          {
            id: 'export-pdf',
            label: 'Eksporter PDF',
            icon: <PrinterIcon className="h-4 w-4" />,
            action: () => setShowExportModal(true),
            description: 'Generer PDF-rapport',
            disabled: holdings.length === 0,
            variant: 'outline',
          },
        ],
      },
      {
        id: 'import',
        label: 'Import',
        icon: <ArrowUpTrayIcon className="h-5 w-5" />,
        tools: [
          {
            id: 'import-csv',
            label: 'Importer CSV',
            icon: <DocumentArrowUpIcon className="h-4 w-4" />,
            action: () => setShowImportModal(true),
            description: 'Last opp CSV-fil fra megler',
            variant: 'outline',
          },
          {
            id: 'import-nordnet',
            label: 'Nordnet Import',
            icon: <CloudArrowUpIcon className="h-4 w-4" />,
            action: () => setShowImportModal(true),
            description: 'Import direkte fra Nordnet',
            variant: 'outline',
            badge: 'Beta',
          },
        ],
      },
      {
        id: 'management',
        label: 'Administrasjon',
        icon: <CogIcon className="h-5 w-5" />,
        tools: [
          {
            id: 'add-stock',
            label: 'Legg til aksje',
            icon: <PlusIcon className="h-4 w-4" />,
            action: () => setShowAddStock(true),
            description: 'Legg til en ny aksje manuelt',
            variant: 'primary',
          },
          {
            id: 'refresh-prices',
            label: 'Oppdater kurser',
            icon: (
              <ArrowPathIcon
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            ),
            action: handleRefresh,
            description: 'Hent de nyeste aksjekursene',
            loading: isRefreshing,
            badge: !isPricesConnected ? 'Offline' : undefined,
            variant: 'secondary',
          },
          {
            id: 'share-portfolio',
            label: 'Del portefølje',
            icon: copiedToClipboard ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ShareIcon className="h-4 w-4" />
            ),
            action: () => setShowShareModal(true),
            description: 'Del porteføljen med andre',
            variant: 'ghost',
          },
        ],
      },
      {
        id: 'analytics',
        label: 'Analyse',
        icon: <ChartBarIcon className="h-5 w-5" />,
        tools: [
          {
            id: 'performance-analysis',
            label: 'Ytelsesanalyse',
            icon: <PresentationChartBarIcon className="h-4 w-4" />,
            action: () => {
              toast({
                title: 'Ytelsesanalyse',
                description: 'Avansert analyse er under utvikling.',
                variant: 'info',
              })
            },
            description: 'Detaljert analyse av porteføljens ytelse',
            variant: 'ghost',
          },
          {
            id: 'risk-analysis',
            label: 'Risikoanalyse',
            icon: <DocumentChartBarIcon className="h-4 w-4" />,
            action: () => {
              toast({
                title: 'Risikoanalyse',
                description: 'Risikoanalyse er under utvikling.',
                variant: 'info',
              })
            },
            description: 'Analyser porteføljens risikoprofil',
            variant: 'ghost',
          },
          {
            id: 'portfolio-report',
            label: 'Porteføljerapport',
            icon: <DocumentDuplicateIcon className="h-4 w-4" />,
            action: () => {
              toast({
                title: 'Porteføljerapport',
                description: 'Rapportgenerering er under utvikling.',
                variant: 'info',
              })
            },
            description: 'Generer omfattende porteføljerapport',
            variant: 'ghost',
          },
        ],
      },
    ],
    [
      holdings.length,
      isRefreshing,
      isPricesConnected,
      copiedToClipboard,
      handleRefresh,
    ]
  )

  const exportFormats = useMemo(
    () => [
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
        icon: <TableCellsIcon className="h-5 w-5" />,
        action: exportToExcel,
      },
    ],
    [exportToCSV, exportToPDF, exportToExcel]
  )

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  return (
    <>
      <AnimatedCard
        className={cn('transition-all duration-300', className)}
        animation="slideUp"
        hover={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center space-x-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Verktøy</h3>
            <Badge variant="secondary" className="text-xs">
              {toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Connection Status */}
        {isExpanded && (
          <div className="px-4 pb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isPricesConnected ? 'bg-green-500' : 'bg-yellow-500'
                )}
              />
              <span>
                {isPricesConnected
                  ? 'Live kurser tilgjengelig'
                  : 'Offline modus'}
              </span>
            </div>
          </div>
        )}

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-6 p-4 pt-0">
                {toolCategories.map((category, categoryIndex) => (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className="mb-3 flex items-center space-x-2">
                      <div className="text-gray-500">{category.icon}</div>
                      <h4 className="text-sm font-medium text-gray-700">
                        {category.label}
                      </h4>
                    </div>

                    {/* Tools Grid */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {category.tools.map((tool, toolIndex) => (
                        <motion.div
                          key={tool.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: categoryIndex * 0.1 + toolIndex * 0.05,
                          }}
                        >
                          <Button
                            variant={tool.variant}
                            size="sm"
                            onClick={tool.action}
                            disabled={tool.disabled || tool.loading}
                            className={cn(
                              'w-full justify-start space-x-2 text-left',
                              'min-h-[44px] p-3',
                              tool.loading && 'cursor-not-allowed opacity-75'
                            )}
                            title={tool.description}
                          >
                            <div className="flex items-center space-x-2">
                              {tool.icon}
                              <span className="flex-1 truncate">
                                {tool.label}
                              </span>
                              {tool.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {tool.badge}
                                </Badge>
                              )}
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Separator between categories */}
                    {categoryIndex < toolCategories.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedCard>

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
            {exportFormats.map(format => (
              <motion.button
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={format.action}
                disabled={isExporting === format.id}
                className={cn(
                  'w-full rounded-lg border border-gray-200 p-4 text-left transition-all',
                  'hover:border-blue-300 hover:bg-blue-50',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isExporting === format.id && 'cursor-not-allowed opacity-50'
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

          <div className="flex justify-end space-x-2 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer porteføljedata"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Last opp CSV-fil fra din megler for å importere transaksjoner.
          </p>

          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 space-y-2">
              <p className="text-lg font-medium">CSV Import</p>
              <p className="text-sm text-gray-500">
                CSV import funksjonalitet er under utvikling.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: 'Under utvikling',
                    description: 'CSV import vil være tilgjengelig snart.',
                    variant: 'info',
                  })
                }}
              >
                Velg CSV-fil
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
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
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <code className="flex-1 truncate text-sm text-gray-800">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/portfolios/${portfolioId}/share`
                    : '#'}
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

            <div className="flex items-start space-x-2 rounded-lg bg-blue-50 p-3">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Personvernmerknader</p>
                <p>
                  Når du deler porteføljen, vil mottakere kun se beholdninger og
                  ytelse - ikke personlig informasjon eller
                  transaksjonshistorikk.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
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
})

PortfolioToolsSection.displayName = 'PortfolioToolsSection'

export default PortfolioToolsSection
