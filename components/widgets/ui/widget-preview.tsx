'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  WidgetRegistration,
  BaseWidgetComponentProps,
} from '@/components/widgets/widget-types'
import { 
  WidgetConfig,
  WidgetType,
  WidgetCategory,
  WidgetSize,
} from '@/lib/types/widget.types'
import { cn } from '@/lib/utils/cn'
import { getInvestmentTheme } from '@/lib/themes/modern-themes'

interface WidgetPreviewProps {
  registration: WidgetRegistration
  config: WidgetConfig
  userId: string
  portfolioId?: string
  stockSymbol?: string
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  onReset?: () => void
  className?: string
}

// Mock data generators for preview
const generateMockStockData = () => ({
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 150.25,
  change: 2.45,
  changePercent: 1.66,
  volume: 45234567,
  marketCap: 2.4e12,
  pe: 28.5,
  dividend: 0.88,
  high52: 182.94,
  low52: 124.17,
})

const generateMockPortfolioData = () => ({
  totalValue: 1234567.89,
  totalCost: 1000000.00,
  totalPnl: 234567.89,
  totalPnlPercent: 23.46,
  dailyChange: 5432.10,
  dailyChangePercent: 0.44,
  holdings: [
    { symbol: 'AAPL', quantity: 100, value: 15025, pnl: 2045 },
    { symbol: 'GOOGL', quantity: 25, value: 67500, pnl: 8900 },
    { symbol: 'MSFT', quantity: 75, value: 25125, pnl: 3250 },
  ],
})

const generateMockNewsData = () => ([
  {
    id: '1',
    title: 'Apple Reports Strong Q4 Earnings',
    summary: 'Apple exceeded expectations with strong iPhone sales and services growth.',
    source: 'Reuters',
    publishedAt: new Date(),
    imageUrl: 'https://via.placeholder.com/300x200',
  },
  {
    id: '2',
    title: 'Tech Stocks Rally on AI Optimism',
    summary: 'Major tech stocks surge as investors bet on AI revolution.',
    source: 'Bloomberg',
    publishedAt: new Date(),
    imageUrl: 'https://via.placeholder.com/300x200',
  },
])

const generateMockMetricsData = () => ({
  totalReturn: 23.45,
  annualizedReturn: 12.34,
  sharpeRatio: 1.45,
  volatility: 18.67,
  maxDrawdown: -8.23,
  winRate: 67.5,
  avgWin: 4.56,
  avgLoss: -2.34,
})

