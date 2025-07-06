'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from '@/components/ui/modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building,
  MapPin,
  X,
} from 'lucide-react'
import { getTransactions } from '@/lib/actions/stocks/crud'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'

// Types
interface StockDetailModalProps {
  isOpen: boolean
  onClose: () => void
  stockData: HoldingWithMetrics
  isMobile?: boolean
}

interface Transaction {
  id: string
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND'
  date: string
  quantity: number
  price: number
  total_amount: number
  currency: string
  fees: number | null
  notes: string | null
  stock?: {
    symbol: string
    name: string
  }
  account?: {
    name: string
  }
}

// Stock Header Component
const StockHeader = ({ stockData }: { stockData: HoldingWithMetrics }) => {
  const stock = stockData.stocks
  const currentPrice = stockData.current_price || 0
  const dayChange = stockData.daily_change || 0
  const dayChangePercent = stockData.daily_change_percent || 0
  const isPositive = dayChange >= 0

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {stock?.symbol || 'N/A'}
          </h2>
          <Badge variant="outline" className="text-xs">
            {stock?.exchange || 'N/A'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {stock?.currency || stockData.currency}
          </Badge>
        </div>
        <p className="mb-1 text-sm text-gray-600">
          {stock?.name || stock?.company_name || 'Unknown Company'}
        </p>
        {stock?.sector && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Building className="h-3 w-3" />
            {stock.sector}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="mb-1 text-2xl font-bold text-gray-900">
          {currentPrice > 0
            ? formatCurrency(currentPrice, stock?.currency || 'NOK')
            : '—'}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-sm',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>
            {formatCurrency(Math.abs(dayChange), stock?.currency || 'NOK')}
          </span>
          <span>({formatPercentage(dayChangePercent)})</span>
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
const OverviewTab = ({ stockData }: { stockData: HoldingWithMetrics }) => {
  const currentPrice = stockData.current_price || 0
  const marketValue =
    stockData.current_value || stockData.quantity * currentPrice
  const unrealizedPnl = stockData.gain_loss || 0
  const unrealizedPnlPercent = stockData.gain_loss_percent || 0

  const isPositive = unrealizedPnl >= 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Kvantitet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {stockData.quantity.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-gray-500">aksjer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gjennomsnittspris
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(
                stockData.cost_basis,
                stockData.stocks?.currency || 'NOK'
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">per aksje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Markedsverdi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(marketValue, stockData.stocks?.currency || 'NOK')}
            </div>
            <p className="mt-1 text-xs text-gray-500">nåværende verdi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Kostbasis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(
                stockData.cost_basis * stockData.quantity,
                stockData.stocks?.currency || 'NOK'
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">totalt investert</p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Urealisert P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'text-3xl font-bold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositive ? '+' : ''}
                {formatCurrency(
                  unrealizedPnl,
                  stockData.stocks?.currency || 'NOK'
                )}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                ({formatPercentage(unrealizedPnlPercent)})
              </div>
            </div>
            <div
              className={cn(
                'rounded-full p-2',
                isPositive ? 'bg-green-100' : 'bg-red-100'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aksjeinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sektor</span>
            <span className="text-sm font-medium">
              {stockData.stocks?.sector || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Aktivaklasse</span>
            <span className="text-sm font-medium">
              {stockData.stocks?.asset_type || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Markedsverdi</span>
            <span className="text-sm font-medium">
              {stockData.stocks?.market_cap
                ? formatCurrency(
                    stockData.stocks.market_cap,
                    stockData.stocks.currency
                  )
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vekt i portefølje</span>
            <span className="text-sm font-medium">
              {formatPercentage(stockData.weight)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prishistorikk</CardTitle>
          <CardDescription>Interaktivt diagram kommer snart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50">
            <div className="text-center text-gray-500">
              <Activity className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">TradingView integrasjon kommer snart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Transactions Tab Component
const TransactionsTab = ({ stockData }: { stockData: HoldingWithMetrics }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        // For now, we'll show a placeholder since we need the actual user ID and stock ID
        // In a real implementation, we'd get the current user and fetch transactions
        // We can implement this properly once we have access to user context
        setTransactions([])
        setLoading(false)
      } catch (err) {
        setError('An error occurred while fetching transactions')
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [stockData.symbol])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Prøv igjen
        </Button>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-gray-600">Ingen transaksjoner funnet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map(transaction => (
        <Card key={transaction.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-full p-2',
                    transaction.transaction_type === 'BUY'
                      ? 'bg-green-100 text-green-600'
                      : transaction.transaction_type === 'SELL'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                  )}
                >
                  {transaction.transaction_type === 'BUY' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : transaction.transaction_type === 'SELL' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {transaction.transaction_type === 'BUY'
                      ? 'Kjøp'
                      : transaction.transaction_type === 'SELL'
                        ? 'Salg'
                        : 'Utbytte'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {transaction.quantity.toLocaleString()} aksjer
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(transaction.price, transaction.currency)} per
                  aksje
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(
                    transaction.total_amount,
                    transaction.currency
                  )}
                </div>
              </div>
            </div>
            {transaction.notes && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm text-gray-600">{transaction.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Performance Tab Component
const PerformanceTab = ({ stockData }: { stockData: HoldingWithMetrics }) => {
  const currentPrice = stockData.current_price || 0
  const marketValue =
    stockData.current_value || stockData.quantity * currentPrice
  const unrealizedPnl = stockData.gain_loss || 0
  const unrealizedPnlPercent = stockData.gain_loss_percent || 0
  const totalCost = stockData.cost_basis * stockData.quantity

  // For now, we don't have holding period data in the HoldingWithMetrics interface
  // This would need to be calculated or added to the interface
  const holdingPeriod = 0
  const firstPurchaseDate = 'N/A'

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Ytelsessammendrag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Totalt investert</span>
            <span className="text-sm font-medium">
              {formatCurrency(totalCost, stockData.stocks?.currency || 'NOK')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Nåværende verdi</span>
            <span className="text-sm font-medium">
              {formatCurrency(marketValue, stockData.stocks?.currency || 'NOK')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Urealisert P&L</span>
            <span
              className={cn(
                'text-sm font-medium',
                unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {unrealizedPnl >= 0 ? '+' : ''}
              {formatCurrency(
                unrealizedPnl,
                stockData.stocks?.currency || 'NOK'
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Prosentvis endring</span>
            <span
              className={cn(
                'text-sm font-medium',
                unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatPercentage(unrealizedPnlPercent)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Holding Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holdeperiode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Første kjøp</span>
            <span className="text-sm font-medium">{firstPurchaseDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Dager holdt</span>
            <span className="text-sm font-medium">
              {holdingPeriod.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Måneder holdt</span>
            <span className="text-sm font-medium">
              {Math.floor(holdingPeriod / 30).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Ytelsesanalyse</CardTitle>
          <CardDescription>
            Avansert ytelsesanalyse kommer snart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50">
            <div className="text-center text-gray-500">
              <PieChart className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Avanserte diagrammer kommer snart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Modal Component
export default function StockDetailModal({
  isOpen,
  onClose,
  stockData,
  isMobile = false,
}: StockDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
      setIsLoading(true)
      // Simulate data loading
      const timer = setTimeout(() => setIsLoading(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!stockData) {
    return null
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent
        size={isMobile ? 'full' : 'xl'}
        className="max-h-[90vh] overflow-hidden"
      >
        <ModalHeader className="pb-4">
          <StockHeader stockData={stockData} />
        </ModalHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-4 p-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="mb-2 h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Oversikt</TabsTrigger>
                <TabsTrigger value="transactions">Transaksjoner</TabsTrigger>
                <TabsTrigger value="performance">Ytelse</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-4">
                  <OverviewTab stockData={stockData} />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <TransactionsTab stockData={stockData} />
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <PerformanceTab stockData={stockData} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}

// Export the component for use in other files
export { StockDetailModal }
