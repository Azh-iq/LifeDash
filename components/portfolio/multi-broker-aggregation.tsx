'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { BrokerId } from '@/lib/integrations/brokers/types'

interface AggregationResult {
  aggregation_status: 'pending' | 'running' | 'completed' | 'failed' | 'never_run'
  total_holdings_count: number
  consolidated_holdings_count: number
  duplicates_detected: number
  conflicts_resolved: number
  base_currency: string
  aggregation_summary?: {
    totalValue: number
    totalCostBasis: number
    totalGainLoss: number
    totalGainLossPercent: number
    assetAllocation: Array<{
      assetClass: string
      value: number
      percentage: number
    }>
    topHoldings: Array<{
      symbol: string
      marketValue: number
      quantity: number
    }>
  }
  errors?: string[]
  warnings?: string[]
  started_at?: string
  completed_at?: string
}

interface ConsolidatedHolding {
  symbol: string
  total_quantity: number
  total_market_value: number
  total_cost_basis: number
  account_count: number
  broker_ids: BrokerId[]
  is_duplicate: boolean
  last_updated: string
}

interface BrokerPerformance {
  broker_id: BrokerId
  account_count: number
  unique_holdings: number
  total_portfolio_value: number
  total_cost_basis: number
  total_unrealized_pnl: number
  avg_return_percent: number
  connection_status: string
  last_sync_time: string
}

interface MultiBrokerAggregationData {
  aggregationResult: AggregationResult
  consolidatedHoldings: ConsolidatedHolding[]
  brokerPerformance: BrokerPerformance[]
}

const brokerDisplayNames: Record<BrokerId, string> = {
  [BrokerId.PLAID]: 'Plaid (US Brokers)',
  [BrokerId.SCHWAB]: 'Charles Schwab',
  [BrokerId.INTERACTIVE_BROKERS]: 'Interactive Brokers',
  [BrokerId.NORDNET]: 'Nordnet'
}

export default function MultiBrokerAggregation() {
  const [data, setData] = useState<MultiBrokerAggregationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAggregating, setIsAggregating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baseCurrency, setBaseCurrency] = useState('USD')

  useEffect(() => {
    fetchAggregationData()
  }, [])

  const fetchAggregationData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/portfolio/aggregate')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch aggregation data')
      }
      
      setData(result.data)
    } catch (err) {
      console.error('Error fetching aggregation data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerAggregation = async () => {
    try {
      setIsAggregating(true)
      setError(null)
      
      const response = await fetch('/api/portfolio/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseCurrency,
          force: true
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger aggregation')
      }
      
      // Refresh data after aggregation
      await fetchAggregationData()
      
    } catch (err) {
      console.error('Error triggering aggregation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsAggregating(false)
    }
  }

  const getStatusBadge = (status: AggregationResult['aggregation_status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'running':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">Never Run</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Multi-Broker Portfolio Aggregation</h2>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
          Error loading aggregation data: {error}
          <Button variant="outline" size="sm" onClick={fetchAggregationData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No aggregation data available. Please check your broker connections.
        </AlertDescription>
      </Alert>
    )
  }

  const { aggregationResult, consolidatedHoldings, brokerPerformance } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Broker Portfolio Aggregation</h2>
          <p className="text-sm text-gray-600">
            Unified view of your portfolio across all connected brokers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="SEK">SEK</option>
            <option value="DKK">DKK</option>
          </select>
          <Button
            onClick={triggerAggregation}
            disabled={isAggregating || aggregationResult.aggregation_status === 'running'}
          >
            {isAggregating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Aggregating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aggregate Portfolio
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aggregation Status</span>
            {getStatusBadge(aggregationResult.aggregation_status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{aggregationResult.total_holdings_count}</div>
              <div className="text-sm text-gray-600">Total Holdings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{aggregationResult.consolidated_holdings_count}</div>
              <div className="text-sm text-gray-600">Unique Holdings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{aggregationResult.duplicates_detected}</div>
              <div className="text-sm text-gray-600">Duplicates Detected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{aggregationResult.conflicts_resolved}</div>
              <div className="text-sm text-gray-600">Conflicts Resolved</div>
            </div>
          </div>
          
          {aggregationResult.aggregation_status === 'running' && (
            <div className="mt-4">
              <Progress value={65} className="w-full" />
              <div className="text-sm text-gray-600 mt-1">Aggregating portfolio data...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      {aggregationResult.aggregation_summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(aggregationResult.aggregation_summary.totalValue, baseCurrency)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Total Gain/Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${aggregationResult.aggregation_summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(aggregationResult.aggregation_summary.totalGainLoss, baseCurrency)}
              </div>
              <div className={`text-sm ${aggregationResult.aggregation_summary.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(aggregationResult.aggregation_summary.totalGainLossPercent)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                Cost Basis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(aggregationResult.aggregation_summary.totalCostBasis, baseCurrency)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Brokers Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brokerPerformance.length}</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Broker Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Broker Performance Comparison</CardTitle>
          <CardDescription>
            Performance metrics for each connected broker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brokerPerformance.map((broker) => (
              <div key={broker.broker_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{brokerDisplayNames[broker.broker_id]}</div>
                    <div className="text-sm text-gray-600">
                      {broker.account_count} accounts • {broker.unique_holdings} holdings
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(broker.total_portfolio_value, baseCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">Portfolio Value</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${broker.total_unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(broker.total_unrealized_pnl, baseCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">Unrealized P&L</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${broker.avg_return_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(broker.avg_return_percent)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Return</div>
                  </div>
                  <Badge variant={broker.connection_status === 'connected' ? 'default' : 'secondary'}>
                    {broker.connection_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Consolidated Holdings</CardTitle>
          <CardDescription>
            Your largest positions across all brokers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consolidatedHoldings.slice(0, 10).map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{holding.symbol}</div>
                    <div className="text-sm text-gray-600">
                      {holding.total_quantity} shares
                      {holding.is_duplicate && (
                        <Badge variant="secondary" className="ml-2">Consolidated</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(holding.total_market_value, baseCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {holding.account_count} accounts • {holding.broker_ids.length} brokers
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {holding.broker_ids.map((brokerId) => (
                      <Badge key={brokerId} variant="outline" className="text-xs">
                        {brokerId.split('_')[0]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Errors and Warnings */}
      {(aggregationResult.errors?.length || aggregationResult.warnings?.length) && (
        <div className="space-y-4">
          {aggregationResult.errors?.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
          {aggregationResult.warnings?.map((warning, index) => (
            <Alert key={index}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}