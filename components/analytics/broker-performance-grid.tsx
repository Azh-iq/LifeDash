'use client'

import { useMultiBrokerPortfolioState } from '@/lib/hooks/use-multi-broker-portfolio-state'
import { BrokerPerformanceCard } from './broker-performance-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'

const brokerDisplayNames: Record<string, string> = {
  'nordnet': 'Nordnet',
  'schwab': 'Charles Schwab',
  'interactive_brokers': 'Interactive Brokers',
  'plaid': 'Plaid (US Brokers)'
}

export function BrokerPerformanceGrid() {
  const { data, isLoading, error } = useMultiBrokerPortfolioState()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Megler Ytelse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Feil ved lasting av megler-ytelse: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data?.brokerPerformance || data.brokerPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Megler Ytelse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">📊</div>
            <div>Ingen megler-tilkoblinger funnet</div>
            <div className="text-sm mt-1">Koble til meglere for å se ytelse</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Megler Ytelse</h2>
        <div className="text-sm text-gray-600">
          {data.brokerPerformance.length} tilkoblede meglere
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.brokerPerformance.map((broker) => (
          <BrokerPerformanceCard
            key={broker.broker_id}
            brokerId={broker.broker_id}
            displayName={brokerDisplayNames[broker.broker_id] || broker.broker_id}
            totalValue={broker.total_portfolio_value}
            totalPnL={broker.total_unrealized_pnl}
            returnPercent={broker.avg_return_percent}
            lastSync={broker.last_sync_time}
            connectionStatus={broker.connection_status as any}
            accountCount={broker.account_count}
            holdingsCount={broker.unique_holdings}
            currency="NOK"
          />
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Sammendrag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.brokerPerformance.length}
              </div>
              <div className="text-sm text-gray-600">Meglere</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.brokerPerformance.reduce((sum, b) => sum + b.account_count, 0)}
              </div>
              <div className="text-sm text-gray-600">Kontoer</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.brokerPerformance.reduce((sum, b) => sum + b.unique_holdings, 0)}
              </div>
              <div className="text-sm text-gray-600">Beholdninger</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('nb-NO', {
                  style: 'currency',
                  currency: 'NOK',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(data.brokerPerformance.reduce((sum, b) => sum + b.total_portfolio_value, 0))}
              </div>
              <div className="text-sm text-gray-600">Total verdi</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}