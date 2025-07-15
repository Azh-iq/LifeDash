'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  DollarSign,
  Percent,
  RefreshCw
} from 'lucide-react'
import { useMultiBrokerPortfolioState } from '@/lib/hooks/use-multi-broker-portfolio-state'

interface CrossBrokerAnalyticsProps {
  className?: string
}

interface PerformanceMetric {
  name: string
  value: number
  change: number
  status: 'positive' | 'negative' | 'neutral'
}

interface RiskMetric {
  level: 'Lav' | 'Moderat' | 'Høy'
  score: number
  description: string
  factors: string[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444']

const brokerDisplayNames: Record<string, string> = {
  'plaid': 'Plaid',
  'schwab': 'Schwab',
  'interactive_brokers': 'IBKR',
  'nordnet': 'Nordnet'
}

export function CrossBrokerAnalytics({ className }: CrossBrokerAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M')
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'performance' | 'risk'>('performance')
  
  const { data, isLoading, error, triggerAggregation, isAggregating } = useMultiBrokerPortfolioState()

  // Calculate performance metrics
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    if (!data?.brokerPerformance) return []

    const totalValue = data.brokerPerformance.reduce((sum, b) => sum + b.total_portfolio_value, 0)
    const totalPnL = data.brokerPerformance.reduce((sum, b) => sum + b.total_unrealized_pnl, 0)
    const avgReturn = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0
    const bestBroker = data.brokerPerformance.reduce((best, current) => 
      current.avg_return_percent > best.avg_return_percent ? current : best
    )
    const worstBroker = data.brokerPerformance.reduce((worst, current) => 
      current.avg_return_percent < worst.avg_return_percent ? current : worst
    )

    return [
      {
        name: 'Gjennomsnittlig avkastning',
        value: avgReturn,
        change: 0, // Would need historical data
        status: avgReturn >= 0 ? 'positive' : 'negative'
      },
      {
        name: 'Beste megler',
        value: bestBroker.avg_return_percent,
        change: 0,
        status: bestBroker.avg_return_percent >= 0 ? 'positive' : 'negative'
      },
      {
        name: 'Verste megler',
        value: worstBroker.avg_return_percent,
        change: 0,
        status: worstBroker.avg_return_percent >= 0 ? 'positive' : 'negative'
      },
      {
        name: 'Diversifisering',
        value: data.brokerPerformance.length * 25, // Simple scoring
        change: 0,
        status: data.brokerPerformance.length > 2 ? 'positive' : 'neutral'
      }
    ]
  }, [data])

