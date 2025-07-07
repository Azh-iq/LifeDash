'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader } from '@/components/ui/modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Globe,
  BarChart3,
  Newspaper,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { HoldingWithMetrics } from '@/lib/hooks/use-portfolio-state'
import {
  APIErrorBoundary,
  RenderErrorBoundary,
} from '@/components/ui/error-boundaries'
import {
  fetchCompanyProfile,
  fetchBasicFinancials,
  fetchCompanyNews,
  CompanyProfile,
  BasicFinancials,
  CompanyNews,
} from '@/lib/utils/finnhub-api'

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
const StockHeader = ({
  stockData,
  companyProfile,
}: {
  stockData: HoldingWithMetrics
  companyProfile: CompanyProfile | null
}) => {
  const stock = stockData.stocks
  const currentPrice = stockData.current_price || 0
  const dayChange = stockData.daily_change || 0
  const dayChangePercent = stockData.daily_change_percent || 0
  const isPositive = dayChange >= 0

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-3">
          {companyProfile?.logo && (
            <img
              src={companyProfile.logo}
              alt={`${companyProfile.name} logo`}
              className="h-8 w-8 rounded object-contain"
              onError={e => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {stock?.symbol || 'N/A'}
          </h2>
          <Badge
            variant="secondary"
            className="bg-purple-100 text-xs text-purple-700"
          >
            {companyProfile?.currency || stock?.currency || 'NOK'}
          </Badge>
          {companyProfile?.exchange && (
            <Badge
              variant="outline"
              className="border-purple-200 text-xs text-purple-600"
            >
              {companyProfile.exchange}
            </Badge>
          )}
        </div>
        <p className="mb-1 text-sm text-purple-600">
          {companyProfile?.name || stock?.name || 'Unknown Company'}
        </p>
        {(companyProfile?.finnhubIndustry || stock?.sector) && (
          <p className="flex items-center gap-1 text-xs text-purple-600">
            <Building className="h-3 w-3" />
            {companyProfile?.finnhubIndustry || stock.sector}
          </p>
        )}
        {companyProfile?.country && (
          <p className="flex items-center gap-1 text-xs text-purple-500">
            <Globe className="h-3 w-3" />
            {companyProfile.country}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="mb-1 text-2xl font-bold text-gray-900">
          {currentPrice > 0
            ? formatCurrency(
                currentPrice,
                companyProfile?.currency || stock?.currency || 'NOK'
              )
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
            {formatCurrency(
              Math.abs(dayChange),
              companyProfile?.currency || stock?.currency || 'NOK'
            )}
          </span>
          <span>({formatPercentage(dayChangePercent)})</span>
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
const OverviewTab = ({
  stockData,
  companyProfile,
  basicFinancials,
}: {
  stockData: HoldingWithMetrics
  companyProfile: CompanyProfile | null
  basicFinancials: BasicFinancials | null
}) => {
  const currentPrice = stockData.current_price || 0
  const marketValue =
    stockData.current_value || stockData.quantity * currentPrice
  const unrealizedPnl = stockData.gain_loss || 0
  const unrealizedPnlPercent = stockData.gain_loss_percent || 0

  const isPositive = unrealizedPnl >= 0

  // Format large numbers for display
  const formatLargeNumber = (num: number, currency = 'NOK') => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B ${currency}`
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M ${currency}`
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K ${currency}`
    }
    return formatCurrency(num, currency)
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">
              Kvantitet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {stockData.quantity.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-purple-500">aksjer</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">
              Gjennomsnittspris
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(
                stockData.cost_basis,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </div>
            <p className="mt-1 text-xs text-purple-500">per aksje</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">
              Markedsverdi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(
                marketValue,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </div>
            <p className="mt-1 text-xs text-purple-500">nåværende verdi</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">
              Kostbasis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(
                stockData.cost_basis * stockData.quantity,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </div>
            <p className="mt-1 text-xs text-purple-500">totalt investert</p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Section */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="h-5 w-5 text-purple-600" />
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
                  companyProfile?.currency ||
                    stockData.stocks?.currency ||
                    'NOK'
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

      {/* Company Info */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Building className="h-5 w-5 text-purple-600" />
            Selskapsinfo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyProfile?.weburl && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Nettside</span>
              <a
                href={companyProfile.weburl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-900"
              >
                <span className="max-w-[200px] truncate">
                  {companyProfile.weburl.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Bransje</span>
            <span className="text-sm font-medium">
              {companyProfile?.finnhubIndustry ||
                stockData.stocks?.sector ||
                'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Børs</span>
            <span className="text-sm font-medium">
              {companyProfile?.exchange || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Markedsverdi</span>
            <span className="text-sm font-medium">
              {companyProfile?.marketCapitalization
                ? formatLargeNumber(
                    companyProfile.marketCapitalization * 1e6,
                    companyProfile.currency
                  )
                : basicFinancials?.metric?.marketCapitalization
                  ? formatLargeNumber(
                      basicFinancials.metric.marketCapitalization * 1e6,
                      companyProfile?.currency || 'USD'
                    )
                  : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Aksjer utestående</span>
            <span className="text-sm font-medium">
              {companyProfile?.shareOutstanding
                ? `${(companyProfile.shareOutstanding / 1e6).toFixed(1)}M`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Vekt i portefølje</span>
            <span className="text-sm font-medium">
              {formatPercentage(stockData.weight)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Financial Metrics */}
      {basicFinancials?.metric && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Nøkkeltall
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {basicFinancials.metric.peBasicExclExtraTTM && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">P/E-forhold</span>
                <span className="text-sm font-medium">
                  {basicFinancials.metric.peBasicExclExtraTTM.toFixed(1)}
                </span>
              </div>
            )}
            {basicFinancials.metric.ptbvAnnual && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">P/B-forhold</span>
                <span className="text-sm font-medium">
                  {basicFinancials.metric.ptbvAnnual.toFixed(1)}
                </span>
              </div>
            )}
            {basicFinancials.metric['52WeekHigh'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">52-ukers høy</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    basicFinancials.metric['52WeekHigh'],
                    companyProfile?.currency || 'USD'
                  )}
                </span>
              </div>
            )}
            {basicFinancials.metric['52WeekLow'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">52-ukers lav</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    basicFinancials.metric['52WeekLow'],
                    companyProfile?.currency || 'USD'
                  )}
                </span>
              </div>
            )}
            {basicFinancials.metric.beta && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">Beta</span>
                <span className="text-sm font-medium">
                  {basicFinancials.metric.beta.toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Placeholder for Chart */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-700">Prishistorikk</CardTitle>
          <CardDescription>Interaktivt diagram kommer snart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-purple-50">
            <div className="text-center text-purple-600">
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
        <Calendar className="mx-auto mb-4 h-12 w-12 text-purple-400" />
        <p className="text-purple-600">Ingen transaksjoner funnet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map(transaction => (
        <Card key={transaction.id} className="border-purple-200">
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
                        : 'bg-purple-100 text-purple-600'
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
                  <div className="text-sm text-purple-500">
                    {new Date(transaction.date).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {transaction.quantity.toLocaleString()} aksjer
                </div>
                <div className="text-sm text-purple-500">
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
                <p className="text-sm text-purple-600">{transaction.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Fundamentals Tab Component
const FundamentalsTab = ({
  stockData,
  companyProfile,
  basicFinancials,
}: {
  stockData: HoldingWithMetrics
  companyProfile: CompanyProfile | null
  basicFinancials: BasicFinancials | null
}) => {
  if (!basicFinancials?.metric) {
    return (
      <div className="py-8 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-purple-400" />
        <p className="text-purple-600">Fundamentale data ikke tilgjengelig</p>
      </div>
    )
  }

  const metric = basicFinancials.metric

  return (
    <div className="space-y-6">
      {/* Valuation Metrics */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Verdsettelse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metric.peBasicExclExtraTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">P/E-forhold (TTM)</span>
              <span className="text-sm font-medium">
                {metric.peBasicExclExtraTTM.toFixed(1)}
              </span>
            </div>
          )}
          {metric.ptbvAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">P/B-forhold</span>
              <span className="text-sm font-medium">
                {metric.ptbvAnnual.toFixed(1)}
              </span>
            </div>
          )}
          {metric.psAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">P/S-forhold</span>
              <span className="text-sm font-medium">
                {metric.psAnnual.toFixed(1)}
              </span>
            </div>
          )}
          {metric.pfcfShareTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">P/FCF-forhold</span>
              <span className="text-sm font-medium">
                {metric.pfcfShareTTM.toFixed(1)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profitability Metrics */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Lønnsomhet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metric.roeAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">ROE (Årlig)</span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.roeAnnual)}
              </span>
            </div>
          )}
          {metric.roaAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">ROA (Årlig)</span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.roaAnnual)}
              </span>
            </div>
          )}
          {metric.roiAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">ROI (Årlig)</span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.roiAnnual)}
              </span>
            </div>
          )}
          {metric.netMarginTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                Netto margin (TTM)
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.netMarginTTM)}
              </span>
            </div>
          )}
          {metric.grossMarginTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                Brutto margin (TTM)
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.grossMarginTTM)}
              </span>
            </div>
          )}
          {metric.operatingMarginTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                Driftsmargin (TTM)
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.operatingMarginTTM)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Activity className="h-5 w-5 text-purple-600" />
            Vekst
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metric.revenueGrowthTTM && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                Inntektsvekst (TTM)
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric.revenueGrowthTTM)}
              </span>
            </div>
          )}
          {metric['52WeekPriceReturnDaily'] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                52-ukers avkastning
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric['52WeekPriceReturnDaily'])}
              </span>
            </div>
          )}
          {metric['13WeekPriceReturnDaily'] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">
                13-ukers avkastning
              </span>
              <span className="text-sm font-medium">
                {formatPercentage(metric['13WeekPriceReturnDaily'])}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Health */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Finansiell helse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metric.currentRatio && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Likviditetsgrad</span>
              <span className="text-sm font-medium">
                {metric.currentRatio.toFixed(2)}
              </span>
            </div>
          )}
          {metric.quickRatio && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Hurtiggrad</span>
              <span className="text-sm font-medium">
                {metric.quickRatio.toFixed(2)}
              </span>
            </div>
          )}
          {metric.totalDebtToEquityAnnual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Gjeldsgrad</span>
              <span className="text-sm font-medium">
                {metric.totalDebtToEquityAnnual.toFixed(2)}
              </span>
            </div>
          )}
          {metric.beta && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Beta</span>
              <span className="text-sm font-medium">
                {metric.beta.toFixed(2)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <PieChart className="h-5 w-5 text-purple-600" />
            Prisområde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metric['52WeekHigh'] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">52-ukers høy</span>
              <span className="text-sm font-medium">
                {formatCurrency(
                  metric['52WeekHigh'],
                  companyProfile?.currency || 'USD'
                )}
              </span>
            </div>
          )}
          {metric['52WeekLow'] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">52-ukers lav</span>
              <span className="text-sm font-medium">
                {formatCurrency(
                  metric['52WeekLow'],
                  companyProfile?.currency || 'USD'
                )}
              </span>
            </div>
          )}
          {metric['52WeekHigh'] && metric['52WeekLow'] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">52-ukers område</span>
              <span className="text-sm font-medium">
                {(
                  ((metric['52WeekHigh'] - metric['52WeekLow']) /
                    metric['52WeekLow']) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// News Tab Component
const NewsTab = ({
  stockData,
  companyNews,
  newsLoading,
}: {
  stockData: HoldingWithMetrics
  companyNews: CompanyNews[] | null
  newsLoading: boolean
}) => {
  if (newsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-purple-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!companyNews || companyNews.length === 0) {
    return (
      <div className="py-8 text-center">
        <Newspaper className="mx-auto mb-4 h-12 w-12 text-purple-400" />
        <p className="text-purple-600">Ingen nyheter funnet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {companyNews.map((news, index) => (
        <Card key={news.id || index} className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {news.image && (
                <div className="flex-shrink-0">
                  <img
                    src={news.image}
                    alt={news.headline}
                    className="h-16 w-16 rounded object-cover"
                    onError={e => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="line-clamp-2 font-semibold text-purple-900">
                    {news.headline}
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-2 flex-shrink-0 border-purple-200 text-xs text-purple-600"
                  >
                    {news.source}
                  </Badge>
                </div>
                <p className="mb-3 line-clamp-3 text-sm text-purple-700">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-500">
                    {new Date(news.datetime * 1000).toLocaleString('nb-NO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                  >
                    Les mer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Performance Tab Component
const PerformanceTab = ({
  stockData,
  companyProfile,
  basicFinancials,
}: {
  stockData: HoldingWithMetrics
  companyProfile: CompanyProfile | null
  basicFinancials: BasicFinancials | null
}) => {
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
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <PieChart className="h-5 w-5 text-purple-600" />
            Ytelsessammendrag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Totalt investert</span>
            <span className="text-sm font-medium">
              {formatCurrency(
                totalCost,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Nåværende verdi</span>
            <span className="text-sm font-medium">
              {formatCurrency(
                marketValue,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Urealisert P&L</span>
            <span
              className={cn(
                'text-sm font-medium',
                unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {unrealizedPnl >= 0 ? '+' : ''}
              {formatCurrency(
                unrealizedPnl,
                companyProfile?.currency || stockData.stocks?.currency || 'NOK'
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Prosentvis endring</span>
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

      {/* Market Performance */}
      {basicFinancials?.metric && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Markedsytelse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {basicFinancials.metric['52WeekPriceReturnDaily'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">
                  52-ukers avkastning
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    basicFinancials.metric['52WeekPriceReturnDaily'] >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatPercentage(
                    basicFinancials.metric['52WeekPriceReturnDaily']
                  )}
                </span>
              </div>
            )}
            {basicFinancials.metric['26WeekPriceReturnDaily'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">
                  26-ukers avkastning
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    basicFinancials.metric['26WeekPriceReturnDaily'] >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatPercentage(
                    basicFinancials.metric['26WeekPriceReturnDaily']
                  )}
                </span>
              </div>
            )}
            {basicFinancials.metric['13WeekPriceReturnDaily'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">
                  13-ukers avkastning
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    basicFinancials.metric['13WeekPriceReturnDaily'] >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatPercentage(
                    basicFinancials.metric['13WeekPriceReturnDaily']
                  )}
                </span>
              </div>
            )}
            {basicFinancials.metric['5DayPriceReturnDaily'] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">
                  5-dagers avkastning
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    basicFinancials.metric['5DayPriceReturnDaily'] >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatPercentage(
                    basicFinancials.metric['5DayPriceReturnDaily']
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Holding Period */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="h-5 w-5 text-purple-600" />
            Holdeperiode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Første kjøp</span>
            <span className="text-sm font-medium">{firstPurchaseDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Dager holdt</span>
            <span className="text-sm font-medium">
              {holdingPeriod.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600">Måneder holdt</span>
            <span className="text-sm font-medium">
              {Math.floor(holdingPeriod / 30).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Charts */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-700">Ytelsesanalyse</CardTitle>
          <CardDescription>
            Avansert ytelsesanalyse kommer snart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-purple-50">
            <div className="text-center text-purple-600">
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
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  )
  const [basicFinancials, setBasicFinancials] =
    useState<BasicFinancials | null>(null)
  const [companyNews, setCompanyNews] = useState<CompanyNews[] | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [financialsLoading, setFinancialsLoading] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)

  // Fetch company data when modal opens
  useEffect(() => {
    if (isOpen && stockData?.stocks?.symbol) {
      setActiveTab('overview')
      setIsLoading(true)

      // Clear previous data
      setCompanyProfile(null)
      setBasicFinancials(null)
      setCompanyNews(null)

      const symbol = stockData.stocks.symbol

      // Fetch company profile
      const fetchProfile = async () => {
        setProfileLoading(true)
        try {
          const result = await fetchCompanyProfile(symbol)
          if (result.success && result.data) {
            setCompanyProfile(result.data)
          }
        } catch (error) {
          console.error('Error fetching company profile:', error)
        } finally {
          setProfileLoading(false)
        }
      }

      // Fetch basic financials
      const fetchFinancials = async () => {
        setFinancialsLoading(true)
        try {
          const result = await fetchBasicFinancials(symbol)
          if (result.success && result.data) {
            setBasicFinancials(result.data)
          }
        } catch (error) {
          console.error('Error fetching basic financials:', error)
        } finally {
          setFinancialsLoading(false)
        }
      }

      // Fetch company news (last 7 days)
      const fetchNews = async () => {
        setNewsLoading(true)
        try {
          const to = new Date().toISOString().split('T')[0]
          const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
          const result = await fetchCompanyNews(symbol, from, to)
          if (result.success && result.data) {
            setCompanyNews(result.data)
          }
        } catch (error) {
          console.error('Error fetching company news:', error)
        } finally {
          setNewsLoading(false)
        }
      }

      // Start fetching all data
      fetchProfile()
      fetchFinancials()
      fetchNews()

      // Simulate loading for UI
      const timer = setTimeout(() => setIsLoading(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, stockData?.stocks?.symbol])

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
          <StockHeader stockData={stockData} companyProfile={companyProfile} />
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
              <TabsList className="grid w-full grid-cols-5 border-purple-200 bg-purple-50">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  Oversikt
                </TabsTrigger>
                <TabsTrigger
                  value="fundamentals"
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  Fundamentalt
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  Nyheter
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  Ytelse
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  Transaksjoner
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-4">
                  <RenderErrorBoundary>
                    <OverviewTab
                      stockData={stockData}
                      companyProfile={companyProfile}
                      basicFinancials={basicFinancials}
                    />
                  </RenderErrorBoundary>
                </TabsContent>

                <TabsContent value="fundamentals" className="space-y-4">
                  <RenderErrorBoundary>
                    <FundamentalsTab
                      stockData={stockData}
                      companyProfile={companyProfile}
                      basicFinancials={basicFinancials}
                    />
                  </RenderErrorBoundary>
                </TabsContent>

                <TabsContent value="news" className="space-y-4">
                  <APIErrorBoundary>
                    <NewsTab
                      stockData={stockData}
                      companyNews={companyNews}
                      newsLoading={newsLoading}
                    />
                  </APIErrorBoundary>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <RenderErrorBoundary>
                    <PerformanceTab
                      stockData={stockData}
                      companyProfile={companyProfile}
                      basicFinancials={basicFinancials}
                    />
                  </RenderErrorBoundary>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <APIErrorBoundary>
                    <TransactionsTab stockData={stockData} />
                  </APIErrorBoundary>
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