// Mock widget components for preview
const MockChartWidget: React.FC<{
  config: WidgetConfig
  type: WidgetType
  title: string
}> = ({ config, type, title }) => {
  const chartConfig = config as any
  const mockData = generateMockPortfolioData()
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{chartConfig.chartType || 'line'}</Badge>
      </div>
      
      <div 
        className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
        style={{ height: chartConfig.height || 300 }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-medium">Graf forhåndsvisning</div>
          <div className="text-sm">
            {chartConfig.chartType} • {chartConfig.timeframe || '1M'}
          </div>
          {chartConfig.showVolume && (
            <div className="text-xs mt-1">Volum: Aktivert</div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Verdi</div>
          <div className="font-semibold">{mockData.totalValue.toLocaleString('no-NO')} NOK</div>
        </div>
        <div>
          <div className="text-gray-500">P&L</div>
          <div className="font-semibold text-green-600">
            +{mockData.totalPnl.toLocaleString('no-NO')} NOK
          </div>
        </div>
        <div>
          <div className="text-gray-500">Endring</div>
          <div className="font-semibold text-green-600">
            +{mockData.totalPnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

const MockTableWidget: React.FC<{
  config: WidgetConfig
  title: string
}> = ({ config, title }) => {
  const tableConfig = config as any
  const mockData = generateMockPortfolioData()
  
  const columns = tableConfig.columns || ['symbol', 'quantity', 'value', 'pnl']
  const pageSize = tableConfig.pageSize || 10
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{columns.length} kolonner</Badge>
      </div>
      
      {tableConfig.showSearch && (
        <div className="bg-gray-50 border rounded-lg p-3">
          <div className="text-sm text-gray-500">🔍 Søkefelt aktivert</div>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col: string) => (
                <th key={col} className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  {col.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.holdings.slice(0, pageSize).map((holding, index) => (
              <tr key={index} className="border-t">
                {columns.map((col: string) => (
                  <td key={col} className="px-4 py-2 text-sm">
                    {col === 'symbol' && holding.symbol}
                    {col === 'quantity' && holding.quantity}
                    {col === 'value' && `${holding.value.toLocaleString('no-NO')} NOK`}
                    {col === 'pnl' && (
                      <span className="text-green-600">
                        +{holding.pnl.toLocaleString('no-NO')} NOK
                      </span>
                    )}
                    {!['symbol', 'quantity', 'value', 'pnl'].includes(col) && '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tableConfig.showPagination && (
        <div className="flex justify-center">
          <div className="bg-gray-50 border rounded-lg px-4 py-2 text-sm text-gray-500">
            Sideinndeling aktivert
          </div>
        </div>
      )}
    </div>
  )
}

const MockMetricsWidget: React.FC<{
  config: WidgetConfig
  title: string
}> = ({ config, title }) => {
  const metricsConfig = config as any
  const mockData = generateMockMetricsData()
  
  const metrics = metricsConfig.metrics || ['totalReturn', 'annualizedReturn', 'sharpeRatio', 'volatility']
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{metrics.length} målinger</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric: string) => (
          <div key={metric} className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">
              {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="text-xl font-semibold">
              {metric === 'totalReturn' && `${mockData.totalReturn}%`}
              {metric === 'annualizedReturn' && `${mockData.annualizedReturn}%`}
              {metric === 'sharpeRatio' && mockData.sharpeRatio}
              {metric === 'volatility' && `${mockData.volatility}%`}
              {metric === 'maxDrawdown' && `${mockData.maxDrawdown}%`}
              {metric === 'winRate' && `${mockData.winRate}%`}
              {!['totalReturn', 'annualizedReturn', 'sharpeRatio', 'volatility', 'maxDrawdown', 'winRate'].includes(metric) && '--'}
            </div>
            {metricsConfig.showSparklines && (
              <div className="mt-2 h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded opacity-50"></div>
            )}
          </div>
        ))}
      </div>
      
      {metricsConfig.compactView && (
        <div className="text-xs text-gray-500 text-center">
          Kompakt visning aktivert
        </div>
      )}
    </div>
  )
}

const MockNewsWidget: React.FC<{
  config: WidgetConfig
  title: string
}> = ({ config, title }) => {
  const newsConfig = config as any
  const mockData = generateMockNewsData()
  
  const maxItems = newsConfig.maxItems || 5
  const sources = newsConfig.sources || ['Reuters', 'Bloomberg']
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{sources.length} kilder</Badge>
      </div>
      
      <div className="space-y-3">
        {mockData.slice(0, maxItems).map((article) => (
          <div key={article.id} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              {newsConfig.showImages && (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  📰
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{article.title}</h4>
                {newsConfig.showSummary && (
                  <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{article.publishedAt.toLocaleDateString('no-NO')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {newsConfig.filterBySymbol && (
        <div className="text-xs text-gray-500 text-center">
          Filtrert etter aktuell aksje
        </div>
      )}
    </div>
  )
}

const MockAlertsWidget: React.FC<{
  config: WidgetConfig
  title: string
}> = ({ config, title }) => {
  const alertsConfig = config as any
  const alertTypes = alertsConfig.alertTypes || ['price_alert', 'volume_alert']
  const maxItems = alertsConfig.maxItems || 10
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{alertTypes.length} typer</Badge>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: Math.min(maxItems, 3) }).map((_, index) => (
          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="text-sm font-medium">
                {alertTypes[index % alertTypes.length]?.replace('_', ' ')} varsel
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Mock varsel for demo formål
            </div>
          </div>
        ))}
      </div>
      
      {alertsConfig.showNotifications && (
        <div className="text-xs text-gray-500 text-center">
          Notifikasjoner aktivert
        </div>
      )}
    </div>
  )
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  registration,
  config,
  userId,
  portfolioId,
  stockSymbol,
  isFullScreen = false,
  onToggleFullScreen,
  onReset,
  className,
}) => {
  const [previewError, setPreviewError] = useState<string | null>(null)

  const theme = useMemo(() => {
    return getInvestmentTheme('light', registration.category.toLowerCase() as any)
  }, [registration.category])

  const widgetTitle = useMemo(() => {
    return config.customTitle || registration.norwegianLabels.title
  }, [config.customTitle, registration.norwegianLabels.title])

  const widgetDescription = useMemo(() => {
    return config.customDescription || registration.norwegianLabels.description
  }, [config.customDescription, registration.norwegianLabels.description])

  const renderPreviewContent = () => {
    try {
      switch (registration.type) {
        case 'HERO_PORTFOLIO_CHART':
        case 'CATEGORY_MINI_CHART':
        case 'STOCK_PERFORMANCE_CHART':
          return (
            <MockChartWidget
              config={config}
              type={registration.type}
              title={widgetTitle}
            />
          )
        case 'HOLDINGS_TABLE_RICH':
          return (
            <MockTableWidget
              config={config}
              title={widgetTitle}
            />
          )
        case 'METRICS_GRID':
        case 'PERFORMANCE_METRICS':
          return (
            <MockMetricsWidget
              config={config}
              title={widgetTitle}
            />
          )
        case 'NEWS_FEED':
          return (
            <MockNewsWidget
              config={config}
              title={widgetTitle}
            />
          )
        case 'PRICE_ALERTS':
          return (
            <MockAlertsWidget
              config={config}
              title={widgetTitle}
            />
          )
        default:
          return (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold mb-2">{widgetTitle}</h3>
              <p className="text-gray-600 mb-4">{widgetDescription}</p>
              <Badge variant="secondary">Forhåndsvisning ikke tilgjengelig</Badge>
            </div>
          )
      }
    } catch (error) {
      setPreviewError('Feil ved visning av forhåndsvisning')
      return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-white rounded-lg shadow-lg overflow-hidden',
        isFullScreen && 'fixed inset-4 z-50',
        className
      )}
    >
      {/* Preview header */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-1.5 rounded-md',
              registration.category === 'STOCKS' && 'bg-purple-100 text-purple-600',
              registration.category === 'CRYPTO' && 'bg-amber-100 text-amber-600',
              registration.category === 'ART' && 'bg-pink-100 text-pink-600',
              registration.category === 'OTHER' && 'bg-emerald-100 text-emerald-600',
            )}>
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Forhåndsvisning</h3>
              <p className="text-xs text-gray-500">{registration.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {registration.recommendedSize}
            </Badge>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {onToggleFullScreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullScreen}
                className="h-8 w-8 p-0"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview content */}
      <div className="p-4">
        {previewError ? (
          <Alert>
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {config.showHeader !== false && (
              <div className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{widgetTitle}</h2>
                    {widgetDescription && (
                      <p className="text-sm text-gray-600">{widgetDescription}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {registration.category}
                    </Badge>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            {renderPreviewContent()}
            
            {config.showFooter !== false && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Sist oppdatert: {new Date().toLocaleTimeString('no-NO')}</span>
                  <span>Oppdatering: {config.refreshInterval || 300}s</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default WidgetPreview