  // Calculate risk metrics
  const riskMetrics = useMemo((): RiskMetric => {
    if (!data?.brokerPerformance) {
      return {
        level: 'Lav',
        score: 0,
        description: 'Ingen data tilgjengelig',
        factors: []
      }
    }

    const brokerCount = data.brokerPerformance.length
    const totalValue = data.brokerPerformance.reduce((sum, b) => sum + b.total_portfolio_value, 0)
    const maxBrokerValue = Math.max(...data.brokerPerformance.map(b => b.total_portfolio_value))
    const concentration = totalValue > 0 ? (maxBrokerValue / totalValue) * 100 : 0
    
    let riskScore = 0
    const factors: string[] = []

    // Broker diversification
    if (brokerCount === 1) {
      riskScore += 30
      factors.push('Kun én megler')
    } else if (brokerCount === 2) {
      riskScore += 15
      factors.push('Begrenset megler-diversifisering')
    } else {
      factors.push('God megler-diversifisering')
    }

    // Concentration risk
    if (concentration > 70) {
      riskScore += 25
      factors.push('Høy konsentrasjon i én megler')
    } else if (concentration > 50) {
      riskScore += 15
      factors.push('Moderat konsentrasjon')
    } else {
      factors.push('Godt fordelt mellom meglere')
    }

    // Volatility (simplified)
    const returns = data.brokerPerformance.map(b => b.avg_return_percent)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )
    
    if (volatility > 15) {
      riskScore += 20
      factors.push('Høy volatilitet mellom meglere')
    } else if (volatility > 10) {
      riskScore += 10
      factors.push('Moderat volatilitet')
    } else {
      factors.push('Lav volatilitet')
    }

    let level: 'Lav' | 'Moderat' | 'Høy'
    let description: string

    if (riskScore < 20) {
      level = 'Lav'
      description = 'Godt diversifisert portfolio med lav risiko'
    } else if (riskScore < 40) {
      level = 'Moderat'
      description = 'Moderat risiko med rom for forbedring'
    } else {
      level = 'Høy'
      description = 'Høy risiko - vurder økt diversifisering'
    }

    return {
      level,
      score: Math.min(riskScore, 100),
      description,
      factors
    }
  }, [data])

  // Prepare chart data
  const brokerComparisonData = useMemo(() => {
    if (!data?.brokerPerformance) return []
    
    return data.brokerPerformance.map(broker => ({
      name: brokerDisplayNames[broker.broker_id] || broker.broker_id,
      value: broker.total_portfolio_value,
      pnl: broker.total_unrealized_pnl,
      return: broker.avg_return_percent,
      accounts: broker.account_count,
      holdings: broker.unique_holdings
    }))
  }, [data])

  const portfolioAllocationData = useMemo(() => {
    if (!data?.brokerPerformance) return []
    
    const total = data.brokerPerformance.reduce((sum, b) => sum + b.total_portfolio_value, 0)
    
    return data.brokerPerformance.map((broker, index) => ({
      name: brokerDisplayNames[broker.broker_id] || broker.broker_id,
      value: broker.total_portfolio_value,
      percentage: total > 0 ? (broker.total_portfolio_value / total) * 100 : 0,
      color: COLORS[index % COLORS.length]
    }))
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cross-Broker Analytics</h2>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Feil ved lasting av analytics data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerAggregation('NOK')} 
            className="ml-2"
            disabled={isAggregating}
          >
            {isAggregating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Prøv igjen'}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data?.brokerPerformance || data.brokerPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Broker Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-lg mb-2">Ingen megler-data funnet</div>
            <div className="text-sm mb-4">Koble til meglere for å se detaljert analytics</div>
            <Button onClick={() => triggerAggregation('NOK')} disabled={isAggregating}>
              {isAggregating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Synkroniser data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cross-Broker Analytics</h2>
          <p className="text-gray-600">Avansert analyse av din multi-megler portefølje</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['1M', '3M', '6M', '1Y'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className="h-8 px-3 text-xs"
              >
                {timeframe}
              </Button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerAggregation('NOK')}
            disabled={isAggregating}
          >
            {isAggregating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                metric.status === 'positive' ? 'text-green-600' : 
                metric.status === 'negative' ? 'text-red-600' : 
                'text-gray-900'
              }`}>
                {metric.name.includes('avkastning') || metric.name.includes('megler') 
                  ? formatPercentage(metric.value)
                  : `${Math.round(metric.value)}${metric.name.includes('Diversifisering') ? '/100' : ''}`
                }
              </div>
              {metric.status === 'positive' && (
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Positiv
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broker Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Megler Sammenligning
            </CardTitle>
            <CardDescription>
              Porteføljeverdi og avkastning per megler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brokerComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? formatCurrency(value as number) : 
                      name === 'return' ? formatPercentage(value as number) :
                      value,
                      name === 'value' ? 'Porteføljeverdi' :
                      name === 'return' ? 'Avkastning' :
                      name
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="value" fill="#6366f1" />
                  <Bar yAxisId="right" dataKey="return" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Portefølje Fordeling
            </CardTitle>
            <CardDescription>
              Fordeling av midler mellom meglere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioAllocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Risiko Analyse
          </CardTitle>
          <CardDescription>
            Vurdering av portefølje-risiko basert på megler-diversifisering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Risiko Nivå</span>
                  <Badge 
                    variant={
                      riskMetrics.level === 'Lav' ? 'default' :
                      riskMetrics.level === 'Moderat' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {riskMetrics.level}
                  </Badge>
                </div>
                <Progress 
                  value={riskMetrics.score} 
                  className={`h-3 ${
                    riskMetrics.level === 'Lav' ? 'text-green-600' :
                    riskMetrics.level === 'Moderat' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}
                />
                <div className="text-xs text-gray-600 mt-1">
                  {riskMetrics.score}/100 risiko poeng
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Beskrivelse</h4>
                <p className="text-sm text-gray-600">{riskMetrics.description}</p>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-medium mb-3">Risiko Faktorer</h4>
              <div className="space-y-2">
                {riskMetrics.factors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.includes('God') || factor.includes('Lav') || factor.includes('Godt') 
                        ? 'bg-green-500' 
                        : factor.includes('Moderat') || factor.includes('Begrenset')
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`} />
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Detaljerte Megler Metrics
          </CardTitle>
          <CardDescription>
            Sammenligning av nøkkeltall for alle tilkoblede meglere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Megler</th>
                  <th className="text-right py-2">Porteføljeverdi</th>
                  <th className="text-right py-2">Urealisert P&L</th>
                  <th className="text-right py-2">Avkastning</th>
                  <th className="text-right py-2">Kontoer</th>
                  <th className="text-right py-2">Beholdninger</th>
                  <th className="text-right py-2">Allokering</th>
                </tr>
              </thead>
              <tbody>
                {data.brokerPerformance.map((broker, index) => {
                  const totalValue = data.brokerPerformance.reduce((sum, b) => sum + b.total_portfolio_value, 0)
                  const allocation = totalValue > 0 ? (broker.total_portfolio_value / totalValue) * 100 : 0
                  
                  return (
                    <tr key={broker.broker_id} className="border-b">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{['🏦', '🇺🇸', '🌐', '🔗'][index % 4]}</span>
                          <span className="font-medium">
                            {brokerDisplayNames[broker.broker_id] || broker.broker_id}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 font-medium">
                        {formatCurrency(broker.total_portfolio_value)}
                      </td>
                      <td className={`text-right py-3 font-medium ${
                        broker.total_unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {broker.total_unrealized_pnl >= 0 ? '+' : ''}
                        {formatCurrency(broker.total_unrealized_pnl)}
                      </td>
                      <td className={`text-right py-3 font-medium ${
                        broker.avg_return_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(broker.avg_return_percent)}
                      </td>
                      <td className="text-right py-3">{broker.account_count}</td>
                      <td className="text-right py-3">{broker.unique_holdings}</td>
                      <td className="text-right py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(allocation, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{allocation.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}