'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Users, 
  Globe,
  Calculator,
  Info,
  ExternalLink
} from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber, formatPercentage, formatMarketCap } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { type CompanyProfile, type BasicFinancials } from '@/lib/utils/finnhub-api'

interface FundamentalsWidgetProps {
  symbol: string
  companyName: string
  profile: CompanyProfile | null
  financials: BasicFinancials | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'gray'
  tooltip?: string
  format?: 'currency' | 'percentage' | 'number' | 'marketcap'
  currency?: string
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  color, 
  tooltip, 
  format = 'number',
  currency = 'NOK'
}: MetricCardProps) {
  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return formatCurrency(val, currency)
      case 'percentage':
        return formatPercentage(val)
      case 'marketcap':
        return formatMarketCap(val, currency)
      case 'number':
        return formatNumber(val)
      default:
        return val.toString()
    }
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-2', colors[color])}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
              </CardTitle>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatValue(value)}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={cn(
                'font-medium',
                change > 0 ? 'text-green-600 dark:text-green-400' : 
                change < 0 ? 'text-red-600 dark:text-red-400' : 
                'text-gray-500 dark:text-gray-400'
              )}>
                {change > 0 ? '+' : ''}{formatPercentage(change)}
              </span>
              {changeLabel && (
                <span className="text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CompanyOverview({ profile }: { profile: CompanyProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Selskapsinformasjon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Børs
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {profile.exchange}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Sektor
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {profile.finnhubIndustry}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Land
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {profile.country}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Børsnotering
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {profile.ipo}
            </div>
          </div>
        </div>
        
        {profile.weburl && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(profile.weburl, '_blank')}
              className="w-full"
            >
              <Globe className="h-4 w-4 mr-2" />
              Besøk selskapets nettside
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FinancialRatios({ financials }: { financials: BasicFinancials }) {
  const ratios = [
    {
      title: 'P/E Ratio',
      value: financials.metric.peBasicExclExtraTTM,
      tooltip: 'Pris-til-inntjening ratio. Måler hvor mye investorer betaler per krone i inntjening.',
      color: 'purple' as const,
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      title: 'P/B Ratio',
      value: financials.metric.ptbvAnnual,
      tooltip: 'Pris-til-bok ratio. Sammenligner markedsverdi med bokført verdi.',
      color: 'blue' as const,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: 'ROE',
      value: financials.metric.roeAnnual,
      tooltip: 'Return on Equity. Måler hvor effektivt selskapet bruker egenkapitalen.',
      color: 'green' as const,
      icon: <TrendingUp className="h-4 w-4" />,
      format: 'percentage' as const,
    },
    {
      title: 'ROA',
      value: financials.metric.roaAnnual,
      tooltip: 'Return on Assets. Måler hvor effektivt selskapet bruker sine eiendeler.',
      color: 'orange' as const,
      icon: <PieChart className="h-4 w-4" />,
      format: 'percentage' as const,
    },
    {
      title: 'Beta',
      value: financials.metric.beta,
      tooltip: 'Måler volatiliteten til aksjen sammenlignet med markedet.',
      color: 'red' as const,
      icon: <TrendingDown className="h-4 w-4" />,
    },
    {
      title: 'Current Ratio',
      value: financials.metric.currentRatio,
      tooltip: 'Måler selskapets evne til å betale kortsiktig gjeld.',
      color: 'gray' as const,
      icon: <DollarSign className="h-4 w-4" />,
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Finansielle nøkkeltall
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ratios.map((ratio) => (
          ratio.value && (
            <MetricCard
              key={ratio.title}
              title={ratio.title}
              value={ratio.value}
              icon={ratio.icon}
              color={ratio.color}
              tooltip={ratio.tooltip}
              format={ratio.format}
            />
          )
        ))}
      </div>
    </div>
  )
}

function MarketMetrics({ profile, financials }: { profile: CompanyProfile, financials: BasicFinancials }) {
  const metrics = [
    {
      title: 'Markedsverdi',
      value: profile.marketCapitalization,
      icon: <Building2 className="h-4 w-4" />,
      color: 'purple' as const,
      format: 'marketcap' as const,
      currency: profile.currency,
      tooltip: 'Total markedsverdi av selskapet',
    },
    {
      title: 'Utestående aksjer',
      value: profile.shareOutstanding,
      icon: <Users className="h-4 w-4" />,
      color: 'blue' as const,
      format: 'number' as const,
      tooltip: 'Antall utestående aksjer',
    },
    {
      title: '52-ukers høy',
      value: financials.metric['52WeekHigh'],
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'green' as const,
      format: 'currency' as const,
      currency: profile.currency,
      tooltip: 'Høyeste aksjepris siste 52 uker',
    },
    {
      title: '52-ukers lav',
      value: financials.metric['52WeekLow'],
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'red' as const,
      format: 'currency' as const,
      currency: profile.currency,
      tooltip: 'Laveste aksjepris siste 52 uker',
    },
    {
      title: 'Bruttomargir TTM',
      value: financials.metric.grossMarginTTM,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'orange' as const,
      format: 'percentage' as const,
      tooltip: 'Bruttomargir siste 12 måneder',
    },
    {
      title: 'Nettomargir TTM',
      value: financials.metric.netMarginTTM,
      icon: <PieChart className="h-4 w-4" />,
      color: 'gray' as const,
      format: 'percentage' as const,
      tooltip: 'Nettomargir siste 12 måneder',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Markedsdata
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          metric.value !== undefined && metric.value !== null && (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              tooltip={metric.tooltip}
              format={metric.format}
              currency={metric.currency}
            />
          )
        ))}
      </div>
    </div>
  )
}

function PerformanceMetrics({ financials }: { financials: BasicFinancials }) {
  const performance = [
    {
      title: '5-dagers avkastning',
      value: financials.metric['5DayPriceReturnDaily'],
      change: financials.metric['5DayPriceReturnDaily'],
    },
    {
      title: '13-ukers avkastning',
      value: financials.metric['13WeekPriceReturnDaily'],
      change: financials.metric['13WeekPriceReturnDaily'],
    },
    {
      title: '26-ukers avkastning',
      value: financials.metric['26WeekPriceReturnDaily'],
      change: financials.metric['26WeekPriceReturnDaily'],
    },
    {
      title: '52-ukers avkastning',
      value: financials.metric['52WeekPriceReturnDaily'],
      change: financials.metric['52WeekPriceReturnDaily'],
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Prisutvikling
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performance.map((perf) => (
          perf.value !== undefined && perf.value !== null && (
            <MetricCard
              key={perf.title}
              title={perf.title}
              value={perf.value}
              change={perf.change}
              icon={perf.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              color={perf.change > 0 ? 'green' : perf.change < 0 ? 'red' : 'gray'}
              format="percentage"
            />
          )
        ))}
      </div>
    </div>
  )
}

export function FundamentalsWidget({
  symbol,
  companyName,
  profile,
  financials,
  loading = false,
  error = null,
  onRefresh,
  className,
}: FundamentalsWidgetProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'ratios' | 'market' | 'performance'>('overview')

  const hasData = profile || financials

  return (
    <StockWidget
      title={`Fundamentals - ${symbol}`}
      description={`Finansielle nøkkeltall for ${companyName}`}
      icon={<Building2 className="h-5 w-5" />}
      size="large"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={cn('min-h-[600px]', className)}
      refreshLabel="Oppdater fundamentals"
      actions={
        hasData && (
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {[
              { value: 'overview', label: 'Oversikt' },
              { value: 'ratios', label: 'Nøkkeltall' },
              { value: 'market', label: 'Marked' },
              { value: 'performance', label: 'Ytelse' },
            ].map(view => (
              <Button
                key={view.value}
                variant={selectedView === view.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView(view.value as any)}
                className={cn(
                  'h-7 px-3 text-xs font-medium transition-all duration-200',
                  selectedView === view.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                {view.label}
              </Button>
            ))}
          </div>
        )
      }
    >
      <div className="space-y-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Ingen fundamentale data tilgjengelig
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Prøv å oppdatere eller kontakt support
            </p>
          </div>
        ) : (
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedView === 'overview' && profile && (
              <CompanyOverview profile={profile} />
            )}
            
            {selectedView === 'ratios' && financials && (
              <FinancialRatios financials={financials} />
            )}
            
            {selectedView === 'market' && profile && financials && (
              <MarketMetrics profile={profile} financials={financials} />
            )}
            
            {selectedView === 'performance' && financials && (
              <PerformanceMetrics financials={financials} />
            )}
          </motion.div>
        )}

        {/* Data Source Footer */}
        {hasData && (
          <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Data levert av Finnhub • Oppdatert: {new Date().toLocaleDateString('nb-NO')}
          </div>
        )}
      </div>
    </StockWidget>
  )
}